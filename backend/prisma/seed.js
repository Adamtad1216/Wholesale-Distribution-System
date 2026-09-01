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
  { name: 'sales:read', module: 'sales', action: 'read', description: 'Read sales data' },
  { name: 'sales:create', module: 'sales', action: 'create', description: 'Create sales records' },
  { name: 'sales:update', module: 'sales', action: 'update', description: 'Update sales records' },
  { name: 'sales:delete', module: 'sales', action: 'delete', description: 'Delete sales records' },
  { name: 'sales_orders:read', module: 'sales_orders', action: 'read', description: 'Read sales orders' },
  { name: 'sales_orders:update', module: 'sales_orders', action: 'update', description: 'Update sales orders' },
  { name: 'preparation_tasks:create', module: 'preparation_tasks', action: 'create', description: 'Create preparation tasks' },
  { name: 'preparation_tasks:read', module: 'preparation_tasks', action: 'read', description: 'Read preparation tasks' },
  { name: 'preparation_tasks:update', module: 'preparation_tasks', action: 'update', description: 'Update preparation tasks' },
  { name: 'deliveries:read', module: 'deliveries', action: 'read', description: 'Read deliveries' },
  { name: 'deliveries:update', module: 'deliveries', action: 'update', description: 'Update deliveries' },
  { name: 'REPORT_VIEW_DASHBOARD', module: 'reports', action: 'view_dashboard', description: 'View reporting dashboard' },
  { name: 'REPORT_VIEW_SALES', module: 'reports', action: 'view_sales', description: 'View sales reports' },
  { name: 'REPORT_VIEW_PRODUCTS', module: 'reports', action: 'view_products', description: 'View product reports' },
  { name: 'REPORT_VIEW_CUSTOMERS', module: 'reports', action: 'view_customers', description: 'View customer reports' },
  { name: 'REPORT_VIEW_SALES_REPS', module: 'reports', action: 'view_sales_reps', description: 'View sales representative reports' },
  { name: 'REPORT_VIEW_WAREHOUSE', module: 'reports', action: 'view_warehouse', description: 'View warehouse reports' },
  { name: 'REPORT_VIEW_DELIVERIES', module: 'reports', action: 'view_deliveries', description: 'View delivery reports' },
  { name: 'REPORT_EXPORT', module: 'reports', action: 'export', description: 'Export reports (reserved for future use)' },
  { name: 'PRICE_TIER_VIEW', module: 'pricing', action: 'view_price_tier', description: 'View price tiers' },
  { name: 'PRICE_TIER_CREATE', module: 'pricing', action: 'create_price_tier', description: 'Create price tiers' },
  { name: 'PRICE_TIER_UPDATE', module: 'pricing', action: 'update_price_tier', description: 'Update price tiers' },
  { name: 'PRICE_TIER_DELETE', module: 'pricing', action: 'delete_price_tier', description: 'Archive price tiers' },
  { name: 'PRODUCT_PRICE_VIEW', module: 'pricing', action: 'view_product_price', description: 'View product prices' },
  { name: 'PRODUCT_PRICE_CREATE', module: 'pricing', action: 'create_product_price', description: 'Create product prices' },
  { name: 'PRODUCT_PRICE_UPDATE', module: 'pricing', action: 'update_product_price', description: 'Update product prices' },
  { name: 'PRODUCT_PRICE_DELETE', module: 'pricing', action: 'delete_product_price', description: 'Delete product prices' },
  { name: 'DISCOUNT_VIEW', module: 'pricing', action: 'view_discount', description: 'View discount rules' },
  { name: 'DISCOUNT_CREATE', module: 'pricing', action: 'create_discount', description: 'Create discount rules' },
  { name: 'DISCOUNT_UPDATE', module: 'pricing', action: 'update_discount', description: 'Update discount rules' },
  { name: 'DISCOUNT_DELETE', module: 'pricing', action: 'delete_discount', description: 'Delete discount rules' },
  { name: 'QUOTA_VIEW', module: 'pricing', action: 'view_quota', description: 'View sales quotas' },
  { name: 'QUOTA_CREATE', module: 'pricing', action: 'create_quota', description: 'Create sales quotas' },
  { name: 'QUOTA_UPDATE', module: 'pricing', action: 'update_quota', description: 'Update sales quotas' },
  { name: 'QUOTA_DELETE', module: 'pricing', action: 'delete_quota', description: 'Delete sales quotas' },
];

async function ensureDefaultPriceTiers() {
  const tiers = [
    { name: 'Retail', description: 'Default retail pricing tier', isDefault: true, priority: 0 },
    { name: 'Wholesale', description: 'Wholesale customer pricing tier', isDefault: false, priority: 10 },
    { name: 'VIP', description: 'VIP customer pricing tier', isDefault: false, priority: 20 },
    { name: 'Distributor', description: 'Distributor pricing tier', isDefault: false, priority: 30 },
  ];

  for (const t of tiers) {
    const existing = await prisma.priceTier.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.priceTier.create({
        data: {
          name: t.name,
          description: t.description,
          isDefault: t.isDefault,
          priority: t.priority,
          status: 'ACTIVE',
        },
      });
    } else if (existing.isDefault !== t.isDefault) {
      if (t.isDefault) {
        await prisma.priceTier.updateMany({
          where: { isDefault: true, id: { not: existing.id } },
          data: { isDefault: false },
        });
      }
      await prisma.priceTier.update({ where: { id: existing.id }, data: { isDefault: t.isDefault } });
    }
  }
}

