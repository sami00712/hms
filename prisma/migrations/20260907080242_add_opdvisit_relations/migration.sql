-- AlterTable
ALTER TABLE "LabOrder" ADD COLUMN     "opdVisitId" TEXT;

-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "opdVisitId" TEXT;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_opdVisitId_fkey" FOREIGN KEY ("opdVisitId") REFERENCES "OPDVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_opdVisitId_fkey" FOREIGN KEY ("opdVisitId") REFERENCES "OPDVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
