-- Billing enhancements: dunning fields, participants, purchased minutes, invoice paidAt

-- Subscription: add dunning / grace period fields
ALTER TABLE "Subscription"
  ADD COLUMN "gracePeriodEndsAt" TIMESTAMP(3),
  ADD COLUMN "dunningAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "paymentFailedAt" TIMESTAMP(3);

-- Usage: track purchased (top-up) minutes and participant count
ALTER TABLE "Usage"
  ADD COLUMN "minutesPurchased" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "participants" INTEGER NOT NULL DEFAULT 0;

-- Invoices: add paidAt
ALTER TABLE "Invoices"
  ADD COLUMN "paidAt" TIMESTAMP(3);
