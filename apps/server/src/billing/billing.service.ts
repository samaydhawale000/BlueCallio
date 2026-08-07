import {
  BadRequestException,
  Injectable,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PAYMENT_SERVICE } from '../payment/payment.service';
import type { PaymentService } from '../payment/payment.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(PAYMENT_SERVICE) private payments: PaymentService,
  ) {}

  // ── Plans ────────────────────────────────────────────
  async getPlans() {
    return this.prisma.plan.findMany({
      where: { status: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        monthlyPrice: true,
        currency: true,
        includedMinutes: true,
        features: true,
        displayOrder: true,
      },
    });
  }

  async getPlanBySlug(slug: string) {
    return this.prisma.plan.findUnique({ where: { slug } });
  }

  // ── Subscriptions ────────────────────────────────────
  async getCurrentSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { companyId: userId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
  }

  async getOrCreateFreeSubscription(userId: string) {
    const existing = await this.getCurrentSubscription(userId);
    if (existing) return existing;

    const free = await this.prisma.plan.findUnique({ where: { slug: 'free' } });
    if (!free) {
      throw new NotFoundException('Free plan not found. Run the plan seed.');
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const sub = await this.prisma.subscription.create({
      data: {
        companyId: userId,
        planId: free.id,
        status: 'ACTIVE',
        billingCycle: 'MONTHLY',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      include: { plan: true },
    });

    await this.ensureUsageRecord(userId, sub.id, now, periodEnd);
    return sub;
  }

async getBillingOverview(userId: string) {
    const sub = await this.getOrCreateFreeSubscription(userId);
    const usage = await this.getUsageForUser(userId, sub);

    const plan = sub.plan;
    const minutesIncluded = plan.includedMinutes ?? 0;
    const minutesPurchased = usage?.minutesPurchased ?? 0;
    const totalAvailable = minutesIncluded + minutesPurchased;
    const minutesUsed = usage?.minutesUsed ?? 0;
    const percentUsed = totalAvailable > 0
      ? Math.round((minutesUsed / totalAvailable) * 100)
      : 0;

    return {
      currentPlan: {
        name: plan.name,
        slug: plan.slug,
        price: plan.monthlyPrice,
        currency: plan.currency,
        includedMinutes: minutesIncluded,
      },
      subscription: {
        id: sub.id,
        status: sub.status,
        billingCycle: sub.billingCycle,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        paymentConfigured: this.payments.isConfigured(),
        gracePeriodEndsAt: sub.gracePeriodEndsAt,
        dunningAttempts: sub.dunningAttempts,
      },
      usage: {
        minutesUsed,
        minutesPurchased,
        minutesRemaining: Math.max(0, totalAvailable - minutesUsed),
        percentUsed,
        callsCreated: usage?.callsCreated ?? 0,
        callsCompleted: usage?.callsCompleted ?? 0,
        participants: usage?.participants ?? 0,
      },
      nextBillingDate: sub.currentPeriodEnd,
    };
  }

  async getInvoices(userId: string) {
    const sub = await this.getCurrentSubscription(userId);
    if (!sub) return [];
    return this.prisma.invoices.findMany({
      where: { subscriptionId: sub.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * The card stored on the User record (razorpayTokenId + card fields) is
   * always the one actually charged at month end — it's the source of truth
   * for "default", independent of how many tokens Razorpay has on file for
   * the customer. Merge it into the provider's list (or fall back to it
   * entirely in mock mode, where there is no provider list to fetch).
   */
  async getPaymentMethods(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const sub = await this.getCurrentSubscription(userId);

    let methods: Awaited<ReturnType<PaymentService['getPaymentMethods']>> = [];
    if (sub?.razorpayCustomerId && this.payments.isConfigured()) {
      methods = await this.payments.getPaymentMethods(sub.razorpayCustomerId);
    }

    if (user?.razorpayTokenId && !methods.some((m) => m.id === user.razorpayTokenId)) {
      methods = [
        {
          id: user.razorpayTokenId,
          brand: user.cardBrand ?? null,
          last4: user.cardLast4 ?? null,
          expMonth: user.cardExpMonth ?? null,
          expYear: user.cardExpYear ?? null,
        },
        ...methods,
      ];
    }

    return methods.map((m) => ({ ...m, default: m.id === user?.razorpayTokenId }));
  }

  /**
   * Remove a saved card. If it was the active auto-charge card, promote
   * another remaining card to default automatically (mirrors how most SaaS
   * billing UIs behave) rather than silently pausing auto-billing.
   */
  async removePaymentMethod(userId: string, tokenId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const sub = await this.getCurrentSubscription(userId);
    if (sub?.razorpayCustomerId && this.payments.isConfigured()) {
      try {
        await this.payments.deletePaymentMethod(sub.razorpayCustomerId, tokenId);
      } catch (e: any) {
        this.logger.warn(`Failed to delete Razorpay token ${tokenId}: ${e?.message}`);
      }
    }

    if (user.razorpayTokenId === tokenId) {
      const remaining = sub?.razorpayCustomerId && this.payments.isConfigured()
        ? (await this.payments.getPaymentMethods(sub.razorpayCustomerId)).filter((m) => m.id !== tokenId)
        : [];
      const promoted = remaining[0] ?? null;

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          razorpayTokenId: promoted?.id ?? null,
          cardBrand: promoted?.brand ?? null,
          cardLast4: promoted?.last4 ?? null,
          cardExpMonth: promoted?.expMonth ?? null,
          cardExpYear: promoted?.expYear ?? null,
        },
      });
    }

    await this.logAudit(userId, 'PAYMENT_METHOD_REMOVED', { tokenId });
    return { removed: true };
  }

  /** Switch which saved card is charged automatically at month end. */
  async setDefaultPaymentMethod(userId: string, tokenId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const sub = await this.getCurrentSubscription(userId);
    let card: {
      brand?: string | null;
      last4?: string | null;
      expMonth?: number | null;
      expYear?: number | null;
    } | null = null;

    if (sub?.razorpayCustomerId && this.payments.isConfigured()) {
      card = await this.payments.getPaymentMethod(sub.razorpayCustomerId, tokenId);
      if (!card) throw new NotFoundException('Payment method not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        razorpayTokenId: tokenId,
        cardBrand: card?.brand ?? user.cardBrand,
        cardLast4: card?.last4 ?? user.cardLast4,
        cardExpMonth: card?.expMonth ?? user.cardExpMonth,
        cardExpYear: card?.expYear ?? user.cardExpYear,
      },
    });

    await this.logAudit(userId, 'PAYMENT_METHOD_UPDATED', { tokenId, event: 'default_changed' });
    return { success: true };
  }

  // ── Add Payment Method (usage-based, no charge) ────
  /**
   * Ensure a Razorpay customer exists for the user, creating one if needed,
   * and persist the customer id on the user + current subscription.
   */
  async ensureRazorpayCustomer(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.razorpayCustomerId) return user.razorpayCustomerId;

    // Payment provider not configured (local/dev/demo) — use a synthetic
    // customer id so the rest of the flow (card save, auto-charge bookkeeping)
    // still works without calling out to Razorpay.
    const customerId = this.payments.isConfigured()
      ? await this.payments.createCustomer({
          email: user.email || '',
          name: user.name,
          userId,
        })
      : `cus_mock_${userId}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: { razorpayCustomerId: customerId },
    });

    const sub = await this.getCurrentSubscription(userId);
    if (sub) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { razorpayCustomerId: customerId },
      });
    }

    return customerId;
  }

  /**
   * Create a ₹0 Razorpay order so the frontend can open the Checkout modal
   * in "save card" mode (token.request = true). Returns the order id.
   */
  async createPaymentSetup(userId: string) {
    const customerId = await this.ensureRazorpayCustomer(userId);
    const setup = await this.payments.createSetupIntent(customerId);
    return { clientSecret: setup.clientSecret, customerId };
  }

  /**
   * Persist the saved-card token + card metadata returned by the Razorpay
   * Checkout handler onto the user record for future auto-charges.
   */
  async attachPaymentMethod(
    userId: string,
    paymentMethodId: string,
    tokenId?: string | null,
    card?: {
      brand?: string | null;
      last4?: string | null;
      expMonth?: number | null;
      expYear?: number | null;
    } | null,
  ) {
    const customerId = await this.ensureRazorpayCustomer(userId);
    await this.payments.attachPaymentMethod({
      customerId,
      paymentMethodId,
      tokenId,
      card,
      setDefault: true,
    });

    // Persist the token + card metadata for server-side auto-charge.
    if (tokenId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          razorpayTokenId: tokenId,
          cardBrand: card?.brand ?? null,
          cardLast4: card?.last4 ?? null,
          cardExpMonth: card?.expMonth ?? null,
          cardExpYear: card?.expYear ?? null,
        },
      });
    }

    await this.logAudit(userId, 'PAYMENT_RECEIVED', {
      event: 'payment_method_attached',
      paymentMethodId,
      tokenId,
    });
    return { attached: true, customerId };
  }

  // ── Checkout / upgrade ───────────────────────────────
  async createCheckout(userId: string, planSlug: string) {
    const plan = await this.getPlanBySlug(planSlug);
    if (!plan) throw new NotFoundException('Plan not found');

    if (!this.payments.isConfigured()) {
      // Mock mode: just switch the plan locally.
      return this.mockUpgrade(userId, plan);
    }

    const sub = await this.getOrCreateFreeSubscription(userId);
    let customerId = sub.razorpayCustomerId;
    if (!customerId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      customerId = await this.payments.createCustomer({
        email: user?.email || '',
        name: user?.name,
        userId,
      });
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { razorpayCustomerId: customerId },
      });
      await this.prisma.user.update({
        where: { id: userId },
        data: { razorpayCustomerId: customerId },
      });
    }

const priceId = plan.razorpayPlanId;
    if (!priceId) {
      // No price configured. Return a clear signal so the UI can show
      // feedback instead of silently doing nothing.
      return {
        mock: true,
        message: `Razorpay plan not configured for ${plan.name}.`,
      };
    }

    const base = process.env.APP_URL || 'http://localhost:3000';
    const session = await this.payments.createCheckoutSession({
      customerId,
      priceId,
      successUrl: `${base}/dashboard/billing?checkout=success`,
      cancelUrl: `${base}/dashboard/billing?checkout=cancelled`,
      metadata: { userId, planSlug },
    });
    return { checkoutUrl: session.url, sessionId: session.sessionId };
  }

  async createPortalSession(userId: string) {
    if (!this.payments.isConfigured()) {
      return { url: '/dashboard/billing', mock: true };
    }
    const sub = await this.getCurrentSubscription(userId);
    if (!sub?.razorpayCustomerId) {
      throw new NotFoundException('No Razorpay customer found');
    }
    const url = await this.payments.createPortalSession(sub.razorpayCustomerId);
    return { url };
  }

  /**
   * Purchase additional minutes (one-time Razorpay payment, or mock in dev).
   * On success, credits the current usage record with minutesPurchased.
   */
  async topUp(userId: string, minutes: number, currency = 'INR') {
    if (minutes <= 0) {
      throw new BadRequestException('Minutes must be greater than zero');
    }
    const sub = await this.getOrCreateFreeSubscription(userId);

    if (!this.payments.isConfigured()) {
      // Mock mode: credit minutes immediately.
      await this.creditPurchasedMinutes(userId, sub, minutes);
      await this.logAudit(userId, 'SUBSCRIPTION_CREATED', {
        topUp: minutes,
        isMock: true,
      });
      return { credited: minutes, isMock: true };
    }

    // Real mode: create a Razorpay customer if needed, then a one-time payment.
    let customerId = sub.razorpayCustomerId;
    if (!customerId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      customerId = await this.payments.createCustomer({
        email: user?.email || '',
        name: user?.name,
        userId,
      });
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { razorpayCustomerId: customerId },
      });
      await this.prisma.user.update({
        where: { id: userId },
        data: { razorpayCustomerId: customerId },
      });
    }

    // Price per minute in paise (INR) — ₹0.70/min → 70.
    const paisePerMinute = process.env.TOPUP_PAISE_PER_MINUTE
      ? Number(process.env.TOPUP_PAISE_PER_MINUTE)
      : 70;
    const amount = minutes * paisePerMinute;

    const base = process.env.APP_URL || 'http://localhost:3000';
    const session = await this.payments.createTopUpSession({
      customerId,
      amount,
      currency,
      successUrl: `${base}/dashboard/billing?topup=success`,
      cancelUrl: `${base}/dashboard/billing?topup=cancelled`,
      metadata: { userId, minutes: String(minutes) },
    });
    return { checkoutUrl: session.url, sessionId: session.sessionId, minutes };
  }

  async cancelSubscription(userId: string) {
    const sub = await this.getCurrentSubscription(userId);
    if (!sub) throw new NotFoundException('No subscription found');
    if (sub.razorpaySubscriptionId && this.payments.isConfigured()) {
      await this.payments.cancelSubscription(sub.razorpaySubscriptionId);
    }
    const updated = await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: true },
    });
    await this.logAudit(userId, 'SUBSCRIPTION_CANCELED', { subscriptionId: sub.id });
    return updated;
  }

  async resumeSubscription(userId: string) {
    const sub = await this.getCurrentSubscription(userId);
    if (!sub) throw new NotFoundException('No subscription found');
    if (sub.razorpaySubscriptionId && this.payments.isConfigured()) {
      await this.payments.resumeSubscription(sub.razorpaySubscriptionId);
    }
    const updated = await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: false },
    });
    await this.logAudit(userId, 'SUBSCRIPTION_RESUMED', { subscriptionId: sub.id });
    return updated;
  }

  // ── Usage ────────────────────────────────────────────
  async getUsageForUser(userId: string, sub?: any) {
    const subscription = sub ?? (await this.getCurrentSubscription(userId));
    if (!subscription) return null;
    return this.prisma.usage.findFirst({
      where: {
        companyId: userId,
        billingCycleStart: subscription.currentPeriodStart || undefined,
      },
    });
  }

  async ensureUsageRecord(userId: string, subId: string, start: Date, end: Date) {
    const existing = await this.prisma.usage.findUnique({
      where: {
        companyId_billingCycleStart: {
          companyId: userId,
          billingCycleStart: start,
        },
      },
    });
    if (existing) return existing;
    return this.prisma.usage.create({
      data: {
        companyId: userId,
        subscriptionId: subId,
        billingCycleStart: start,
        billingCycleEnd: end,
        minutesUsed: 0,
        callsCreated: 0,
        callsCompleted: 0,
      },
    });
  }

async recordCallUsage(userId: string, minutes: number, completed: boolean) {
    const sub = await this.getOrCreateFreeSubscription(userId);
    const start = sub.currentPeriodStart || new Date();
    await this.prisma.usage.upsert({
      where: {
        companyId_billingCycleStart: { companyId: userId, billingCycleStart: start },
      },
      create: {
        companyId: userId,
        subscriptionId: sub.id,
        billingCycleStart: start,
        billingCycleEnd: sub.currentPeriodEnd || new Date(),
        minutesUsed: Math.round(minutes),
        callsCreated: 1,
        callsCompleted: completed ? 1 : 0,
        participants: 0,
        apiRequests: 0,
      },
      update: {
        minutesUsed: { increment: Math.round(minutes) },
        callsCreated: { increment: 1 },
        callsCompleted: completed ? { increment: 1 } : undefined,
      },
    });
  }

  /**
   * Track the number of participants that joined calls this cycle.
   */
  async recordCallParticipants(userId: string, count: number) {
    const sub = await this.getOrCreateFreeSubscription(userId);
    const start = sub.currentPeriodStart || new Date();
    await this.prisma.usage.upsert({
      where: {
        companyId_billingCycleStart: { companyId: userId, billingCycleStart: start },
      },
      create: {
        companyId: userId,
        subscriptionId: sub.id,
        billingCycleStart: start,
        billingCycleEnd: sub.currentPeriodEnd || new Date(),
        minutesUsed: 0,
        callsCreated: 0,
        callsCompleted: 0,
        participants: count,
        apiRequests: 0,
      },
      update: {
        participants: { increment: count },
      },
    });
  }

async getUsageLimit(userId: string): Promise<{ allowed: boolean; minutesRemaining: number; included: number; purchased: number }> {
    const sub = await this.getOrCreateFreeSubscription(userId);
    const usage = await this.getUsageForUser(userId, sub);
    const included = sub.plan.includedMinutes ?? 0;
    const purchased = usage?.minutesPurchased ?? 0;
    const used = usage?.minutesUsed ?? 0;
    return {
      allowed: used < included + purchased,
      minutesRemaining: Math.max(0, included + purchased - used),
      included,
      purchased,
    };
  }

  /**
   * Credit purchased (top-up) minutes to the current usage record.
   */
  private async creditPurchasedMinutes(userId: string, sub: any, minutes: number) {
    const start = sub.currentPeriodStart || new Date();
    await this.prisma.usage.upsert({
      where: {
        companyId_billingCycleStart: { companyId: userId, billingCycleStart: start },
      },
      create: {
        companyId: userId,
        subscriptionId: sub.id,
        billingCycleStart: start,
        billingCycleEnd: sub.currentPeriodEnd || new Date(),
        minutesUsed: 0,
        minutesPurchased: minutes,
        callsCreated: 0,
        callsCompleted: 0,
        participants: 0,
        apiRequests: 0,
      },
      update: {
        minutesPurchased: { increment: minutes },
      },
    });
  }

  // ── Admin helpers ────────────────────────────────────
  async getCustomerBilling(userId: string) {
    const sub = await this.getCurrentSubscription(userId);
    if (!sub) {
      return { plan: 'free', status: 'ACTIVE', minutesUsed: 0, includedMinutes: 0 };
    }
    const usage = await this.getUsageForUser(userId, sub);
    return {
      plan: sub.plan.slug,
      planName: sub.plan.name,
      status: sub.status,
      minutesUsed: usage?.minutesUsed ?? 0,
      includedMinutes: sub.plan.includedMinutes ?? 0,
    };
  }

async getRevenue() {
    const [payments, activeSubs] = await Promise.all([
      this.prisma.payment.findMany({
        where: { paymentStatus: 'PAID' },
        orderBy: { paidAt: 'desc' },
        take: 100,
      }),
      this.prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: true },
      }),
    ]);
    const total = payments.reduce((s, p) => s + p.amount, 0);
    const paidCount = payments.length;
    const mrr = activeSubs.reduce((s, sub) => s + (sub.plan.monthlyPrice ?? 0), 0);
    const arr = mrr * 12;
    const payingCustomers = activeSubs.filter((s) => (s.plan.monthlyPrice ?? 0) > 0).length;
    return {
      total,
      count: paidCount,
      mrr,
      arr,
      payingCustomers,
      activeSubscriptions: activeSubs.length,
      payments,
    };
  }

  // ── Mock upgrade (no Razorpay configured) ──────────
  private async mockUpgrade(userId: string, plan: any) {
    const sub = await this.getOrCreateFreeSubscription(userId);
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await this.prisma.usage.deleteMany({
      where: { companyId: userId },
    });

    const updated = await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
      include: { plan: true },
    });

    await this.ensureUsageRecord(userId, sub.id, now, periodEnd);
    await this.logAudit(userId, 'SUBSCRIPTION_CREATED', { plan: plan.slug });
    return { plan: plan.name, status: updated.status, isMock: true };
  }

  // ── Webhook ──────────────────────────────────────────
  async handleWebhookEvent(event: Record<string, any>) {
    const type = event.type;
    this.logger.log(`Handling webhook: ${type}`);
    switch (type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data?.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data?.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data?.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data?.object);
        break;
      default:
        break;
    }
  }

private async handleCheckoutCompleted(session: any) {
    const userId = session?.metadata?.userId;
    const planSlug = session?.metadata?.planSlug;
    const topUpMinutes = Number(session?.metadata?.minutes || 0);

    // Top-up (one-time payment) checkout: credit purchased minutes.
if (topUpMinutes > 0 && userId) {
      const sub = await this.getOrCreateFreeSubscription(userId);
      await this.creditPurchasedMinutes(userId, sub, topUpMinutes);
      await this.logAudit(userId, 'PAYMENT_RECEIVED', {
        minutes: topUpMinutes,
        type: 'topup',
      });
      return;
    }

    if (!userId || !planSlug) return;
    const plan = await this.prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) return;
    const sub = await this.getCurrentSubscription(userId);
    if (sub) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          planId: plan.id,
          razorpayCustomerId: session.customer,
          status: 'ACTIVE',
          dunningAttempts: 0,
          paymentFailedAt: null,
          gracePeriodEndsAt: null,
        },
      });
    }
    await this.logAudit(userId, 'SUBSCRIPTION_CREATED', { plan: planSlug });
  }

  private async handlePaymentSucceeded(invoice: any) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id: invoice.subscription },
    });
    if (!sub) return;
    await this.prisma.payment.create({
      data: {
        subscriptionId: sub.id,
        razorpayPaymentId: invoice.payment_id,
        razorpayOrderId: invoice.order_id,
        amount: invoice.amount,
        currency: (invoice.currency || 'INR').toUpperCase(),
        paymentStatus: 'PAID',
        paidAt: new Date(),
      },
    });
    await this.logAudit(sub.companyId, 'PAYMENT_RECEIVED', { amount: invoice.amount });
  }

  private async handlePaymentFailed(invoice: any) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id: invoice.subscription },
    });
    if (!sub) return;
    await this.prisma.payment.create({
      data: {
        subscriptionId: sub.id,
        razorpayOrderId: invoice.order_id,
        amount: invoice.amount,
        currency: (invoice.currency || 'INR').toUpperCase(),
        paymentStatus: 'FAILED',
      },
    });
    // Increment dunning attempt and extend grace period (7 days from now).
    const grace = new Date();
    grace.setDate(grace.getDate() + 7);
    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'PAST_DUE',
        dunningAttempts: { increment: 1 },
        paymentFailedAt: new Date(),
        gracePeriodEndsAt: grace,
      },
    });
    await this.logAudit(sub.companyId, 'PAYMENT_FAILED', {
      amount: invoice.amount,
      attempts: (sub.dunningAttempts ?? 0) + 1,
    });
  }

  private async handleSubscriptionUpdated(subscription: any) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscription.id },
    });
    if (!sub) return;
    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: this.mapRazorpayStatus(subscription.status),
        currentPeriodStart: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : undefined,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      },
    });
  }

  private mapRazorpayStatus(status: string): any {
    switch (status) {
      case 'active': return 'ACTIVE';
      case 'trialing': return 'TRIALING';
      case 'past_due': return 'PAST_DUE';
      case 'cancelled': return 'CANCELED';
      case 'completed': return 'COMPLETED';
      case 'halted': return 'PAST_DUE';
      default: return 'ACTIVE';
    }
  }

  private async logAudit(actorId: any, action: any, metadata: any) {
    try {
      await this.prisma.auditLog.create({
        data: { actorId: actorId || null, action, metadata },
      });
    } catch {
      // Non-fatal
    }
  }
}
