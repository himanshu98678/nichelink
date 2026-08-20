-- AlterTable
ALTER TABLE "BillingInvoice" ADD COLUMN "providerPaymentId" TEXT;

-- CreateIndex
CREATE INDEX "BillingInvoice_providerPaymentId_idx" ON "BillingInvoice"("providerPaymentId");