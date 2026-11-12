-- The billing model changes from "pay once per CV" to a 21-day full-access pass that belongs
-- to the buyer (account or guest browser), not to a CV (docs/PAYMENTS.md). This migration only
-- adds; the next one moves the data over (an enum value cannot be used in the transaction
-- that adds it).

-- A pass given, not bought: the release's 21 days for those who paid under the old model.
ALTER TYPE "PaymentGateway" ADD VALUE 'grant';

-- A guest buyer's key (lib/guest.ts), hashed: a pass bought without an account belongs to the
-- browser; moved to `userId` on sign-in (services/guestCvs.ts).
ALTER TABLE "Payment" ADD COLUMN "guestKeyHash" TEXT;
CREATE INDEX "Payment_userId_status_idx" ON "Payment"("userId", "status");
CREATE INDEX "Payment_guestKeyHash_status_idx" ON "Payment"("guestKeyHash", "status");

-- Last request with this account's session, kept to the day (middleware/auth.ts): the
-- one-year retention rule (services/retention.ts).
ALTER TABLE "User" ADD COLUMN "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Free downloads are recorded too now: a download within the year keeps a CV (retention).
ALTER TABLE "PdfDownload" ADD COLUMN "variant" TEXT NOT NULL DEFAULT 'designed';
