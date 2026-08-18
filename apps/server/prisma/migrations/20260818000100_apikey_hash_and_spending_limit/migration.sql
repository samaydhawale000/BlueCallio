-- AlterTable
ALTER TABLE "User" ADD COLUMN "spendingLimitPaise" INTEGER;

-- ApiKey: move from storing the raw key to storing only its hash + a short
-- prefix for masked display. Add the new columns nullable first, backfill
-- from the existing plaintext `key` column, then tighten to NOT NULL and
-- drop `key`. Uses Postgres's built-in sha256() (core since PG 14) — no
-- pgcrypto extension required.
ALTER TABLE "ApiKey" ADD COLUMN "keyHash" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN "keyPrefix" TEXT;

UPDATE "ApiKey"
SET "keyHash" = encode(sha256(convert_to("key", 'utf8')), 'hex'),
    "keyPrefix" = left("key", 12)
WHERE "keyHash" IS NULL;

ALTER TABLE "ApiKey" ALTER COLUMN "keyHash" SET NOT NULL;
ALTER TABLE "ApiKey" ALTER COLUMN "keyPrefix" SET NOT NULL;

DROP INDEX "ApiKey_key_key";
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

ALTER TABLE "ApiKey" DROP COLUMN "key";
