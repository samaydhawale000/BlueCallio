-- AlterEnum
ALTER TYPE "CallStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "CallStatus" ADD VALUE 'BUSY';

-- AlterTable
ALTER TABLE "Call" ADD COLUMN     "callerAvatar" TEXT,
ADD COLUMN     "callerName" TEXT,
ADD COLUMN     "receiverAvatar" TEXT,
ADD COLUMN     "receiverName" TEXT;
