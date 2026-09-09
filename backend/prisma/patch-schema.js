import 'dotenv/config';
import prisma from '../src/config/prisma.js';

async function main() {
  console.log('Patching schema for missing columns...');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "discount_rules" ADD COLUMN IF NOT EXISTS "category_id" UUID;
    CREATE INDEX IF NOT EXISTS "discount_rules_category_id_status_idx" ON "discount_rules"("category_id", "status");
    
    ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "make" TEXT;
    ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "model" TEXT;
    ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "year" INTEGER;
    ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "notes" TEXT;
    ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "assigned_driver_id" UUID;
  `);

  console.log('✓ Successfully ensured discount_rules.category_id and vehicle columns exist.');
  const rules = await prisma.discountRule.findMany();
  console.log(`✓ prisma.discountRule.findMany() succeeded. Total rows: ${rules.length}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Failed to patch schema:', e);
  await prisma.$disconnect();
  process.exit(1);
});
