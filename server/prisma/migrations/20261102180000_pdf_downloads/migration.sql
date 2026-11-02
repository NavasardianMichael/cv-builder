-- Every designed PDF sent in full: delivery evidence for refund claims (routes/cvs.ts).
-- CreateTable
CREATE TABLE "PdfDownload" (
    "id" TEXT NOT NULL,
    "cvId" TEXT,
    "paymentId" TEXT,
    "bytes" INTEGER NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PdfDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PdfDownload_cvId_createdAt_idx" ON "PdfDownload"("cvId", "createdAt");

-- CreateIndex
CREATE INDEX "PdfDownload_paymentId_idx" ON "PdfDownload"("paymentId");

-- AddForeignKey
ALTER TABLE "PdfDownload" ADD CONSTRAINT "PdfDownload_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "Cv"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdfDownload" ADD CONSTRAINT "PdfDownload_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
