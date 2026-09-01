-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN     "delivery_address_text" TEXT,
ADD COLUMN     "delivery_latitude" DECIMAL(10,7),
ADD COLUMN     "delivery_longitude" DECIMAL(10,7);

-- CreateTable
CREATE TABLE "preparation_tasks" (
    "id" UUID NOT NULL,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "sales_order_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "store_keeper_id" UUID NOT NULL,
    "scheduled_by" UUID NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "preparation_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preparation_task_items" (
    "id" UUID NOT NULL,
    "preparation_task_id" UUID NOT NULL,
    "sales_order_item_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "prepared_quantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "preparation_task_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "preparation_tasks_sales_order_id_idx" ON "preparation_tasks"("sales_order_id");

-- CreateIndex
CREATE INDEX "preparation_tasks_warehouse_id_idx" ON "preparation_tasks"("warehouse_id");

-- CreateIndex
CREATE INDEX "preparation_tasks_store_keeper_id_idx" ON "preparation_tasks"("store_keeper_id");

-- CreateIndex
CREATE INDEX "preparation_task_items_preparation_task_id_idx" ON "preparation_task_items"("preparation_task_id");

-- AddForeignKey
ALTER TABLE "preparation_tasks" ADD CONSTRAINT "preparation_tasks_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_tasks" ADD CONSTRAINT "preparation_tasks_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_tasks" ADD CONSTRAINT "preparation_tasks_store_keeper_id_fkey" FOREIGN KEY ("store_keeper_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_tasks" ADD CONSTRAINT "preparation_tasks_scheduled_by_fkey" FOREIGN KEY ("scheduled_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_task_items" ADD CONSTRAINT "preparation_task_items_preparation_task_id_fkey" FOREIGN KEY ("preparation_task_id") REFERENCES "preparation_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_task_items" ADD CONSTRAINT "preparation_task_items_sales_order_item_id_fkey" FOREIGN KEY ("sales_order_item_id") REFERENCES "sales_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_task_items" ADD CONSTRAINT "preparation_task_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
