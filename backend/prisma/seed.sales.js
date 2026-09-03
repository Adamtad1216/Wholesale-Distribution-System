import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const REGION_CODE = 'ADD';
const REGION_NAME = 'Addis Ababa';
const COMPANY_NAME = 'Test Wholesale Ltd';
const BRANCH_CODE = 'BR-TEST-001';
const BRANCH_NAME = 'Main Branch';
const WAREHOUSE_CODE = 'WH-TEST-001';
const WAREHOUSE_NAME = 'Central Warehouse';

const PRODUCTS = [
  { sku: 'PROD-TEST-001', name: 'Test Product 1', category: 'Test Category A', brand: 'Test Brand', unit: 'Piece', abbreviation: 'PCS', sellingPrice: 100, wholesalePrice: 80, purchasePrice: 60 },
  { sku: 'PROD-TEST-002', name: 'Test Product 2', category: 'Test Category B', brand: 'Test Brand', unit: 'Box', abbreviation: 'BOX', sellingPrice: 250, wholesalePrice: 200, purchasePrice: 150 },
  { sku: 'PROD-TEST-003', name: 'Test Product 3', category: 'Test Category A', brand: 'Test Brand', unit: 'Piece', abbreviation: 'PCS', sellingPrice: 50, wholesalePrice: 40, purchasePrice: 30 },
  { sku: 'PROD-TEST-004', name: 'Test Product 4', category: 'Test Category C', brand: 'Test Brand', unit: 'Dozen', abbreviation: 'DZN', sellingPrice: 500, wholesalePrice: 400, purchasePrice: 300 },
  { sku: 'PROD-TEST-005', name: 'Test Product 5', category: 'Test Category B', brand: 'Test Brand', unit: 'Box', abbreviation: 'BOX', sellingPrice: 175, wholesalePrice: 140, purchasePrice: 100 },
];

async function main() {
  console.log('Starting sales test data seed...');

  const region = await prisma.region.upsert({
    where: { code: REGION_CODE },
    update: {},
    create: { name: REGION_NAME, code: REGION_CODE, description: 'Capital city of Ethiopia', isActive: true },
  });
  console.log(`Region ready: ${region.name} (${region.id})`);

  const existingCompany = await prisma.company.findFirst({ where: { name: COMPANY_NAME } });
  const company = existingCompany
    ? existingCompany
    : await prisma.company.create({ data: { name: COMPANY_NAME, regionId: region.id, status: 'ACTIVE' } });
  console.log(`Company ready: ${company.name} (${company.id})`);

  const branch = await prisma.branch.upsert({
    where: { branchCode: BRANCH_CODE },
    update: {},
    create: { companyId: company.id, branchCode: BRANCH_CODE, name: BRANCH_NAME, regionId: region.id, status: 'ACTIVE' },
  });
  console.log(`Branch ready: ${branch.name} (${branch.id})`);

  const warehouse = await prisma.warehouse.upsert({
    where: { code: WAREHOUSE_CODE },
    update: {},
    create: { code: WAREHOUSE_CODE, name: WAREHOUSE_NAME, branchId: branch.id, regionId: region.id, status: 'ACTIVE' },
  });
  console.log(`Warehouse ready: ${warehouse.name} (${warehouse.id})`);

  const brand = await prisma.brand.upsert({
    where: { name: 'Test Brand' },
    update: {},
    create: { name: 'Test Brand', description: 'Test brand for sales testing', status: 'ACTIVE' },
  });
  console.log(`Brand ready: ${brand.name} (${brand.id})`);

  const unitCache = new Map();
  for (const p of PRODUCTS) {
    if (!unitCache.has(p.unit)) {
      const existingUnit = await prisma.unit.findFirst({ where: { name: p.unit } });
      const unit = existingUnit
        ? existingUnit
        : await prisma.unit.create({ data: { name: p.unit, abbreviation: p.abbreviation } });
      unitCache.set(p.unit, unit);
      console.log(`Unit ready: ${unit.name} (${unit.id})`);
    }
  }

  const categoryCache = new Map();
  for (const p of PRODUCTS) {
    if (!categoryCache.has(p.category)) {
      const existingCategory = await prisma.category.findFirst({ where: { name: p.category } });
      const category = existingCategory
        ? existingCategory
        : await prisma.category.create({ data: { name: p.category, description: `Category for ${p.category}`, status: 'ACTIVE' } });
      categoryCache.set(p.category, category);
      console.log(`Category ready: ${category.name} (${category.id})`);
    }
  }

  for (const p of PRODUCTS) {
    const unit = unitCache.get(p.unit);
    const category = categoryCache.get(p.category);

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: { sellingPrice: p.sellingPrice, wholesalePrice: p.wholesalePrice, purchasePrice: p.purchasePrice, status: 'ACTIVE', isArchived: false },
      create: {
        sku: p.sku,
        name: p.name,
        categoryId: category.id,
        brandId: brand.id,
        unitId: unit.id,
        sellingPrice: p.sellingPrice,
        wholesalePrice: p.wholesalePrice,
        purchasePrice: p.purchasePrice,
        minimumStockLevel: 10,
        reorderLevel: 5,
        status: 'ACTIVE',
      },
    });
    console.log(`Product ready: ${product.name} (${product.id})`);

    await prisma.warehouseStock.upsert({
      where: { warehouseId_productId: { warehouseId: warehouse.id, productId: product.id } },
      update: { quantity: 100, reservedQuantity: 0, availableQuantity: 100, minimumStock: 10, reorderLevel: 5 },
      create: {
        warehouseId: warehouse.id,
        productId: product.id,
        quantity: 100,
        reservedQuantity: 0,
        availableQuantity: 100,
        minimumStock: 10,
        reorderLevel: 5,
      },
    });
    console.log(`Stock ready: ${product.name} @ ${warehouse.name}`);
  }

  console.log('\nSales test data seed completed successfully.');
  console.log('\nUse these IDs for Swagger testing:');
  console.log(`  Warehouse ID: ${warehouse.id}`);
  console.log(`  Region ID:    ${region.id}`);
  console.log(`  Company ID:   ${company.id}`);
  console.log(`  Branch ID:    ${branch.id}`);
  console.log(`  Brand ID:     ${brand.id}`);
  for (const p of PRODUCTS) {
    const unit = unitCache.get(p.unit);
    const category = categoryCache.get(p.category);
    console.log(`  Product ${p.sku}: ${p.name} | category=${category.id} | unit=${unit.id}`);
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
