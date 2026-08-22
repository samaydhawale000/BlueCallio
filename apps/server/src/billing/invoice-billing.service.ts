import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PAYMENT_SERVICE } from '../payment/payment.service';
import type { PaymentService } from '../payment/payment.service';
import { UsageBillingService } from './usage-billing.service';

/**
 * Month-end usage invoice generation + auto-charge (usage-based billing v2).
 *
 * Flow:
 *  1. Generate a line-item invoice from the previous cycle's CallUsage rows
 *     (per media type: audio / video / screen-share → minutes + ₹).
 *  2. Apply tax (GST from BillingRate.taxPercent).
 *  3. Auto-charge the customer's saved card via a PaymentIntent.
 *  4. On success → invoice marked PAID. On failure → mark dunning, set a
 *     grace period, retry later. Active calls are never interrupted.
 */
@Injectable()
export class InvoiceBillingService {
  private readonly logger = new Logger(InvoiceBillingService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(PAYMENT_SERVICE) private payments: PaymentService,
    private usageBilling: UsageBillingService,
  ) {}

  /**
   * Generate (or return existing) the invoice for a given cycle for a user.
   * The cycle is identified by its start date (first day of month).
   */
  async generateInvoiceForCycle(userId: string, cycleStart: Date) {
    const existing = await this.prisma.usageInvoice.findUnique({
      where: {
        userId_cycleStart: { userId, cycleStart },
      },
      include: { lineItems: true },
    });
    if (existing) return existing;

    const usage = await this.prisma.usage.findUnique({
      where: {
        companyId_billingCycleStart: {
          companyId: userId,
          billingCycleStart: cycleStart,
        },
      },
    });

    const rates = await this.usageBilling.getRates();

    // Billable minutes = usage beyond free allowance (screen-share always paid).
    const billableAudio = Math.max(0, (usage?.audioMinutes ?? 0) - rates.freeAudioMins);
    const billableVideo = Math.max(0, (usage?.videoMinutes ?? 0) - rates.freeVideoMins);
    const billableScreenShare = usage?.screenShareMinutes ?? 0;

    const audioPaise = billableAudio * rates.audioPaise;
    const videoPaise = billableVideo * rates.videoPaise;
    const screenSharePaise = billableScreenShare * rates.screenSharePaise;
    const subtotalPaise = audioPaise + videoPaise + screenSharePaise;
    const taxPaise = Math.round(subtotalPaise * (rates.taxPercent / 100));
    const totalPaise = subtotalPaise + taxPaise;

    const cycleEnd = new Date(cycleStart);
    cycleEnd.setMonth(cycleEnd.getMonth() + 1);
    cycleEnd.setDate(0); // last day of month

    const invoice = await this.prisma.usageInvoice.create({
      data: {
        userId,
        cycleStart,
        cycleEnd,
        invoiceNumber: `BJ-${cycleStart.getFullYear()}${String(cycleStart.getMonth() + 1).padStart(2, '0')}-${userId.slice(0, 8).toUpperCase()}`,
        audioMinutes: billableAudio,
        videoMinutes: billableVideo,
        screenShareMinutes: billableScreenShare,
        audioPaise,
        videoPaise,
        screenSharePaise,
        subtotalPaise,
        taxPaise,
        totalPaise,
        currency: 'INR',
        status: 'open',
      },
    });

    // Per-call line items.
    const callUsage = await this.prisma.callUsage.findMany({
      where: { usageId: usage?.id ?? '' },
    });
    if (callUsage.length) {
      await this.prisma.usageInvoiceLineItem.createMany({
        data: callUsage.map((cu) => ({
          invoiceId: invoice.id,
          callId: cu.callId,
          mediaType: cu.audioMinutes
            ? 'audio'
            : cu.videoMinutes
              ? 'video'
              : 'screen_share',
          minutes:
            cu.audioMinutes + cu.videoMinutes + cu.screenShareMinutes,
          participants: cu.participants,
          amountPaise: cu.costPaise,
        })),
      });
    }

    this.logger.log(
      `Generated invoice ${invoice.invoiceNumber} for user ${userId}: ${totalPaise} paise`,
    );

    return this.prisma.usageInvoice.findUnique({
      where: { id: invoice.id },
      include: { lineItems: true },
    });
  }

