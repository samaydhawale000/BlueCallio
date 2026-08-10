-- CreateTable
CREATE TABLE "UsageInvoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cycleStart" TIMESTAMP(3) NOT NULL,
    "cycleEnd" TIMESTAMP(3) NOT NULL,
    "invoiceNumber" TEXT,
    "stripeInvoiceId" TEXT,
    "stripePaymentIntentId" TEXT,
    "audioMinutes" INTEGER NOT NULL DEFAULT 0,
    "videoMinutes" INTEGER NOT NULL DEFAULT 0,
    "screenShareMinutes" INTEGER NOT NULL DEFAULT 0,
    "audioPaise" INTEGER NOT NULL DEFAULT 0,
    "videoPaise" INTEGER NOT NULL DEFAULT 0,
    "screenSharePaise" INTEGER NOT NULL DEFAULT 0,
    "subtotalPaise" INTEGER NOT NULL DEFAULT 0,
    "taxPaise" INTEGER NOT NULL DEFAULT 0,
    "totalPaise" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'open',
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageInvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "callId" TEXT,
    "mediaType" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "participants" INTEGER NOT NULL DEFAULT 0,
    "amountPaise" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageInvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsageInvoice_userId_cycleStart_key" ON "UsageInvoice"("userId", "cycleStart");

-- CreateIndex
CREATE INDEX "UsageInvoiceLineItem_invoiceId_idx" ON "UsageInvoiceLineItem"("invoiceId");

-- AddForeignKey
ALTER TABLE "UsageInvoice" ADD CONSTRAINT "UsageInvoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageInvoiceLineItem" ADD CONSTRAINT "UsageInvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "UsageInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
