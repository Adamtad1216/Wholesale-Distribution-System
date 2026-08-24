-- Pluralize table names
-- This migration renames existing tables from singular to plural names
-- to match the @@map() annotations added to the Prisma schema

-- regions is already plural in the database, skip it

ALTER TABLE "Person" RENAME TO "people";
ALTER TABLE "User" RENAME TO "users";
ALTER TABLE "Role" RENAME TO "roles";
ALTER TABLE "Permission" RENAME TO "permissions";
ALTER TABLE "UserRole" RENAME TO "user_roles";
ALTER TABLE "RolePermission" RENAME TO "role_permissions";
ALTER TABLE "JobSpecification" RENAME TO "job_specifications";
ALTER TABLE "Employee" RENAME TO "employees";
ALTER TABLE "Company" RENAME TO "companies";
ALTER TABLE "Branch" RENAME TO "branches";
ALTER TABLE "Warehouse" RENAME TO "warehouses";
ALTER TABLE "Organization" RENAME TO "organizations";
ALTER TABLE "OrganizationContact" RENAME TO "organization_contacts";
ALTER TABLE "Customer" RENAME TO "customers";
ALTER TABLE "Supplier" RENAME TO "suppliers";
ALTER TABLE "PaymentTerms" RENAME TO "payment_terms";
ALTER TABLE "Category" RENAME TO "categories";
ALTER TABLE "Brand" RENAME TO "brands";
ALTER TABLE "Unit" RENAME TO "units";
ALTER TABLE "Product" RENAME TO "products";
ALTER TABLE "ProductImage" RENAME TO "product_images";
ALTER TABLE "WarehouseStock" RENAME TO "warehouse_stocks";
ALTER TABLE "StockMovement" RENAME TO "stock_movements";
ALTER TABLE "StockReservation" RENAME TO "stock_reservations";
ALTER TABLE "StockAdjustment" RENAME TO "stock_adjustments";
ALTER TABLE "StockAdjustmentItem" RENAME TO "stock_adjustment_items";
ALTER TABLE "PurchaseOrder" RENAME TO "purchase_orders";
ALTER TABLE "PurchaseOrderItem" RENAME TO "purchase_order_items";
ALTER TABLE "GoodsReceipt" RENAME TO "goods_receipts";
ALTER TABLE "GoodsReceiptItem" RENAME TO "goods_receipt_items";
ALTER TABLE "SupplierInvoice" RENAME TO "supplier_invoices";
ALTER TABLE "PurchaseReturn" RENAME TO "purchase_returns";
ALTER TABLE "PurchaseReturnItem" RENAME TO "purchase_return_items";
ALTER TABLE "PriceTier" RENAME TO "price_tiers";
ALTER TABLE "DiscountRule" RENAME TO "discount_rules";
ALTER TABLE "SalesQuota" RENAME TO "sales_quotas";
ALTER TABLE "SalesQuotaUsage" RENAME TO "sales_quota_usages";
ALTER TABLE "CustomerAddress" RENAME TO "customer_addresses";
ALTER TABLE "SalesRequest" RENAME TO "sales_requests";
ALTER TABLE "SalesRequestItem" RENAME TO "sales_request_items";
ALTER TABLE "Quotation" RENAME TO "quotations";
ALTER TABLE "SalesOrderQuotationItem" RENAME TO "sales_order_quotation_items";
ALTER TABLE "SalesOrder" RENAME TO "sales_orders";
ALTER TABLE "SalesOrderItem" RENAME TO "sales_order_items";
ALTER TABLE "SalesReturn" RENAME TO "sales_returns";
ALTER TABLE "SalesReturnItem" RENAME TO "sales_return_items";
ALTER TABLE "SalesOrderStatusHistory" RENAME TO "sales_order_status_histories";
ALTER TABLE "Vehicle" RENAME TO "vehicles";
ALTER TABLE "Delivery" RENAME TO "deliveries";
ALTER TABLE "DeliveryItem" RENAME TO "delivery_items";
ALTER TABLE "DeliveryProof" RENAME TO "delivery_proofs";
ALTER TABLE "Invoice" RENAME TO "invoices";
ALTER TABLE "InvoiceItem" RENAME TO "invoice_items";
ALTER TABLE "Payment" RENAME TO "payments";
ALTER TABLE "PaymentAllocation" RENAME TO "payment_allocations";
ALTER TABLE "Refund" RENAME TO "refunds";
ALTER TABLE "Credit" RENAME TO "credits";
ALTER TABLE "AiQuery" RENAME TO "ai_queries";
ALTER TABLE "AiRecommendation" RENAME TO "ai_recommendations";
ALTER TABLE "AiRecommendationSource" RENAME TO "ai_recommendation_sources";
ALTER TABLE "Notification" RENAME TO "notifications";
ALTER TABLE "AuditLog" RENAME TO "audit_logs";
