-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifyExpiresAt" TIMESTAMP(3),
ADD COLUMN     "emailVerifyTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerifyTokenHash_key" ON "User"("emailVerifyTokenHash");
