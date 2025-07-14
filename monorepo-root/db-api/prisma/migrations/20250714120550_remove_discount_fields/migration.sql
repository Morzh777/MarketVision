/*
  Warnings:

  - You are about to drop the column `avg_discount` on the `MarketStats` table. All the data in the column will be lost.
  - You are about to drop the column `discounted_count` on the `MarketStats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MarketStats" DROP COLUMN "avg_discount",
DROP COLUMN "discounted_count";
