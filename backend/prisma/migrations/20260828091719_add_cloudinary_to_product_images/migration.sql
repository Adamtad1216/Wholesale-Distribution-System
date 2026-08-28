-- AlterTable
ALTER TABLE "ai_queries" RENAME CONSTRAINT "AiQuery_pkey" TO "ai_queries_pkey";

-- AlterTable
ALTER TABLE "ai_recommendation_sources" RENAME CONSTRAINT "AiRecommendationSource_pkey" TO "ai_recommendation_sources_pkey";

-- AlterTable
ALTER TABLE "ai_recommendations" RENAME CONSTRAINT "AiRecommendation_pkey" TO "ai_recommendations_pkey";

-- AlterTable
ALTER TABLE "audit_logs" RENAME CONSTRAINT "AuditLog_pkey" TO "audit_logs_pkey";

-- AlterTable
ALTER TABLE "branches" RENAME CONSTRAINT "Branch_pkey" TO "branches_pkey";

-- AlterTable
ALTER TABLE "brands" RENAME CONSTRAINT "Brand_pkey" TO "brands_pkey";

-- AlterTable
ALTER TABLE "categories" RENAME CONSTRAINT "Category_pkey" TO "categories_pkey";

-- AlterTable
ALTER TABLE "companies" RENAME CONSTRAINT "Company_pkey" TO "companies_pkey";

-- AlterTable
ALTER TABLE "credits" RENAME CONSTRAINT "Credit_pkey" TO "credits_pkey";

-- AlterTable
ALTER TABLE "customer_addresses" RENAME CONSTRAINT "CustomerAddress_pkey" TO "customer_addresses_pkey";

-- AlterTable
ALTER TABLE "customers" RENAME CONSTRAINT "Customer_pkey" TO "customers_pkey";

-- AlterTable
ALTER TABLE "deliveries" RENAME CONSTRAINT "Delivery_pkey" TO "deliveries_pkey";

-- AlterTable
ALTER TABLE "delivery_items" RENAME CONSTRAINT "DeliveryItem_pkey" TO "delivery_items_pkey";

-- AlterTable
ALTER TABLE "delivery_proofs" RENAME CONSTRAINT "DeliveryProof_pkey" TO "delivery_proofs_pkey";

-- AlterTable
ALTER TABLE "discount_rules" RENAME CONSTRAINT "DiscountRule_pkey" TO "discount_rules_pkey";

-- AlterTable
ALTER TABLE "employees" RENAME CONSTRAINT "Employee_pkey" TO "employees_pkey";

-- AlterTable
ALTER TABLE "goods_receipt_items" RENAME CONSTRAINT "GoodsReceiptItem_pkey" TO "goods_receipt_items_pkey";

-- AlterTable
ALTER TABLE "goods_receipts" RENAME CONSTRAINT "GoodsReceipt_pkey" TO "goods_receipts_pkey";

-- AlterTable
ALTER TABLE "invoice_items" RENAME CONSTRAINT "InvoiceItem_pkey" TO "invoice_items_pkey";

-- AlterTable
ALTER TABLE "invoices" RENAME CONSTRAINT "Invoice_pkey" TO "invoices_pkey";

-- AlterTable
ALTER TABLE "job_specifications" RENAME CONSTRAINT "JobSpecification_pkey" TO "job_specifications_pkey";

-- AlterTable
ALTER TABLE "notifications" RENAME CONSTRAINT "Notification_pkey" TO "notifications_pkey";

-- AlterTable
ALTER TABLE "organization_contacts" RENAME CONSTRAINT "OrganizationContact_pkey" TO "organization_contacts_pkey";

-- AlterTable
ALTER TABLE "organizations" RENAME CONSTRAINT "Organization_pkey" TO "organizations_pkey";

-- AlterTable
ALTER TABLE "payment_allocations" RENAME CONSTRAINT "PaymentAllocation_pkey" TO "payment_allocations_pkey";

-- AlterTable
ALTER TABLE "payment_terms" RENAME CONSTRAINT "PaymentTerms_pkey" TO "payment_terms_pkey";

-- AlterTable
ALTER TABLE "payments" RENAME CONSTRAINT "Payment_pkey" TO "payments_pkey";

-- AlterTable
ALTER TABLE "permissions" RENAME CONSTRAINT "Permission_pkey" TO "permissions_pkey";

-- AlterTable
ALTER TABLE "persons" RENAME CONSTRAINT "Person_pkey" TO "persons_pkey";

-- AlterTable
ALTER TABLE "price_tiers" RENAME CONSTRAINT "PriceTier_pkey" TO "price_tiers_pkey";

-- AlterTable
ALTER TABLE "product_images" ADD COLUMN     "cloudinary_public_id" TEXT;
ALTER TABLE "product_images" RENAME CONSTRAINT "ProductImage_pkey" TO "product_images_pkey";

-- AlterTable
ALTER TABLE "products" RENAME CONSTRAINT "Product_pkey" TO "products_pkey";

-- AlterTable
ALTER TABLE "purchase_order_items" RENAME CONSTRAINT "PurchaseOrderItem_pkey" TO "purchase_order_items_pkey";

-- AlterTable
ALTER TABLE "purchase_orders" RENAME CONSTRAINT "PurchaseOrder_pkey" TO "purchase_orders_pkey";

-- AlterTable
ALTER TABLE "purchase_return_items" RENAME CONSTRAINT "PurchaseReturnItem_pkey" TO "purchase_return_items_pkey";

-- AlterTable
ALTER TABLE "purchase_returns" RENAME CONSTRAINT "PurchaseReturn_pkey" TO "purchase_returns_pkey";

-- AlterTable
ALTER TABLE "quotations" RENAME CONSTRAINT "Quotation_pkey" TO "quotations_pkey";

-- AlterTable
ALTER TABLE "refunds" RENAME CONSTRAINT "Refund_pkey" TO "refunds_pkey";

-- AlterTable
ALTER TABLE "role_permissions" RENAME CONSTRAINT "RolePermission_pkey" TO "role_permissions_pkey";

-- AlterTable
ALTER TABLE "roles" RENAME CONSTRAINT "Role_pkey" TO "roles_pkey";

-- AlterTable
ALTER TABLE "sales_order_items" RENAME CONSTRAINT "SalesOrderItem_pkey" TO "sales_order_items_pkey";

