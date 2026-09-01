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

const MATI_USERNAME = process.env.MATI_USERNAME || 'mati';
const MATI_EMAIL = process.env.MATI_EMAIL || 'mati@example.com';
const MATI_PASSWORD = process.env.MATI_PASSWORD || 'Admin@123';
const MATI_FULL_NAME = process.env.MATI_FULL_NAME || 'Mati Super Admin';

const ALL_PERMISSIONS = [
  // Wildcard Permission — Unrestricted System Access
  { name: '*', module: 'system', action: 'all', description: 'Wildcard super admin access to all modules' },

  // Customers
  { name: 'customers:create', module: 'customers', action: 'create', description: 'Create customers' },
  { name: 'customers:read', module: 'customers', action: 'read', description: 'Read customers' },
  { name: 'customers:update', module: 'customers', action: 'update', description: 'Update customers' },
  { name: 'customers:delete', module: 'customers', action: 'delete', description: 'Delete customers' },

  // Organizational Structure
  { name: 'companies:create', module: 'companies', action: 'create', description: 'Create companies' },
  { name: 'companies:read', module: 'companies', action: 'read', description: 'Read companies' },
  { name: 'companies:update', module: 'companies', action: 'update', description: 'Update companies' },
  { name: 'companies:delete', module: 'companies', action: 'delete', description: 'Delete companies' },

  { name: 'branches:create', module: 'branches', action: 'create', description: 'Create branches' },
  { name: 'branches:read', module: 'branches', action: 'read', description: 'Read branches' },
  { name: 'branches:update', module: 'branches', action: 'update', description: 'Update branches' },
  { name: 'branches:delete', module: 'branches', action: 'delete', description: 'Delete branches' },

  { name: 'warehouses:create', module: 'warehouses', action: 'create', description: 'Create warehouses' },
  { name: 'warehouses:read', module: 'warehouses', action: 'read', description: 'Read warehouses' },
  { name: 'warehouses:update', module: 'warehouses', action: 'update', description: 'Update warehouses' },
  { name: 'warehouses:delete', module: 'warehouses', action: 'delete', description: 'Delete warehouses' },

  { name: 'regions:create', module: 'regions', action: 'create', description: 'Create regions' },
  { name: 'regions:read', module: 'regions', action: 'read', description: 'Read regions' },
  { name: 'regions:update', module: 'regions', action: 'update', description: 'Update regions' },
  { name: 'regions:delete', module: 'regions', action: 'delete', description: 'Delete regions' },

  // Identity & Access
  { name: 'jobSpecifications:create', module: 'jobSpecifications', action: 'create', description: 'Create job specifications' },
  { name: 'jobSpecifications:read', module: 'jobSpecifications', action: 'read', description: 'Read job specifications' },
  { name: 'jobSpecifications:update', module: 'jobSpecifications', action: 'update', description: 'Update job specifications' },
  { name: 'jobSpecifications:delete', module: 'jobSpecifications', action: 'delete', description: 'Delete job specifications' },

  { name: 'employees:create', module: 'employees', action: 'create', description: 'Create employees' },
  { name: 'employees:read', module: 'employees', action: 'read', description: 'Read employees' },
  { name: 'employees:update', module: 'employees', action: 'update', description: 'Update employees' },
  { name: 'employees:delete', module: 'employees', action: 'delete', description: 'Delete employees' },

  { name: 'users:create', module: 'users', action: 'create', description: 'Create users' },
  { name: 'users:read', module: 'users', action: 'read', description: 'Read users' },
  { name: 'users:update', module: 'users', action: 'update', description: 'Update users' },
  { name: 'users:resetPassword', module: 'users', action: 'resetPassword', description: 'Reset user passwords' },
  { name: 'users:delete', module: 'users', action: 'delete', description: 'Delete users' },

  { name: 'roles:read', module: 'roles', action: 'read', description: 'Read roles' },
  { name: 'roles:create', module: 'roles', action: 'create', description: 'Create roles' },
  { name: 'roles:write', module: 'roles', action: 'write', description: 'Write roles' },
  { name: 'roles:update', module: 'roles', action: 'update', description: 'Update roles' },
  { name: 'roles:delete', module: 'roles', action: 'delete', description: 'Delete roles' },

  { name: 'permissions:read', module: 'permissions', action: 'read', description: 'Read permissions' },
  { name: 'permissions:write', module: 'permissions', action: 'write', description: 'Write permissions' },
  { name: 'permissions:create', module: 'permissions', action: 'create', description: 'Create permissions' },
  { name: 'permissions:update', module: 'permissions', action: 'update', description: 'Update permissions' },
  { name: 'permissions:delete', module: 'permissions', action: 'delete', description: 'Delete permissions' },

  // Documents & Finance
  { name: 'documents:create', module: 'documents', action: 'create', description: 'Create documents' },
  { name: 'documents:read', module: 'documents', action: 'read', description: 'Read documents' },
  { name: 'documents:update', module: 'documents', action: 'update', description: 'Update documents' },
  { name: 'documents:delete', module: 'documents', action: 'delete', description: 'Delete documents' },

  { name: 'payments:create', module: 'payments', action: 'create', description: 'Create payments' },
  { name: 'payments:read', module: 'payments', action: 'read', description: 'Read payments' },
  { name: 'payments:update', module: 'payments', action: 'update', description: 'Update payments' },
  { name: 'payments:delete', module: 'payments', action: 'delete', description: 'Delete payments' },

  { name: 'invoices:create', module: 'invoices', action: 'create', description: 'Create invoices' },
  { name: 'invoices:read', module: 'invoices', action: 'read', description: 'Read invoices' },
  { name: 'invoices:update', module: 'invoices', action: 'update', description: 'Update invoices' },
  { name: 'invoices:delete', module: 'invoices', action: 'delete', description: 'Delete invoices' },

  // Suppliers & Procurement
  { name: 'suppliers:create', module: 'suppliers', action: 'create', description: 'Create suppliers' },
  { name: 'suppliers:read', module: 'suppliers', action: 'read', description: 'Read suppliers' },
  { name: 'suppliers:update', module: 'suppliers', action: 'update', description: 'Update suppliers' },
  { name: 'suppliers:delete', module: 'suppliers', action: 'delete', description: 'Delete suppliers' },

  { name: 'procurement:create', module: 'procurement', action: 'create', description: 'Create procurement orders' },
  { name: 'procurement:read', module: 'procurement', action: 'read', description: 'Read procurement orders' },
  { name: 'procurement:update', module: 'procurement', action: 'update', description: 'Update procurement orders' },
  { name: 'procurement:delete', module: 'procurement', action: 'delete', description: 'Delete procurement orders' },

  // Inventory & Sales
  { name: 'inventory:create', module: 'inventory', action: 'create', description: 'Create inventory items' },
  { name: 'inventory:read', module: 'inventory', action: 'read', description: 'Read inventory items' },
  { name: 'inventory:update', module: 'inventory', action: 'update', description: 'Update inventory items' },
  { name: 'inventory:delete', module: 'inventory', action: 'delete', description: 'Delete inventory items' },

  { name: 'sales:create', module: 'sales', action: 'create', description: 'Create sales orders' },
  { name: 'sales:read', module: 'sales', action: 'read', description: 'Read sales orders' },
  { name: 'sales:update', module: 'sales', action: 'update', description: 'Update sales orders' },
  { name: 'sales:delete', module: 'sales', action: 'delete', description: 'Delete sales orders' },

  { name: 'reports:read', module: 'reports', action: 'read', description: 'Read system reports' },
];

