import 'dotenv/config';
import request from 'supertest';
import app from './src/app.js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

(async () => {
  const roles = await p.role.findMany();
  console.log('Roles:', roles.map(x => x.name).join(', '));
  
  const admin = await p.user.findFirst({
    where: { username: 'admin' },
    include: { person: true, userRoles: { include: { role: true } } },
  });
  console.log('Admin user:', admin ? { id: admin.id, username: admin.username, roles: admin.userRoles.map(ur => ur.role.name) } : 'NOT FOUND');
  
  const r = await request(app).post('/api/v1/auth/login').send({ username: 'admin', password: 'Admin@123' });
  console.log('Login status:', r.status);
  console.log('Login body:', JSON.stringify(r.body, null, 2));
  
  await p.$disconnect();
  process.exit(0);
})();
