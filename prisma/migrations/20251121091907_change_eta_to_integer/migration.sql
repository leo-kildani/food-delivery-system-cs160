/*
  Warnings:

  - The `eta` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "eta",
ADD COLUMN     "eta" INTEGER;
