-- A settled payment refunded or voided later in the bank's panel (services/payments.ts#revalidatePaidCv).
ALTER TYPE "PaymentStatus" ADD VALUE 'refunded';
