/*
  Warnings:

  - You are about to drop the column `manager_id` on the `branches` table. All the data in the column will be lost.
  - You are about to drop the column `available_quantity` on the `warehouse_stocks` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `warehouse_stocks` table. All the data in the column will be lost.
  - You are about to drop the column `reserved_quantity` on the `warehouse_stocks` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "branches" DROP CONSTRAINT "branches_manager_id_fkey";

-- AlterTable
ALTER TABLE "branches" DROP COLUMN "manager_id";

-- AlterTable
ALTER TABLE "warehouse_stock_transfers" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" UUID,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "warehouse_stocks" DROP COLUMN "available_quantity",
DROP COLUMN "quantity",
DROP COLUMN "reserved_quantity";

-- CreateTable
CREATE TABLE "branch_managers" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" TIMESTAMP(3),
    "notes" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_managers" (
    "id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" TIMESTAMP(3),
    "notes" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_added_quantities" (
    "id" UUID NOT NULL,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "warehouse_stock_id" UUID,
    "warehouse_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "previous_total_qty" DECIMAL(15,3) NOT NULL,
    "added_quantity" DECIMAL(15,3) NOT NULL,
    "current_total_qty" DECIMAL(15,3) NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference_type" TEXT,
    "reference_id" UUID,
    "notes" TEXT,

    CONSTRAINT "product_added_quantities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "branch_managers_branch_id_idx" ON "branch_managers"("branch_id");

-- CreateIndex
CREATE INDEX "branch_managers_employee_id_idx" ON "branch_managers"("employee_id");

-- CreateIndex
CREATE INDEX "warehouse_managers_warehouse_id_idx" ON "warehouse_managers"("warehouse_id");

-- CreateIndex
CREATE INDEX "warehouse_managers_employee_id_idx" ON "warehouse_managers"("employee_id");

-- CreateIndex
CREATE INDEX "product_added_quantities_warehouse_stock_id_idx" ON "product_added_quantities"("warehouse_stock_id");

-- CreateIndex
CREATE INDEX "product_added_quantities_warehouse_id_product_id_idx" ON "product_added_quantities"("warehouse_id", "product_id");

-- CreateIndex
CREATE INDEX "product_added_quantities_added_at_idx" ON "product_added_quantities"("added_at");

-- CreateIndex
CREATE INDEX "product_added_quantities_reference_type_reference_id_idx" ON "product_added_quantities"("reference_type", "reference_id");

-- AddForeignKey
ALTER TABLE "branch_managers" ADD CONSTRAINT "branch_managers_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_managers" ADD CONSTRAINT "branch_managers_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_managers" ADD CONSTRAINT "branch_managers_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_managers" ADD CONSTRAINT "branch_managers_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_managers" ADD CONSTRAINT "warehouse_managers_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_managers" ADD CONSTRAINT "warehouse_managers_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_managers" ADD CONSTRAINT "warehouse_managers_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_managers" ADD CONSTRAINT "warehouse_managers_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_added_quantities" ADD CONSTRAINT "product_added_quantities_warehouse_stock_id_fkey" FOREIGN KEY ("warehouse_stock_id") REFERENCES "warehouse_stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_added_quantities" ADD CONSTRAINT "product_added_quantities_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_added_quantities" ADD CONSTRAINT "product_added_quantities_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_added_quantities" ADD CONSTRAINT "product_added_quantities_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_added_quantities" ADD CONSTRAINT "product_added_quantities_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_stock_transfers" ADD CONSTRAINT "warehouse_stock_transfers_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
