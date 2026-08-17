import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'System Administrator';

const ALL_PERMISSIONS = [
  { name: 'customers:create', module: 'customers', action: 'create', description: 'Create customers' },
  { name: 'customers:read', module: 'customers', action: 'read', description: 'Read customers' },
  { name: 'customers:update', module: 'customers', action: 'update', description: 'Update customers' },
  { name: 'customers:delete', module: 'customers', action: 'delete', description: 'Delete customers' },
  { name: 'users:create', module: 'users', action: 'create', description: 'Create users' },
  { name: 'users:read', module: 'users', action: 'read', description: 'Read users' },
  { name: 'users:update', module: 'users', action: 'update', description: 'Update users' },
  { name: 'users:resetPassword', module: 'users', action: 'resetPassword', description: 'Reset user passwords' },
];

async function main() {
  console.log('Starting seed...');

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username: ADMIN_USERNAME },
        { person: { email: ADMIN_EMAIL } },
      ],
    },
    include: { person: true },
  });

  if (existingUser) {
    console.log(`Admin user already exists: ${existingUser.username} (${existingUser.id})`);
    await ensureAdminPermissions(existingUser.id);
    console.log('Seed completed (idempotent).');
    return;
  }

  const [adminRole] = await prisma.$transaction(async (tx) => {
    const role = await tx.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        description: 'System Administrator',
      },
    });

    const createdPermissions = [];
    for (const perm of ALL_PERMISSIONS) {
      const p = await tx.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm,
      });
      createdPermissions.push(p);
    }

    await tx.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    for (const perm of createdPermissions) {
      await tx.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: perm.id,
        },
      });
    }

    const customerRole = await tx.role.upsert({
      where: { name: 'CUSTOMER' },
      update: {},
      create: {
        name: 'CUSTOMER',
        description: 'Customer',
      },
    });

    await tx.rolePermission.deleteMany({
      where: { roleId: customerRole.id },
    });

    return [role, createdPermissions];
  });

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

  console.log(`Admin user created: ${user.username} (${user.id})`);
  console.log(`Admin person created: ${person.firstName} ${person.lastName} (${person.id})`);
  console.log('Seed completed successfully.');
}

async function ensureAdminPermissions(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: true } } },
  });

  if (!user) return;

  const hasAdminRole = user.userRoles.some((ur) => ur.role.name === 'ADMIN');
  if (!hasAdminRole) {
    const adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' },
    });

    if (adminRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });
      console.log(`Assigned ADMIN role to existing user: ${user.username}`);
    }
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
