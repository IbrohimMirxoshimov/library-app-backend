-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "townId" INTEGER;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_townId_fkey" FOREIGN KEY ("townId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
