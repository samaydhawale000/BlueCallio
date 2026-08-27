-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "billingAnchorDay" INTEGER;

-- AlterTable
ALTER TABLE "UsageInvoice" ADD COLUMN     "dunningStartedAt" TIMESTAMP(3),
ADD COLUMN     "nextRetryAt" TIMESTAMP(3),
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProrationAdjustment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),
    "consumedInvoiceId" TEXT,

    CONSTRAINT "ProrationAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProrationAdjustment_userId_consumedAt_idx" ON "ProrationAdjustment"("userId", "consumedAt");

-- CreateIndex
CREATE INDEX "Subscription_companyId_idx" ON "Subscription"("companyId");

-- AddForeignKey
ALTER TABLE "ProrationAdjustment" ADD CONSTRAINT "ProrationAdjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: capture each existing subscription's current anchor day so
-- addAnchoredMonth() has an immutable reference point going forward. This is
-- a one-time approximation for pre-existing rows (see plan doc) — it cannot
-- recover an original anchor that a prior short-month rollover already
-- clamped down.
UPDATE "Subscription"
SET "billingAnchorDay" = EXTRACT(DAY FROM "currentPeriodStart")::INTEGER
WHERE "currentPeriodStart" IS NOT NULL AND "billingAnchorDay" IS NULL;
