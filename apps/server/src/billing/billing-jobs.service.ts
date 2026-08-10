import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';
import { InvoiceBillingService } from './invoice-billing.service';

/**
 * Scheduled billing jobs — run outside any API request:
 *  - Daily: reset expired usage records (new billing cycle) for active subs.
 *  - Daily: auto-downgrade subscriptions that have exceeded their grace
 *    period after repeated payment failures (PAST_DUE → Free).
 *  - Monthly (1st): generate + auto-charge usage-based invoices.
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
    await this.resetExpiredUsage();
    await this.downgradePastDueSubscriptions();
    await this.runMonthlyInvoiceJob();
    this.logger.log('Daily billing jobs complete.');
  }

  /**
   * On the 1st of the month, generate a usage invoice for the previous cycle
   * for every user that had usage, then auto-charge their saved card.
   */
  private async runMonthlyInvoiceJob() {
    const now = new Date();
    // Only run on the 1st of the month.
    if (now.getDate() !== 1) return;

    // Previous cycle = previous calendar month.
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    this.logger.log(
      `Generating usage invoices for cycle starting ${prevStart.toISOString()}`,
    );
    await this.invoiceBilling.runMonthlyBilling(prevStart);
  }

  /**
   * For each ACTIVE subscription, if its current period has ended, create a
   * fresh usage record for the new cycle (minutes reset). Purchased top-up
   * minutes carry over so customers don't lose prepaid minutes.
   */
  private async resetExpiredUsage() {
    const now = new Date();
    const subs = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true },
    });

    for (const sub of subs) {
      if (!sub.currentPeriodEnd || sub.currentPeriodEnd > now) continue;

      const newStart = new Date(sub.currentPeriodEnd);
      const newEnd = new Date(newStart);
      newEnd.setMonth(newEnd.getMonth() + 1);

      // Carry over purchased (top-up) minutes from the previous cycle.
      const oldUsage = await this.prisma.usage.findFirst({
        where: {
          companyId: sub.companyId,
          billingCycleStart: sub.currentPeriodStart || undefined,
        },
      });
      const carriedPurchased = oldUsage?.minutesPurchased ?? 0;

      await this.prisma.usage.upsert({
        where: {
          companyId_billingCycleStart: {
            companyId: sub.companyId,
            billingCycleStart: newStart,
          },
        },
        create: {
          companyId: sub.companyId,
          subscriptionId: sub.id,
          billingCycleStart: newStart,
          billingCycleEnd: newEnd,
          minutesUsed: 0,
          minutesPurchased: carriedPurchased,
          callsCreated: 0,
          callsCompleted: 0,
          participants: 0,
          apiRequests: 0,
        },
        update: {
          billingCycleEnd: newEnd,
          minutesUsed: 0,
          minutesPurchased: carriedPurchased,
          callsCreated: 0,
          callsCompleted: 0,
          participants: 0,
          apiRequests: 0,
        },
      });

      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          currentPeriodStart: newStart,
          currentPeriodEnd: newEnd,
          dunningAttempts: 0,
          paymentFailedAt: null,
          gracePeriodEndsAt: null,
        },
      });

      this.logger.log(
        `Reset usage for user ${sub.companyId}: new cycle starts ${newStart.toISOString()}`,
      );
    }
  }

  /**
   * Any subscription that is PAST_DUE and has passed its grace period is
   * downgraded to the Free plan (automatically). The customer can upgrade
   * again later.
   */
  private async downgradePastDueSubscriptions() {
    const now = new Date();
    const pastDue = await this.prisma.subscription.findMany({
      where: { status: 'PAST_DUE' },
    });

    for (const sub of pastDue) {
      if (sub.gracePeriodEndsAt && sub.gracePeriodEndsAt > now) continue;

      const free = await this.prisma.plan.findUnique({
        where: { slug: 'free' },
      });
      if (!free) continue;

      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          planId: free.id,
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
          metadata: { from: 'PAST_DUE', to: 'free', reason: 'auto_downgrade' },
        },
      });

      this.logger.log(
        `Auto-downgraded user ${sub.companyId} to Free (grace period elapsed).`,
      );
    }
  }
}
