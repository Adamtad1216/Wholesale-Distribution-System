-- CreateTable
CREATE TABLE "supplier_payout_channels" (
    "id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "channel_type" TEXT NOT NULL DEFAULT 'BANK',
    "bank_name" TEXT,
    "account_number" TEXT NOT NULL,
    "account_name" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_payout_channels_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "supplier_payout_channels" ADD CONSTRAINT "supplier_payout_channels_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
