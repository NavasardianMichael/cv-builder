-- AlterTable
ALTER TABLE "Cv" ADD COLUMN     "guestKeyHash" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Cv_guestKeyHash_updatedAt_idx" ON "Cv"("guestKeyHash", "updatedAt");

-- Exactly one owner: an account or a guest key, never both or neither.
ALTER TABLE "Cv" ADD CONSTRAINT "Cv_one_owner" CHECK (("userId" IS NULL) <> ("guestKeyHash" IS NULL));
