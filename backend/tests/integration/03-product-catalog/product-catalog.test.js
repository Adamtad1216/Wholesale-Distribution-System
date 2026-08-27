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

async function ensureAdmin() {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username: ADMIN_USERNAME },
        { person: { email: ADMIN_EMAIL } },
      ],
    },
    include: { person: true, userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } },
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
  ];

  const allPerms = await prisma.$transaction(
    catalogPerms.map(
      (name) =>
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
    const hasAdminRole = existing.userRoles.some(
      (ur) => ur.role.name === 'ADMIN'
    );
    if (!hasAdminRole) {
      await prisma.userRole.create({
        data: { userId: existing.id, roleId: adminRole.id },
      });
    }
    return existing;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const [person, user] = await prisma.$transaction(async (tx) => {
    const person = await tx.person.create({
      data: {
        firstName: ADMIN_FULL_NAME.split(' ')[0] || 'System',
        middleName: ADMIN_FULL_NAME.split(' ')[1] || undefined,
        lastName: ADMIN_FULL_NAME.split(' ').slice(2).join(' ') || 'Administrator',
        email: ADMIN_EMAIL,
        status: 'ACTIVE',
      },
    });

    const user = await tx.user.create({
      data: {
        personId: person.id,
        username: ADMIN_USERNAME,
        passwordHash,
        isActive: true,
      },
    });

    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });

    return [person, user];
  });

  return user;
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
  await prisma.productImage.deleteMany({});
  await prisma.priceTier.deleteMany({});
  await prisma.discountRule.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.category.deleteMany({});
}

