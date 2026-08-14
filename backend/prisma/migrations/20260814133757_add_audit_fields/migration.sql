/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `persons` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ai_queries" ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "ai_recommendation_sources" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "ai_recommendations" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "credits" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "deliveries" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "delivery_items" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "delivery_proofs" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "goods_receipt_items" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "goods_receipts" ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "invoice_items" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "organization_contacts" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "payment_allocations" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "payment_terms" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "persons" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "product_images" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "purchase_order_items" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "purchase_return_items" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "purchase_returns" ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "quotation_items" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "refunds" ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "sales_order_items" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "sales_request_items" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "sales_requests" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "sales_return_items" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "sales_returns" ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "stock_adjustment_items" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "stock_adjustments" ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "stock_reservations" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "supplier_invoices" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "units" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "locked_until" TIMESTAMP(3),
ADD COLUMN     "reset_token_expires" TIMESTAMP(3),
ADD COLUMN     "reset_token_hash" TEXT,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "warehouse_stocks" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "updated_by_id" UUID;

-- CreateIndex
CREATE INDEX "ai_queries_updated_by_id_idx" ON "ai_queries"("updated_by_id");

-- CreateIndex
CREATE INDEX "ai_recommendation_sources_created_by_id_idx" ON "ai_recommendation_sources"("created_by_id");

-- CreateIndex
CREATE INDEX "ai_recommendation_sources_updated_by_id_idx" ON "ai_recommendation_sources"("updated_by_id");

-- CreateIndex
CREATE INDEX "ai_recommendations_created_by_id_idx" ON "ai_recommendations"("created_by_id");

-- CreateIndex
CREATE INDEX "ai_recommendations_updated_by_id_idx" ON "ai_recommendations"("updated_by_id");

-- CreateIndex
CREATE INDEX "audit_logs_updated_by_id_idx" ON "audit_logs"("updated_by_id");

-- CreateIndex
CREATE INDEX "brands_created_by_id_idx" ON "brands"("created_by_id");

-- CreateIndex
CREATE INDEX "brands_updated_by_id_idx" ON "brands"("updated_by_id");

-- CreateIndex
CREATE INDEX "categories_created_by_id_idx" ON "categories"("created_by_id");

-- CreateIndex
CREATE INDEX "categories_updated_by_id_idx" ON "categories"("updated_by_id");

-- CreateIndex
CREATE INDEX "credits_created_by_id_idx" ON "credits"("created_by_id");

-- CreateIndex
CREATE INDEX "credits_updated_by_id_idx" ON "credits"("updated_by_id");

-- CreateIndex
CREATE INDEX "customers_created_by_id_idx" ON "customers"("created_by_id");

-- CreateIndex
CREATE INDEX "customers_updated_by_id_idx" ON "customers"("updated_by_id");

-- CreateIndex
CREATE INDEX "deliveries_created_by_id_idx" ON "deliveries"("created_by_id");

-- CreateIndex
CREATE INDEX "deliveries_updated_by_id_idx" ON "deliveries"("updated_by_id");

-- CreateIndex
CREATE INDEX "delivery_items_created_by_id_idx" ON "delivery_items"("created_by_id");

-- CreateIndex
CREATE INDEX "delivery_items_updated_by_id_idx" ON "delivery_items"("updated_by_id");

-- CreateIndex
CREATE INDEX "delivery_proofs_created_by_id_idx" ON "delivery_proofs"("created_by_id");

-- CreateIndex
CREATE INDEX "delivery_proofs_updated_by_id_idx" ON "delivery_proofs"("updated_by_id");

-- CreateIndex
CREATE INDEX "employees_person_id_idx" ON "employees"("person_id");

-- CreateIndex
CREATE INDEX "employees_created_by_id_idx" ON "employees"("created_by_id");

-- CreateIndex
CREATE INDEX "employees_updated_by_id_idx" ON "employees"("updated_by_id");

-- CreateIndex
CREATE INDEX "goods_receipt_items_created_by_id_idx" ON "goods_receipt_items"("created_by_id");

-- CreateIndex
CREATE INDEX "goods_receipt_items_updated_by_id_idx" ON "goods_receipt_items"("updated_by_id");

-- CreateIndex
CREATE INDEX "goods_receipts_updated_by_id_idx" ON "goods_receipts"("updated_by_id");

-- CreateIndex
CREATE INDEX "invoice_items_created_by_id_idx" ON "invoice_items"("created_by_id");

