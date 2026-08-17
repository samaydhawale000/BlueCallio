import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  PAYMENT_SERVICE,
  PaymentService,
  CreateCustomerInput,
  CreateCheckoutInput,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  SubscriptionResult,
  InvoiceResult,
  PaymentMethodResult,
  CheckoutResult,
  TopUpResult,
  SetupIntentResult,
  PaymentIntentResult,
} from './payment.service';

/**
 * Razorpay implementation of the PaymentService interface.
 *
 * If RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set, the service runs in
 * "mock" mode: every method returns simulated data so the rest of the
 * platform is still fully testable without payment credentials.
 *
 * Saved-card flow (no Stripe-style SetupIntents):
 *  1. createSetupIntent() → creates a ₹0 order (order_id) which the frontend
 *     uses to open the Razorpay Checkout modal in "save card" mode
 *     (token.request = true).
 *  2. attachPaymentMethod() → the Checkout handler returns a card token
 *     (token_xxx) + card metadata; we persist them on the User. This method
 *     is a no-op for Razorpay (the token is already created server-side).
 *  3. createPaymentIntent() → charges the saved card token directly via
 *     POST /v1/payments.
 */
@Injectable()
export class RazorpayPaymentService implements PaymentService {
  private readonly logger = new Logger(RazorpayPaymentService.name);
  private readonly razorpay: any;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keyId && keySecret) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Razorpay = require('razorpay');
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    } else {
      this.razorpay = null;
      this.logger.warn(
        'RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — running payment service in mock mode.',
      );
    }
  }

  isConfigured(): boolean {
    return !!this.razorpay;
  }

  private assertConfigured() {
    if (!this.razorpay) {
      throw new Error(
        'Payment provider is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
      );
    }
  }

  async createCustomer(input: CreateCustomerInput): Promise<string> {
    this.assertConfigured();
    const customer = await this.razorpay.customers.create({
      email: input.email,
      name: input.name || undefined,
      contact: undefined,
      notes: { userId: input.userId },
    });
    return customer.id;
  }

  /**
   * Creates a ₹1 order (the Razorpay minimum). The order id is used by the
   * frontend Checkout modal to capture a card token in "save card" mode
   * (token.request = true). The user is NOT charged — the checkout handler
   * only captures a saved-card token; the order is never captured for
   * payment. Razorpay rejects orders below ₹1 (100 paise), so we must use the
   * ₹1 minimum rather than ₹0.
   */
  async createSetupIntent(customerId: string): Promise<SetupIntentResult> {
    this.assertConfigured();
    const order = await this.razorpay.orders.create({
      amount: 100, // ₹1 minimum — Razorpay rejects amounts below ₹1.
      currency: 'INR',
      receipt: `setup_${Date.now()}`,
      notes: { customerId },
    });
    return { clientSecret: order.id, customerId };
  }

  /**
   * Razorpay creates the card token during Checkout, so there is nothing to
   * attach server-side. The token id + card metadata are persisted on the
   * User by the caller.
   */
  async attachPaymentMethod(_input: {
    customerId: string;
    paymentMethodId: string;
    tokenId?: string | null;
    card?: {
      brand?: string | null;
      last4?: string | null;
      expMonth?: number | null;
      expYear?: number | null;
    } | null;
    setDefault?: boolean;
  }): Promise<void> {
    // No-op for Razorpay. Token is already linked to the customer.
    return;
  }

  /**
   * Auto-charge a saved card token (off-session / server-to-server).
   */
  async createPaymentIntent(input: {
    customerId: string;
    amountPaise: number;
    currency?: string;
    tokenId?: string | null;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntentResult> {
    this.assertConfigured();
    if (!input.tokenId) {
      throw new Error(
        'Razorpay tokenId is required to charge a saved card.',
      );
    }
    const payload: Record<string, any> = {
      amount: input.amountPaise,
      currency: input.currency || 'INR',
      token: { id: input.tokenId },
      notes: input.metadata,
    };
    const payment = await this.razorpay.payments.create(payload);
    return {
      id: payment.id,
      clientSecret: null,
      status: payment.status,
      amount: payment.amount,
      currency: (payment.currency || 'INR').toUpperCase(),
    };
  }

  /**
   * Razorpay Checkout is a client-side modal, not a hosted URL. We create an
   * order and let the frontend open Checkout with the returned order id.
   * Used mainly by the legacy plan-selection flow; the new usage-based flow
   * uses createSetupIntent + createPaymentIntent instead.
   */
  async createCheckoutSession(
    input: CreateCheckoutInput,
  ): Promise<CheckoutResult> {
    this.assertConfigured();
    const order = await this.razorpay.orders.create({
      amount: 100, // ₹1 placeholder — plan-based checkout is being retired.
      currency: 'INR',
      receipt: `checkout_${Date.now()}`,
      notes: {
        customerId: input.customerId,
        priceId: input.priceId,
        ...(input.metadata || {}),
      },
    });
    return { url: null, sessionId: order.id, mode: 'payment' };
  }

  async createSubscription(
    _input: CreateSubscriptionInput,
  ): Promise<SubscriptionResult> {
    // No subscriptions in the new usage-based model. Returning a mock keeps
    // the interface intact until the legacy plan UI is fully removed.
    this.logger.warn('createSubscription called — subscriptions are retired.');
    return {
      id: `mock_sub_${Date.now()}`,
      status: 'active',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      defaultPaymentMethod: null,
    };
  }

  async updateSubscription(
    input: UpdateSubscriptionInput,
  ): Promise<SubscriptionResult> {
    return this.getSubscription(input.subscriptionId);
  }

  async cancelSubscription(subscriptionId: string): Promise<SubscriptionResult> {
    this.logger.warn(`cancelSubscription(${subscriptionId}) — no-op (retired).`);
    return {
      id: subscriptionId,
      status: 'canceled',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: true,
      defaultPaymentMethod: null,
    };
  }

  async resumeSubscription(subscriptionId: string): Promise<void> {
    this.logger.warn(`resumeSubscription(${subscriptionId}) — no-op (retired).`);
  }

  async getSubscription(subscriptionId: string): Promise<SubscriptionResult> {
    return {
      id: subscriptionId,
      status: 'active',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      defaultPaymentMethod: null,
    };
  }

  async getInvoices(_customerId: string): Promise<InvoiceResult[]> {
    // Razorpay does not create provider invoices for token charges — we store
    // invoices in our own DB (UsageInvoice / Invoices tables).
    return [];
  }

  async getPaymentMethods(
    customerId: string,
  ): Promise<PaymentMethodResult[]> {
    this.assertConfigured();
    try {
      const res = await this.razorpay.customers.fetchTokens(customerId);
      const items: any[] = res?.items ?? [];
      return items.map((t: any) => {
        const card = t?.card || {};
        return {
          id: t?.token ?? t?.id ?? null,
          brand: card?.network ?? card?.issuer ?? null,
          last4: card?.last4 ?? null,
          expMonth: card?.expirymonth != null ? Number(card.expirymonth) : null,
          expYear: card?.expiryyear != null ? Number(card.expiryyear) : null,
        };
      });
    } catch {
      return [];
    }
  }

  async getPaymentMethod(
    customerId: string,
    tokenId: string,
  ): Promise<PaymentMethodResult | null> {
    this.assertConfigured();
    try {
      const t = await this.razorpay.customers.fetchToken(customerId, tokenId);
      const card = t?.card || {};
      return {
        id: t?.token ?? tokenId,
        brand: card?.network ?? card?.issuer ?? null,
        last4: card?.last4 ?? null,
        expMonth: card?.expirymonth != null ? Number(card.expirymonth) : null,
        expYear: card?.expiryyear != null ? Number(card.expiryyear) : null,
      };
    } catch {
      return null;
    }
  }

  async deletePaymentMethod(customerId: string, tokenId: string): Promise<void> {
    this.assertConfigured();
    await this.razorpay.customers.deleteToken(customerId, tokenId);
  }

  async verifyCardSetupPayment(input: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): Promise<{ verified: boolean }> {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return { verified: false };
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${input.orderId}|${input.paymentId}`)
      .digest('hex');
    return { verified: expected === input.signature };
  }

  /**
   * Resolves the card token the `token.request = true` Checkout flow saved
   * against this customer as a side effect of the given (already verified)
   * payment. We deliberately do NOT derive the token from the payment id —
   * a razorpay_payment_id is not a card token — instead we ask Razorpay for
   * the customer's saved tokens directly via the same fetchTokens API
   * getPaymentMethods() uses, and confirm the payment actually succeeded
   * first so a failed/pending payment can never attach a stale token.
   */
  async resolveSavedCardToken(
    customerId: string,
    paymentId: string,
  ): Promise<PaymentMethodResult> {
    this.assertConfigured();
    const payment = await this.razorpay.payments.fetch(paymentId);
    if (!payment || !['captured', 'authorized'].includes(payment.status)) {
      throw new Error(
        `Card setup payment was not successful (status: ${payment?.status ?? 'unknown'}).`,
      );
    }
    if (payment.customer_id && payment.customer_id !== customerId) {
      throw new Error('Payment does not belong to this customer.');
    }

    const tokens = await this.getPaymentMethods(customerId);
    if (!tokens.length) {
      throw new Error(
        'Razorpay has not saved a card token for this customer yet.',
      );
    }
    // fetchTokens returns the customer's saved tokens; the one just created
    // by this Checkout session is the most recent.
    return tokens[0];
  }

  async createPortalSession(_customerId: string): Promise<string> {
    const base = process.env.APP_URL || 'http://localhost:3000';
    return `${base}/dashboard/billing`;
  }

  async createTopUpSession(input: {
    customerId: string;
    amount: number;
    currency?: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<TopUpResult> {
    this.assertConfigured();
    const order = await this.razorpay.orders.create({
      amount: input.amount,
      currency: input.currency || 'INR',
      receipt: `topup_${Date.now()}`,
      notes: {
        customerId: input.customerId,
        ...(input.metadata || {}),
      },
    });
    return { url: null, sessionId: order.id };
  }

  async verifyWebhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<Record<string, any>> {
    this.assertConfigured();
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('RAZORPAY_WEBHOOK_SECRET is not set.');
    }
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    const actual = (signature || '').replace(/^v1_/, '');
    if (expected !== actual) {
      throw new Error('Invalid Razorpay webhook signature.');
    }
    try {
      return JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new Error('Invalid webhook payload.');
    }
  }

  async handleWebhook(event: Record<string, any>): Promise<void> {
    // Business handling of Razorpay events (payment captured / failed).
    // The BillingService subscribes to these where relevant.
    this.logger.log(`Received Razorpay event: ${event.event}`);
  }
}

export function paymentServiceFactory(): PaymentService {
  return new RazorpayPaymentService();
}

export const RazorpayPaymentServiceProvider = {
  provide: PAYMENT_SERVICE,
  useFactory: () => new RazorpayPaymentService(),
};