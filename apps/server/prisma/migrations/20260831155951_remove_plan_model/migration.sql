-- AlterEnum
BEGIN;
CREATE TYPE "BillingStatus_new" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED');
ALTER TABLE "public"."Subscription" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Subscription" ALTER COLUMN "status" TYPE "BillingStatus_new" USING ("status"::text::"BillingStatus_new");
ALTER TYPE "BillingStatus" RENAME TO "BillingStatus_old";
ALTER TYPE "BillingStatus_new" RENAME TO "BillingStatus";
DROP TYPE "public"."BillingStatus_old";
ALTER TABLE "Subscription" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_planId_fkey";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "billingCycle",
DROP COLUMN "planId",
DROP COLUMN "razorpayCustomerId",
DROP COLUMN "razorpaySubscriptionId";

-- DropTable
DROP TABLE "Plan";

-- DropEnum
DROP TYPE "BillingCycle";
