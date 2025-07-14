-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "confidence" DOUBLE PRECISION,
ADD COLUMN     "is_valid" BOOLEAN,
ADD COLUMN     "reason" TEXT;

-- CreateTable
CREATE TABLE "MarketStats" (
    "id" SERIAL NOT NULL,
    "product_id" TEXT,
    "query" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "min" INTEGER NOT NULL,
    "max" INTEGER NOT NULL,
    "mean" DOUBLE PRECISION NOT NULL,
    "median" DOUBLE PRECISION NOT NULL,
    "iqr" JSONB NOT NULL,
    "total_count" INTEGER NOT NULL,
    "discounted_count" INTEGER,
    "avg_discount" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketStats_pkey" PRIMARY KEY ("id")
);
