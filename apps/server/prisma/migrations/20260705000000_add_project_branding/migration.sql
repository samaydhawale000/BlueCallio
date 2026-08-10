-- AlterTable
CREATE TYPE "ProjectTheme" AS ENUM ('LIGHT', 'DARK');

ALTER TABLE "Project"
  ADD COLUMN "companyName" TEXT,
  ADD COLUMN "logoUrl" TEXT,
  ADD COLUMN "primaryColor" TEXT NOT NULL DEFAULT '#2563EB',
  ADD COLUMN "theme" "ProjectTheme" NOT NULL DEFAULT 'DARK',
  ADD COLUMN "waitingRoom" BOOLEAN NOT NULL DEFAULT false;