-- AlterTable
ALTER TABLE "sales_order_quotation_items" RENAME CONSTRAINT "SalesOrderQuotationItem_pkey" TO "sales_order_quotation_items_pkey";

-- AlterTable
ALTER TABLE "sales_order_status_histories" RENAME CONSTRAINT "SalesOrderStatusHistory_pkey" TO "sales_order_status_histories_pkey";

-- AlterTable
ALTER TABLE "sales_orders" RENAME CONSTRAINT "SalesOrder_pkey" TO "sales_orders_pkey";

-- AlterTable
ALTER TABLE "sales_quota_usages" RENAME CONSTRAINT "SalesQuotaUsage_pkey" TO "sales_quota_usages_pkey";

-- AlterTable
ALTER TABLE "sales_quotas" RENAME CONSTRAINT "SalesQuota_pkey" TO "sales_quotas_pkey";

-- AlterTable
ALTER TABLE "sales_request_items" RENAME CONSTRAINT "SalesRequestItem_pkey" TO "sales_request_items_pkey";

-- AlterTable
ALTER TABLE "sales_requests" RENAME CONSTRAINT "SalesRequest_pkey" TO "sales_requests_pkey";

-- AlterTable
ALTER TABLE "sales_return_items" RENAME CONSTRAINT "SalesReturnItem_pkey" TO "sales_return_items_pkey";

-- AlterTable
ALTER TABLE "sales_returns" RENAME CONSTRAINT "SalesReturn_pkey" TO "sales_returns_pkey";

-- AlterTable
ALTER TABLE "stock_adjustment_items" RENAME CONSTRAINT "StockAdjustmentItem_pkey" TO "stock_adjustment_items_pkey";

-- AlterTable
ALTER TABLE "stock_adjustments" RENAME CONSTRAINT "StockAdjustment_pkey" TO "stock_adjustments_pkey";

-- AlterTable
ALTER TABLE "stock_movements" RENAME CONSTRAINT "StockMovement_pkey" TO "stock_movements_pkey";

-- AlterTable
ALTER TABLE "stock_reservations" RENAME CONSTRAINT "StockReservation_pkey" TO "stock_reservations_pkey";

-- AlterTable
ALTER TABLE "supplier_invoices" RENAME CONSTRAINT "SupplierInvoice_pkey" TO "supplier_invoices_pkey";

-- AlterTable
ALTER TABLE "suppliers" RENAME CONSTRAINT "Supplier_pkey" TO "suppliers_pkey";

-- AlterTable
ALTER TABLE "units" RENAME CONSTRAINT "Unit_pkey" TO "units_pkey";

-- AlterTable
ALTER TABLE "user_roles" RENAME CONSTRAINT "UserRole_pkey" TO "user_roles_pkey";

-- AlterTable
ALTER TABLE "users" RENAME CONSTRAINT "User_pkey" TO "users_pkey";

-- AlterTable
ALTER TABLE "vehicles" RENAME CONSTRAINT "Vehicle_pkey" TO "vehicles_pkey";

-- AlterTable
ALTER TABLE "warehouse_stocks" RENAME CONSTRAINT "WarehouseStock_pkey" TO "warehouse_stocks_pkey";

-- AlterTable
ALTER TABLE "warehouses" RENAME CONSTRAINT "Warehouse_pkey" TO "warehouses_pkey";

-- RenameForeignKey
ALTER TABLE "ai_queries" RENAME CONSTRAINT "AiQuery_created_by_id_fkey" TO "ai_queries_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "ai_queries" RENAME CONSTRAINT "AiQuery_updated_by_id_fkey" TO "ai_queries_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "ai_queries" RENAME CONSTRAINT "AiQuery_user_id_fkey" TO "ai_queries_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "ai_recommendation_sources" RENAME CONSTRAINT "AiRecommendationSource_created_by_id_fkey" TO "ai_recommendation_sources_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "ai_recommendation_sources" RENAME CONSTRAINT "AiRecommendationSource_recommendation_id_fkey" TO "ai_recommendation_sources_recommendation_id_fkey";

-- RenameForeignKey
ALTER TABLE "ai_recommendation_sources" RENAME CONSTRAINT "AiRecommendationSource_updated_by_id_fkey" TO "ai_recommendation_sources_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "ai_recommendations" RENAME CONSTRAINT "AiRecommendation_ai_query_id_fkey" TO "ai_recommendations_ai_query_id_fkey";

-- RenameForeignKey
ALTER TABLE "ai_recommendations" RENAME CONSTRAINT "AiRecommendation_created_by_id_fkey" TO "ai_recommendations_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "ai_recommendations" RENAME CONSTRAINT "AiRecommendation_updated_by_id_fkey" TO "ai_recommendations_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "audit_logs" RENAME CONSTRAINT "AuditLog_created_by_id_fkey" TO "audit_logs_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "audit_logs" RENAME CONSTRAINT "AuditLog_updated_by_id_fkey" TO "audit_logs_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "audit_logs" RENAME CONSTRAINT "AuditLog_user_id_fkey" TO "audit_logs_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "branches" RENAME CONSTRAINT "Branch_company_id_fkey" TO "branches_company_id_fkey";

-- RenameForeignKey
ALTER TABLE "branches" RENAME CONSTRAINT "Branch_created_by_id_fkey" TO "branches_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "branches" RENAME CONSTRAINT "Branch_manager_id_fkey" TO "branches_manager_id_fkey";

-- RenameForeignKey
ALTER TABLE "branches" RENAME CONSTRAINT "Branch_region_id_fkey" TO "branches_region_id_fkey";

-- RenameForeignKey
ALTER TABLE "branches" RENAME CONSTRAINT "Branch_updated_by_id_fkey" TO "branches_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "brands" RENAME CONSTRAINT "Brand_created_by_id_fkey" TO "brands_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "brands" RENAME CONSTRAINT "Brand_updated_by_id_fkey" TO "brands_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "categories" RENAME CONSTRAINT "Category_created_by_id_fkey" TO "categories_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "categories" RENAME CONSTRAINT "Category_parent_id_fkey" TO "categories_parent_id_fkey";

-- RenameForeignKey
ALTER TABLE "categories" RENAME CONSTRAINT "Category_updated_by_id_fkey" TO "categories_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "companies" RENAME CONSTRAINT "Company_created_by_id_fkey" TO "companies_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "companies" RENAME CONSTRAINT "Company_region_id_fkey" TO "companies_region_id_fkey";

