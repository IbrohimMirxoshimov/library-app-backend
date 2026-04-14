-- CreateEnum
CREATE TYPE "StockCondition" AS ENUM ('NEW', 'GOOD', 'FAIR', 'POOR');

-- AlterTable
ALTER TABLE "stocks" ADD COLUMN     "condition" "StockCondition",
ADD COLUMN     "sourceId" INTEGER;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
