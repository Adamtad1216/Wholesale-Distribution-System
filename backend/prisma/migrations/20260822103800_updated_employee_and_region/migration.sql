/*
  Warnings:

  - You are about to drop the column `region` on the `Branch` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `job_title` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `Warehouse` table. All the data in the column will be lost.
  - You are about to drop the `Driver` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SalesRepresentative` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[invitation_token_hash]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `region_id` to the `Branch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region_id` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `job_specification_id` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region_id` to the `Warehouse` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserAccountStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_assigned_sales_rep_id_fkey";

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_driver_id_fkey";

-- DropForeignKey
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_updated_by_id_fkey";

-- DropForeignKey
ALTER TABLE "Quotation" DROP CONSTRAINT "Quotation_sales_rep_id_fkey";

-- DropForeignKey
ALTER TABLE "SalesOrder" DROP CONSTRAINT "SalesOrder_sales_rep_id_fkey";

-- DropForeignKey
ALTER TABLE "SalesRepresentative" DROP CONSTRAINT "SalesRepresentative_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "SalesRepresentative" DROP CONSTRAINT "SalesRepresentative_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "SalesRepresentative" DROP CONSTRAINT "SalesRepresentative_updated_by_id_fkey";

-- DropForeignKey
ALTER TABLE "SalesRequest" DROP CONSTRAINT "SalesRequest_sales_rep_id_fkey";

-- AlterTable
ALTER TABLE "Branch" DROP COLUMN "region",
ADD COLUMN     "region_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "region",
ADD COLUMN     "region_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "job_title",
ADD COLUMN     "commission_rate" DECIMAL(5,2),
ADD COLUMN     "driver_license_expiry" TIMESTAMP(3),
ADD COLUMN     "driver_license_number" TEXT,
ADD COLUMN     "job_specification_id" UUID NOT NULL,
ADD COLUMN     "sales_territory" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "account_status" "UserAccountStatus" NOT NULL DEFAULT 'INVITED',
ADD COLUMN     "invitation_accepted_at" TIMESTAMP(3),
ADD COLUMN     "invitation_token_expires_at" TIMESTAMP(3),
ADD COLUMN     "invitation_token_hash" TEXT,
ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "password_hash" DROP NOT NULL,
ALTER COLUMN "is_active" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Warehouse" DROP COLUMN "region",
ADD COLUMN     "region_id" UUID NOT NULL;

-- DropTable
DROP TABLE "Driver";

-- DropTable
DROP TABLE "SalesRepresentative";

-- DropEnum
DROP TYPE "EthiopianRegion";

-- CreateTable
CREATE TABLE "regions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" UUID,
    "updated_by_id" UUID,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSpecification" (
    "id" UUID NOT NULL,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "JobSpecification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regions_code_key" ON "regions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "JobSpecification_code_key" ON "JobSpecification"("code");

-- CreateIndex
CREATE UNIQUE INDEX "JobSpecification_title_key" ON "JobSpecification"("title");

-- CreateIndex
CREATE UNIQUE INDEX "User_invitation_token_hash_key" ON "User"("invitation_token_hash");

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSpecification" ADD CONSTRAINT "JobSpecification_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSpecification" ADD CONSTRAINT "JobSpecification_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_job_specification_id_fkey" FOREIGN KEY ("job_specification_id") REFERENCES "JobSpecification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_assigned_sales_rep_id_fkey" FOREIGN KEY ("assigned_sales_rep_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRequest" ADD CONSTRAINT "SalesRequest_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
