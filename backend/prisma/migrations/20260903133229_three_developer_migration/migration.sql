-- CreateEnum
CREATE TYPE "TransferReason" AS ENUM ('REBALANCING', 'RESTOCKING', 'DAMAGED_GOODS', 'STORE_REQUEST', 'SEASONAL_ALLOCATION', 'EXCESS_STOCK', 'OTHER');

-- CreateTable
CREATE TABLE "warehouse_stock_transfers" (
    "id" UUID NOT NULL,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "from_warehouse_id" UUID NOT NULL,
    "to_warehouse_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "transfer_reason" "TransferReason" NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "remark" TEXT,

    CONSTRAINT "warehouse_stock_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_selling_prices" (
    "id" UUID NOT NULL,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "product_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "selling_price" DECIMAL(15,2) NOT NULL,
    "wholesale_price" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "warehouse_selling_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "warehouse_stock_transfers_from_warehouse_id_idx" ON "warehouse_stock_transfers"("from_warehouse_id");

-- CreateIndex
CREATE INDEX "warehouse_stock_transfers_to_warehouse_id_idx" ON "warehouse_stock_transfers"("to_warehouse_id");

-- CreateIndex
CREATE INDEX "warehouse_stock_transfers_product_id_idx" ON "warehouse_stock_transfers"("product_id");

-- CreateIndex
CREATE INDEX "warehouse_selling_prices_product_id_warehouse_id_status_idx" ON "warehouse_selling_prices"("product_id", "warehouse_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_selling_prices_product_id_warehouse_id_key" ON "warehouse_selling_prices"("product_id", "warehouse_id");

-- AddForeignKey
ALTER TABLE "warehouse_stock_transfers" ADD CONSTRAINT "warehouse_stock_transfers_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_stock_transfers" ADD CONSTRAINT "warehouse_stock_transfers_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_stock_transfers" ADD CONSTRAINT "warehouse_stock_transfers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_stock_transfers" ADD CONSTRAINT "warehouse_stock_transfers_from_warehouse_id_fkey" FOREIGN KEY ("from_warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_stock_transfers" ADD CONSTRAINT "warehouse_stock_transfers_to_warehouse_id_fkey" FOREIGN KEY ("to_warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_selling_prices" ADD CONSTRAINT "warehouse_selling_prices_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_selling_prices" ADD CONSTRAINT "warehouse_selling_prices_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_selling_prices" ADD CONSTRAINT "warehouse_selling_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_selling_prices" ADD CONSTRAINT "warehouse_selling_prices_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
