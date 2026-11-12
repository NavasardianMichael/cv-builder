-- When the bank first sent the buyer back for this payment (routes/payments.ts). A payment
-- the buyer came back from is finished on their side; one they did not may still be open in
-- another tab — the "unfinished payment" warning before a new checkout (services/payments.ts).
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "returnedAt" TIMESTAMP(3);
