-- When the buyer was sent back to this payment's still-open bank page instead of a new order
-- (services/payments.ts, resumeOpenPayment). Done once per payment: if they come back again
-- without the bank sending them, that page may not reopen, and the next click starts anew.
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "reopenedAt" TIMESTAMP(3);
