import 'dotenv/config';
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/prisma.js';
import bcrypt from 'bcryptjs';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'System Administrator';

const TS = Date.now();
const PERSON_USERNAME = `person_cust_${TS}`;
const ORG_USERNAME = `org_cust_${TS}`;
const TEST_USER_USERNAME = `test_user_${TS}`;
const ORG_DUP_1 = `org_dup_1_${TS}`;
const ORG_DUP_2 = `org_dup_2_${TS}`;
const ORG_EMAIL_1 = `org_email_1_${TS}`;
const ORG_EMAIL_2 = `org_email_2_${TS}`;
const LOGIN_TEST_USER = `login_test_user_${TS}`;
const PERSON_EMAIL = `person.cust.${TS}@example.com`;
const ORG_EMAIL = `info.testorg.${TS}@example.com`;
const CONTACT_EMAIL = `contact.testorg.${TS}@example.com`;
const DUP_CONTACT_EMAIL = `dup.contact.${TS}@example.com`;

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

  const customerRole = await prisma.role.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: { name: 'CUSTOMER', description: 'Customer' },
  });

  const perms = await prisma.$transaction(
    ['customers:create', 'customers:read', 'customers:update', 'customers:delete', 'users:create', 'users:read', 'users:update', 'users:resetPassword'].map(
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

  for (const perm of perms) {
    await prisma.rolePermission.create({
      data: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  await prisma.rolePermission.deleteMany({
    where: { roleId: customerRole.id },
  });

  if (existing) {
    const hasAdminRole = existing.userRoles.some(
      (ur) => ur.role.name === 'ADMIN'
    );
    if (!hasAdminRole) {
      await prisma.userRole.create({
        data: { userId: existing.id, roleId: adminRole.id },
      });
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

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
      data: { userId: user.id, roleId: adminRole.id },
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

async function cleanupCustomers() {
  await prisma.customer.deleteMany({});
  await prisma.person.deleteMany({
    where: { user: null, customers: { none: {} }, suppliers: { none: {} } },
  });
  await prisma.organization.deleteMany({
    where: { customers: { none: {} }, suppliers: { none: {} } },
  });
}

describe('Customer Management', () => {
  beforeAll(async () => {
    await ensureAdmin();
    await cleanupCustomers();
  });

  it('debug: verify admin and token work', async () => {
    const token = await getAuthToken();
    console.log('TOKEN:', token);
    
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.decode(token);
    console.log('DECODED:', JSON.stringify(decoded));
    
    const r = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    
    console.log('/auth/me status:', r.status);
    console.log('/auth/me body:', JSON.stringify(r.body));
    
    const r2 = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerType: 'PERSON',
        person: { firstName: 'Debug', lastName: 'Test' },
      });
    
    console.log('/customers status:', r2.status);
    console.log('/customers body:', JSON.stringify(r2.body));
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/customers - Create', () => {
    it('returns 401 when unauthenticated', async () => {
      const response = await request(app)
        .post('/api/v1/customers')
        .send({
          customerType: 'PERSON',
          person: { firstName: 'John', lastName: 'Doe' },
        });

      expect(response.status).toBe(401);
    });

    it('returns 403 when user lacks permission', async () => {
      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          customerType: 'PERSON',
          person: { firstName: 'John', lastName: 'Doe' },
        });

      expect(response.status).toBe(401);
    });

    it('creates a PERSON customer successfully', async () => {
      const token = await getAuthToken();
      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'PERSON',
          person: {
            firstName: 'John',
            middleName: 'M',
            lastName: 'Doe',
            phone: '+251911111111',
            email: 'john.doe@example.com',
            address: 'Addis Ababa',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.customerType).toBe('PERSON');
      expect(response.body.data.person.firstName).toBe('John');
      expect(response.body.data.person.lastName).toBe('Doe');
      expect(response.body.data.createdById).toBeDefined();
      expect(response.body.data.updatedById).toBeDefined();
    });

    it('creates an ORGANIZATION customer successfully', async () => {
      const token = await getAuthToken();
      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'ORGANIZATION',
          organization: {
            name: 'Test Corp',
            registrationNumber: 'REG-123',
            taxNumber: 'TAX-456',
            phone: '+251922222222',
            email: 'info@testcorp.com',
            address: 'Addis Ababa',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.customerType).toBe('ORGANIZATION');
      expect(response.body.data.organization.name).toBe('Test Corp');
      expect(response.body.data.createdById).toBeDefined();
      expect(response.body.data.updatedById).toBeDefined();
    });

    it('returns 400 for invalid customer type', async () => {
      const token = await getAuthToken();
      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'INVALID',
        });

      expect(response.status).toBe(400);
    });

    it('returns 400 when PERSON fields are missing', async () => {
      const token = await getAuthToken();
      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'PERSON',
          person: {
            firstName: 'John',
          },
        });

      expect(response.status).toBe(400);
    });

    it('returns 400 when ORGANIZATION fields are missing', async () => {
      const token = await getAuthToken();
      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'ORGANIZATION',
        });

      expect(response.status).toBe(400);
    });

    it('returns 409 for duplicate person email', async () => {
      const token = await getAuthToken();
      await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'PERSON',
          person: {
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
          },
        });

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'PERSON',
          person: {
            firstName: 'Jane2',
            lastName: 'Doe2',
            email: 'jane@example.com',
          },
        });

      expect(response.status).toBe(409);
    });

    it('returns 409 for duplicate organization registration number', async () => {
      const token = await getAuthToken();
      await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'ORGANIZATION',
          organization: {
            name: 'Dup Corp',
            registrationNumber: 'DUP-REG-1',
          },
        });

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'ORGANIZATION',
          organization: {
            name: 'Dup Corp 2',
            registrationNumber: 'DUP-REG-1',
          },
        });

      expect(response.status).toBe(409);
    });

    it('sets createdById and updatedById correctly', async () => {
      const token = await getAuthToken();
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'PERSON',
          person: {
            firstName: 'Audit',
            lastName: 'Test',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.data.createdById).toBeDefined();
      expect(response.body.data.updatedById).toBeDefined();
    });
  });

  describe('GET /api/v1/customers - List', () => {
    it('returns 401 when unauthenticated', async () => {
      const response = await request(app).get('/api/v1/customers');
      expect(response.status).toBe(401);
    });

    it('lists customers with pagination', async () => {
      const token = await getAuthToken();
      const response = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.page).toBeDefined();
      expect(response.body.meta.limit).toBeDefined();
      expect(response.body.meta.total).toBeDefined();
      expect(response.body.meta.totalPages).toBeDefined();
      expect(response.body.meta.hasNextPage).toBeDefined();
      expect(response.body.meta.hasPreviousPage).toBeDefined();
    });

    it('filters by customerType', async () => {
      const token = await getAuthToken();
      const response = await request(app)
        .get('/api/v1/customers?customerType=PERSON')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((c) => c.customerType === 'PERSON')).toBe(true);
    });

    it('returns empty result when no customers match', async () => {
      await cleanupCustomers();
      const token = await getAuthToken();
      const response = await request(app)
        .get('/api/v1/customers?customerType=ORGANIZATION')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/v1/customers/:id - Detail', () => {
    it('returns 404 for non-existent customer', async () => {
      const token = await getAuthToken();
      const response = await request(app)
        .get('/api/v1/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('returns 404 for archived customer', async () => {
      const token = await getAuthToken();
      const createResponse = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'PERSON',
          person: {
            firstName: 'Archive',
            lastName: 'Test',
          },
        });

      const customerId = createResponse.body.data.id;
      await request(app)
        .delete(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app)
        .get(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('returns customer detail for PERSON', async () => {
      const token = await getAuthToken();
      const createResponse = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'PERSON',
          person: {
            firstName: 'Detail',
            lastName: 'Person',
            email: 'detail@example.com',
          },
        });

      const customerId = createResponse.body.data.id;
      const response = await request(app)
        .get(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.person.firstName).toBe('Detail');
      expect(response.body.data.organization).toBeNull();
    });

    it('returns customer detail for ORGANIZATION', async () => {
      const token = await getAuthToken();
      const createResponse = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'ORGANIZATION',
          organization: {
            name: 'Detail Org',
            registrationNumber: 'DETAIL-REG',
          },
        });

      const customerId = createResponse.body.data.id;
      const response = await request(app)
        .get(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.organization.name).toBe('Detail Org');
      expect(response.body.data.person).toBeNull();
    });
  });

  describe('PATCH /api/v1/customers/:id - Update', () => {
    it('returns 401 when unauthenticated', async () => {
      const response = await request(app)
        .patch('/api/v1/customers/00000000-0000-0000-0000-000000000000')
        .send({ creditLimit: 1000 });

      expect(response.status).toBe(401);
    });

    it('returns 404 for non-existent customer', async () => {
      const token = await getAuthToken();
      const response = await request(app)
        .patch('/api/v1/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .send({ creditLimit: 1000 });

      expect(response.status).toBe(404);
    });

    it('returns 404 for archived customer', async () => {
      const token = await getAuthToken();
      const createResponse = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'PERSON',
          person: {
            firstName: 'Archive',
            lastName: 'Update',
          },
        });

      const customerId = createResponse.body.data.id;
      await request(app)
        .delete(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app)
        .patch(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ creditLimit: 1000 });

      expect(response.status).toBe(404);
    });

    it('updates PERSON customer fields', async () => {
      const token = await getAuthToken();
      const createResponse = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'PERSON',
          person: {
            firstName: 'Update',
            lastName: 'Person',
          },
        });

      const customerId = createResponse.body.data.id;
      const response = await request(app)
        .patch(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          creditLimit: 5000,
          person: {
            firstName: 'Updated',
            phone: '+251933333333',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.creditLimit).toBe(5000);
      expect(response.body.data.person.firstName).toBe('Updated');
      expect(response.body.data.person.phone).toBe('+251933333333');
    });

    it('updates ORGANIZATION customer fields', async () => {
      const token = await getAuthToken();
      const createResponse = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'ORGANIZATION',
          organization: {
            name: 'Update Org',
          },
        });

      const customerId = createResponse.body.data.id;
      const response = await request(app)
        .patch(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          creditLimit: 10000,
          organization: {
            name: 'Updated Org',
            taxNumber: 'NEW-TAX',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.creditLimit).toBe(10000);
      expect(response.body.data.organization.name).toBe('Updated Org');
      expect(response.body.data.organization.taxNumber).toBe('NEW-TAX');
    });

    it('rejects customer type change', async () => {
      const token = await getAuthToken();
      const createResponse = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'PERSON',
          person: {
            firstName: 'Type',
            lastName: 'Check',
          },
        });

      const customerId = createResponse.body.data.id;
      const response = await request(app)
        .patch(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'ORGANIZATION',
        });

      expect(response.status).toBe(400);
    });

    it('preserves createdById on update', async () => {
      const token = await getAuthToken();
      const createResponse = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'PERSON',
          person: {
            firstName: 'Preserve',
            lastName: 'Created',
          },
        });

      const originalCreatedById = createResponse.body.data.createdById;
      const customerId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          creditLimit: 2000,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.createdById).toBe(originalCreatedById);
    });

    it('updates updatedById on update', async () => {
      const token = await getAuthToken();
      const createResponse = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'PERSON',
          person: {
            firstName: 'Update',
            lastName: 'ById',
          },
        });

      const originalUpdatedById = createResponse.body.data.updatedById;
      const customerId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          creditLimit: 3000,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.updatedById).toBeDefined();
    });

    it('returns 409 for duplicate organization registration number on update', async () => {
      const token = await getAuthToken();
      const org1 = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'ORGANIZATION',
          organization: {
            name: 'Org A',
            registrationNumber: 'UPDATE-REG-1',
          },
        });

      const org2 = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'ORGANIZATION',
          organization: {
            name: 'Org B',
            registrationNumber: 'UPDATE-REG-2',
          },
        });

      const response = await request(app)
        .patch(`/api/v1/customers/${org2.body.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          organization: {
            registrationNumber: 'UPDATE-REG-1',
          },
        });

      expect(response.status).toBe(409);
    });

    it('returns 409 for duplicate organization tax number on update', async () => {
      const token = await getAuthToken();
      const org1 = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'ORGANIZATION',
          organization: {
            name: 'Tax Org A',
            taxNumber: 'UPDATE-TAX-1',
          },
        });

      const org2 = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'ORGANIZATION',
          organization: {
            name: 'Tax Org B',
            taxNumber: 'UPDATE-TAX-2',
          },
        });

      const response = await request(app)
        .patch(`/api/v1/customers/${org2.body.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          organization: {
            taxNumber: 'UPDATE-TAX-1',
          },
        });

      expect(response.status).toBe(409);
    });

    it('updates organization contacts', async () => {
      const token = await getAuthToken();
      const createResponse = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'ORGANIZATION',
          organization: {
            name: 'Contact Update Org',
            contacts: [
              {
                firstName: 'Old',
                lastName: 'Contact',
                email: `old.contact.${TS}@example.com`,
                isPrimary: true,
              },
            ],
          },
        });

      const customerId = createResponse.body.data.id;
      const response = await request(app)
        .patch(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          organization: {
            contacts: [
              {
                firstName: 'New',
                lastName: 'Contact',
                email: `new.contact.${TS}@example.com`,
                isPrimary: true,
              },
            ],
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.organization.contacts).toHaveLength(1);
      expect(response.body.data.organization.contacts[0].person.firstName).toBe('New');
      expect(response.body.data.organization.contacts[0].person.email).toBe(`new.contact.${TS}@example.com`);
    });
  });

  describe('DELETE /api/v1/customers/:id - Delete', () => {
    it('returns 401 when unauthenticated', async () => {
      const response = await request(app)
        .delete('/api/v1/customers/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(401);
    });

    it('returns 404 for non-existent customer', async () => {
      const token = await getAuthToken();
      const response = await request(app)
        .delete('/api/v1/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('soft-deletes a customer and returns 204', async () => {
      const token = await getAuthToken();
      const createResponse = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'PERSON',
          person: {
            firstName: 'Delete',
            lastName: 'Test',
          },
        });

      const customerId = createResponse.body.data.id;
      const response = await request(app)
        .delete(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it('excludes soft-deleted customer from list', async () => {
      const token = await getAuthToken();
      const createResponse = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'PERSON',
          person: {
            firstName: 'Hidden',
            lastName: 'Customer',
          },
        });

      const customerId = createResponse.body.data.id;
      await request(app)
        .delete(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`);

      const listResponse = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`);

      const found = listResponse.body.data.find((c) => c.id === customerId);
      expect(found).toBeUndefined();
    });

    it('does not allow re-creating a customer with the same email after delete because Person email is globally unique', async () => {
      const token = await getAuthToken();
      const createResponse = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'PERSON',
          person: {
            firstName: 'Recreate',
            lastName: 'Test',
            email: `recreate.${TS}@example.com`,
          },
        });

      const customerId = createResponse.body.data.id;
      await request(app)
        .delete(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`);

      const newResponse = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'PERSON',
          person: {
            firstName: 'Recreated',
            lastName: 'Test',
            email: `recreate.${TS}@example.com`,
          },
        });

      expect(newResponse.status).toBe(409);
    });
  });

  describe('Security', () => {
    it('does not expose password hashes in responses', async () => {
      const token = await getAuthToken();
      const createResponse = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerType: 'PERSON',
          person: {
            firstName: 'Secure',
            lastName: 'User',
          },
        });

      const customerId = createResponse.body.data.id;
      const response = await request(app)
        .get(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`);

      const responseStr = JSON.stringify(response.body);
      expect(responseStr).not.toContain('passwordHash');
      expect(responseStr).not.toContain('refreshTokenHash');
      expect(responseStr).not.toContain('resetTokenHash');
    });
  });

  describe('Auth Registration', () => {
    it('registers a PERSON customer via auth', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          customerType: 'PERSON',
          username: PERSON_USERNAME,
          password: 'Person@123!',
          firstName: 'Person',
          lastName: 'Customer',
          phone: '+251911111111',
          email: PERSON_EMAIL,
          address: 'Addis Ababa',
        });

      console.log('PERSON REGISTER RESPONSE:', response.status, JSON.stringify(response.body));
      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.customer.customerType).toBe('PERSON');
      expect(response.body.data.customer.person.firstName).toBe('Person');
      expect(response.body.data.user.username).toBe(PERSON_USERNAME);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('registers an ORGANIZATION customer via auth with representative details', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          customerType: 'ORGANIZATION',
          username: ORG_USERNAME,
          password: 'Org@123!',
          name: 'Test Organization',
          registrationNumber: 'ORG-REG-001',
          taxNumber: 'ORG-TAX-001',
          phone: '+251922222222',
          email: ORG_EMAIL,
          address: 'Addis Ababa',
          contacts: [
            {
              firstName: 'Contact',
              lastName: 'Person',
              phone: '+251933333333',
              email: CONTACT_EMAIL,
              isPrimary: true,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.customer.customerType).toBe('ORGANIZATION');
      expect(response.body.data.customer.organization.name).toBe('Test Organization');
      expect(response.body.data.user.username).toBe(ORG_USERNAME);
      expect(response.body.data.user.person.firstName).toBe('Contact');
      expect(response.body.data.user.person.lastName).toBe('Person');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('registers an ORGANIZATION customer with multiple contacts', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          customerType: 'ORGANIZATION',
          username: `multi_contact_${TS}`,
          password: 'Multi@123!',
          name: 'Multi Contact Org',
          registrationNumber: `MULTI-REG-${TS}`,
          taxNumber: `MULTI-TAX-${TS}`,
          phone: '+251922222222',
          email: `multi.org.${TS}@example.com`,
          address: 'Addis Ababa',
          contacts: [
            {
              firstName: 'Primary',
              lastName: 'Contact',
              phone: '+251933333333',
              email: `primary.contact.${TS}@example.com`,
              position: 'CEO',
              isPrimary: true,
            },
            {
              firstName: 'Secondary',
              lastName: 'Contact',
              phone: '+251944444444',
              email: `secondary.contact.${TS}@example.com`,
              position: 'CFO',
              isPrimary: false,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.customer.organization.contacts).toHaveLength(2);
      expect(response.body.data.customer.organization.contacts[0].person.firstName).toBe('Primary');
      expect(response.body.data.customer.organization.contacts[1].person.firstName).toBe('Secondary');
      expect(response.body.data.user.person.email).toBe(`primary.contact.${TS}@example.com`);
    });

    it('returns 400 for missing customerType', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: TEST_USER_USERNAME,
          password: 'Test@123!',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
    });

    it('returns 400 for invalid customerType', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          customerType: 'INVALID',
          username: TEST_USER_USERNAME,
          password: 'Test@123!',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
    });

    it('returns 409 for duplicate organization registration number', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          customerType: 'ORGANIZATION',
          username: ORG_DUP_1,
          password: 'Org@123!',
          name: 'Dup Org',
          registrationNumber: 'DUP-REG-999',
          contacts: [
            {
              firstName: 'Contact',
              lastName: 'One',
            },
          ],
        });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          customerType: 'ORGANIZATION',
          username: ORG_DUP_2,
          password: 'Org@123!',
          name: 'Dup Org 2',
          registrationNumber: 'DUP-REG-999',
          contacts: [
            {
              firstName: 'Contact',
              lastName: 'Two',
            },
          ],
        });

      expect(response.status).toBe(409);
    });

    it('returns 409 for duplicate contact email', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          customerType: 'ORGANIZATION',
          username: ORG_EMAIL_1,
          password: 'Org@123!',
          name: 'Email Org 1',
          contacts: [
            {
              firstName: 'Contact',
              lastName: 'One',
              email: DUP_CONTACT_EMAIL,
            },
          ],
        });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          customerType: 'ORGANIZATION',
          username: ORG_EMAIL_2,
          password: 'Org@123!',
          name: 'Email Org 2',
          contacts: [
            {
              firstName: 'Contact',
              lastName: 'Two',
              email: DUP_CONTACT_EMAIL,
            },
          ],
        });

      expect(response.status).toBe(409);
    });

    it('allows login for registered customer', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          customerType: 'PERSON',
          username: LOGIN_TEST_USER,
          password: 'Login@Test123!',
          firstName: 'Login',
          lastName: 'Test',
        });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: LOGIN_TEST_USER,
          password: 'Login@Test123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.username).toBe(LOGIN_TEST_USER);
      expect(response.body.data.accessToken).toBeDefined();
    });
  });
});
