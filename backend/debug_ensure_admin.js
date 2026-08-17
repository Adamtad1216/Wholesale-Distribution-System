import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'System Administrator';

async function ensureAdmin() {
  console.log('Starting ensureAdmin...');
  
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username: ADMIN_USERNAME },
        { person: { email: ADMIN_EMAIL } },
      ],
    },
    include: { person: true, userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } },
  });

  console.log('Existing admin:', existing ? { id: existing.id, username: existing.username, hasAdminRole: existing.userRoles.some(ur => ur.role.name === 'ADMIN') } : 'NOT FOUND');

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'System Administrator' },
  });
  console.log('ADMIN role:', adminRole.id);

  const customerRole = await prisma.role.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: { name: 'CUSTOMER', description: 'Customer' },
  });
  console.log('CUSTOMER role:', customerRole.id);

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
  console.log('Permissions created:', perms.length);

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

    console.log('Returning existing admin');
    return existing;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  console.log('Password hash created');

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

  console.log('Created new admin user');
  return user;
}

(async () => {
  try {
    await ensureAdmin();
    
    const roles = await prisma.role.findMany();
    console.log('Roles after ensureAdmin:', roles.map(x => x.name).join(', '));
    
    const customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
    console.log('CUSTOMER role exists:', !!customerRole);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
