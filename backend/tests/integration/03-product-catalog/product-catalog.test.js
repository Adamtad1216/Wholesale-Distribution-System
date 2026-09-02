import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../../src/app.js';
import prisma from '../../../src/config/prisma.js';
import bcrypt from 'bcryptjs';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'System Administrator';

let adminToken = '';
let testWarehouseId = '';

async function ensureAdmin() {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username: ADMIN_USERNAME },
        { person: { email: ADMIN_EMAIL } },
      ],
    },
    include: {
      person: true,
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'System Administrator' },
  });

  const catalogPerms = [
    'categories:create', 'categories:read', 'categories:update', 'categories:delete',
    'brands:create', 'brands:read', 'brands:update', 'brands:delete',
    'units:create', 'units:read', 'units:update', 'units:delete',
    'products:create', 'products:read', 'products:update', 'products:delete',
    'warehouse-selling-prices:create', 'warehouse-selling-prices:read', 'warehouse-selling-prices:update', 'warehouse-selling-prices:delete',
  ];

  const allPerms = await prisma.$transaction(
    catalogPerms.map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: {
          name,
          module: name.split(':')[0],
          action: name.split(':')[1],
          description: `${name} permission`,
        },
      })
    )
  );

  await prisma.rolePermission.deleteMany({
    where: { roleId: adminRole.id },
  });

  for (const perm of allPerms) {
    await prisma.rolePermission.create({
      data: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  if (existing) {
    const hasAdminRole = existing.userRoles.some((ur) => ur.role.name === 'ADMIN');
    if (!hasAdminRole) {
      await prisma.userRole.create({
        data: { userId: existing.id, roleId: adminRole.id },
      });
    }
    return existing;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const [person, user] = await prisma.$transaction(async (tx) => {
    const p = await tx.person.create({
      data: {
        firstName: ADMIN_FULL_NAME.split(' ')[0] || 'System',
        middleName: ADMIN_FULL_NAME.split(' ')[1] || undefined,
        lastName: ADMIN_FULL_NAME.split(' ').slice(2).join(' ') || 'Administrator',
        email: ADMIN_EMAIL,
        status: 'ACTIVE',
      },
    });

    const u = await tx.user.create({
      data: {
        personId: p.id,
        username: ADMIN_USERNAME,
        passwordHash,
        isActive: true,
      },
    });

    await tx.userRole.create({
      data: {
        userId: u.id,
        roleId: adminRole.id,
      },
    });

    return [p, u];
  });

  return user;
}

async function ensureWarehouse() {
  const existing = await prisma.warehouse.findFirst({
    where: { isArchived: false },
  });
  if (existing) {
    testWarehouseId = existing.id;
    return existing;
  }

  const region = await prisma.region.findFirst() || await prisma.region.create({
    data: { name: 'Addis Ababa', code: 'AA' },
  });

  const company = await prisma.company.findFirst() || await prisma.company.create({
    data: { name: 'Main Co', regionId: region.id },
  });

  const branch = await prisma.branch.findFirst() || await prisma.branch.create({
    data: { name: 'Main Branch', branchCode: 'BR-001', companyId: company.id, regionId: region.id },
  });

  const warehouse = await prisma.warehouse.create({
    data: {
      name: 'Central Warehouse',
      code: 'WH-TEST-001',
      branchId: branch.id,
      regionId: region.id,
    },
  });

  testWarehouseId = warehouse.id;
  return warehouse;
}

async function getAuthToken() {
  if (adminToken) return adminToken;

  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    });

  expect(response.status).toBe(200);
  expect(response.body.status).toBe('success');
  adminToken = response.body.data.accessToken;
  return adminToken;
}

async function cleanupCatalog() {
  await prisma.warehouseSellingPrice.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.priceTier.deleteMany({});
  await prisma.discountRule.deleteMany({});
  await prisma.warehouseStock.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.category.deleteMany({});
}

describe('Product Catalog & Warehouse Selling Prices API (Integration)', () => {
  beforeAll(async () => {
    await ensureAdmin();
    await ensureWarehouse();
    await cleanupCatalog();
    await getAuthToken();
  });

  afterAll(async () => {
    await cleanupCatalog();
    await prisma.$disconnect();
  });

  let parentCategoryId = '';
  let leafCategoryId = '';
  let brandId = '';
  let unitId = '';
  let createdProductId = '';

  describe('Categories CRUD & Leaf Constraints', () => {
    it('should create a parent category with automatic ACTIVE status and null updatedAt', async () => {
      const res = await request(app)
        .post('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Electronics',
          description: 'Electronic products',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.name).toBe('Electronics');
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.createdBy).toBeDefined();
      expect(res.body.data.updatedBy).toBeNull();
      expect(res.body.data.updatedAt).toBeNull();
      parentCategoryId = res.body.data.id;
    });

    it('should create a child leaf category under parent category', async () => {
      const res = await request(app)
        .post('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Wireless Headphones',
          parentId: parentCategoryId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.parentId).toBe(parentCategoryId);
      leafCategoryId = res.body.data.id;
    });
  });

  describe('Brands & Units CRUD', () => {
    it('should create a brand with null updatedAt on creation', async () => {
      const res = await request(app)
        .post('/api/v1/catalog/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sony',
          description: 'Electronics brand',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Sony');
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.updatedAt).toBeNull();
      brandId = res.body.data.id;
    });

    it('should create a unit of measurement', async () => {
      const res = await request(app)
        .post('/api/v1/catalog/units')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Piece',
          abbreviation: 'PCS',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.abbreviation).toBe('PCS');
      unitId = res.body.data.id;
    });
  });

  describe('Product CRUD & Validations', () => {
    it('should fail when creating product under a non-leaf parent category', async () => {
      const res = await request(app)
        .post('/api/v1/catalog/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Parent Product',
          categoryId: parentCategoryId,
          brandId,
          unitId,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('leaf category');
    });

    it('should create product with leaf category, auto SKU, images, and nested warehouse selling price without status in payload', async () => {
      const res = await request(app)
        .post('/api/v1/catalog/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sony WH-1000XM5',
          categoryId: leafCategoryId,
          brandId,
          unitId,
          images: [
            { imageUrl: 'https://example.com/xm5.jpg', isPrimary: true },
          ],
          warehouseSellingPrices: [
            {
              warehouseId: testWarehouseId,
              sellingPrice: 399.99,
              wholesalePrice: 320.0,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.name).toBe('Sony WH-1000XM5');
      expect(res.body.data.sku).toMatch(/^PRD-/);
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.createdBy).toBeDefined();
      expect(res.body.data.updatedBy).toBeNull();
      expect(res.body.data.updatedAt).toBeNull();
      expect(res.body.data.images).toHaveLength(1);
      expect(res.body.data.warehouseSellingPrices).toHaveLength(1);
      expect(Number(res.body.data.warehouseSellingPrices[0].sellingPrice)).toBe(399.99);

      createdProductId = res.body.data.id;
    });

    it('should get product by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/catalog/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdProductId);
      expect(res.body.data.category.id).toBe(leafCategoryId);
      expect(res.body.data.brand.id).toBe(brandId);
      expect(res.body.data.unit.id).toBe(unitId);
    });

    it('should list products and filter by unified ID filters: productId, warehouseId, categoryId, search', async () => {
      const res = await request(app)
        .get(`/api/v1/catalog/products?productId=${createdProductId}&warehouseId=${testWarehouseId}&search=WH-1000XM5`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(createdProductId);
      expect(res.body.meta.total).toBe(1);
    });

    it('should update product details and populate updatedAt and updatedBy', async () => {
      const res = await request(app)
        .patch(`/api/v1/catalog/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sony WH-1000XM5 Premium Edition',
          warehouseSellingPrices: [
            {
              warehouseId: testWarehouseId,
              sellingPrice: 420.0,
              wholesalePrice: 350.0,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Sony WH-1000XM5 Premium Edition');
      expect(res.body.data.updatedBy).toBeDefined();
      expect(res.body.data.updatedAt).toBeDefined();
      expect(Number(res.body.data.warehouseSellingPrices[0].sellingPrice)).toBe(420.0);
    });

    it('should add and remove images on product', async () => {
      const addRes = await request(app)
        .post(`/api/v1/catalog/products/${createdProductId}/images`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          imageUrl: 'https://example.com/xm5-side.jpg',
          isPrimary: false,
        });

      expect(addRes.status).toBe(201);
      const newImageId = addRes.body.data.id;

      const delRes = await request(app)
        .delete(`/api/v1/catalog/products/${createdProductId}/images/${newImageId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(204);
    });
  });

  describe('Warehouse Selling Prices by productId Operations', () => {
    it('should query warehouse selling prices filtered by productId and warehouseId in list endpoint', async () => {
      const res = await request(app)
        .get(`/api/v1/catalog/warehouse-selling-prices?productId=${createdProductId}&warehouseId=${testWarehouseId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].productId).toBe(createdProductId);
      expect(res.body.data[0].warehouseId).toBe(testWarehouseId);
    });

    it('should get warehouse selling price directly by productId param', async () => {
      const res = await request(app)
        .get(`/api/v1/catalog/warehouse-selling-prices/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      const data = Array.isArray(res.body.data) ? res.body.data[0] : res.body.data;
      expect(data.productId).toBe(createdProductId);
    });

    it('should update warehouse selling price by productId param', async () => {
      const res = await request(app)
        .patch(`/api/v1/catalog/warehouse-selling-prices/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          warehouseId: testWarehouseId,
          sellingPrice: 430.0,
          wholesalePrice: 360.0,
        });

      expect(res.status).toBe(200);
      expect(Number(res.body.data.sellingPrice)).toBe(430.0);
      expect(res.body.data.updatedBy).toBeDefined();
    });
  });

  describe('Archive Recreation & Deletion Restrictions', () => {
    it('should restrict category deletion when linked to active products', async () => {
      const res = await request(app)
        .delete(`/api/v1/catalog/categories/${leafCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('associated products');
    });

    it('should restrict brand and unit deletion when linked to active products', async () => {
      const brandRes = await request(app)
        .delete(`/api/v1/catalog/brands/${brandId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(brandRes.status).toBe(400);

      const unitRes = await request(app)
        .delete(`/api/v1/catalog/units/${unitId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(unitRes.status).toBe(400);
    });

    it('should restrict product deletion when linked to warehouse stock with quantity > 0', async () => {
      // Create active stock for this product
      await prisma.warehouseStock.create({
        data: {
          warehouseId: testWarehouseId,
          productId: createdProductId,
          quantity: 25,
          availableQuantity: 25,
        },
      });

      const res = await request(app)
        .delete(`/api/v1/catalog/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('linked to');
    });

    it('should allow product deletion once stock is cleared, and support recreation with same SKU', async () => {
      // Clear stock
      await prisma.warehouseStock.deleteMany({
        where: { productId: createdProductId },
      });

      // Fetch product SKU
      const p = await prisma.product.findUnique({ where: { id: createdProductId } });
      const originalSku = p.sku;

      // Soft delete product
      const delRes = await request(app)
        .delete(`/api/v1/catalog/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(204);

      // Verify product is archived
      const archived = await prisma.product.findUnique({ where: { id: createdProductId } });
      expect(archived.isArchived).toBe(true);

      // Recreate product with the exact same SKU -> must succeed
      const recreateRes = await request(app)
        .post('/api/v1/catalog/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sku: originalSku,
          name: 'Sony WH-1000XM5 Recreated',
          categoryId: leafCategoryId,
          brandId,
          unitId,
        });

      expect(recreateRes.status).toBe(201);
      expect(recreateRes.body.data.sku).toBe(originalSku);
      expect(recreateRes.body.data.name).toBe('Sony WH-1000XM5 Recreated');
      expect(recreateRes.body.data.status).toBe('ACTIVE');
    });
  });
});
