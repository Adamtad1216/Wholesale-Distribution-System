import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

(async () => {
  const roles = await p.role.findMany();
  console.log('Roles before:', roles.map(x => x.name).join(', '));
  
  const customerRole = await p.role.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: { name: 'CUSTOMER', description: 'Customer' },
  });
  console.log('CUSTOMER role:', customerRole.name, customerRole.id);
  
  const rolesAfter = await p.role.findMany();
  console.log('Roles after:', rolesAfter.map(x => x.name).join(', '));
  
  await p.$disconnect();
})();
