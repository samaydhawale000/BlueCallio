import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';
import { InvoiceBillingService } from './invoice-billing.service';
import { addAnchoredMonth } from './billing-cycle.util';

/**
 * Scheduled billing jobs — run outside any API request:
 *  - Daily: renew any subscription whose cycle has ended (anchored to that
 *    customer's own signup day-of-month, not the calendar 1st) — closes out
 *    the cycle's invoice, charges the saved card, advances to the next
 *    cycle, or terminates the subscription if cancelAtPeriodEnd is set.
 *  - Daily: retry invoices stuck in dunning on a fixed day-1/3/7 schedule.
 *  - Daily: auto-downgrade subscriptions that have exceeded their grace
 *    period after repeated payment failures (PAST_DUE → Free).
 *
 * There is no distributed lock / queue infra in this stack (single
 * @nestjs/schedule cron, no Redis) — safety instead comes from atomic
 * conditional updateMany "claims" (mirroring CallService.endCall's status-
 * transition idiom) plus DB unique constraints on invoice creation, so a
 * re-run or an overlapping instance can never double-advance a cycle,
 * double-generate an invoice, or double-charge one.
 */
@Injectable()
export class BillingJobsService {
  private readonly logger = new Logger(BillingJobsService.name);

  constructor(
    private prisma: PrismaService,
    private invoiceBilling: InvoiceBillingService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleDailyBilling() {
    this.logger.log('Running daily billing jobs…');
    await this.renewDueSubscriptions();
    await this.retryDunningInvoices();
    await this.downgradePastDueSubscriptions();
    this.logger.log('Daily billing jobs complete.');
  }

  /**
   * For each ACTIVE subscription whose cycle has ended: honor
   * cancelAtPeriodEnd (final invoice, then terminate — no new cycle), or
   * else close out the just-ended cycle's invoice/charge and roll forward
   * to the next anchored cycle. PAST_DUE subscriptions are excluded here —
   * they're handled by retryDunningInvoices/downgradePastDueSubscriptions
   * instead of being silently rolled forward while unpaid.
   */
  private async renewDueSubscriptions() {
    const now = new Date();
    const due = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE', currentPeriodEnd: { lte: now } },
    });

