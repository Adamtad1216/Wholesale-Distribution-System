/*
  Warnings:

  - You are about to drop the column `quotation_id` on the `sales_orders` table. All the data in the column will be lost.
  - You are about to drop the `quotations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sales_order_quotation_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sales_request_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sales_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "quotations" DROP CONSTRAINT "quotations_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "quotations" DROP CONSTRAINT "quotations_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "quotations" DROP CONSTRAINT "quotations_sales_rep_id_fkey";

-- DropForeignKey
ALTER TABLE "quotations" DROP CONSTRAINT "quotations_sales_request_id_fkey";

-- DropForeignKey
ALTER TABLE "quotations" DROP CONSTRAINT "quotations_updated_by_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_order_quotation_items" DROP CONSTRAINT "sales_order_quotation_items_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_order_quotation_items" DROP CONSTRAINT "sales_order_quotation_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_order_quotation_items" DROP CONSTRAINT "sales_order_quotation_items_quotation_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_order_quotation_items" DROP CONSTRAINT "sales_order_quotation_items_updated_by_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_orders" DROP CONSTRAINT "sales_orders_quotation_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_request_items" DROP CONSTRAINT "sales_request_items_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_request_items" DROP CONSTRAINT "sales_request_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_request_items" DROP CONSTRAINT "sales_request_items_sales_request_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_request_items" DROP CONSTRAINT "sales_request_items_updated_by_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_requests" DROP CONSTRAINT "sales_requests_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_requests" DROP CONSTRAINT "sales_requests_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_requests" DROP CONSTRAINT "sales_requests_sales_rep_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_requests" DROP CONSTRAINT "sales_requests_updated_by_id_fkey";

-- DropIndex
DROP INDEX "sales_orders_quotation_id_key";

-- AlterTable
ALTER TABLE "sales_orders" DROP COLUMN "quotation_id";

-- DropTable
DROP TABLE "quotations";

-- DropTable
DROP TABLE "sales_order_quotation_items";

-- DropTable
DROP TABLE "sales_request_items";

-- DropTable
DROP TABLE "sales_requests";

-- DropEnum
DROP TYPE "RequestSource";