-- RenameForeignKey
ALTER TABLE "companies" RENAME CONSTRAINT "Company_updated_by_id_fkey" TO "companies_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "credits" RENAME CONSTRAINT "Credit_created_by_id_fkey" TO "credits_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "credits" RENAME CONSTRAINT "Credit_customer_id_fkey" TO "credits_customer_id_fkey";

-- RenameForeignKey
ALTER TABLE "credits" RENAME CONSTRAINT "Credit_sales_return_id_fkey" TO "credits_sales_return_id_fkey";

-- RenameForeignKey
ALTER TABLE "credits" RENAME CONSTRAINT "Credit_updated_by_id_fkey" TO "credits_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "customer_addresses" RENAME CONSTRAINT "CustomerAddress_created_by_id_fkey" TO "customer_addresses_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "customer_addresses" RENAME CONSTRAINT "CustomerAddress_customer_id_fkey" TO "customer_addresses_customer_id_fkey";

-- RenameForeignKey
ALTER TABLE "customer_addresses" RENAME CONSTRAINT "CustomerAddress_updated_by_id_fkey" TO "customer_addresses_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "customers" RENAME CONSTRAINT "Customer_assigned_sales_rep_id_fkey" TO "customers_assigned_sales_rep_id_fkey";

-- RenameForeignKey
ALTER TABLE "customers" RENAME CONSTRAINT "Customer_created_by_id_fkey" TO "customers_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "customers" RENAME CONSTRAINT "Customer_organization_id_fkey" TO "customers_organization_id_fkey";

-- RenameForeignKey
ALTER TABLE "customers" RENAME CONSTRAINT "Customer_payment_terms_id_fkey" TO "customers_payment_terms_id_fkey";

-- RenameForeignKey
ALTER TABLE "customers" RENAME CONSTRAINT "Customer_person_id_fkey" TO "customers_person_id_fkey";

-- RenameForeignKey
ALTER TABLE "customers" RENAME CONSTRAINT "Customer_updated_by_id_fkey" TO "customers_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "deliveries" RENAME CONSTRAINT "Delivery_created_by_id_fkey" TO "deliveries_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "deliveries" RENAME CONSTRAINT "Delivery_customer_id_fkey" TO "deliveries_customer_id_fkey";

-- RenameForeignKey
ALTER TABLE "deliveries" RENAME CONSTRAINT "Delivery_driver_id_fkey" TO "deliveries_driver_id_fkey";

-- RenameForeignKey
ALTER TABLE "deliveries" RENAME CONSTRAINT "Delivery_sales_order_id_fkey" TO "deliveries_sales_order_id_fkey";

-- RenameForeignKey
ALTER TABLE "deliveries" RENAME CONSTRAINT "Delivery_scheduled_by_fkey" TO "deliveries_scheduled_by_fkey";

-- RenameForeignKey
ALTER TABLE "deliveries" RENAME CONSTRAINT "Delivery_updated_by_id_fkey" TO "deliveries_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "deliveries" RENAME CONSTRAINT "Delivery_vehicle_id_fkey" TO "deliveries_vehicle_id_fkey";

-- RenameForeignKey
ALTER TABLE "deliveries" RENAME CONSTRAINT "Delivery_warehouse_id_fkey" TO "deliveries_warehouse_id_fkey";

-- RenameForeignKey
ALTER TABLE "delivery_items" RENAME CONSTRAINT "DeliveryItem_created_by_id_fkey" TO "delivery_items_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "delivery_items" RENAME CONSTRAINT "DeliveryItem_delivery_id_fkey" TO "delivery_items_delivery_id_fkey";

-- RenameForeignKey
ALTER TABLE "delivery_items" RENAME CONSTRAINT "DeliveryItem_product_id_fkey" TO "delivery_items_product_id_fkey";

-- RenameForeignKey
ALTER TABLE "delivery_items" RENAME CONSTRAINT "DeliveryItem_sales_order_item_id_fkey" TO "delivery_items_sales_order_item_id_fkey";

-- RenameForeignKey
ALTER TABLE "delivery_items" RENAME CONSTRAINT "DeliveryItem_updated_by_id_fkey" TO "delivery_items_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "delivery_proofs" RENAME CONSTRAINT "DeliveryProof_created_by_id_fkey" TO "delivery_proofs_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "delivery_proofs" RENAME CONSTRAINT "DeliveryProof_delivery_id_fkey" TO "delivery_proofs_delivery_id_fkey";

-- RenameForeignKey
ALTER TABLE "delivery_proofs" RENAME CONSTRAINT "DeliveryProof_updated_by_id_fkey" TO "delivery_proofs_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "discount_rules" RENAME CONSTRAINT "DiscountRule_created_by_id_fkey" TO "discount_rules_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "discount_rules" RENAME CONSTRAINT "DiscountRule_product_id_fkey" TO "discount_rules_product_id_fkey";

-- RenameForeignKey
ALTER TABLE "discount_rules" RENAME CONSTRAINT "DiscountRule_updated_by_id_fkey" TO "discount_rules_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "employees" RENAME CONSTRAINT "Employee_branch_id_fkey" TO "employees_branch_id_fkey";

-- RenameForeignKey
ALTER TABLE "employees" RENAME CONSTRAINT "Employee_created_by_id_fkey" TO "employees_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "employees" RENAME CONSTRAINT "Employee_job_specification_id_fkey" TO "employees_job_specification_id_fkey";

-- RenameForeignKey
ALTER TABLE "employees" RENAME CONSTRAINT "Employee_person_id_fkey" TO "employees_person_id_fkey";

-- RenameForeignKey
ALTER TABLE "employees" RENAME CONSTRAINT "Employee_updated_by_id_fkey" TO "employees_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "goods_receipt_items" RENAME CONSTRAINT "GoodsReceiptItem_created_by_id_fkey" TO "goods_receipt_items_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "goods_receipt_items" RENAME CONSTRAINT "GoodsReceiptItem_goods_receipt_id_fkey" TO "goods_receipt_items_goods_receipt_id_fkey";

-- RenameForeignKey
ALTER TABLE "goods_receipt_items" RENAME CONSTRAINT "GoodsReceiptItem_product_id_fkey" TO "goods_receipt_items_product_id_fkey";

