import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Req,
  Headers,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { BillingService } from './billing.service';
import { UsageBillingService } from './usage-billing.service';
import { InvoiceBillingService } from './invoice-billing.service';
import { UsageSegmentService } from './usage-segment.service';
import { RatingEngineService } from './rating-engine.service';
import { PAYMENT_SERVICE } from '../payment/payment.service';
import type { PaymentService } from '../payment/payment.service';
import { CheckoutDto } from './dto/checkout.dto';
import { TopUpDto } from './dto/topup.dto';

@Controller('billing')
export class BillingController {
  constructor(
    private billingService: BillingService,
    private usageBilling: UsageBillingService,
    private invoiceBilling: InvoiceBillingService,
    private segmentService: UsageSegmentService,
    private ratingEngine: RatingEngineService,
    @Inject(PAYMENT_SERVICE) private payments: PaymentService,
  ) {}

// ── Public: plans list ──────────────────────────────
  @Get('plans')
  async getPlans() {
    return this.billingService.getPlans();
  }

  // ── Public: billing rates (no auth — used by landing/docs/FAQ) ──
  @Get('rates')
  async getRatesPublic() {
    return this.usageBilling.getRates();
  }

  // ── Customer (auth) endpoints ───────────────────────
  @Get('overview')
  @UseGuards(JwtGuard)
  async overview(@Req() req: any) {
    return this.billingService.getBillingOverview(req.user.userId);
  }

  @Get('invoices')
  @UseGuards(JwtGuard)
  async invoices(@Req() req: any) {
    return this.billingService.getInvoices(req.user.userId);
  }

@Get('payment-methods')
  @UseGuards(JwtGuard)
  async paymentMethods(@Req() req: any) {
    return this.billingService.getPaymentMethods(req.user.userId);
  }

