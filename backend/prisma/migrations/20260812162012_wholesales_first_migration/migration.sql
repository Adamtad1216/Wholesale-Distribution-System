-- CreateEnum
CREATE TYPE "RequestSource" AS ENUM ('CUSTOMER_PORTAL', 'SALES_OFFICER');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE_RECEIPT', 'SALES_RESERVATION', 'SALES_FULFILLMENT', 'SALES_RETURN', 'PURCHASE_RETURN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'TRANSFER_IN', 'TRANSFER_OUT');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CUSTOMER_PAYMENT', 'SUPPLIER_PAYMENT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CARD', 'OTHER');

-- CreateTable
CREATE TABLE "persons" (
    "id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "employee_code" TEXT NOT NULL,
    "hire_date" TIMESTAMP(3) NOT NULL,
    "department" TEXT,
    "job_title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_representatives" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "territory" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "sales_representatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "license_number" TEXT NOT NULL,
    "license_expiry" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "registration_number" TEXT,
    "tax_number" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_contacts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "position" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "organization_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "customer_code" TEXT NOT NULL,
    "person_id" UUID,
    "organization_id" UUID,
    "customer_type" TEXT NOT NULL,
    "credit_limit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payment_terms_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assigned_sales_rep_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "supplier_code" TEXT NOT NULL,
    "person_id" UUID,
    "organization_id" UUID,
    "payment_terms_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_terms" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "payment_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" UUID NOT NULL,
    "brand_id" UUID,
    "unit_id" UUID NOT NULL,
    "purchase_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "selling_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "wholesale_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "minimum_stock_level" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "reorder_level" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit_id" UUID NOT NULL,
    "purchase_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "selling_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "wholesale_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "manager_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_stocks" (
    "id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "reserved_quantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "available_quantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "minimum_stock" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "reorder_level" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "movement_type" "StockMovementType" NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "reference_type" TEXT,
    "reference_id" UUID,
    "unit_cost" DECIMAL(15,2),
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_reservations" (
    "id" UUID NOT NULL,
    "sales_order_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMP(3),

    CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_by" UUID NOT NULL,
    "approved_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustment_items" (
    "id" UUID NOT NULL,
    "adjustment_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "system_quantity" DECIMAL(15,3) NOT NULL,
    "actual_quantity" DECIMAL(15,3) NOT NULL,
    "difference" DECIMAL(15,3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "stock_adjustment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL,
    "po_number" TEXT NOT NULL,
    "supplier_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "ordered_by" UUID NOT NULL,
    "approved_by" UUID,
    "order_date" TIMESTAMP(3) NOT NULL,
    "expected_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "received_quantity" DECIMAL(15,3) NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipts" (
    "id" UUID NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "received_by" UUID NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',

    CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt_items" (
    "id" UUID NOT NULL,
    "goods_receipt_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "ordered_quantity" DECIMAL(15,3) NOT NULL,
    "received_quantity" DECIMAL(15,3) NOT NULL,
    "damaged_quantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "goods_receipt_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_invoices" (
    "id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "supplier_id" UUID NOT NULL,
    "purchase_order_id" UUID,
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',

    CONSTRAINT "supplier_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_returns" (
    "id" UUID NOT NULL,
    "return_number" TEXT NOT NULL,
    "supplier_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "purchase_order_id" UUID,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_by" UUID NOT NULL,

    CONSTRAINT "purchase_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_return_items" (
    "id" UUID NOT NULL,
    "purchase_return_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit_cost" DECIMAL(15,2) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "purchase_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_requests" (
    "id" UUID NOT NULL,
    "request_number" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "sales_rep_id" UUID,
    "source" "RequestSource" NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_request_items" (
    "id" UUID NOT NULL,
    "sales_request_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "sales_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" UUID NOT NULL,
    "quotation_number" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "sales_rep_id" UUID NOT NULL,
    "sales_request_id" UUID,
    "quotation_date" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" UUID NOT NULL,
    "quotation_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "sales_rep_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "quotation_id" UUID,
    "order_date" TIMESTAMP(3) NOT NULL,
    "required_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_items" (
    "id" UUID NOT NULL,
    "sales_order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "reserved_quantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "fulfilled_quantity" DECIMAL(15,3) NOT NULL DEFAULT 0,

    CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_returns" (
    "id" UUID NOT NULL,
    "return_number" TEXT NOT NULL,
    "sales_order_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_by" UUID NOT NULL,

    CONSTRAINT "sales_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_return_items" (
    "id" UUID NOT NULL,
    "sales_return_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "condition" TEXT,
    "reason" TEXT,

    CONSTRAINT "sales_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "plate_number" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "model" TEXT,
    "capacity" DECIMAL(15,3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" UUID NOT NULL,
    "delivery_number" TEXT NOT NULL,
    "sales_order_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "delivery_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "delivery_address" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_items" (
    "id" UUID NOT NULL,
    "delivery_id" UUID NOT NULL,
    "sales_order_item_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "delivered_quantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "returned_quantity" DECIMAL(15,3) NOT NULL DEFAULT 0,

    CONSTRAINT "delivery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_proofs" (
    "id" UUID NOT NULL,
    "delivery_id" UUID NOT NULL,
    "proof_type" TEXT NOT NULL,
    "file_url" TEXT,
    "recipient_name" TEXT,
    "recipient_signature" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "sales_order_id" UUID NOT NULL,
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "payment_number" TEXT NOT NULL,
    "customer_id" UUID,
    "supplier_id" UUID,
    "payment_type" "PaymentType" NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "reference_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "received_by" UUID,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_allocations" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "allocated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "refund_number" TEXT NOT NULL,
    "payment_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "refund_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processed_by" UUID NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credits" (
    "id" UUID NOT NULL,
    "credit_number" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "sales_return_id" UUID,
    "amount" DECIMAL(15,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_queries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "intent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_recommendations" (
    "id" UUID NOT NULL,
    "ai_query_id" UUID NOT NULL,
    "recommendation_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence_score" DECIMAL(5,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_recommendation_sources" (
    "id" UUID NOT NULL,
    "recommendation_id" UUID NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" UUID NOT NULL,
    "metric_name" TEXT,
    "metric_value" DECIMAL(15,4),
    "explanation" TEXT,

    CONSTRAINT "ai_recommendation_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "persons_email_idx" ON "persons"("email");

-- CreateIndex
CREATE INDEX "persons_phone_idx" ON "persons"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_person_id_key" ON "users"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "permissions"("module");

-- CreateIndex
CREATE UNIQUE INDEX "employees_person_id_key" ON "employees"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_code_key" ON "employees"("employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "sales_representatives_employee_id_key" ON "sales_representatives"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_employee_id_key" ON "drivers"("employee_id");

-- CreateIndex
CREATE INDEX "drivers_license_number_idx" ON "drivers"("license_number");

-- CreateIndex
CREATE INDEX "organizations_name_idx" ON "organizations"("name");

-- CreateIndex
CREATE INDEX "organizations_registration_number_idx" ON "organizations"("registration_number");

-- CreateIndex
CREATE INDEX "organizations_tax_number_idx" ON "organizations"("tax_number");

-- CreateIndex
CREATE INDEX "organization_contacts_organization_id_idx" ON "organization_contacts"("organization_id");

-- CreateIndex
CREATE INDEX "organization_contacts_person_id_idx" ON "organization_contacts"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_contacts_organization_id_person_id_key" ON "organization_contacts"("organization_id", "person_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_customer_code_key" ON "customers"("customer_code");

-- CreateIndex
CREATE INDEX "customers_person_id_idx" ON "customers"("person_id");

-- CreateIndex
CREATE INDEX "customers_organization_id_idx" ON "customers"("organization_id");

-- CreateIndex
CREATE INDEX "customers_assigned_sales_rep_id_idx" ON "customers"("assigned_sales_rep_id");

-- CreateIndex
CREATE INDEX "customers_payment_terms_id_idx" ON "customers"("payment_terms_id");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_supplier_code_key" ON "suppliers"("supplier_code");

-- CreateIndex
CREATE INDEX "suppliers_person_id_idx" ON "suppliers"("person_id");

-- CreateIndex
CREATE INDEX "suppliers_organization_id_idx" ON "suppliers"("organization_id");

-- CreateIndex
CREATE INDEX "suppliers_payment_terms_id_idx" ON "suppliers"("payment_terms_id");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_brand_id_idx" ON "products"("brand_id");

-- CreateIndex
CREATE INDEX "products_unit_id_idx" ON "products"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "product_variants_unit_id_idx" ON "product_variants"("unit_id");

-- CreateIndex
CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE INDEX "warehouses_manager_id_idx" ON "warehouses"("manager_id");

-- CreateIndex
CREATE INDEX "warehouse_stocks_product_id_idx" ON "warehouse_stocks"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_stocks_warehouse_id_product_id_key" ON "warehouse_stocks"("warehouse_id", "product_id");

-- CreateIndex
CREATE INDEX "stock_movements_warehouse_id_idx" ON "stock_movements"("warehouse_id");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_idx" ON "stock_movements"("product_id");

-- CreateIndex
CREATE INDEX "stock_movements_movement_type_idx" ON "stock_movements"("movement_type");

-- CreateIndex
CREATE INDEX "stock_movements_reference_type_reference_id_idx" ON "stock_movements"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "stock_movements_created_by_idx" ON "stock_movements"("created_by");

-- CreateIndex
CREATE INDEX "stock_reservations_sales_order_id_idx" ON "stock_reservations"("sales_order_id");

-- CreateIndex
CREATE INDEX "stock_reservations_warehouse_id_product_id_idx" ON "stock_reservations"("warehouse_id", "product_id");

-- CreateIndex
CREATE INDEX "stock_adjustments_warehouse_id_idx" ON "stock_adjustments"("warehouse_id");

-- CreateIndex
CREATE INDEX "stock_adjustments_created_by_idx" ON "stock_adjustments"("created_by");

-- CreateIndex
CREATE INDEX "stock_adjustments_approved_by_idx" ON "stock_adjustments"("approved_by");

-- CreateIndex
CREATE INDEX "stock_adjustment_items_adjustment_id_idx" ON "stock_adjustment_items"("adjustment_id");

-- CreateIndex
CREATE INDEX "stock_adjustment_items_product_id_idx" ON "stock_adjustment_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");

-- CreateIndex
CREATE INDEX "purchase_orders_supplier_id_idx" ON "purchase_orders"("supplier_id");

-- CreateIndex
CREATE INDEX "purchase_orders_warehouse_id_idx" ON "purchase_orders"("warehouse_id");

-- CreateIndex
CREATE INDEX "purchase_orders_ordered_by_idx" ON "purchase_orders"("ordered_by");

-- CreateIndex
CREATE INDEX "purchase_orders_approved_by_idx" ON "purchase_orders"("approved_by");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "purchase_orders_order_date_idx" ON "purchase_orders"("order_date");

-- CreateIndex
CREATE INDEX "purchase_order_items_purchase_order_id_idx" ON "purchase_order_items"("purchase_order_id");

-- CreateIndex
CREATE INDEX "purchase_order_items_product_id_idx" ON "purchase_order_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipts_receipt_number_key" ON "goods_receipts"("receipt_number");

-- CreateIndex
CREATE INDEX "goods_receipts_purchase_order_id_idx" ON "goods_receipts"("purchase_order_id");

-- CreateIndex
CREATE INDEX "goods_receipts_warehouse_id_idx" ON "goods_receipts"("warehouse_id");

-- CreateIndex
CREATE INDEX "goods_receipts_received_by_idx" ON "goods_receipts"("received_by");

-- CreateIndex
CREATE INDEX "goods_receipt_items_goods_receipt_id_idx" ON "goods_receipt_items"("goods_receipt_id");

-- CreateIndex
CREATE INDEX "goods_receipt_items_product_id_idx" ON "goods_receipt_items"("product_id");

-- CreateIndex
CREATE INDEX "supplier_invoices_supplier_id_idx" ON "supplier_invoices"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_invoices_purchase_order_id_idx" ON "supplier_invoices"("purchase_order_id");

-- CreateIndex
CREATE INDEX "supplier_invoices_due_date_idx" ON "supplier_invoices"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_invoices_supplier_id_invoice_number_key" ON "supplier_invoices"("supplier_id", "invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_returns_return_number_key" ON "purchase_returns"("return_number");

-- CreateIndex
CREATE INDEX "purchase_returns_supplier_id_idx" ON "purchase_returns"("supplier_id");

-- CreateIndex
CREATE INDEX "purchase_returns_warehouse_id_idx" ON "purchase_returns"("warehouse_id");

-- CreateIndex
CREATE INDEX "purchase_returns_purchase_order_id_idx" ON "purchase_returns"("purchase_order_id");

-- CreateIndex
CREATE INDEX "purchase_returns_created_by_idx" ON "purchase_returns"("created_by");

-- CreateIndex
CREATE INDEX "purchase_return_items_purchase_return_id_idx" ON "purchase_return_items"("purchase_return_id");

-- CreateIndex
CREATE INDEX "purchase_return_items_product_id_idx" ON "purchase_return_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_requests_request_number_key" ON "sales_requests"("request_number");

-- CreateIndex
CREATE INDEX "sales_requests_customer_id_idx" ON "sales_requests"("customer_id");

-- CreateIndex
CREATE INDEX "sales_requests_sales_rep_id_idx" ON "sales_requests"("sales_rep_id");

-- CreateIndex
CREATE INDEX "sales_requests_status_idx" ON "sales_requests"("status");

-- CreateIndex
CREATE INDEX "sales_requests_created_at_idx" ON "sales_requests"("created_at");

-- CreateIndex
CREATE INDEX "sales_request_items_sales_request_id_idx" ON "sales_request_items"("sales_request_id");

-- CreateIndex
CREATE INDEX "sales_request_items_product_id_idx" ON "sales_request_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotation_number_key" ON "quotations"("quotation_number");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_sales_request_id_key" ON "quotations"("sales_request_id");

-- CreateIndex
CREATE INDEX "quotations_customer_id_idx" ON "quotations"("customer_id");

-- CreateIndex
CREATE INDEX "quotations_sales_rep_id_idx" ON "quotations"("sales_rep_id");

-- CreateIndex
CREATE INDEX "quotations_valid_until_idx" ON "quotations"("valid_until");

-- CreateIndex
CREATE INDEX "quotation_items_quotation_id_idx" ON "quotation_items"("quotation_id");

-- CreateIndex
CREATE INDEX "quotation_items_product_id_idx" ON "quotation_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_order_number_key" ON "sales_orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_quotation_id_key" ON "sales_orders"("quotation_id");

-- CreateIndex
CREATE INDEX "sales_orders_customer_id_idx" ON "sales_orders"("customer_id");

-- CreateIndex
CREATE INDEX "sales_orders_sales_rep_id_idx" ON "sales_orders"("sales_rep_id");

-- CreateIndex
CREATE INDEX "sales_orders_warehouse_id_idx" ON "sales_orders"("warehouse_id");

-- CreateIndex
CREATE INDEX "sales_orders_status_idx" ON "sales_orders"("status");

-- CreateIndex
CREATE INDEX "sales_orders_order_date_idx" ON "sales_orders"("order_date");

-- CreateIndex
CREATE INDEX "sales_order_items_sales_order_id_idx" ON "sales_order_items"("sales_order_id");

-- CreateIndex
CREATE INDEX "sales_order_items_product_id_idx" ON "sales_order_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_returns_return_number_key" ON "sales_returns"("return_number");

-- CreateIndex
CREATE INDEX "sales_returns_sales_order_id_idx" ON "sales_returns"("sales_order_id");

-- CreateIndex
CREATE INDEX "sales_returns_customer_id_idx" ON "sales_returns"("customer_id");

-- CreateIndex
CREATE INDEX "sales_returns_warehouse_id_idx" ON "sales_returns"("warehouse_id");

-- CreateIndex
CREATE INDEX "sales_returns_created_by_idx" ON "sales_returns"("created_by");

-- CreateIndex
CREATE INDEX "sales_return_items_sales_return_id_idx" ON "sales_return_items"("sales_return_id");

-- CreateIndex
CREATE INDEX "sales_return_items_product_id_idx" ON "sales_return_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_number_key" ON "vehicles"("plate_number");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_delivery_number_key" ON "deliveries"("delivery_number");

-- CreateIndex
CREATE INDEX "deliveries_sales_order_id_idx" ON "deliveries"("sales_order_id");

-- CreateIndex
CREATE INDEX "deliveries_customer_id_idx" ON "deliveries"("customer_id");

-- CreateIndex
CREATE INDEX "deliveries_warehouse_id_idx" ON "deliveries"("warehouse_id");

-- CreateIndex
CREATE INDEX "deliveries_driver_id_idx" ON "deliveries"("driver_id");

-- CreateIndex
CREATE INDEX "deliveries_vehicle_id_idx" ON "deliveries"("vehicle_id");

-- CreateIndex
CREATE INDEX "deliveries_scheduled_date_idx" ON "deliveries"("scheduled_date");

-- CreateIndex
CREATE INDEX "delivery_items_delivery_id_idx" ON "delivery_items"("delivery_id");

-- CreateIndex
CREATE INDEX "delivery_items_sales_order_item_id_idx" ON "delivery_items"("sales_order_item_id");

-- CreateIndex
CREATE INDEX "delivery_items_product_id_idx" ON "delivery_items"("product_id");

-- CreateIndex
CREATE INDEX "delivery_proofs_delivery_id_idx" ON "delivery_proofs"("delivery_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_customer_id_idx" ON "invoices"("customer_id");

-- CreateIndex
CREATE INDEX "invoices_sales_order_id_idx" ON "invoices"("sales_order_id");

-- CreateIndex
CREATE INDEX "invoices_due_date_idx" ON "invoices"("due_date");

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_items_product_id_idx" ON "invoice_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_number_key" ON "payments"("payment_number");

-- CreateIndex
CREATE INDEX "payments_customer_id_idx" ON "payments"("customer_id");

-- CreateIndex
CREATE INDEX "payments_supplier_id_idx" ON "payments"("supplier_id");

-- CreateIndex
CREATE INDEX "payments_payment_date_idx" ON "payments"("payment_date");

-- CreateIndex
CREATE INDEX "payments_received_by_idx" ON "payments"("received_by");

-- CreateIndex
CREATE INDEX "payment_allocations_invoice_id_idx" ON "payment_allocations"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_allocations_payment_id_invoice_id_key" ON "payment_allocations"("payment_id", "invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_refund_number_key" ON "refunds"("refund_number");

-- CreateIndex
CREATE INDEX "refunds_payment_id_idx" ON "refunds"("payment_id");

-- CreateIndex
CREATE INDEX "refunds_customer_id_idx" ON "refunds"("customer_id");

-- CreateIndex
CREATE INDEX "refunds_processed_by_idx" ON "refunds"("processed_by");

-- CreateIndex
CREATE UNIQUE INDEX "credits_credit_number_key" ON "credits"("credit_number");

-- CreateIndex
CREATE INDEX "credits_customer_id_idx" ON "credits"("customer_id");

-- CreateIndex
CREATE INDEX "credits_sales_return_id_idx" ON "credits"("sales_return_id");

-- CreateIndex
CREATE INDEX "ai_queries_user_id_idx" ON "ai_queries"("user_id");

-- CreateIndex
CREATE INDEX "ai_queries_created_at_idx" ON "ai_queries"("created_at");

-- CreateIndex
CREATE INDEX "ai_recommendations_ai_query_id_idx" ON "ai_recommendations"("ai_query_id");

-- CreateIndex
CREATE INDEX "ai_recommendation_sources_recommendation_id_idx" ON "ai_recommendation_sources"("recommendation_id");

-- CreateIndex
CREATE INDEX "ai_recommendation_sources_source_type_source_id_idx" ON "ai_recommendation_sources"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_representatives" ADD CONSTRAINT "sales_representatives_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_contacts" ADD CONSTRAINT "organization_contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_contacts" ADD CONSTRAINT "organization_contacts_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_payment_terms_id_fkey" FOREIGN KEY ("payment_terms_id") REFERENCES "payment_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_assigned_sales_rep_id_fkey" FOREIGN KEY ("assigned_sales_rep_id") REFERENCES "sales_representatives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_payment_terms_id_fkey" FOREIGN KEY ("payment_terms_id") REFERENCES "payment_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_stocks" ADD CONSTRAINT "warehouse_stocks_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_stocks" ADD CONSTRAINT "warehouse_stocks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustment_items" ADD CONSTRAINT "stock_adjustment_items_adjustment_id_fkey" FOREIGN KEY ("adjustment_id") REFERENCES "stock_adjustments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustment_items" ADD CONSTRAINT "stock_adjustment_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_ordered_by_fkey" FOREIGN KEY ("ordered_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_goods_receipt_id_fkey" FOREIGN KEY ("goods_receipt_id") REFERENCES "goods_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_purchase_return_id_fkey" FOREIGN KEY ("purchase_return_id") REFERENCES "purchase_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_requests" ADD CONSTRAINT "sales_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_requests" ADD CONSTRAINT "sales_requests_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "sales_representatives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_request_items" ADD CONSTRAINT "sales_request_items_sales_request_id_fkey" FOREIGN KEY ("sales_request_id") REFERENCES "sales_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_request_items" ADD CONSTRAINT "sales_request_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "sales_representatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_sales_request_id_fkey" FOREIGN KEY ("sales_request_id") REFERENCES "sales_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "sales_representatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_return_items" ADD CONSTRAINT "sales_return_items_sales_return_id_fkey" FOREIGN KEY ("sales_return_id") REFERENCES "sales_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_return_items" ADD CONSTRAINT "sales_return_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_sales_order_item_id_fkey" FOREIGN KEY ("sales_order_item_id") REFERENCES "sales_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_proofs" ADD CONSTRAINT "delivery_proofs_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_sales_return_id_fkey" FOREIGN KEY ("sales_return_id") REFERENCES "sales_returns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_queries" ADD CONSTRAINT "ai_queries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_ai_query_id_fkey" FOREIGN KEY ("ai_query_id") REFERENCES "ai_queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendation_sources" ADD CONSTRAINT "ai_recommendation_sources_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "ai_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
