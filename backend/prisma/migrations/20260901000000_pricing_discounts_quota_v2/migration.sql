-- ============================================================
-- PRICING, DISCOUNTS & QUOTAS - PHASE 4 (Developer C)
-- Refactors PriceTier into tier definitions, introduces ProductPrice,
-- and adds customer/warehouse scoped fields to DiscountRule and SalesQuota.
-- ============================================================

-- CreateEnum
CREATE TYPE "QuotaPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- AlterEnum: ensure SalesOrderStatus contains all required values (some may have been added before migration was generated)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'SalesOrderStatus' AND e.enumlabel = 'SALES_REP_APPROVED') THEN
    ALTER TYPE "SalesOrderStatus" ADD VALUE 'SALES_REP_APPROVED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'SalesOrderStatus' AND e.enumlabel = 'WAREHOUSE_PREPARATION_SCHEDULED') THEN
    ALTER TYPE "SalesOrderStatus" ADD VALUE 'WAREHOUSE_PREPARATION_SCHEDULED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'SalesOrderStatus' AND e.enumlabel = 'PREPARING') THEN
    ALTER TYPE "SalesOrderStatus" ADD VALUE 'PREPARING';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'SalesOrderStatus' AND e.enumlabel = 'DELIVERY_SCHEDULED') THEN
    ALTER TYPE "SalesOrderStatus" ADD VALUE 'DELIVERY_SCHEDULED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'SalesOrderStatus' AND e.enumlabel = 'OUT_FOR_DELIVERY') THEN
    ALTER TYPE "SalesOrderStatus" ADD VALUE 'OUT_FOR_DELIVERY';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'SalesOrderHistoryAction' AND e.enumlabel = 'WAREHOUSE_PREPARATION_SCHEDULED') THEN
    ALTER TYPE "SalesOrderHistoryAction" ADD VALUE 'WAREHOUSE_PREPARATION_SCHEDULED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'SalesOrderHistoryAction' AND e.enumlabel = 'PREPARING') THEN
    ALTER TYPE "SalesOrderHistoryAction" ADD VALUE 'PREPARING';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'SalesOrderHistoryAction' AND e.enumlabel = 'DELIVERY_SCHEDULED') THEN
    ALTER TYPE "SalesOrderHistoryAction" ADD VALUE 'DELIVERY_SCHEDULED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'SalesOrderHistoryAction' AND e.enumlabel = 'OUT_FOR_DELIVERY') THEN
    ALTER TYPE "SalesOrderHistoryAction" ADD VALUE 'OUT_FOR_DELIVERY';
  END IF;
END $$;

-- DropForeignKey
ALTER TABLE "discount_rules" DROP CONSTRAINT IF EXISTS "discount_rules_product_id_fkey";

-- DropForeignKey
ALTER TABLE "price_tiers" DROP CONSTRAINT IF EXISTS "price_tiers_product_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_quotas" DROP CONSTRAINT IF EXISTS "sales_quotas_product_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_quotas" DROP CONSTRAINT IF EXISTS "sales_quotas_branch_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "price_tiers_product_id_min_quantity_max_quantity_idx";

-- DropIndex
DROP INDEX IF EXISTS "discount_rules_product_id_status_idx";

-- DropIndex
DROP INDEX IF EXISTS "sales_quotas_product_id_branch_id_status_idx";

-- AlterTable: price_tiers -> drop product-level fields, add tier-definition fields
ALTER TABLE "price_tiers" DROP COLUMN IF EXISTS "product_id";
ALTER TABLE "price_tiers" DROP COLUMN IF EXISTS "min_quantity";
ALTER TABLE "price_tiers" DROP COLUMN IF EXISTS "max_quantity";
ALTER TABLE "price_tiers" DROP COLUMN IF EXISTS "unit_price";
ALTER TABLE "price_tiers" DROP COLUMN IF EXISTS "starts_at";
ALTER TABLE "price_tiers" DROP COLUMN IF EXISTS "ends_at";

ALTER TABLE "price_tiers" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "price_tiers" ADD COLUMN IF NOT EXISTS "is_archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "price_tiers" ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMP(3);
ALTER TABLE "price_tiers" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "price_tiers" ADD COLUMN IF NOT EXISTS "is_default" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "price_tiers" ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0;

-- Backfill: rows that existed before may have NULL name; give them a placeholder label so the unique index can be created
UPDATE "price_tiers" SET "name" = CONCAT('LegacyTier-', "id") WHERE "name" IS NULL;

