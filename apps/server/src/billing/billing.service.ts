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

/** Loose E.164 check (+ up to 15 digits) — what Razorpay requires for a contact number. */
const PHONE_RE = /^\+[1-9]\d{7,14}$/;

/**
 * BlueCallio v1 billing = usage-based (see UsageBillingService,
 * RatingEngineService, UsageSegmentService — that is the active model
 * calls are actually metered and charged against, enforced via
 * UsageBillingService.canStartCall).
 *
 * This service also still carries the PRE-usage-based Plan/Subscription
 * model (monthly plans, checkout, top-up, cancel/resume) from before the
 * pivot. It is NOT on the call-billing path — CallService never calls into
 * it — and is kept only for: (a) any customer still on a legacy active
 * subscription, and (b) the admin plan-management screen. Sections below
 * are marked "LEGACY" accordingly; don't extend that model for new work.
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(PAYMENT_SERVICE) private payments: PaymentService,
  ) {}

  // ── LEGACY: Plans ────────────────────────────────────
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

  // ── Subscriptions (SHARED — not pure legacy) ────────
  // getCurrentSubscription/getOrCreateFreeSubscription are still live
  // dependencies of the current usage-based flow below (ensureRazorpayCustomer,
  // getPaymentMethods, removePaymentMethod, setDefaultPaymentMethod all read
  // through the Subscription row for its razorpayCustomerId). Only the
  // plan-price/checkout/cancel/resume methods further down are dead legacy.
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
        billingAnchorDay: now.getDate(),
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

    return methods.map((m) => ({
      ...m,
      brand: m.brand ?? (m.id === user?.razorpayTokenId ? user.cardBrand : null),
      last4: m.last4 ?? (m.id === user?.razorpayTokenId ? user.cardLast4 : null),
      expMonth: m.expMonth ?? (m.id === user?.razorpayTokenId ? user.cardExpMonth : null),
      expYear: m.expYear ?? (m.id === user?.razorpayTokenId ? user.cardExpYear : null),
      default: m.id === user?.razorpayTokenId,
    }));
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
          contact: user.phone,
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
   * Create a ₹1 Razorpay card-mandate authorisation order so the frontend
   * can open the Checkout modal with recurring = true. Returns the order id.
   *
   * The contact phone number Razorpay requires to authorise a recurring
   * mandate is collected once at login (see AuthService.setPhone) and kept
   * in sync on the Razorpay customer — not re-collected here.
   */
  async createPaymentSetup(userId: string) {
    const customerId = await this.ensureRazorpayCustomer(userId);

    if (this.payments.isConfigured()) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true },
      });
      if (!user?.phone) {
        throw new BadRequestException(
          'Add a contact phone number to your account before saving a card.',
        );
      }
      await this.payments.updateCustomerContact(customerId, user.phone);
    }

    const setup = await this.payments.createSetupIntent(customerId);
    return { clientSecret: setup.clientSecret, customerId };
  }

  /**
   * Sets the user's contact phone number (required by Razorpay to authorise
   * a recurring card mandate) and, if a Razorpay customer already exists,
   * syncs it there immediately — covers customers created before this field
   * existed, which Razorpay would otherwise reject with "The contact field
   * is required for recurring links".
   */
  async setContactPhone(userId: string, phone: string) {
    const trimmed = phone?.trim();
    if (!trimmed || !PHONE_RE.test(trimmed)) {
      throw new BadRequestException(
        'Enter a valid phone number with country code, e.g. +919876543210.',
      );
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { phone: trimmed },
    });

    if (user.razorpayCustomerId && this.payments.isConfigured()) {
      await this.payments.updateCustomerContact(user.razorpayCustomerId, trimmed);
    }

    return { phone: trimmed };
  }

  /**
   * Persist the saved-card token + card metadata for future auto-charges.
   *
   * When Razorpay is configured, the token is never taken from the client —
   * a `razorpay_payment_id` is not a card token. Instead we verify the
   * Checkout payment signature server-side, then ask Razorpay for the real
   * token it created for this customer (see resolveSavedCardToken). Only in
   * mock/dev mode (no Razorpay credentials) do we fall back to trusting the
   * client-simulated token, since there is no real gateway to verify against.
   */
  async attachPaymentMethod(
    userId: string,
    paymentMethodId: string,
    payment?: {
      tokenId?: string | null;
      orderId?: string | null;
      paymentId?: string | null;
      signature?: string | null;
    } | null,
    fallbackCard?: {
      brand?: string | null;
      last4?: string | null;
      expMonth?: number | null;
      expYear?: number | null;
    } | null,
  ) {
    const customerId = await this.ensureRazorpayCustomer(userId);

    let tokenId: string | null | undefined;
    let card = fallbackCard;

    if (this.payments.isConfigured()) {
      if (!payment?.orderId || !payment?.paymentId || !payment?.signature) {
        throw new BadRequestException(
          'Missing Razorpay payment verification details.',
        );
      }
      const { verified } = await this.payments.verifyCardSetupPayment({
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        signature: payment.signature,
      });
      if (!verified) {
        throw new BadRequestException(
          'Could not verify the Razorpay payment signature.',
        );
      }
      const resolved = await this.payments.resolveSavedCardToken(
        customerId,
        payment.paymentId,
      );
      tokenId = resolved.id;
      card = {
        brand: resolved.brand,
        last4: resolved.last4,
        expMonth: resolved.expMonth,
        expYear: resolved.expYear,
      };
    } else {
      // Mock/dev mode: no real gateway to verify against — trust the
      // client-simulated token so local dev/demo still works end to end.
      tokenId = payment?.tokenId;
    }

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

  // ── LEGACY: Checkout / upgrade (plan-based) ─────────
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

    // Price per minute in paise (INR) — derived from the DB billing rates.
    // Top-ups are priced at the video rate so they cover the costliest media.
    const rates = await this.prisma.billingRate.findUnique({
      where: { key: 'default' },
    });
    const paisePerMinute = process.env.TOPUP_PAISE_PER_MINUTE
      ? Number(process.env.TOPUP_PAISE_PER_MINUTE)
      : rates?.videoPaise ?? 80;
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

  /**
   * Cancels at period end, not immediately: the customer keeps the plan
   * (and gets billed one final invoice for usage already incurred) through
   * currentPeriodEnd, honored by BillingJobsService.renewDueSubscriptions.
   */
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
    return {
      ...updated,
      message: sub.currentPeriodEnd
        ? `Your plan will remain active until ${sub.currentPeriodEnd.toDateString()}, after which it will not renew.`
        : 'Your plan will not renew at the end of the current cycle.',
    };
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

  // ── LEGACY: Usage (plan minutesUsed tracking — superseded
  // by UsageBillingService's audio/video/screenShare participant-minutes) ──
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

  // ── LEGACY: Mock upgrade (no Razorpay configured) ──
  private async mockUpgrade(userId: string, plan: any) {
    const updated = await this.changePlanWithProration(userId, plan.slug);
    await this.logAudit(userId, 'SUBSCRIPTION_CREATED', { plan: plan.slug });
    return { plan: plan.name, status: updated.status, isMock: true };
  }

  /**
   * Switch the user's plan immediately, mid-cycle, without disturbing the
   * current billing cycle's boundaries or already-accrued Usage — those
   * must survive so the eventual invoice for this cycle bills usage
   * correctly regardless of which plan was active when it accrued.
   *
   * Cost is reconciled via a deferred ProrationAdjustment folded into the
   * NEXT invoice (see InvoiceBillingService.generateInvoiceForCycle), not
   * charged synchronously: standard days-remaining proration — credit the
   * unused portion of the old plan, charge the remaining portion of the new
   * plan, for the days left in the current cycle. Free-plan changes never
   * prorate a cash payout, only forfeit the remainder.
   */
  async changePlanWithProration(userId: string, newPlanSlug: string) {
    const newPlan = await this.getPlanBySlug(newPlanSlug);
    if (!newPlan) throw new NotFoundException('Plan not found');

    const sub = await this.getOrCreateFreeSubscription(userId);
    const oldPlan = sub.plan;

    if (sub.currentPeriodStart && sub.currentPeriodEnd && oldPlan.id !== newPlan.id) {
      const cycleMs = sub.currentPeriodEnd.getTime() - sub.currentPeriodStart.getTime();
      const daysInCycle = Math.max(1, cycleMs / 86400000);
      const now = new Date();
      const daysRemaining = Math.max(
        0,
        (sub.currentPeriodEnd.getTime() - now.getTime()) / 86400000,
      );

      const oldDailyRate = (oldPlan.monthlyPrice ?? 0) / daysInCycle;
      const newDailyRate = (newPlan.monthlyPrice ?? 0) / daysInCycle;
      const credit = Math.round(oldDailyRate * daysRemaining);
      const charge = Math.round(newDailyRate * daysRemaining);
      const netAdjustmentPaise = charge - credit;

      if (netAdjustmentPaise !== 0) {
        await this.prisma.prorationAdjustment.create({
          data: {
            userId,
            amountPaise: netAdjustmentPaise,
            reason: `plan_change:${oldPlan.slug}->${newPlan.slug}`,
          },
        });
      }
    }

    const updated = await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        planId: newPlan.id,
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
      },
      include: { plan: true },
    });

    await this.logAudit(userId, 'PLAN_CHANGED', { from: oldPlan.slug, to: newPlan.slug });
    return updated;
  }

  // ── Webhook (Razorpay) ──────────────────────────────
  // NOTE: this previously assumed Stripe's webhook shape (`event.type`,
  // `event.data.object`, invoice/session field names) even though it's only
  // ever called from the Razorpay webhook endpoint — meaning no real
  // Razorpay webhook (payment success/failure, subscription change) was
  // ever actually processed; the switch never matched. Razorpay's shape is
  // `event.event` (event name) + `event.payload.<entity>.entity`.
  async handleWebhookEvent(event: Record<string, any>) {
    const type = event.event;
    this.logger.log(`Handling Razorpay webhook: ${type}`);
    switch (type) {
      case 'payment.captured':
        await this.handlePaymentCaptured(event.payload?.payment?.entity);
        break;
      case 'payment.failed':
        await this.handlePaymentFailedEvent(event.payload?.payment?.entity);
        break;
      case 'subscription.charged':
        await this.handleSubscriptionCharged(
          event.payload?.subscription?.entity,
          event.payload?.payment?.entity,
        );
        break;
      case 'subscription.cancelled':
      case 'subscription.completed':
        await this.handleSubscriptionStatusEvent(event.payload?.subscription?.entity);
        break;
      default:
        this.logger.debug(`Unhandled Razorpay webhook event: ${type}`);
        break;
    }
  }

  /**
   * A captured (successful) payment — covers both plan checkout and minute
   * top-ups, since both go through a Razorpay Order carrying `notes`
   * (userId + planSlug, or userId + minutes) that Razorpay copies onto the
   * resulting payment entity.
   *
   * Idempotent: Razorpay retries webhook delivery, so this must never credit
   * the same payment twice. Guarded by an existence check + a DB unique
   * constraint on Payment.razorpayPaymentId as the hard backstop.
   */
  private async handlePaymentCaptured(payment: any) {
    if (!payment?.id) return;

    const already = await this.prisma.payment.findFirst({
      where: { razorpayPaymentId: payment.id },
    });
    if (already) {
      this.logger.warn(`Payment ${payment.id} already recorded — skipping duplicate webhook.`);
      return;
    }

    const userId = payment.notes?.userId;
    if (!userId) {
      this.logger.warn(`payment.captured for ${payment.id} has no userId in notes — skipping.`);
      return;
    }

    const sub = await this.getOrCreateFreeSubscription(userId);

    try {
      await this.prisma.payment.create({
        data: {
          subscriptionId: sub.id,
          razorpayPaymentId: payment.id,
          razorpayOrderId: payment.order_id ?? null,
          amount: payment.amount ?? 0,
          currency: (payment.currency || 'INR').toUpperCase(),
          paymentStatus: 'PAID',
          paymentMethod: payment.method ?? null,
          paidAt: new Date(),
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        this.logger.warn(`Payment ${payment.id} already recorded (race) — skipping duplicate credit.`);
        return;
      }
      throw e;
    }

    const topUpMinutes = Number(payment.notes?.minutes || 0);
    if (topUpMinutes > 0) {
      await this.creditPurchasedMinutes(userId, sub, topUpMinutes);
      await this.logAudit(userId, 'PAYMENT_RECEIVED', {
        minutes: topUpMinutes,
        type: 'topup',
        razorpayPaymentId: payment.id,
      });
      return;
    }

    const planSlug = payment.notes?.planSlug;
    if (planSlug) {
      const plan = await this.prisma.plan.findUnique({ where: { slug: planSlug } });
      if (plan) {
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: {
            planId: plan.id,
            status: 'ACTIVE',
            dunningAttempts: 0,
            paymentFailedAt: null,
            gracePeriodEndsAt: null,
          },
        });
        await this.logAudit(userId, 'SUBSCRIPTION_CREATED', { plan: planSlug, razorpayPaymentId: payment.id });
        return;
      }
    }

    await this.logAudit(userId, 'PAYMENT_RECEIVED', { amount: payment.amount, razorpayPaymentId: payment.id });
  }

  private async handlePaymentFailedEvent(payment: any) {
    if (!payment?.id) return;

    const userId = payment.notes?.userId;
    if (!userId) {
      this.logger.warn(`payment.failed for ${payment.id} has no userId in notes — skipping.`);
      return;
    }

    const already = await this.prisma.payment.findFirst({
      where: { razorpayPaymentId: payment.id },
    });
    if (already) return;

    const sub = await this.getOrCreateFreeSubscription(userId);

    try {
      await this.prisma.payment.create({
        data: {
          subscriptionId: sub.id,
          razorpayPaymentId: payment.id,
          razorpayOrderId: payment.order_id ?? null,
          amount: payment.amount ?? 0,
          currency: (payment.currency || 'INR').toUpperCase(),
          paymentStatus: 'FAILED',
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') return;
      throw e;
    }

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
      amount: payment.amount,
      razorpayPaymentId: payment.id,
    });
  }

  /** Legacy plan-subscription recurring charge (see razorpay-payment.service.ts — subscriptions are retired for new signups, kept for any still-active legacy rows). */
  private async handleSubscriptionCharged(subscription: any, payment: any) {
    if (!subscription?.id) return;
    const sub = await this.prisma.subscription.findFirst({
      where: { razorpaySubscriptionId: subscription.id },
    });
    if (!sub) return;

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'ACTIVE',
        dunningAttempts: 0,
        paymentFailedAt: null,
        gracePeriodEndsAt: null,
        currentPeriodStart: subscription.current_start
          ? new Date(subscription.current_start * 1000)
          : undefined,
        currentPeriodEnd: subscription.current_end
          ? new Date(subscription.current_end * 1000)
          : undefined,
      },
    });

    if (payment?.id) {
      const already = await this.prisma.payment.findFirst({ where: { razorpayPaymentId: payment.id } });
      if (!already) {
        try {
          await this.prisma.payment.create({
            data: {
              subscriptionId: sub.id,
              razorpayPaymentId: payment.id,
              amount: payment.amount ?? 0,
              currency: (payment.currency || 'INR').toUpperCase(),
              paymentStatus: 'PAID',
              paidAt: new Date(),
            },
          });
        } catch (e: any) {
          if (e?.code !== 'P2002') throw e;
        }
      }
    }
    await this.logAudit(sub.companyId, 'PAYMENT_RECEIVED', { subscriptionId: sub.id, event: 'subscription.charged' });
  }

  /** Legacy plan-subscription cancel/complete (see note on handleSubscriptionCharged). */
  private async handleSubscriptionStatusEvent(subscription: any) {
    if (!subscription?.id) return;
    const sub = await this.prisma.subscription.findFirst({
      where: { razorpaySubscriptionId: subscription.id },
    });
    if (!sub) return;

    const cancelled = subscription.status === 'cancelled' || subscription.status === 'completed';
    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: cancelled ? 'CANCELED' : this.mapRazorpayStatus(subscription.status),
        cancelAtPeriodEnd: cancelled,
      },
    });
    await this.logAudit(
      sub.companyId,
      cancelled ? 'SUBSCRIPTION_CANCELED' : 'SUBSCRIPTION_RESUMED',
      { subscriptionId: sub.id },
    );
  }

  private mapRazorpayStatus(status: string): any {
    switch (status) {
      case 'active': return 'ACTIVE';
      case 'authenticated': return 'TRIALING';
      case 'past_due': return 'PAST_DUE';
      case 'cancelled': return 'CANCELED';
      case 'completed': return 'CANCELED';
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