-- RenameForeignKey
ALTER TABLE "goods_receipt_items" RENAME CONSTRAINT "GoodsReceiptItem_updated_by_id_fkey" TO "goods_receipt_items_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "goods_receipts" RENAME CONSTRAINT "GoodsReceipt_created_by_id_fkey" TO "goods_receipts_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "goods_receipts" RENAME CONSTRAINT "GoodsReceipt_purchase_order_id_fkey" TO "goods_receipts_purchase_order_id_fkey";

-- RenameForeignKey
ALTER TABLE "goods_receipts" RENAME CONSTRAINT "GoodsReceipt_received_by_fkey" TO "goods_receipts_received_by_fkey";

-- RenameForeignKey
ALTER TABLE "goods_receipts" RENAME CONSTRAINT "GoodsReceipt_updated_by_id_fkey" TO "goods_receipts_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "goods_receipts" RENAME CONSTRAINT "GoodsReceipt_warehouse_id_fkey" TO "goods_receipts_warehouse_id_fkey";

-- RenameForeignKey
ALTER TABLE "invoice_items" RENAME CONSTRAINT "InvoiceItem_created_by_id_fkey" TO "invoice_items_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "invoice_items" RENAME CONSTRAINT "InvoiceItem_invoice_id_fkey" TO "invoice_items_invoice_id_fkey";

-- RenameForeignKey
ALTER TABLE "invoice_items" RENAME CONSTRAINT "InvoiceItem_product_id_fkey" TO "invoice_items_product_id_fkey";

-- RenameForeignKey
ALTER TABLE "invoice_items" RENAME CONSTRAINT "InvoiceItem_updated_by_id_fkey" TO "invoice_items_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "invoices" RENAME CONSTRAINT "Invoice_created_by_id_fkey" TO "invoices_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "invoices" RENAME CONSTRAINT "Invoice_customer_id_fkey" TO "invoices_customer_id_fkey";

-- RenameForeignKey
ALTER TABLE "invoices" RENAME CONSTRAINT "Invoice_sales_order_id_fkey" TO "invoices_sales_order_id_fkey";

-- RenameForeignKey
ALTER TABLE "invoices" RENAME CONSTRAINT "Invoice_updated_by_id_fkey" TO "invoices_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "job_specifications" RENAME CONSTRAINT "JobSpecification_created_by_id_fkey" TO "job_specifications_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "job_specifications" RENAME CONSTRAINT "JobSpecification_updated_by_id_fkey" TO "job_specifications_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "notifications" RENAME CONSTRAINT "Notification_created_by_id_fkey" TO "notifications_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "notifications" RENAME CONSTRAINT "Notification_updated_by_id_fkey" TO "notifications_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "notifications" RENAME CONSTRAINT "Notification_user_id_fkey" TO "notifications_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "organization_contacts" RENAME CONSTRAINT "OrganizationContact_created_by_id_fkey" TO "organization_contacts_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "organization_contacts" RENAME CONSTRAINT "OrganizationContact_organization_id_fkey" TO "organization_contacts_organization_id_fkey";

-- RenameForeignKey
ALTER TABLE "organization_contacts" RENAME CONSTRAINT "OrganizationContact_person_id_fkey" TO "organization_contacts_person_id_fkey";

-- RenameForeignKey
ALTER TABLE "organization_contacts" RENAME CONSTRAINT "OrganizationContact_updated_by_id_fkey" TO "organization_contacts_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "organizations" RENAME CONSTRAINT "Organization_created_by_id_fkey" TO "organizations_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "organizations" RENAME CONSTRAINT "Organization_updated_by_id_fkey" TO "organizations_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "payment_allocations" RENAME CONSTRAINT "PaymentAllocation_created_by_id_fkey" TO "payment_allocations_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "payment_allocations" RENAME CONSTRAINT "PaymentAllocation_invoice_id_fkey" TO "payment_allocations_invoice_id_fkey";

-- RenameForeignKey
ALTER TABLE "payment_allocations" RENAME CONSTRAINT "PaymentAllocation_payment_id_fkey" TO "payment_allocations_payment_id_fkey";

-- RenameForeignKey
ALTER TABLE "payment_allocations" RENAME CONSTRAINT "PaymentAllocation_updated_by_id_fkey" TO "payment_allocations_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "payment_terms" RENAME CONSTRAINT "PaymentTerms_created_by_id_fkey" TO "payment_terms_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "payment_terms" RENAME CONSTRAINT "PaymentTerms_updated_by_id_fkey" TO "payment_terms_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "payments" RENAME CONSTRAINT "Payment_created_by_id_fkey" TO "payments_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "payments" RENAME CONSTRAINT "Payment_customer_id_fkey" TO "payments_customer_id_fkey";

-- RenameForeignKey
ALTER TABLE "payments" RENAME CONSTRAINT "Payment_received_by_fkey" TO "payments_received_by_fkey";

-- RenameForeignKey
ALTER TABLE "payments" RENAME CONSTRAINT "Payment_supplier_id_fkey" TO "payments_supplier_id_fkey";

-- RenameForeignKey
ALTER TABLE "payments" RENAME CONSTRAINT "Payment_updated_by_id_fkey" TO "payments_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "permissions" RENAME CONSTRAINT "Permission_created_by_id_fkey" TO "permissions_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "permissions" RENAME CONSTRAINT "Permission_updated_by_id_fkey" TO "permissions_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "persons" RENAME CONSTRAINT "Person_created_by_id_fkey" TO "persons_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "persons" RENAME CONSTRAINT "Person_updated_by_id_fkey" TO "persons_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "price_tiers" RENAME CONSTRAINT "PriceTier_created_by_id_fkey" TO "price_tiers_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "price_tiers" RENAME CONSTRAINT "PriceTier_product_id_fkey" TO "price_tiers_product_id_fkey";

-- RenameForeignKey
ALTER TABLE "price_tiers" RENAME CONSTRAINT "PriceTier_updated_by_id_fkey" TO "price_tiers_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "product_images" RENAME CONSTRAINT "ProductImage_created_by_id_fkey" TO "product_images_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "product_images" RENAME CONSTRAINT "ProductImage_product_id_fkey" TO "product_images_product_id_fkey";

-- RenameForeignKey
ALTER TABLE "product_images" RENAME CONSTRAINT "ProductImage_updated_by_id_fkey" TO "product_images_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "products" RENAME CONSTRAINT "Product_brand_id_fkey" TO "products_brand_id_fkey";

