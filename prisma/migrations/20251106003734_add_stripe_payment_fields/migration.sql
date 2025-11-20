/*
  Warnings:

  - A unique constraint covering the columns `[stripeSessionId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentStatus" TEXT DEFAULT 'pending',
ADD COLUMN     "stripePaymentId" TEXT,
ADD COLUMN     "stripeSessionId" TEXT,
ADD COLUMN     "totalAmount" DECIMAL(10,2);

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");

-- CreateIndex
CREATE INDEX "Order_stripeSessionId_idx" ON "Order"("stripeSessionId");