describe('Product Catalog API', () => {
  beforeAll(async () => {
    await ensureAdmin();
    await cleanupCatalog();
  });

  afterAll(async () => {
    await cleanupCatalog();
    await prisma.$disconnect();
  });

  describe('Categories', () => {
    it('should create a category', async () => {
      const token = await getAuthToken();
      const res = await request(app)
        .post('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Electronics',
          description: 'Electronic products',
          status: 'ACTIVE',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.name).toBe('Electronics');
    });

    it('should list categories', async () => {
      const token = await getAuthToken();
      const res = await request(app)
        .get('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it('should get category by id', async () => {
      const token = await getAuthToken();
      const createRes = await request(app)
        .post('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Clothing', status: 'ACTIVE' });

      const id = createRes.body.data.id;
      const res = await request(app)
        .get(`/api/v1/catalog/categories/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Clothing');
    });

    it('should update category', async () => {
      const token = await getAuthToken();
      const createRes = await request(app)
        .post('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Food', status: 'ACTIVE' });

      const id = createRes.body.data.id;
      const res = await request(app)
        .patch(`/api/v1/catalog/categories/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Food & Beverages', description: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Food & Beverages');
    });

    it('should delete category', async () => {
      const token = await getAuthToken();
      const createRes = await request(app)
        .post('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'ToDelete', status: 'ACTIVE' });

      const id = createRes.body.data.id;
      const res = await request(app)
        .delete(`/api/v1/catalog/categories/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);
    });
  });

  describe('Brands', () => {
    it('should create a brand', async () => {
      const token = await getAuthToken();
      const res = await request(app)
        .post('/api/v1/catalog/brands')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Samsung',
          description: 'Electronics brand',
          status: 'ACTIVE',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.name).toBe('Samsung');
    });

    it('should list brands', async () => {
      const token = await getAuthToken();
      const res = await request(app)
        .get('/api/v1/catalog/brands')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Units', () => {
    it('should create a unit', async () => {
      const token = await getAuthToken();
      const res = await request(app)
        .post('/api/v1/catalog/units')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Piece',
          abbreviation: 'PCS',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.name).toBe('Piece');
      expect(res.body.data.abbreviation).toBe('PCS');
    });

    it('should list units', async () => {
      const token = await getAuthToken();
      const res = await request(app)
        .get('/api/v1/catalog/units')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Products', () => {
    it('should create a product with relations', async () => {
      const token = await getAuthToken();

      const categoryRes = await request(app)
        .post('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Category', status: 'ACTIVE' });

      const brandRes = await request(app)
        .post('/api/v1/catalog/brands')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Brand', status: 'ACTIVE' });

      const unitRes = await request(app)
        .post('/api/v1/catalog/units')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Unit', abbreviation: 'TU' });

      const res = await request(app)
        .post('/api/v1/catalog/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sku: 'TEST-001',
          name: 'Test Product',
          categoryId: categoryRes.body.data.id,
          brandId: brandRes.body.data.id,
          unitId: unitRes.body.data.id,
          purchasePrice: 100,
          sellingPrice: 150,
          wholesalePrice: 120,
          minimumStockLevel: 10,
          reorderLevel: 5,
          status: 'ACTIVE',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.name).toBe('Test Product');
      expect(res.body.data.sku).toBe('TEST-001');
    });

    it('should list products with pagination', async () => {
      const token = await getAuthToken();
      const res = await request(app)
        .get('/api/v1/catalog/products?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.page).toBe(1);
    });

    it('should search products', async () => {
      const token = await getAuthToken();
      const res = await request(app)
        .get('/api/v1/catalog/products?search=Test')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });

    it('should add image to product', async () => {
      const token = await getAuthToken();

      const categoryRes = await request(app)
        .post('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'ImgCat', status: 'ACTIVE' });

      const brandRes = await request(app)
        .post('/api/v1/catalog/brands')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'ImgBrand', status: 'ACTIVE' });

      const unitRes = await request(app)
        .post('/api/v1/catalog/units')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'ImgUnit', abbreviation: 'IU' });

      const productRes = await request(app)
        .post('/api/v1/catalog/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sku: 'IMG-001',
          name: 'Image Product',
          categoryId: categoryRes.body.data.id,
          brandId: brandRes.body.data.id,
          unitId: unitRes.body.data.id,
          purchasePrice: 50,
          sellingPrice: 80,
          wholesalePrice: 60,
          status: 'ACTIVE',
        });

      const productId = productRes.body.data.id;
      const res = await request(app)
        .post(`/api/v1/catalog/products/${productId}/images`)
        .set('Authorization', `Bearer ${token}`)
        .send({ imageUrl: 'https://example.com/image.jpg', isPrimary: true });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.imageUrl).toBe('https://example.com/image.jpg');
    });

    it('should add price tier to product', async () => {
      const token = await getAuthToken();

      const categoryRes = await request(app)
        .post('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'TierCat', status: 'ACTIVE' });

      const brandRes = await request(app)
        .post('/api/v1/catalog/brands')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'TierBrand', status: 'ACTIVE' });

      const unitRes = await request(app)
        .post('/api/v1/catalog/units')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'TierUnit', abbreviation: 'TNU' });

      const productRes = await request(app)
        .post('/api/v1/catalog/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sku: 'TIER-001',
          name: 'Tier Product',
          categoryId: categoryRes.body.data.id,
          brandId: brandRes.body.data.id,
          unitId: unitRes.body.data.id,
          purchasePrice: 50,
          sellingPrice: 80,
          wholesalePrice: 60,
          status: 'ACTIVE',
        });

      const productId = productRes.body.data.id;
      const res = await request(app)
        .post(`/api/v1/catalog/products/${productId}/price-tiers`)
        .set('Authorization', `Bearer ${token}`)
        .send({ minQuantity: 10, maxQuantity: 100, unitPrice: 70 });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
    });

    it('should add discount rule to product', async () => {
      const token = await getAuthToken();

      const categoryRes = await request(app)
        .post('/api/v1/catalog/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'DiscCat', status: 'ACTIVE' });

      const brandRes = await request(app)
        .post('/api/v1/catalog/brands')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'DiscBrand', status: 'ACTIVE' });

      const unitRes = await request(app)
        .post('/api/v1/catalog/units')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'DiscUnit', abbreviation: 'DU' });

      const productRes = await request(app)
        .post('/api/v1/catalog/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sku: 'DISC-001',
          name: 'Discount Product',
          categoryId: categoryRes.body.data.id,
          brandId: brandRes.body.data.id,
          unitId: unitRes.body.data.id,
          purchasePrice: 50,
          sellingPrice: 80,
          wholesalePrice: 60,
          status: 'ACTIVE',
        });

      const productId = productRes.body.data.id;
      const res = await request(app)
        .post(`/api/v1/catalog/products/${productId}/discount-rules`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Summer Sale',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          minQuantity: 5,
          maxQuantity: 50,
          status: 'ACTIVE',
        })
        .expect(201);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.discountType).toBe('PERCENTAGE');
    });
  });
});