-- CreateIndex
CREATE INDEX "invoice_items_updated_by_id_idx" ON "invoice_items"("updated_by_id");

-- CreateIndex
CREATE INDEX "invoices_created_by_id_idx" ON "invoices"("created_by_id");

-- CreateIndex
CREATE INDEX "invoices_updated_by_id_idx" ON "invoices"("updated_by_id");

-- CreateIndex
CREATE INDEX "notifications_updated_by_id_idx" ON "notifications"("updated_by_id");

-- CreateIndex
CREATE INDEX "organization_contacts_created_by_id_idx" ON "organization_contacts"("created_by_id");

-- CreateIndex
CREATE INDEX "organization_contacts_updated_by_id_idx" ON "organization_contacts"("updated_by_id");

-- CreateIndex
CREATE INDEX "organizations_created_by_id_idx" ON "organizations"("created_by_id");

-- CreateIndex
CREATE INDEX "organizations_updated_by_id_idx" ON "organizations"("updated_by_id");

-- CreateIndex
CREATE INDEX "payment_allocations_created_by_id_idx" ON "payment_allocations"("created_by_id");

-- CreateIndex
CREATE INDEX "payment_allocations_updated_by_id_idx" ON "payment_allocations"("updated_by_id");

-- CreateIndex
CREATE INDEX "payment_terms_created_by_id_idx" ON "payment_terms"("created_by_id");

-- CreateIndex
CREATE INDEX "payment_terms_updated_by_id_idx" ON "payment_terms"("updated_by_id");

