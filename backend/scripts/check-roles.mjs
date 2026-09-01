import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
  console.log('Roles:', roles.map(r => r.name));

  const salesRepRole = await prisma.role.findUnique({ where: { name: 'SALES_REPRESENTATIVE' } });
  console.log('SALES_REPRESENTATIVE role:', salesRepRole ? `exists (${salesRepRole.id})` : 'NOT FOUND');

  const jobSpec = await prisma.jobSpecification.findFirst({ where: { code: 'SALES-REP' } });
  console.log('SALES-REP job spec:', jobSpec ? `exists (${jobSpec.id})` : 'NOT FOUND');

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
