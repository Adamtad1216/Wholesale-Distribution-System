import 'dotenv/config';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/prisma.js';
import bcrypt from 'bcryptjs';

// Mock Cloudinary
vi.mock('../../src/config/cloudinary.js', () => {
  return {
    default: {
      config: () => ({ cloud_name: 'test_cloud' }),
      uploader: {
        upload_stream: (options, callback) => {
          return {
            end: (buffer) => {
              setTimeout(() => {
                callback(null, {
                  secure_url: 'https://res.cloudinary.com/test_cloud/image/upload/v12345/test.png',
                  public_id: 'wholesale_docs/test_public_id',
                });
              }, 10);
            },
          };
        },
      },
    },
  };
});

describe('Document Upload API', () => {
  let adminToken;

  beforeAll(async () => {
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'Admin@123';
    
    let adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    if (!adminRole) {
      adminRole = await prisma.role.create({ data: { name: 'ADMIN', description: 'Admin' } });
    }
    
    const existing = await prisma.user.findUnique({
      where: { username: ADMIN_USERNAME },
    });
    
    if (!existing) {
      const person = await prisma.person.create({
        data: {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@wholesale.com',
          status: 'ACTIVE',
        },
      });
      
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      const user = await prisma.user.create({
        data: {
          personId: person.id,
          username: ADMIN_USERNAME,
          passwordHash,
          isActive: true,
          accountStatus: 'ACTIVE',
        },
      });
      
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });
    } else {
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, isActive: true, failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
      });

    adminToken = response.body.data.accessToken;
  });

  it('uploads a file successfully and returns Cloudinary response details', async () => {
    const fileBuffer = Buffer.from('test file content');

    const response = await request(app)
      .post('/api/v1/documents/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', fileBuffer, 'test.png');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      fileUrl: 'https://res.cloudinary.com/test_cloud/image/upload/v12345/test.png',
      fileName: 'test.png',
      fileType: 'image/png',
      fileSize: expect.any(Number),
      publicId: 'wholesale_docs/test_public_id',
    });
  });

  it('returns 400 if no file is provided', async () => {
    const response = await request(app)
      .post('/api/v1/documents/upload')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
