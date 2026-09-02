-- DropForeignKey
ALTER TABLE "deliveries" DROP CONSTRAINT "deliveries_vehicle_id_fkey";

-- AlterTable
ALTER TABLE "deliveries" ALTER COLUMN "vehicle_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "persons" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "bio" TEXT;

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_quotas" ADD CONSTRAINT "sales_quotas_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