-- RenameForeignKey
ALTER TABLE "products" RENAME CONSTRAINT "Product_category_id_fkey" TO "products_category_id_fkey";

-- RenameForeignKey
ALTER TABLE "products" RENAME CONSTRAINT "Product_created_by_id_fkey" TO "products_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "products" RENAME CONSTRAINT "Product_unit_id_fkey" TO "products_unit_id_fkey";

-- RenameForeignKey
ALTER TABLE "products" RENAME CONSTRAINT "Product_updated_by_id_fkey" TO "products_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_order_items" RENAME CONSTRAINT "PurchaseOrderItem_created_by_id_fkey" TO "purchase_order_items_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_order_items" RENAME CONSTRAINT "PurchaseOrderItem_product_id_fkey" TO "purchase_order_items_product_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_order_items" RENAME CONSTRAINT "PurchaseOrderItem_purchase_order_id_fkey" TO "purchase_order_items_purchase_order_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_order_items" RENAME CONSTRAINT "PurchaseOrderItem_updated_by_id_fkey" TO "purchase_order_items_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_orders" RENAME CONSTRAINT "PurchaseOrder_approved_by_fkey" TO "purchase_orders_approved_by_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_orders" RENAME CONSTRAINT "PurchaseOrder_created_by_id_fkey" TO "purchase_orders_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_orders" RENAME CONSTRAINT "PurchaseOrder_ordered_by_fkey" TO "purchase_orders_ordered_by_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_orders" RENAME CONSTRAINT "PurchaseOrder_supplier_id_fkey" TO "purchase_orders_supplier_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_orders" RENAME CONSTRAINT "PurchaseOrder_updated_by_id_fkey" TO "purchase_orders_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_orders" RENAME CONSTRAINT "PurchaseOrder_warehouse_id_fkey" TO "purchase_orders_warehouse_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_return_items" RENAME CONSTRAINT "PurchaseReturnItem_created_by_id_fkey" TO "purchase_return_items_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_return_items" RENAME CONSTRAINT "PurchaseReturnItem_product_id_fkey" TO "purchase_return_items_product_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_return_items" RENAME CONSTRAINT "PurchaseReturnItem_purchase_return_id_fkey" TO "purchase_return_items_purchase_return_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_return_items" RENAME CONSTRAINT "PurchaseReturnItem_updated_by_id_fkey" TO "purchase_return_items_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_returns" RENAME CONSTRAINT "PurchaseReturn_created_by_id_fkey" TO "purchase_returns_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_returns" RENAME CONSTRAINT "PurchaseReturn_purchase_order_id_fkey" TO "purchase_returns_purchase_order_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_returns" RENAME CONSTRAINT "PurchaseReturn_supplier_id_fkey" TO "purchase_returns_supplier_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_returns" RENAME CONSTRAINT "PurchaseReturn_updated_by_id_fkey" TO "purchase_returns_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "purchase_returns" RENAME CONSTRAINT "PurchaseReturn_warehouse_id_fkey" TO "purchase_returns_warehouse_id_fkey";

-- RenameForeignKey
ALTER TABLE "quotations" RENAME CONSTRAINT "Quotation_created_by_id_fkey" TO "quotations_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "quotations" RENAME CONSTRAINT "Quotation_customer_id_fkey" TO "quotations_customer_id_fkey";

-- RenameForeignKey
ALTER TABLE "quotations" RENAME CONSTRAINT "Quotation_sales_rep_id_fkey" TO "quotations_sales_rep_id_fkey";

-- RenameForeignKey
ALTER TABLE "quotations" RENAME CONSTRAINT "Quotation_sales_request_id_fkey" TO "quotations_sales_request_id_fkey";

-- RenameForeignKey
ALTER TABLE "quotations" RENAME CONSTRAINT "Quotation_updated_by_id_fkey" TO "quotations_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "refunds" RENAME CONSTRAINT "Refund_created_by_id_fkey" TO "refunds_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "refunds" RENAME CONSTRAINT "Refund_customer_id_fkey" TO "refunds_customer_id_fkey";

-- RenameForeignKey
ALTER TABLE "refunds" RENAME CONSTRAINT "Refund_payment_id_fkey" TO "refunds_payment_id_fkey";

-- RenameForeignKey
ALTER TABLE "refunds" RENAME CONSTRAINT "Refund_processed_by_fkey" TO "refunds_processed_by_fkey";

-- RenameForeignKey
ALTER TABLE "refunds" RENAME CONSTRAINT "Refund_updated_by_id_fkey" TO "refunds_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "role_permissions" RENAME CONSTRAINT "RolePermission_created_by_id_fkey" TO "role_permissions_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "role_permissions" RENAME CONSTRAINT "RolePermission_permission_id_fkey" TO "role_permissions_permission_id_fkey";

-- RenameForeignKey
ALTER TABLE "role_permissions" RENAME CONSTRAINT "RolePermission_role_id_fkey" TO "role_permissions_role_id_fkey";

-- RenameForeignKey
ALTER TABLE "role_permissions" RENAME CONSTRAINT "RolePermission_updated_by_id_fkey" TO "role_permissions_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "roles" RENAME CONSTRAINT "Role_created_by_id_fkey" TO "roles_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "roles" RENAME CONSTRAINT "Role_updated_by_id_fkey" TO "roles_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_order_items" RENAME CONSTRAINT "SalesOrderItem_created_by_id_fkey" TO "sales_order_items_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_order_items" RENAME CONSTRAINT "SalesOrderItem_discount_rule_id_fkey" TO "sales_order_items_discount_rule_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_order_items" RENAME CONSTRAINT "SalesOrderItem_price_tier_id_fkey" TO "sales_order_items_price_tier_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_order_items" RENAME CONSTRAINT "SalesOrderItem_product_id_fkey" TO "sales_order_items_product_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_order_items" RENAME CONSTRAINT "SalesOrderItem_sales_order_id_fkey" TO "sales_order_items_sales_order_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_order_items" RENAME CONSTRAINT "SalesOrderItem_updated_by_id_fkey" TO "sales_order_items_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_order_quotation_items" RENAME CONSTRAINT "SalesOrderQuotationItem_created_by_id_fkey" TO "sales_order_quotation_items_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_order_quotation_items" RENAME CONSTRAINT "SalesOrderQuotationItem_product_id_fkey" TO "sales_order_quotation_items_product_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_order_quotation_items" RENAME CONSTRAINT "SalesOrderQuotationItem_quotation_id_fkey" TO "sales_order_quotation_items_quotation_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_order_quotation_items" RENAME CONSTRAINT "SalesOrderQuotationItem_updated_by_id_fkey" TO "sales_order_quotation_items_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_order_status_histories" RENAME CONSTRAINT "SalesOrderStatusHistory_changed_by_id_fkey" TO "sales_order_status_histories_changed_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_order_status_histories" RENAME CONSTRAINT "SalesOrderStatusHistory_sales_order_id_fkey" TO "sales_order_status_histories_sales_order_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_orders" RENAME CONSTRAINT "SalesOrder_approved_by_fkey" TO "sales_orders_approved_by_fkey";

