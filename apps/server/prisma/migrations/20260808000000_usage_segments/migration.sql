-- Alt: Usage segment-based rating engine (v1)
-- 1. Add UsageSegment table (built from the call event stream).
-- 2. Add participantId to CallEvent for per-participant media tracking.

-- CreateTable
CREATE TABLE "UsageSegment" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "audio" BOOLEAN NOT NULL DEFAULT false,
    "video" BOOLEAN NOT NULL DEFAULT false,
    "screenShare" BOOLEAN NOT NULL DEFAULT false,
    "costPaise" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsageSegment_callId_startedAt_idx" ON "UsageSegment"("callId", "startedAt");

-- AddForeignKey
ALTER TABLE "UsageSegment" ADD CONSTRAINT "UsageSegment_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "CallEvent" ADD COLUMN "participantId" TEXT;

-- CreateIndex
CREATE INDEX "CallEvent_callId_createdAt_idx" ON "CallEvent"("callId", "createdAt");
