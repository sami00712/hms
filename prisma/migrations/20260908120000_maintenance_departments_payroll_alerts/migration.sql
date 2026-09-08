-- CreateEnum
ALTER TYPE "Role" ADD VALUE 'NURSE';
ALTER TYPE "Role" ADD VALUE 'MAINTENANCE';

-- CreateEnum
CREATE TYPE "MaintenanceCategory" AS ENUM ('MACHINE_ELECTRIC', 'BED', 'MEDICAL_EQUIPMENT', 'FURNITURE', 'HVAC_AC', 'PLUMBING_WATER', 'FIRE_SAFETY', 'BUILDING_CIVIL', 'LABORATORY', 'OTHER');
CREATE TYPE "MaintenanceStatus" AS ENUM ('REPORTED', 'SCHEDULED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');
CREATE TYPE "Priority" AS ENUM ('NORMAL', 'URGENT', 'MOST_URGENT');

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

CREATE TABLE "MaintenanceAsset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "MaintenanceCategory" NOT NULL,
    "location" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MaintenanceRequest" (
    "id" TEXT NOT NULL,
    "assetId" TEXT,
    "category" "MaintenanceCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'REPORTED',
    "reportedById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SalaryRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "baseSalary" DOUBLE PRECISION NOT NULL,
    "bonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPay" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryRecord_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SalaryRecord_userId_month_year_key" ON "SalaryRecord"("userId", "month", "year");

CREATE TABLE "IssueAlert" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "raisedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "IssueAlert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Nurse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "departmentId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Nurse_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD COLUMN "departmentId" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MaintenanceAsset" ADD CONSTRAINT "MaintenanceAsset_pkey" PRIMARY KEY ("id");
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MaintenanceAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalaryRecord" ADD CONSTRAINT "SalaryRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "IssueAlert" ADD CONSTRAINT "IssueAlert_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IssueAlert" ADD CONSTRAINT "IssueAlert_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Nurse" ADD CONSTRAINT "Nurse_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add relations to User (these are already handled by the schema but we need the relation tables)
-- Note: User already has maintenanceReported and maintenanceAssigned via Prisma relations
-- SalaryRecord and IssueAlert relations are handled via foreign keys above
