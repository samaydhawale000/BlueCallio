-- Usage-based billing (pay per participant-minute)
-- Adds per-media-type usage tracking, editable billing rates, per-call line items

-- Usage: add per-media-type participant minutes + estimated cost
ALTER TABLE "Usage"
  ADD COLUMN "audioMinutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "videoMinutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "screenShareMinutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "usageCostPaise" INTEGER NOT NULL DEFAULT 0;

-- Editable billing rates + free allowances
CREATE TABLE "BillingRate" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "audioPaise" INTEGER NOT NULL DEFAULT 20,
  "videoPaise" INTEGER NOT NULL DEFAULT 80,
  "screenSharePaise" INTEGER NOT NULL DEFAULT 10,
  "freeAudioMins" INTEGER NOT NULL DEFAULT 500,
  "freeVideoMins" INTEGER NOT NULL DEFAULT 200,
  "taxPercent" INTEGER NOT NULL DEFAULT 18,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BillingRate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingRate_key_key" ON "BillingRate"("key");

-- Per-call billing line item
CREATE TABLE "CallUsage" (
  "id" TEXT NOT NULL,
  "usageId" TEXT NOT NULL,
  "callId" TEXT NOT NULL,
  "audioMinutes" INTEGER NOT NULL DEFAULT 0,
  "videoMinutes" INTEGER NOT NULL DEFAULT 0,
  "screenShareMinutes" INTEGER NOT NULL DEFAULT 0,
  "participants" INTEGER NOT NULL DEFAULT 0,
  "costPaise" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CallUsage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CallUsage_usageId_idx" ON "CallUsage"("usageId");
CREATE INDEX "CallUsage_callId_idx" ON "CallUsage"("callId");

-- Foreign keys
ALTER TABLE "CallUsage"
  ADD CONSTRAINT "CallUsage_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "Usage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default billing rate (₹0.20 audio / ₹0.80 video / +₹0.10 screen share)
INSERT INTO "BillingRate" ("id", "key", "audioPaise", "videoPaise", "screenSharePaise", "freeAudioMins", "freeVideoMins", "taxPercent", "updatedAt")
VALUES (gen_random_uuid(), 'default', 20, 80, 10, 500, 200, 18, CURRENT_TIMESTAMP);