async function ensureAllPermissions() {
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

  const salesRepRole = await prisma.role.upsert({
    where: { name: 'SALES_REPRESENTATIVE' },
    update: {},
    create: { name: 'SALES_REPRESENTATIVE', description: 'Sales Representative' },
  });

  const warehouseManagerRole = await prisma.role.upsert({
    where: { name: 'WAREHOUSE_MANAGER' },
    update: {},
    create: { name: 'WAREHOUSE_MANAGER', description: 'Warehouse Manager' },
  });

  const storeKeeperRole = await prisma.role.upsert({
    where: { name: 'STORE_KEEPER' },
    update: {},
    create: { name: 'STORE_KEEPER', description: 'Store Keeper' },
  });

  const driverRole = await prisma.role.upsert({
    where: { name: 'DRIVER' },
    update: {},
    create: { name: 'DRIVER', description: 'Driver' },
  });

  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  const allPerms = await prisma.permission.findMany();

  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  await prisma.rolePermission.deleteMany({ where: { roleId: customerRole.id } });

  await prisma.rolePermission.deleteMany({ where: { roleId: salesRepRole.id } });
  const salesPerms = await prisma.permission.findMany({
    where: {
      OR: [
        { module: 'sales' },
        { name: { in: ['PRODUCT_PRICE_VIEW', 'DISCOUNT_VIEW', 'QUOTA_VIEW'] } },
      ],
    },
  });
  for (const perm of salesPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: salesRepRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: salesRepRole.id, permissionId: perm.id },
    });
  }

  await prisma.rolePermission.deleteMany({ where: { roleId: warehouseManagerRole.id } });
  const warehouseManagerPerms = await prisma.permission.findMany({
    where: { name: { in: ['sales_orders:read', 'sales_orders:update', 'preparation_tasks:create', 'preparation_tasks:read', 'preparation_tasks:update', 'deliveries:create', 'deliveries:read', 'deliveries:update', 'warehouses:read', 'customers:read', 'products:read', 'PRODUCT_PRICE_VIEW', 'DISCOUNT_VIEW', 'QUOTA_VIEW'] } },
  });
  for (const perm of warehouseManagerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: warehouseManagerRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: warehouseManagerRole.id, permissionId: perm.id },
    });
  }

  await prisma.rolePermission.deleteMany({ where: { roleId: storeKeeperRole.id } });
  const storeKeeperPerms = await prisma.permission.findMany({
    where: { name: { in: ['preparation_tasks:read', 'preparation_tasks:update', 'sales_orders:read', 'warehouses:read', 'products:read'] } },
  });
  for (const perm of storeKeeperPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: storeKeeperRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: storeKeeperRole.id, permissionId: perm.id },
    });
  }

  await prisma.rolePermission.deleteMany({ where: { roleId: driverRole.id } });
  const driverPerms = await prisma.permission.findMany({
    where: { name: { in: ['deliveries:read', 'deliveries:update', 'sales_orders:read', 'customers:read', 'products:read'] } },
  });
  for (const perm of driverPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: driverRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: driverRole.id, permissionId: perm.id },
    });
  }

  const allReportPerms = await prisma.permission.findMany({
    where: { module: 'reports' },
  });

  await prisma.rolePermission.deleteMany({
    where: { roleId: adminRole.id, permission: { module: 'reports' } },
  });
  for (const perm of allReportPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  await prisma.rolePermission.deleteMany({
    where: { roleId: salesRepRole.id, permission: { module: 'reports' } },
  });
  const salesRepReportPerms = allReportPerms.filter((p) =>
    ['REPORT_VIEW_DASHBOARD', 'REPORT_VIEW_SALES', 'REPORT_VIEW_PRODUCTS', 'REPORT_VIEW_CUSTOMERS', 'REPORT_VIEW_SALES_REPS'].includes(p.name)
  );
  for (const perm of salesRepReportPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: salesRepRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: salesRepRole.id, permissionId: perm.id },
    });
  }

  await prisma.rolePermission.deleteMany({
    where: { roleId: warehouseManagerRole.id, permission: { module: 'reports' } },
  });
  const warehouseManagerReportPerms = allReportPerms.filter((p) =>
    ['REPORT_VIEW_DASHBOARD', 'REPORT_VIEW_WAREHOUSE', 'REPORT_VIEW_DELIVERIES', 'REPORT_VIEW_SALES', 'REPORT_VIEW_PRODUCTS'].includes(p.name)
  );
  for (const perm of warehouseManagerReportPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: warehouseManagerRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: warehouseManagerRole.id, permissionId: perm.id },
    });
  }

  await prisma.rolePermission.deleteMany({
    where: { roleId: storeKeeperRole.id, permission: { module: 'reports' } },
  });
  const storeKeeperReportPerms = allReportPerms.filter((p) =>
    ['REPORT_VIEW_WAREHOUSE'].includes(p.name)
  );
  for (const perm of storeKeeperReportPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: storeKeeperRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: storeKeeperRole.id, permissionId: perm.id },
    });
  }

  await prisma.rolePermission.deleteMany({
    where: { roleId: driverRole.id, permission: { module: 'reports' } },
  });
  const driverReportPerms = allReportPerms.filter((p) =>
    ['REPORT_VIEW_DELIVERIES'].includes(p.name)
  );
  for (const perm of driverReportPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: driverRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: driverRole.id, permissionId: perm.id },
    });
  }

  console.log('Permissions and roles ensured.');
}

ensureDefaultPriceTiers().catch((e) => {
  console.error('Price tier seed failed:', e);
  process.exit(1);
});

async function main() {
  console.log('Starting seed...');

  await ensureDefaultPriceTiers();

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
    await ensureDefaultPriceTiers();
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

  await ensureAllPermissions();
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