-- RenameForeignKey
ALTER TABLE "sales_orders" RENAME CONSTRAINT "SalesOrder_created_by_id_fkey" TO "sales_orders_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_orders" RENAME CONSTRAINT "SalesOrder_customer_id_fkey" TO "sales_orders_customer_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_orders" RENAME CONSTRAINT "SalesOrder_delivery_address_id_fkey" TO "sales_orders_delivery_address_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_orders" RENAME CONSTRAINT "SalesOrder_discount_rule_id_fkey" TO "sales_orders_discount_rule_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_orders" RENAME CONSTRAINT "SalesOrder_price_tier_id_fkey" TO "sales_orders_price_tier_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_orders" RENAME CONSTRAINT "SalesOrder_quotation_id_fkey" TO "sales_orders_quotation_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_orders" RENAME CONSTRAINT "SalesOrder_sales_quota_id_fkey" TO "sales_orders_sales_quota_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_orders" RENAME CONSTRAINT "SalesOrder_sales_rep_id_fkey" TO "sales_orders_sales_rep_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_orders" RENAME CONSTRAINT "SalesOrder_updated_by_id_fkey" TO "sales_orders_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_orders" RENAME CONSTRAINT "SalesOrder_warehouse_id_fkey" TO "sales_orders_warehouse_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_quota_usages" RENAME CONSTRAINT "SalesQuotaUsage_customer_id_fkey" TO "sales_quota_usages_customer_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_quota_usages" RENAME CONSTRAINT "SalesQuotaUsage_quota_id_fkey" TO "sales_quota_usages_quota_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_quota_usages" RENAME CONSTRAINT "SalesQuotaUsage_sales_order_id_fkey" TO "sales_quota_usages_sales_order_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_quotas" RENAME CONSTRAINT "SalesQuota_branch_id_fkey" TO "sales_quotas_branch_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_quotas" RENAME CONSTRAINT "SalesQuota_created_by_id_fkey" TO "sales_quotas_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_quotas" RENAME CONSTRAINT "SalesQuota_product_id_fkey" TO "sales_quotas_product_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_quotas" RENAME CONSTRAINT "SalesQuota_updated_by_id_fkey" TO "sales_quotas_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_request_items" RENAME CONSTRAINT "SalesRequestItem_created_by_id_fkey" TO "sales_request_items_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_request_items" RENAME CONSTRAINT "SalesRequestItem_product_id_fkey" TO "sales_request_items_product_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_request_items" RENAME CONSTRAINT "SalesRequestItem_sales_request_id_fkey" TO "sales_request_items_sales_request_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_request_items" RENAME CONSTRAINT "SalesRequestItem_updated_by_id_fkey" TO "sales_request_items_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_requests" RENAME CONSTRAINT "SalesRequest_created_by_id_fkey" TO "sales_requests_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_requests" RENAME CONSTRAINT "SalesRequest_customer_id_fkey" TO "sales_requests_customer_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_requests" RENAME CONSTRAINT "SalesRequest_sales_rep_id_fkey" TO "sales_requests_sales_rep_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_requests" RENAME CONSTRAINT "SalesRequest_updated_by_id_fkey" TO "sales_requests_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_return_items" RENAME CONSTRAINT "SalesReturnItem_created_by_id_fkey" TO "sales_return_items_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_return_items" RENAME CONSTRAINT "SalesReturnItem_product_id_fkey" TO "sales_return_items_product_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_return_items" RENAME CONSTRAINT "SalesReturnItem_sales_return_id_fkey" TO "sales_return_items_sales_return_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_return_items" RENAME CONSTRAINT "SalesReturnItem_updated_by_id_fkey" TO "sales_return_items_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_returns" RENAME CONSTRAINT "SalesReturn_created_by_id_fkey" TO "sales_returns_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_returns" RENAME CONSTRAINT "SalesReturn_customer_id_fkey" TO "sales_returns_customer_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_returns" RENAME CONSTRAINT "SalesReturn_sales_order_id_fkey" TO "sales_returns_sales_order_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_returns" RENAME CONSTRAINT "SalesReturn_updated_by_id_fkey" TO "sales_returns_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "sales_returns" RENAME CONSTRAINT "SalesReturn_warehouse_id_fkey" TO "sales_returns_warehouse_id_fkey";

-- RenameForeignKey
ALTER TABLE "stock_adjustment_items" RENAME CONSTRAINT "StockAdjustmentItem_adjustment_id_fkey" TO "stock_adjustment_items_adjustment_id_fkey";

-- RenameForeignKey
ALTER TABLE "stock_adjustment_items" RENAME CONSTRAINT "StockAdjustmentItem_created_by_id_fkey" TO "stock_adjustment_items_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "stock_adjustment_items" RENAME CONSTRAINT "StockAdjustmentItem_product_id_fkey" TO "stock_adjustment_items_product_id_fkey";

-- RenameForeignKey
ALTER TABLE "stock_adjustment_items" RENAME CONSTRAINT "StockAdjustmentItem_updated_by_id_fkey" TO "stock_adjustment_items_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "stock_adjustments" RENAME CONSTRAINT "StockAdjustment_approved_by_fkey" TO "stock_adjustments_approved_by_fkey";

-- RenameForeignKey
ALTER TABLE "stock_adjustments" RENAME CONSTRAINT "StockAdjustment_created_by_id_fkey" TO "stock_adjustments_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "stock_adjustments" RENAME CONSTRAINT "StockAdjustment_updated_by_id_fkey" TO "stock_adjustments_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "stock_adjustments" RENAME CONSTRAINT "StockAdjustment_warehouse_id_fkey" TO "stock_adjustments_warehouse_id_fkey";