    for (const sub of due) {
      try {
        await this.renewOne(sub, now);
      } catch (err) {
        this.logger.error(`Failed to renew subscription ${sub.id}: ${String(err)}`);
      }
    }
  }

  private async renewOne(sub: any, now: Date) {
    const oldStart = sub.currentPeriodStart ?? now;
    const oldEnd = sub.currentPeriodEnd ?? now;

    if (sub.cancelAtPeriodEnd) {
      // Atomically claim: only the caller that actually flips the
      // subscription to CANCELED closes out the final cycle.
      const claimed = await this.prisma.subscription.updateMany({
        where: { id: sub.id, status: 'ACTIVE' },
        data: { status: 'CANCELED' },
      });
      if (claimed.count === 0) return; // another run already handled this

      const invoice = await this.invoiceBilling.generateInvoiceForCycle(sub.companyId, oldStart);
      if (invoice && invoice.totalPaise > 0) {
        await this.invoiceBilling.chargeInvoice(sub.companyId, invoice.id);
      }
      this.logger.log(
        `Subscription ${sub.id} cancelled at period end (final cycle ${oldStart.toISOString()} invoiced).`,
      );
      return;
    }

    const newStart = oldEnd;
    const anchorDay = sub.billingAnchorDay ?? oldStart.getDate();
    const newEnd = addAnchoredMonth(newStart, anchorDay);

    // Atomic claim, conditioned on the currentPeriodEnd we read — if another
    // run already advanced this subscription, count === 0 and we skip.
    const claimed = await this.prisma.subscription.updateMany({
      where: { id: sub.id, currentPeriodEnd: sub.currentPeriodEnd },
      data: { currentPeriodStart: newStart, currentPeriodEnd: newEnd },
    });
    if (claimed.count === 0) return;

    // Carry over purchased (top-up) minutes from the previous cycle.
    const oldUsage = await this.prisma.usage.findUnique({
      where: {
        companyId_billingCycleStart: { companyId: sub.companyId, billingCycleStart: oldStart },
      },
    });
    await this.prisma.usage.upsert({
      where: {
        companyId_billingCycleStart: { companyId: sub.companyId, billingCycleStart: newStart },
      },
      create: {
        companyId: sub.companyId,
        subscriptionId: sub.id,
        billingCycleStart: newStart,
        billingCycleEnd: newEnd,
        minutesPurchased: oldUsage?.minutesPurchased ?? 0,
      },
      update: {},
    });

    const invoice = await this.invoiceBilling.generateInvoiceForCycle(sub.companyId, oldStart);
    if (invoice && invoice.totalPaise > 0) {
      await this.invoiceBilling.chargeInvoice(sub.companyId, invoice.id);
    }

    this.logger.log(
      `Renewed subscription ${sub.id} for ${sub.companyId}: new cycle ${newStart.toISOString()} -> ${newEnd.toISOString()}`,
    );
  }

  /**
   * Retry invoices stuck in dunning on their scheduled day (fixed day-1/3/7
   * schedule from when dunning started — see InvoiceBillingService).
   */
  private async retryDunningInvoices() {
    const now = new Date();
    const due = await this.prisma.usageInvoice.findMany({
      where: { status: 'dunning', nextRetryAt: { lte: now } },
    });

    for (const invoice of due) {
      try {
        await this.invoiceBilling.retryChargeInvoice(invoice.id);
      } catch (err) {
        this.logger.error(`Dunning retry failed for invoice ${invoice.id}: ${String(err)}`);
      }
    }
  }

  /**
   * Any subscription that is PAST_DUE and has passed its grace period is
   * reset to ACTIVE (giving up on collecting the unpaid invoice) unless the
   * customer had already asked to cancel, in which case the cancellation is
   * honored instead. Also seals any still-open dunning invoice as failed so
   * billing history doesn't show a permanently-pending state.
   */
  private async downgradePastDueSubscriptions() {
    const now = new Date();
    const pastDue = await this.prisma.subscription.findMany({
      where: { status: 'PAST_DUE' },
    });

    for (const sub of pastDue) {
      if (sub.gracePeriodEndsAt && sub.gracePeriodEndsAt > now) continue;

      await this.prisma.usageInvoice.updateMany({
        where: { userId: sub.companyId, status: 'dunning' },
        data: { status: 'failed', nextRetryAt: null },
      });

      // A customer who cancelled while their payment was failing shouldn't
      // be silently reactivated when their grace period runs out — honor
      // the cancellation instead of resetting them to good standing.
      if (sub.cancelAtPeriodEnd) {
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'CANCELED',
            dunningAttempts: 0,
            paymentFailedAt: null,
            gracePeriodEndsAt: null,
          },
        });
        await this.prisma.auditLog.create({
          data: {
            actorId: sub.companyId,
            action: 'SUBSCRIPTION_CANCELED',
            metadata: { from: 'PAST_DUE', reason: 'cancel_at_period_end_after_grace' },
          },
        });
        this.logger.log(`Subscription ${sub.id} cancelled after grace period elapsed (unpaid, cancelAtPeriodEnd).`);
        continue;
      }

      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: 'ACTIVE',
          cancelAtPeriodEnd: false,
          dunningAttempts: 0,
          paymentFailedAt: null,
          gracePeriodEndsAt: null,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          actorId: sub.companyId,
          action: 'PLAN_CHANGED',
          metadata: { reason: 'auto_reset_after_grace_period', from: 'PAST_DUE', to: 'ACTIVE' },
        },
      });

      this.logger.log(
        `Reset subscription ${sub.id} to good standing (grace period elapsed, unpaid invoice sealed as failed).`,
      );
    }
  }
}
