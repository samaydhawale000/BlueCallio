-- Switch billing provider from Stripe to Razorpay.
-- Renames Stripe-specific columns to Razorpay equivalents and adds card
-- fingerprint columns for saved-card auto-charge.

-- User: rename stripeCustomerId -> razorpayCustomerId, add card token fields.
ALTER TABLE "User" RENAME COLUMN "stripeCustomerId" TO "razorpayCustomerId";
ALTER TABLE "User" ADD COLUMN "razorpayTokenId" TEXT;
ALTER TABLE "User" ADD COLUMN "cardBrand" TEXT;
ALTER TABLE "User" ADD COLUMN "cardLast4" TEXT;
ALTER TABLE "User" ADD COLUMN "cardExpMonth" INTEGER;
ALTER TABLE "User" ADD COLUMN "cardExpYear" INTEGER;

-- Plan: rename stripePriceId -> razorpayPlanId.
ALTER TABLE "Plan" RENAME COLUMN "stripePriceId" TO "razorpayPlanId";

-- Subscription: rename Stripe customer/subscription ids.
ALTER TABLE "Subscription" RENAME COLUMN "stripeCustomerId" TO "razorpayCustomerId";
ALTER TABLE "Subscription" RENAME COLUMN "stripeSubscriptionId" TO "razorpaySubscriptionId";

-- Payment: rename Stripe ids -> Razorpay payment/order ids.
ALTER TABLE "Payment" RENAME COLUMN "stripePaymentIntentId" TO "razorpayPaymentId";
ALTER TABLE "Payment" RENAME COLUMN "stripeInvoiceId" TO "razorpayOrderId";

-- Invoices: rename stripeInvoiceId -> razorpayPaymentId.
ALTER TABLE "Invoices" RENAME COLUMN "stripeInvoiceId" TO "razorpayPaymentId";

-- UsageInvoice: rename Stripe ids -> Razorpay payment/order ids.
ALTER TABLE "UsageInvoice" RENAME COLUMN "stripeInvoiceId" TO "razorpayPaymentId";
ALTER TABLE "UsageInvoice" RENAME COLUMN "stripePaymentIntentId" TO "razorpayOrderId";

