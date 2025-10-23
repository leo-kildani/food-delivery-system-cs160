/*
  Warnings:

  - You are about to drop the column `aptNumber` on the `DeliveryAddress` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `DeliveryAddress` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `DeliveryAddress` table. All the data in the column will be lost.
  - You are about to drop the column `stateCode` on the `DeliveryAddress` table. All the data in the column will be lost.
  - You are about to drop the column `street` on the `DeliveryAddress` table. All the data in the column will be lost.
  - Added the required column `address` to the `DeliveryAddress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DeliveryAddress" DROP COLUMN "aptNumber",
DROP COLUMN "city",
DROP COLUMN "postalCode",
DROP COLUMN "stateCode",
DROP COLUMN "street",
ADD COLUMN     "address" TEXT NOT NULL;