-- CreateIndex
CREATE INDEX "payments_updated_by_id_idx" ON "payments"("updated_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "persons_email_key" ON "persons"("email");

-- CreateIndex
CREATE INDEX "persons_created_by_id_idx" ON "persons"("created_by_id");

-- CreateIndex
CREATE INDEX "persons_updated_by_id_idx" ON "persons"("updated_by_id");

-- CreateIndex
CREATE INDEX "product_images_created_by_id_idx" ON "product_images"("created_by_id");

-- CreateIndex
CREATE INDEX "product_images_updated_by_id_idx" ON "product_images"("updated_by_id");

-- CreateIndex
CREATE INDEX "product_variants_created_by_id_idx" ON "product_variants"("created_by_id");

-- CreateIndex
CREATE INDEX "product_variants_updated_by_id_idx" ON "product_variants"("updated_by_id");

-- CreateIndex
CREATE INDEX "products_created_by_id_idx" ON "products"("created_by_id");

-- CreateIndex
CREATE INDEX "products_updated_by_id_idx" ON "products"("updated_by_id");

-- CreateIndex
CREATE INDEX "purchase_order_items_created_by_id_idx" ON "purchase_order_items"("created_by_id");

-- CreateIndex
CREATE INDEX "purchase_order_items_updated_by_id_idx" ON "purchase_order_items"("updated_by_id");

-- CreateIndex
CREATE INDEX "purchase_orders_updated_by_id_idx" ON "purchase_orders"("updated_by_id");

-- CreateIndex
CREATE INDEX "purchase_return_items_created_by_id_idx" ON "purchase_return_items"("created_by_id");

-- CreateIndex
CREATE INDEX "purchase_return_items_updated_by_id_idx" ON "purchase_return_items"("updated_by_id");

-- CreateIndex
CREATE INDEX "purchase_returns_updated_by_id_idx" ON "purchase_returns"("updated_by_id");

-- CreateIndex
CREATE INDEX "quotation_items_created_by_id_idx" ON "quotation_items"("created_by_id");

-- CreateIndex
CREATE INDEX "quotation_items_updated_by_id_idx" ON "quotation_items"("updated_by_id");

-- CreateIndex
CREATE INDEX "quotations_created_by_id_idx" ON "quotations"("created_by_id");

-- CreateIndex
CREATE INDEX "quotations_updated_by_id_idx" ON "quotations"("updated_by_id");

-- CreateIndex
CREATE INDEX "refunds_updated_by_id_idx" ON "refunds"("updated_by_id");

-- CreateIndex
CREATE INDEX "sales_order_items_created_by_id_idx" ON "sales_order_items"("created_by_id");

-- CreateIndex
CREATE INDEX "sales_order_items_updated_by_id_idx" ON "sales_order_items"("updated_by_id");

-- CreateIndex
CREATE INDEX "sales_orders_updated_by_id_idx" ON "sales_orders"("updated_by_id");

-- CreateIndex
CREATE INDEX "sales_request_items_created_by_id_idx" ON "sales_request_items"("created_by_id");

-- CreateIndex
CREATE INDEX "sales_request_items_updated_by_id_idx" ON "sales_request_items"("updated_by_id");

-- CreateIndex
CREATE INDEX "sales_requests_created_by_id_idx" ON "sales_requests"("created_by_id");

-- CreateIndex
CREATE INDEX "sales_requests_updated_by_id_idx" ON "sales_requests"("updated_by_id");

-- CreateIndex
CREATE INDEX "sales_return_items_created_by_id_idx" ON "sales_return_items"("created_by_id");

-- CreateIndex
CREATE INDEX "sales_return_items_updated_by_id_idx" ON "sales_return_items"("updated_by_id");

-- CreateIndex
CREATE INDEX "sales_returns_updated_by_id_idx" ON "sales_returns"("updated_by_id");

-- CreateIndex
CREATE INDEX "stock_adjustment_items_created_by_id_idx" ON "stock_adjustment_items"("created_by_id");

-- CreateIndex
CREATE INDEX "stock_adjustment_items_updated_by_id_idx" ON "stock_adjustment_items"("updated_by_id");

-- CreateIndex
CREATE INDEX "stock_adjustments_updated_by_id_idx" ON "stock_adjustments"("updated_by_id");

-- CreateIndex
CREATE INDEX "stock_reservations_created_by_id_idx" ON "stock_reservations"("created_by_id");

-- CreateIndex
CREATE INDEX "stock_reservations_updated_by_id_idx" ON "stock_reservations"("updated_by_id");

-- CreateIndex
CREATE INDEX "supplier_invoices_created_by_id_idx" ON "supplier_invoices"("created_by_id");

-- CreateIndex
CREATE INDEX "supplier_invoices_updated_by_id_idx" ON "supplier_invoices"("updated_by_id");

-- CreateIndex
CREATE INDEX "suppliers_created_by_id_idx" ON "suppliers"("created_by_id");

-- CreateIndex
CREATE INDEX "suppliers_updated_by_id_idx" ON "suppliers"("updated_by_id");

-- CreateIndex
CREATE INDEX "units_created_by_id_idx" ON "units"("created_by_id");

-- CreateIndex
CREATE INDEX "units_updated_by_id_idx" ON "units"("updated_by_id");

-- CreateIndex
CREATE INDEX "users_created_by_id_idx" ON "users"("created_by_id");

-- CreateIndex
CREATE INDEX "users_updated_by_id_idx" ON "users"("updated_by_id");

-- CreateIndex
CREATE INDEX "vehicles_created_by_id_idx" ON "vehicles"("created_by_id");

-- CreateIndex
CREATE INDEX "vehicles_updated_by_id_idx" ON "vehicles"("updated_by_id");

-- CreateIndex
CREATE INDEX "warehouse_stocks_created_by_id_idx" ON "warehouse_stocks"("created_by_id");

-- CreateIndex
CREATE INDEX "warehouse_stocks_updated_by_id_idx" ON "warehouse_stocks"("updated_by_id");

-- CreateIndex
CREATE INDEX "warehouses_created_by_id_idx" ON "warehouses"("created_by_id");

-- CreateIndex
CREATE INDEX "warehouses_updated_by_id_idx" ON "warehouses"("updated_by_id");

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_contacts" ADD CONSTRAINT "organization_contacts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_contacts" ADD CONSTRAINT "organization_contacts_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_terms" ADD CONSTRAINT "payment_terms_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_terms" ADD CONSTRAINT "payment_terms_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_stocks" ADD CONSTRAINT "warehouse_stocks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_stocks" ADD CONSTRAINT "warehouse_stocks_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustment_items" ADD CONSTRAINT "stock_adjustment_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustment_items" ADD CONSTRAINT "stock_adjustment_items_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_requests" ADD CONSTRAINT "sales_requests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_requests" ADD CONSTRAINT "sales_requests_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_request_items" ADD CONSTRAINT "sales_request_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_request_items" ADD CONSTRAINT "sales_request_items_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_return_items" ADD CONSTRAINT "sales_return_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_return_items" ADD CONSTRAINT "sales_return_items_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_proofs" ADD CONSTRAINT "delivery_proofs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_proofs" ADD CONSTRAINT "delivery_proofs_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_queries" ADD CONSTRAINT "ai_queries_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendation_sources" ADD CONSTRAINT "ai_recommendation_sources_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendation_sources" ADD CONSTRAINT "ai_recommendation_sources_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