-- RenameForeignKey
ALTER TABLE "stock_movements" RENAME CONSTRAINT "StockMovement_created_by_id_fkey" TO "stock_movements_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "stock_movements" RENAME CONSTRAINT "StockMovement_product_id_fkey" TO "stock_movements_product_id_fkey";

-- RenameForeignKey
ALTER TABLE "stock_movements" RENAME CONSTRAINT "StockMovement_updated_by_id_fkey" TO "stock_movements_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "stock_movements" RENAME CONSTRAINT "StockMovement_warehouse_id_fkey" TO "stock_movements_warehouse_id_fkey";

-- RenameForeignKey
ALTER TABLE "stock_reservations" RENAME CONSTRAINT "StockReservation_created_by_id_fkey" TO "stock_reservations_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "stock_reservations" RENAME CONSTRAINT "StockReservation_product_id_fkey" TO "stock_reservations_product_id_fkey";

-- RenameForeignKey
ALTER TABLE "stock_reservations" RENAME CONSTRAINT "StockReservation_sales_order_id_fkey" TO "stock_reservations_sales_order_id_fkey";

-- RenameForeignKey
ALTER TABLE "stock_reservations" RENAME CONSTRAINT "StockReservation_updated_by_id_fkey" TO "stock_reservations_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "stock_reservations" RENAME CONSTRAINT "StockReservation_warehouse_id_fkey" TO "stock_reservations_warehouse_id_fkey";

-- RenameForeignKey
ALTER TABLE "supplier_invoices" RENAME CONSTRAINT "SupplierInvoice_created_by_id_fkey" TO "supplier_invoices_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "supplier_invoices" RENAME CONSTRAINT "SupplierInvoice_purchase_order_id_fkey" TO "supplier_invoices_purchase_order_id_fkey";

-- RenameForeignKey
ALTER TABLE "supplier_invoices" RENAME CONSTRAINT "SupplierInvoice_supplier_id_fkey" TO "supplier_invoices_supplier_id_fkey";

-- RenameForeignKey
ALTER TABLE "supplier_invoices" RENAME CONSTRAINT "SupplierInvoice_updated_by_id_fkey" TO "supplier_invoices_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "suppliers" RENAME CONSTRAINT "Supplier_created_by_id_fkey" TO "suppliers_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "suppliers" RENAME CONSTRAINT "Supplier_organization_id_fkey" TO "suppliers_organization_id_fkey";

-- RenameForeignKey
ALTER TABLE "suppliers" RENAME CONSTRAINT "Supplier_payment_terms_id_fkey" TO "suppliers_payment_terms_id_fkey";

-- RenameForeignKey
ALTER TABLE "suppliers" RENAME CONSTRAINT "Supplier_person_id_fkey" TO "suppliers_person_id_fkey";

-- RenameForeignKey
ALTER TABLE "suppliers" RENAME CONSTRAINT "Supplier_updated_by_id_fkey" TO "suppliers_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "units" RENAME CONSTRAINT "Unit_created_by_id_fkey" TO "units_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "units" RENAME CONSTRAINT "Unit_updated_by_id_fkey" TO "units_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_roles" RENAME CONSTRAINT "UserRole_created_by_id_fkey" TO "user_roles_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_roles" RENAME CONSTRAINT "UserRole_role_id_fkey" TO "user_roles_role_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_roles" RENAME CONSTRAINT "UserRole_updated_by_id_fkey" TO "user_roles_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_roles" RENAME CONSTRAINT "UserRole_user_id_fkey" TO "user_roles_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "users" RENAME CONSTRAINT "User_created_by_id_fkey" TO "users_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "users" RENAME CONSTRAINT "User_person_id_fkey" TO "users_person_id_fkey";

-- RenameForeignKey
ALTER TABLE "users" RENAME CONSTRAINT "User_updated_by_id_fkey" TO "users_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "vehicles" RENAME CONSTRAINT "Vehicle_created_by_id_fkey" TO "vehicles_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "vehicles" RENAME CONSTRAINT "Vehicle_updated_by_id_fkey" TO "vehicles_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "warehouse_stocks" RENAME CONSTRAINT "WarehouseStock_created_by_id_fkey" TO "warehouse_stocks_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "warehouse_stocks" RENAME CONSTRAINT "WarehouseStock_product_id_fkey" TO "warehouse_stocks_product_id_fkey";

-- RenameForeignKey
ALTER TABLE "warehouse_stocks" RENAME CONSTRAINT "WarehouseStock_updated_by_id_fkey" TO "warehouse_stocks_updated_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "warehouse_stocks" RENAME CONSTRAINT "WarehouseStock_warehouse_id_fkey" TO "warehouse_stocks_warehouse_id_fkey";

-- RenameForeignKey
ALTER TABLE "warehouses" RENAME CONSTRAINT "Warehouse_branch_id_fkey" TO "warehouses_branch_id_fkey";

-- RenameForeignKey
ALTER TABLE "warehouses" RENAME CONSTRAINT "Warehouse_created_by_id_fkey" TO "warehouses_created_by_id_fkey";

-- RenameForeignKey
ALTER TABLE "warehouses" RENAME CONSTRAINT "Warehouse_manager_id_fkey" TO "warehouses_manager_id_fkey";

-- RenameForeignKey
ALTER TABLE "warehouses" RENAME CONSTRAINT "Warehouse_region_id_fkey" TO "warehouses_region_id_fkey";

-- RenameForeignKey
ALTER TABLE "warehouses" RENAME CONSTRAINT "Warehouse_updated_by_id_fkey" TO "warehouses_updated_by_id_fkey";

-- RenameIndex
ALTER INDEX "Branch_branch_code_key" RENAME TO "branches_branch_code_key";

-- RenameIndex
ALTER INDEX "Brand_name_key" RENAME TO "brands_name_key";

-- RenameIndex
ALTER INDEX "Company_tin_number_key" RENAME TO "companies_tin_number_key";

-- RenameIndex
ALTER INDEX "Company_trade_license_number_key" RENAME TO "companies_trade_license_number_key";

-- RenameIndex
ALTER INDEX "Company_vat_registration_number_key" RENAME TO "companies_vat_registration_number_key";