async function main() {
  console.log('Starting seed...');

  // 1. Ensure Roles & Permissions
  const [superAdminRole, adminRole, createdPermissions] = await prisma.$transaction(async (tx) => {
    // Create SUPER_ADMIN role
    const superAdminRole = await tx.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: { description: 'Super Administrator with All Unrestricted Permissions' },
      create: {
        name: 'SUPER_ADMIN',
        description: 'Super Administrator with All Unrestricted Permissions',
      },
    });

    // Create ADMIN role
    const adminRole = await tx.role.upsert({
      where: { name: 'ADMIN' },
      update: { description: 'System Administrator' },
      create: {
        name: 'ADMIN',
        description: 'System Administrator',
      },
    });

    // Create/Upsert All Permissions
    const createdPermissions = [];
    for (const perm of ALL_PERMISSIONS) {
      const p = await tx.permission.upsert({
        where: { name: perm.name },
        update: { description: perm.description, module: perm.module, action: perm.action },
        create: perm,
      });
      createdPermissions.push(p);
    }

    // Attach ALL permissions to SUPER_ADMIN role
    await tx.rolePermission.deleteMany({
      where: { roleId: superAdminRole.id },
    });

    for (const perm of createdPermissions) {
      await tx.rolePermission.create({
        data: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      });
    }

    // Attach ALL permissions to ADMIN role
    await tx.rolePermission.deleteMany({
      where: { roleId: adminRole.id },
    });

    for (const perm of createdPermissions) {
      await tx.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      });
    }

    // Ensure CUSTOMER role exists
    await tx.role.upsert({
      where: { name: 'CUSTOMER' },
      update: {},
      create: {
        name: 'CUSTOMER',
        description: 'Customer Role',
      },
    });

    return [superAdminRole, adminRole, createdPermissions];
  });

  console.log(`Seeded ${createdPermissions.length} permissions for SUPER_ADMIN & ADMIN roles.`);

  // 2. Ensure Super Admin User 'mati'
  await createOrUpdateSuperUser({
    username: MATI_USERNAME,
    email: MATI_EMAIL,
    password: MATI_PASSWORD,
    fullName: MATI_FULL_NAME,
    roleId: superAdminRole.id,
  });

  // 3. Ensure Default Admin User 'admin'
  await createOrUpdateSuperUser({
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    fullName: ADMIN_FULL_NAME,
    roleId: adminRole.id,
  });

  console.log('Seed completed successfully! Super admin Mati has all permissions.');
}

async function createOrUpdateSuperUser({ username, email, password, fullName, roleId }) {
  const passwordHash = await bcrypt.hash(password, 12);

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { person: { email } },
      ],
    },
    include: { person: true },
  });

  if (existingUser) {
    console.log(`Updating existing user: ${existingUser.username} (${existingUser.id})`);
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        username,
        passwordHash,
        isActive: true,
        accountStatus: 'ACTIVE',
      },
    });

    // Ensure user has role assigned
    const userRoleExists = await prisma.userRole.findFirst({
      where: { userId: existingUser.id, roleId },
    });

    if (!userRoleExists) {
      await prisma.userRole.create({
        data: {
          userId: existingUser.id,
          roleId,
        },
      });
    }

    return existingUser;
  }

  // Create Person and User
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Mati';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Admin';

  const person = await prisma.person.create({
    data: {
      firstName,
      lastName,
      email,
      status: 'ACTIVE',
    },
  });

  const user = await prisma.user.create({
    data: {
      personId: person.id,
      username,
      passwordHash,
      accountStatus: 'ACTIVE',
      isActive: true,
    },
  });

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId,
    },
  });

  console.log(`Super user created successfully: username=${username}, email=${email}`);
  return user;
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
