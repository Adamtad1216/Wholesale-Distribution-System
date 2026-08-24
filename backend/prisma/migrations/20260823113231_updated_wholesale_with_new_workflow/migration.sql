/*
  Warnings:

  - The `status` column on the `Delivery` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `SalesOrder` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `SalesReturn` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `StockReservation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `ProductVariant` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[supplier_id,return_number]` on the table `PurchaseReturn` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[supplier_id,invoice_number]` on the table `SupplierInvoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[warehouse_id,product_id]` on the table `WarehouseStock` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `customer_type` on the `Customer` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('PERSON', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "SalesOrderStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ADJUSTMENT_REQUIRED', 'APPROVED', 'REJECTED', 'RESERVED', 'READY_FOR_DELIVERY', 'PARTIALLY_FULFILLED', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalesOrderSource" AS ENUM ('CUSTOMER_PORTAL', 'SALES_REPRESENTATIVE');

-- CreateEnum
CREATE TYPE "SalesOrderHistoryAction" AS ENUM ('CREATED', 'SUBMITTED', 'ADJUSTMENT_REQUESTED', 'RESUBMITTED', 'APPROVED', 'REJECTED', 'RESERVATION_CREATED', 'READY_FOR_DELIVERY', 'PARTIALLY_FULFILLED', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockReservationStatus" AS ENUM ('RESERVED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'RELEASED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PricingRuleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('SCHEDULED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'PARTIAL', 'FAILED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'RECEIVED', 'INSPECTED', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID', 'CREDITED');

-- DropForeignKey
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_product_id_fkey";

-- DropForeignKey
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_updated_by_id_fkey";

-- DropForeignKey
ALTER TABLE "SalesOrder" DROP CONSTRAINT "SalesOrder_sales_rep_id_fkey";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "customer_type",
ADD COLUMN     "customer_type" "CustomerType" NOT NULL;

-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "delivery_latitude" DECIMAL(10,7),
ADD COLUMN     "delivery_longitude" DECIMAL(10,7),
ADD COLUMN     "scheduled_by" UUID,
DROP COLUMN "status",
ADD COLUMN     "status" "DeliveryStatus" NOT NULL DEFAULT 'SCHEDULED';

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "branch_id" UUID,
ADD COLUMN     "is_available_for_sales" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "status",
ADD COLUMN     "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "adjustment_reason" TEXT,
ADD COLUMN     "delivery_address_id" UUID,
ADD COLUMN     "discount_rule_id" UUID,
ADD COLUMN     "price_tier_id" UUID,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "sales_quota_id" UUID,
ADD COLUMN     "source" "SalesOrderSource" NOT NULL DEFAULT 'CUSTOMER_PORTAL',
ALTER COLUMN "sales_rep_id" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "SalesOrderStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "SalesOrderItem" ADD COLUMN     "discount_rule_id" UUID,
ADD COLUMN     "price_tier_id" UUID;

-- AlterTable
ALTER TABLE "SalesReturn" DROP COLUMN "status",
ADD COLUMN     "status" "ReturnStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "StockReservation" DROP COLUMN "status",
ADD COLUMN     "status" "StockReservationStatus" NOT NULL DEFAULT 'RESERVED';

-- DropTable
DROP TABLE "ProductVariant";

-- CreateTable
CREATE TABLE "PriceTier" (
    "id" UUID NOT NULL,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "product_id" UUID NOT NULL,
    "min_quantity" DECIMAL(15,3) NOT NULL,
    "max_quantity" DECIMAL(15,3),
    "unit_price" DECIMAL(15,2) NOT NULL,
    "status" "PricingRuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),

    CONSTRAINT "PriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountRule" (
    "id" UUID NOT NULL,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "product_id" UUID,
    "customer_type" "CustomerType",
    "min_quantity" DECIMAL(15,3),
    "max_quantity" DECIMAL(15,3),
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(15,2) NOT NULL,
    "status" "PricingRuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),

    CONSTRAINT "DiscountRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesQuota" (
    "id" UUID NOT NULL,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "product_id" UUID,
    "customer_type" "CustomerType",
    "branch_id" UUID,
    "max_quantity" DECIMAL(15,3) NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "status" "PricingRuleStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "SalesQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesQuotaUsage" (
    "id" UUID NOT NULL,
    "quota_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "sales_order_id" UUID NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesQuotaUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAddress" (
    "id" UUID NOT NULL,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "customer_id" UUID NOT NULL,
    "label" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "sub_city" TEXT,
    "woreda" TEXT,
    "landmark" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderStatusHistory" (
    "id" UUID NOT NULL,
    "sales_order_id" UUID NOT NULL,
    "from_status" "SalesOrderStatus",
    "to_status" "SalesOrderStatus" NOT NULL,
    "action" "SalesOrderHistoryAction" NOT NULL,
    "reason" TEXT,
    "changed_by_id" UUID NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesOrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceTier_product_id_min_quantity_max_quantity_idx" ON "PriceTier"("product_id", "min_quantity", "max_quantity");

-- CreateIndex
CREATE INDEX "DiscountRule_product_id_status_idx" ON "DiscountRule"("product_id", "status");

-- CreateIndex
CREATE INDEX "SalesQuota_product_id_branch_id_status_idx" ON "SalesQuota"("product_id", "branch_id", "status");

-- CreateIndex
CREATE INDEX "SalesQuotaUsage_quota_id_customer_id_idx" ON "SalesQuotaUsage"("quota_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "SalesQuotaUsage_quota_id_sales_order_id_key" ON "SalesQuotaUsage"("quota_id", "sales_order_id");

-- CreateIndex
CREATE INDEX "CustomerAddress_customer_id_is_active_idx" ON "CustomerAddress"("customer_id", "is_active");

-- CreateIndex
CREATE INDEX "SalesOrderStatusHistory_sales_order_id_changed_at_idx" ON "SalesOrderStatusHistory"("sales_order_id", "changed_at");

-- CreateIndex
CREATE INDEX "PurchaseReturn_supplier_id_status_idx" ON "PurchaseReturn"("supplier_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseReturn_supplier_id_return_number_key" ON "PurchaseReturn"("supplier_id", "return_number");

-- CreateIndex
CREATE INDEX "SalesOrder_customer_id_status_idx" ON "SalesOrder"("customer_id", "status");

-- CreateIndex
CREATE INDEX "SalesOrder_warehouse_id_status_idx" ON "SalesOrder"("warehouse_id", "status");

-- CreateIndex
CREATE INDEX "SalesOrder_sales_rep_id_status_idx" ON "SalesOrder"("sales_rep_id", "status");

-- CreateIndex
CREATE INDEX "SupplierInvoice_supplier_id_status_idx" ON "SupplierInvoice"("supplier_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierInvoice_supplier_id_invoice_number_key" ON "SupplierInvoice"("supplier_id", "invoice_number");

-- CreateIndex
CREATE INDEX "WarehouseStock_warehouse_id_idx" ON "WarehouseStock"("warehouse_id");

-- CreateIndex
CREATE INDEX "WarehouseStock_product_id_idx" ON "WarehouseStock"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseStock_warehouse_id_product_id_key" ON "WarehouseStock"("warehouse_id", "product_id");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceTier" ADD CONSTRAINT "PriceTier_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceTier" ADD CONSTRAINT "PriceTier_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceTier" ADD CONSTRAINT "PriceTier_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountRule" ADD CONSTRAINT "DiscountRule_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountRule" ADD CONSTRAINT "DiscountRule_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountRule" ADD CONSTRAINT "DiscountRule_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesQuota" ADD CONSTRAINT "SalesQuota_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesQuota" ADD CONSTRAINT "SalesQuota_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesQuota" ADD CONSTRAINT "SalesQuota_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesQuota" ADD CONSTRAINT "SalesQuota_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesQuotaUsage" ADD CONSTRAINT "SalesQuotaUsage_quota_id_fkey" FOREIGN KEY ("quota_id") REFERENCES "SalesQuota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesQuotaUsage" ADD CONSTRAINT "SalesQuotaUsage_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesQuotaUsage" ADD CONSTRAINT "SalesQuotaUsage_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_delivery_address_id_fkey" FOREIGN KEY ("delivery_address_id") REFERENCES "CustomerAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_price_tier_id_fkey" FOREIGN KEY ("price_tier_id") REFERENCES "PriceTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_discount_rule_id_fkey" FOREIGN KEY ("discount_rule_id") REFERENCES "DiscountRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_sales_quota_id_fkey" FOREIGN KEY ("sales_quota_id") REFERENCES "SalesQuota"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_price_tier_id_fkey" FOREIGN KEY ("price_tier_id") REFERENCES "PriceTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_discount_rule_id_fkey" FOREIGN KEY ("discount_rule_id") REFERENCES "DiscountRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderStatusHistory" ADD CONSTRAINT "SalesOrderStatusHistory_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderStatusHistory" ADD CONSTRAINT "SalesOrderStatusHistory_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_scheduled_by_fkey" FOREIGN KEY ("scheduled_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
