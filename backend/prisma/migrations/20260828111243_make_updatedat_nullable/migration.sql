-- AlterTable
ALTER TABLE "brands" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "product_images" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "units" ALTER COLUMN "updated_at" DROP NOT NULL;