-- Drop default unique index that may not exist, then add the unique on name
DO $$
BEGIN
  BEGIN
    ALTER TABLE "price_tiers" ADD CONSTRAINT "price_tiers_name_key" UNIQUE ("name");
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

ALTER TABLE "price_tiers" ALTER COLUMN "name" SET NOT NULL;

-- AlterTable: discount_rules -> add price tier, warehouse, priority; drop customer type
ALTER TABLE "discount_rules" DROP COLUMN IF EXISTS "customer_type";
ALTER TABLE "discount_rules" DROP COLUMN IF EXISTS "max_quantity";
ALTER TABLE "discount_rules" ADD COLUMN IF NOT EXISTS "price_tier_id" UUID;
ALTER TABLE "discount_rules" ADD COLUMN IF NOT EXISTS "warehouse_id" UUID;
ALTER TABLE "discount_rules" ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: sales_quotas -> add customer, price tier, warehouse, period
ALTER TABLE "sales_quotas" DROP COLUMN IF EXISTS "customer_type";
ALTER TABLE "sales_quotas" ADD COLUMN IF NOT EXISTS "customer_id" UUID;
ALTER TABLE "sales_quotas" ADD COLUMN IF NOT EXISTS "price_tier_id" UUID;
ALTER TABLE "sales_quotas" ADD COLUMN IF NOT EXISTS "warehouse_id" UUID;
ALTER TABLE "sales_quotas" ADD COLUMN IF NOT EXISTS "period" "QuotaPeriod" NOT NULL DEFAULT 'MONTHLY';

-- AlterTable: customers -> add price_tier_id
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "price_tier_id" UUID;

-- CreateTable: product_prices
CREATE TABLE IF NOT EXISTS "product_prices" (
    "id" UUID NOT NULL,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "product_id" UUID NOT NULL,
    "price_tier_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "status" "PricingRuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),

    CONSTRAINT "product_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "product_prices_product_id_price_tier_id_warehouse_id_status_key"
    ON "product_prices"("product_id", "price_tier_id", "warehouse_id", "status");

CREATE INDEX IF NOT EXISTS "product_prices_product_id_warehouse_id_idx" ON "product_prices"("product_id", "warehouse_id");
CREATE INDEX IF NOT EXISTS "product_prices_price_tier_id_idx" ON "product_prices"("price_tier_id");

-- CreateIndex: discount_rules new indexes
CREATE INDEX IF NOT EXISTS "discount_rules_product_id_status_priority_idx" ON "discount_rules"("product_id", "status", "priority");
CREATE INDEX IF NOT EXISTS "discount_rules_warehouse_id_status_idx" ON "discount_rules"("warehouse_id", "status");

-- CreateIndex: sales_quotas new indexes
CREATE INDEX IF NOT EXISTS "sales_quotas_customer_id_product_id_warehouse_id_status_idx"
    ON "sales_quotas"("customer_id", "product_id", "warehouse_id", "status");
CREATE INDEX IF NOT EXISTS "sales_quotas_product_id_warehouse_id_status_idx"
    ON "sales_quotas"("product_id", "warehouse_id", "status");

-- AddForeignKey: customers.price_tier_id -> price_tiers
ALTER TABLE "customers" ADD CONSTRAINT "customers_price_tier_id_fkey"
    FOREIGN KEY ("price_tier_id") REFERENCES "price_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: discount_rules
ALTER TABLE "discount_rules" ADD CONSTRAINT "discount_rules_price_tier_id_fkey"
    FOREIGN KEY ("price_tier_id") REFERENCES "price_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "discount_rules" ADD CONSTRAINT "discount_rules_warehouse_id_fkey"
    FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "discount_rules" ADD CONSTRAINT "discount_rules_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: sales_quotas
ALTER TABLE "sales_quotas" ADD CONSTRAINT "sales_quotas_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_quotas" ADD CONSTRAINT "sales_quotas_price_tier_id_fkey"
    FOREIGN KEY ("price_tier_id") REFERENCES "price_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_quotas" ADD CONSTRAINT "sales_quotas_warehouse_id_fkey"
    FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_quotas" ADD CONSTRAINT "sales_quotas_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: product_prices
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_price_tier_id_fkey"
    FOREIGN KEY ("price_tier_id") REFERENCES "price_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_warehouse_id_fkey"
    FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;