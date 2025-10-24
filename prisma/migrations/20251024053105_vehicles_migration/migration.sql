/*
  Warnings:

  - You are about to drop the column `deliveryId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `Delivery` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `createdAt` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toAddress` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricePerUnit` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weightPerUnit` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('IN_TRANSIT', 'STANDBY');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'IN_TRANSIT';

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_deliveryId_fkey";

-- DropIndex
DROP INDEX "public"."Order_deliveryId_idx";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "deliveryId",
ADD COLUMN     "VehicleId" INTEGER,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "toAddress" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "pricePerUnit" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "weightPerUnit" DECIMAL(10,3) NOT NULL;

-- DropTable
DROP TABLE "public"."Delivery";

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" SERIAL NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'STANDBY',

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_VehicleId_idx" ON "Order"("VehicleId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_VehicleId_fkey" FOREIGN KEY ("VehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
