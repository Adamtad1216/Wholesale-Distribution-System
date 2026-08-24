import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });
p.role.findMany()
  .then(r => console.log('Roles:', r.map(x => x.name).join(', ')))
  .finally(() => p.$disconnect());