  // ── Add Payment Method (usage-based, no upfront charge) ──
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('payment-method/setup')
  @UseGuards(JwtGuard)
  async paymentMethodSetup(@Req() req: any) {
    return this.billingService.createPaymentSetup(req.user.userId);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('payment-method/attach')
  @UseGuards(JwtGuard)
  async paymentMethodAttach(
    @Req() req: any,
    @Body() dto: {
      paymentMethodId: string;
      // Mock/dev mode only (no real Razorpay to verify against).
      tokenId?: string | null;
      // Real Razorpay mode: proof of a completed Checkout payment, verified
      // server-side before we trust anything from it.
      orderId?: string | null;
      paymentId?: string | null;
      signature?: string | null;
      card?: {
        brand?: string | null;
        last4?: string | null;
        expMonth?: number | null;
        expYear?: number | null;
      } | null;
    },
  ) {
    return this.billingService.attachPaymentMethod(
      req.user.userId,
      dto.paymentMethodId,
      {
        tokenId: dto.tokenId,
        orderId: dto.orderId,
        paymentId: dto.paymentId,
        signature: dto.signature,
      },
      dto.card,
    );
  }

  @Delete('payment-method/:id')
  @UseGuards(JwtGuard)
  async removePaymentMethod(@Req() req: any, @Param('id') id: string) {
    return this.billingService.removePaymentMethod(req.user.userId, id);
  }

  @Post('payment-method/default')
  @UseGuards(JwtGuard)
  async setDefaultPaymentMethod(@Req() req: any, @Body() dto: { id: string }) {
    return this.billingService.setDefaultPaymentMethod(req.user.userId, dto.id);
  }

  // ── Spending protection ─────────────────────────────
  @Get('spending-limit')
  @UseGuards(JwtGuard)
  async getSpendingLimit(@Req() req: any) {
    return this.usageBilling.getSpendingLimit(req.user.userId);
  }

  @Post('spending-limit')
  @UseGuards(JwtGuard)
  async setSpendingLimit(@Req() req: any, @Body() dto: { spendingLimitPaise: number | null }) {
    return this.usageBilling.setSpendingLimit(req.user.userId, dto.spendingLimitPaise);
  }

  // ── Usage-based invoices ────────────────────────────
  @Get('usage-invoices')
  @UseGuards(JwtGuard)
  async usageInvoices(@Req() req: any) {
    return this.invoiceBilling.getInvoicesForUser(req.user.userId);
  }

  @Post('usage-invoices/generate')
  @UseGuards(JwtGuard)
  async generateUsageInvoice(@Req() req: any) {
    const now = new Date();
    const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.invoiceBilling.generateInvoiceForCycle(
      req.user.userId,
      cycleStart,
    );
  }

@Post('portal')
  @UseGuards(JwtGuard)
  async portal(@Req() req: any) {
    return this.billingService.createPortalSession(req.user.userId);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('checkout')
  @UseGuards(JwtGuard)
  async checkout(@Req() req: any, @Body() dto: CheckoutDto) {
    return this.billingService.createCheckout(req.user.userId, dto.planSlug);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('topup')
  @UseGuards(JwtGuard)
  async topup(@Req() req: any, @Body() dto: TopUpDto) {
    return this.billingService.topUp(
      req.user.userId,
      dto.minutes,
      dto.currency,
    );
  }

  @Post('cancel')
  @UseGuards(JwtGuard)
  async cancel(@Req() req: any) {
    return this.billingService.cancelSubscription(req.user.userId);
  }

  @Post('resume')
  @UseGuards(JwtGuard)
  async resume(@Req() req: any) {
    return this.billingService.resumeSubscription(req.user.userId);
  }

@Get('usage')
  @UseGuards(JwtGuard)
  async usage(@Req() req: any) {
    return this.billingService.getUsageLimit(req.user.userId);
  }

  // ── Usage-based billing (v2) ────────────────────────
  @Get('current-usage')
  @UseGuards(JwtGuard)
  async currentUsage(@Req() req: any) {
    return this.usageBilling.getCurrentUsage(req.user.userId);
  }

@Get('call-usage')
  @UseGuards(JwtGuard)
  async callUsage(@Req() req: any) {
    return this.usageBilling.getCallUsage(req.user.userId);
  }

  // ── Segment engine: per-call usage timeline ─────────
  @Get('call/:id/segments')
  @UseGuards(JwtGuard)
  async callSegments(@Req() req: any, @Param('id') callId: string) {
    // Ensure the caller owns this call (via a project they own).
    await this.ensureCallOwnedByUser(callId, req.user.userId);
    const segments = await this.segmentService.getSegmentsForCall(callId);
    const rated = await this.ratingEngine.rateCall(callId);
    return { callId, segments, totals: rated.totals };
  }

  // ── Admin: segment analytics ─────────────────────────
  @Get('admin/segment-analytics')
  @UseGuards(JwtGuard, AdminGuard)
  async segmentAnalytics() {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const segments = await this.segmentService.getSegmentsSince(start);
    const rated = await this.ratingEngine.rateSegments(segments);
    return {
      since: start,
      segmentCount: segments.length,
      totals: rated,
    };
  }

  private async ensureCallOwnedByUser(callId: string, userId: string) {
    const call = await this.segmentService.getCallOwner(callId);
    if (!call || call.project.ownerId !== userId) {
      throw new Error('Call not found');
    }
  }

  // ── Admin endpoints ─────────────────────────────────
  @Get('admin/revenue')
  @UseGuards(JwtGuard, AdminGuard)
  async revenue() {
    return this.billingService.getRevenue();
  }

  @Get('admin/rates')
  @UseGuards(JwtGuard, AdminGuard)
  async getRates() {
    return this.usageBilling.getRates();
  }

  @Post('admin/rates')
  @UseGuards(JwtGuard, AdminGuard)
  async updateRates(@Body() dto: any) {
    return this.usageBilling.updateRates(dto);
  }

@Get('admin/usage-summary')
  @UseGuards(JwtGuard, AdminGuard)
  async usageSummary() {
    // Aggregate usage across all users for the current cycle.
    const start = new Date();
    start.setDate(1);
    const usageAgg = await this.usageBilling.summarizeAdminUsage(start);
    return usageAgg;
  }

  // ── Webhook (Razorpay) ──────────────────────────────
  @Post('webhook')
  async webhook(
    @Req() req: RawBodyRequest<any>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!this.payments.isConfigured()) {
      return { received: true, mock: true };
    }
    const event = await this.payments.verifyWebhook(rawBody, signature);
    await this.billingService.handleWebhookEvent(event);
    return { received: true };
  }
}