-- RenameIndex
ALTER INDEX "Credit_credit_number_key" RENAME TO "credits_credit_number_key";

-- RenameIndex
ALTER INDEX "CustomerAddress_customer_id_is_active_idx" RENAME TO "customer_addresses_customer_id_is_active_idx";

-- RenameIndex
ALTER INDEX "Customer_customer_code_key" RENAME TO "customers_customer_code_key";

-- RenameIndex
ALTER INDEX "Delivery_delivery_number_key" RENAME TO "deliveries_delivery_number_key";

-- RenameIndex
ALTER INDEX "DiscountRule_product_id_status_idx" RENAME TO "discount_rules_product_id_status_idx";

-- RenameIndex
ALTER INDEX "Employee_employee_code_key" RENAME TO "employees_employee_code_key";

-- RenameIndex
ALTER INDEX "Employee_person_id_key" RENAME TO "employees_person_id_key";

-- RenameIndex
ALTER INDEX "GoodsReceipt_receipt_number_key" RENAME TO "goods_receipts_receipt_number_key";

-- RenameIndex
ALTER INDEX "Invoice_invoice_number_key" RENAME TO "invoices_invoice_number_key";

-- RenameIndex
ALTER INDEX "JobSpecification_code_key" RENAME TO "job_specifications_code_key";

-- RenameIndex
ALTER INDEX "JobSpecification_title_key" RENAME TO "job_specifications_title_key";

-- RenameIndex
ALTER INDEX "Payment_payment_number_key" RENAME TO "payments_payment_number_key";

-- RenameIndex
ALTER INDEX "Permission_name_key" RENAME TO "permissions_name_key";

-- RenameIndex
ALTER INDEX "Person_email_key" RENAME TO "persons_email_key";

-- RenameIndex
ALTER INDEX "PriceTier_product_id_min_quantity_max_quantity_idx" RENAME TO "price_tiers_product_id_min_quantity_max_quantity_idx";

-- RenameIndex
ALTER INDEX "Product_sku_key" RENAME TO "products_sku_key";

-- RenameIndex
ALTER INDEX "PurchaseOrder_po_number_key" RENAME TO "purchase_orders_po_number_key";

-- RenameIndex
ALTER INDEX "PurchaseReturn_return_number_key" RENAME TO "purchase_returns_return_number_key";

-- RenameIndex
ALTER INDEX "PurchaseReturn_supplier_id_return_number_key" RENAME TO "purchase_returns_supplier_id_return_number_key";

-- RenameIndex
ALTER INDEX "PurchaseReturn_supplier_id_status_idx" RENAME TO "purchase_returns_supplier_id_status_idx";

-- RenameIndex
ALTER INDEX "Quotation_quotation_number_key" RENAME TO "quotations_quotation_number_key";

-- RenameIndex
ALTER INDEX "Quotation_sales_request_id_key" RENAME TO "quotations_sales_request_id_key";

-- RenameIndex
ALTER INDEX "Refund_refund_number_key" RENAME TO "refunds_refund_number_key";

-- RenameIndex
ALTER INDEX "Role_name_key" RENAME TO "roles_name_key";

-- RenameIndex
ALTER INDEX "SalesOrderStatusHistory_sales_order_id_changed_at_idx" RENAME TO "sales_order_status_histories_sales_order_id_changed_at_idx";

-- RenameIndex
ALTER INDEX "SalesOrder_customer_id_status_idx" RENAME TO "sales_orders_customer_id_status_idx";

-- RenameIndex
ALTER INDEX "SalesOrder_order_number_key" RENAME TO "sales_orders_order_number_key";

-- RenameIndex
ALTER INDEX "SalesOrder_quotation_id_key" RENAME TO "sales_orders_quotation_id_key";

-- RenameIndex
ALTER INDEX "SalesOrder_sales_rep_id_status_idx" RENAME TO "sales_orders_sales_rep_id_status_idx";

-- RenameIndex
ALTER INDEX "SalesOrder_warehouse_id_status_idx" RENAME TO "sales_orders_warehouse_id_status_idx";

-- RenameIndex
ALTER INDEX "SalesQuotaUsage_quota_id_customer_id_idx" RENAME TO "sales_quota_usages_quota_id_customer_id_idx";

-- RenameIndex
ALTER INDEX "SalesQuotaUsage_quota_id_sales_order_id_key" RENAME TO "sales_quota_usages_quota_id_sales_order_id_key";

-- RenameIndex
ALTER INDEX "SalesQuota_product_id_branch_id_status_idx" RENAME TO "sales_quotas_product_id_branch_id_status_idx";

-- RenameIndex
ALTER INDEX "SalesRequest_request_number_key" RENAME TO "sales_requests_request_number_key";

-- RenameIndex
ALTER INDEX "SalesReturn_return_number_key" RENAME TO "sales_returns_return_number_key";

-- RenameIndex
ALTER INDEX "SupplierInvoice_supplier_id_invoice_number_key" RENAME TO "supplier_invoices_supplier_id_invoice_number_key";

-- RenameIndex
ALTER INDEX "SupplierInvoice_supplier_id_status_idx" RENAME TO "supplier_invoices_supplier_id_status_idx";

-- RenameIndex
ALTER INDEX "Supplier_supplier_code_key" RENAME TO "suppliers_supplier_code_key";

-- RenameIndex
ALTER INDEX "User_invitation_token_hash_key" RENAME TO "users_invitation_token_hash_key";

-- RenameIndex
ALTER INDEX "User_person_id_key" RENAME TO "users_person_id_key";

-- RenameIndex
ALTER INDEX "User_username_key" RENAME TO "users_username_key";

-- RenameIndex
ALTER INDEX "Vehicle_plate_number_key" RENAME TO "vehicles_plate_number_key";

-- RenameIndex
ALTER INDEX "WarehouseStock_product_id_idx" RENAME TO "warehouse_stocks_product_id_idx";

-- RenameIndex
ALTER INDEX "WarehouseStock_warehouse_id_idx" RENAME TO "warehouse_stocks_warehouse_id_idx";

-- RenameIndex
ALTER INDEX "WarehouseStock_warehouse_id_product_id_key" RENAME TO "warehouse_stocks_warehouse_id_product_id_key";

-- RenameIndex
ALTER INDEX "Warehouse_code_key" RENAME TO "warehouses_code_key";