  /**
   * Attempt to charge the user's saved card for an open invoice. If no
   * payment method is configured, mark the invoice as dunning and set a
   * grace period so new calls can be gated (active calls keep running).
   */
  async chargeInvoice(userId: string, invoiceId: string) {
    const invoice = await this.prisma.usageInvoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'paid') return invoice;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user?.razorpayCustomerId || !this.payments.isConfigured()) {
      // No payment method: enter dunning + grace period.
      return this.enterDunning(invoice.id, userId);
    }

    try {
      const userToken = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { razorpayTokenId: true },
      });

      const intent = await this.payments.createPaymentIntent({
        customerId: user.razorpayCustomerId,
        amountPaise: invoice.totalPaise,
        currency: invoice.currency,
        tokenId: userToken?.razorpayTokenId,
        metadata: { invoiceId: invoice.id, userId },
      });

      if (intent.status === 'captured' || intent.status === 'authorized' || intent.status === 'succeeded') {
        const updated = await this.prisma.usageInvoice.update({
          where: { id: invoice.id },
          data: {
            status: 'paid',
            razorpayPaymentId: intent.id,
            paidAt: new Date(),
          },
        });
        await this.prisma.auditLog.create({
          data: {
            actorId: userId,
            action: 'PAYMENT_RECEIVED',
            metadata: { invoiceId: invoice.id, amountPaise: invoice.totalPaise },
          },
        });
        this.logger.log(`Charged invoice ${invoice.id}: ${invoice.totalPaise} paise`);
        return updated;
      }

      // Payment not immediately succeeded → treat as dunning.
      await this.prisma.usageInvoice.update({
        where: { id: invoice.id },
        data: { razorpayOrderId: intent.id, status: 'dunning' },
      });
      return this.enterDunning(invoice.id, userId);
    } catch (err) {
      this.logger.warn(`Payment failed for invoice ${invoice.id}: ${String(err)}`);
      return this.enterDunning(invoice.id, userId);
    }
  }

  /**
   * Mark an invoice as dunning and set a grace period (7 days) so the UI can
   * gate NEW calls while active calls continue uninterrupted.
   */
  private async enterDunning(invoiceId: string, userId: string) {
    const grace = new Date();
    grace.setDate(grace.getDate() + 7);

    const [invoice] = await Promise.all([
      this.prisma.usageInvoice.update({
        where: { id: invoiceId },
        data: { status: 'dunning', dueAt: grace },
      }),
      this.prisma.subscription.updateMany({
        where: { companyId: userId },
        data: {
          status: 'PAST_DUE',
          dunningAttempts: { increment: 1 },
          paymentFailedAt: new Date(),
          gracePeriodEndsAt: grace,
        },
      }),
    ]);

    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'PAYMENT_FAILED',
        metadata: { invoiceId, gracePeriodEndsAt: grace },
      },
    });

    this.logger.log(`Invoice ${invoiceId} entered dunning (grace until ${grace.toISOString()})`);
    return invoice;
  }

  /**
   * Monthly job: generate invoices for the just-completed cycle for all users
   * that had usage, then charge their saved cards.
   */
  async runMonthlyBilling(cycleStart: Date) {
    const usages = await this.prisma.usage.findMany({
      where: { billingCycleStart: cycleStart },
      select: { companyId: true },
      distinct: ['companyId'],
    });

    let invoicesGenerated = 0;
    let charged = 0;

for (const u of usages) {
      try {
        const invoice = await this.generateInvoiceForCycle(u.companyId, cycleStart);
        invoicesGenerated++;
        if (invoice && invoice.totalPaise > 0) {
          await this.chargeInvoice(u.companyId, invoice.id);
          charged++;
        }
      } catch (err) {
        this.logger.error(`Failed monthly billing for ${u.companyId}: ${String(err)}`);
      }
    }

    this.logger.log(
      `Monthly billing complete: ${invoicesGenerated} invoices, ${charged} charged.`,
    );
    return { invoicesGenerated, charged };
  }

  /**
   * List a user's usage invoices (newest first).
   */
  async getInvoicesForUser(userId: string, pageValue?: string) {
    const page = Math.max(1, parseInt(pageValue ?? '', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(process.env.PAGE_SIZE) || 10));
    const where = { userId };
    const [total, data] = await Promise.all([
      this.prisma.usageInvoice.count({ where }),
      this.prisma.usageInvoice.findMany({
        where,
        orderBy: { cycleStart: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { lineItems: true },
      }),
    ]);
    return { data, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
  }
}

export interface InvoiceBillingDeps {
  prisma: PrismaService;
  payments: PaymentService;
  usageBilling: UsageBillingService;
}
