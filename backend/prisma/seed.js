import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || "System Administrator";

const ALL_PERMISSIONS = [
  // Wildcard Permission — Unrestricted System Access
  {
    name: "*",
    module: "system",
    action: "all",
    description: "Wildcard super admin access to all modules",
  },

  // Customers
  {
    name: "customers:create",
    module: "customers",
    action: "create",
    description: "Create customers",
  },
  {
    name: "customers:read",
    module: "customers",
    action: "read",
    description: "Read customers",
  },
  {
    name: "customers:update",
    module: "customers",
    action: "update",
    description: "Update customers",
  },
  {
    name: "customers:delete",
    module: "customers",
    action: "delete",
    description: "Delete customers",
  },

  // Organizational Structure
  {
    name: "companies:create",
    module: "companies",
    action: "create",
    description: "Create companies",
  },
  {
    name: "companies:read",
    module: "companies",
    action: "read",
    description: "Read companies",
  },
  {
    name: "companies:update",
    module: "companies",
    action: "update",
    description: "Update companies",
  },
  {
    name: "companies:delete",
    module: "companies",
    action: "delete",
    description: "Delete companies",
  },

  {
    name: "branches:create",
    module: "branches",
    action: "create",
    description: "Create branches",
  },
  {
    name: "branches:read",
    module: "branches",
    action: "read",
    description: "Read branches",
  },
  {
    name: "branches:update",
    module: "branches",
    action: "update",
    description: "Update branches",
  },
  {
    name: "branches:delete",
    module: "branches",
    action: "delete",
    description: "Delete branches",
  },

  {
    name: "warehouses:create",
    module: "warehouses",
    action: "create",
    description: "Create warehouses",
  },
  {
    name: "warehouses:read",
    module: "warehouses",
    action: "read",
    description: "Read warehouses",
  },
  {
    name: "warehouses:update",
    module: "warehouses",
    action: "update",
    description: "Update warehouses",
  },
  {
    name: "warehouses:delete",
    module: "warehouses",
    action: "delete",
    description: "Delete warehouses",
  },

  {
    name: "regions:create",
    module: "regions",
    action: "create",
    description: "Create regions",
  },
  {
    name: "regions:read",
    module: "regions",
    action: "read",
    description: "Read regions",
  },
  {
    name: "regions:update",
    module: "regions",
    action: "update",
    description: "Update regions",
  },
  {
    name: "regions:delete",
    module: "regions",
    action: "delete",
    description: "Delete regions",
  },

  // Identity & Access
  {
    name: "jobSpecifications:create",
    module: "jobSpecifications",
    action: "create",
    description: "Create job specifications",
  },
  {
    name: "jobSpecifications:read",
    module: "jobSpecifications",
    action: "read",
    description: "Read job specifications",
  },
  {
    name: "jobSpecifications:update",
    module: "jobSpecifications",
    action: "update",
    description: "Update job specifications",
  },
  {
    name: "jobSpecifications:delete",
    module: "jobSpecifications",
    action: "delete",
    description: "Delete job specifications",
  },

  {
    name: "employees:create",
    module: "employees",
    action: "create",
    description: "Create employees",
  },
  {
    name: "employees:read",
    module: "employees",
    action: "read",
    description: "Read employees",
  },
  {
    name: "employees:update",
    module: "employees",
    action: "update",
    description: "Update employees",
  },
  {
    name: "employees:delete",
    module: "employees",
    action: "delete",
    description: "Delete employees",
  },

  {
    name: "users:create",
    module: "users",
    action: "create",
    description: "Create users",
  },
  {
    name: "users:read",
    module: "users",
    action: "read",
    description: "Read users",
  },
  {
    name: "users:update",
    module: "users",
    action: "update",
    description: "Update users",
  },
  {
    name: "users:resetPassword",
    module: "users",
    action: "resetPassword",
    description: "Reset user passwords",
  },

  // Permissions
  {
    name: "permissions:read",
    module: "permissions",
    action: "read",
    description: "Read permissions",
  },
  {
    name: "permissions:write",
    module: "permissions",
    action: "write",
    description: "Create and update permissions",
  },
  {
    name: "permissions:delete",
    module: "permissions",
    action: "delete",
    description: "Delete permissions",
  },

  // Reporting & Dashboards
  {
    name: "REPORT_VIEW_DASHBOARD",
    module: "reporting",
    action: "view_dashboard",
    description: "View dashboard metrics",
  },
  {
    name: "REPORT_VIEW_SALES",
    module: "reporting",
    action: "view_sales",
    description: "View sales reports",
  },
  {
    name: "REPORT_VIEW_PRODUCTS",
    module: "reporting",
    action: "view_products",
    description: "View product sales reports",
  },
  {
    name: "REPORT_VIEW_CUSTOMERS",
    module: "reporting",
    action: "view_customers",
    description: "View customer reports",
  },
  {
    name: "REPORT_VIEW_SALES_REPS",
    module: "reporting",
    action: "view_sales_reps",
    description: "View sales representative reports",
  },
  {
    name: "REPORT_VIEW_WAREHOUSE",
    module: "reporting",
    action: "view_warehouse",
    description: "View warehouse reports",
  },
  {
    name: "REPORT_VIEW_DELIVERIES",
    module: "reporting",
    action: "view_deliveries",
    description: "View delivery reports",
  },
];

async function ensureDefaultPriceTiers() {
  const tiers = [
    {
      name: "Retail",
      description: "Standard retail pricing",
      isDefault: true,
      priority: 0,
    },
    {
      name: "Wholesale",
      description: "Wholesale tier pricing",
      isDefault: false,
      priority: 10,
    },
    {
      name: "Bulk",
      description: "Bulk purchase tier pricing",
      isDefault: false,
      priority: 20,
    },
  ];

  for (const tier of tiers) {
    await prisma.priceTier.upsert({
      where: { name: tier.name },
      update: {
        description: tier.description,
        isDefault: tier.isDefault,
        priority: tier.priority,
      },
      create: tier,
    });
  }
}

async function ensureAdminPermissions(userId) {
  const superAdminRole = await prisma.role.findUnique({
    where: { name: "SUPER_ADMIN" },
  });
  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (!superAdminRole || !adminRole) return;

  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {
        description: perm.description,
        module: perm.module,
        action: perm.action,
      },
      create: perm,
    });
  }

  const allPermissions = await prisma.permission.findMany();

  const wildcardPerm = allPermissions.find((p) => p.name === "*");

  await prisma.rolePermission.deleteMany({
    where: { roleId: superAdminRole.id },
  });
  if (wildcardPerm) {
    await prisma.rolePermission.create({
      data: { roleId: superAdminRole.id, permissionId: wildcardPerm.id },
    });
  }

  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
  for (const perm of allPermissions) {
    await prisma.rolePermission.create({
      data: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  const existing = await prisma.userRole.findFirst({
    where: { userId, roleId: superAdminRole.id },
  });
  if (!existing) {
    await prisma.userRole.create({
      data: { userId, roleId: superAdminRole.id },
    });
  }
}

async function main() {
  console.log("Starting seed...");

  await ensureDefaultPriceTiers();

  // Remove any legacy mati test user
  const existingMati = await prisma.user.findFirst({
    where: {
      OR: [{ username: "mati" }, { person: { email: "mati@example.com" } }],
    },
  });
  if (existingMati) {
    await prisma.user.delete({ where: { id: existingMati.id } });
    console.log("Removed legacy mati user.");
  }

  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ username: ADMIN_USERNAME }, { person: { email: ADMIN_EMAIL } }],
    },
    include: { person: true },
  });

  if (existingAdmin) {
    console.log(
      `Admin user already exists: ${existingAdmin.username} (${existingAdmin.id})`,
    );
    await ensureAdminPermissions(existingAdmin.id);
    console.log("Seed completed (idempotent).");
    return;
  }

  const { adminRole, superAdminRole, createdPermissions } =
    await prisma.$transaction(async (tx) => {
      const superAdminRole = await tx.role.upsert({
        where: { name: "SUPER_ADMIN" },
        update: { description: "Super System Administrator" },
        create: {
          name: "SUPER_ADMIN",
          description: "Super System Administrator",
        },
      });

      const adminRole = await tx.role.upsert({
        where: { name: "ADMIN" },
        update: { description: "System Administrator" },
        create: {
          name: "ADMIN",
          description: "System Administrator",
        },
      });

      const createdPermissions = [];
      for (const perm of ALL_PERMISSIONS) {
        const p = await tx.permission.upsert({
          where: { name: perm.name },
          update: {
            description: perm.description,
            module: perm.module,
            action: perm.action,
          },
          create: perm,
        });
        createdPermissions.push(p);
      }

      const wildcardPerm = createdPermissions.find((p) => p.name === "*");

      await tx.rolePermission.deleteMany({
        where: { roleId: superAdminRole.id },
      });

      if (wildcardPerm) {
        await tx.rolePermission.create({
          data: {
            roleId: superAdminRole.id,
            permissionId: wildcardPerm.id,
          },
        });
      }

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

      await tx.role.upsert({
        where: { name: "CUSTOMER" },
        update: {},
        create: {
          name: "CUSTOMER",
          description: "Customer Role",
        },
      });

      return { superAdminRole, adminRole, createdPermissions };
    });

  console.log(
    `Seeded ${createdPermissions.length} permissions for SUPER_ADMIN & ADMIN roles.`,
  );

  // 1. Ensure Default Admin User (Super Admin with all permissions)
  await createOrUpdateSuperUser({
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    fullName: ADMIN_FULL_NAME,
    roleId: superAdminRole.id,
  });

  console.log(
    "Seed completed successfully! The admin user is now a Super Admin with all permissions.",
  );
}

async function createOrUpdateSuperUser({
  username,
  email,
  password,
  fullName,
  roleId,
}) {
  const passwordHash = await bcrypt.hash(password, 12);

  const nameParts = (fullName || username || "").trim().split(/\s+/);
  const firstName = nameParts[0] || username;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "User";

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { person: { email } }],
    },
    include: { person: true },
  });

  if (existingUser) {
    console.log(
      `Updating existing user: ${existingUser.username} (${existingUser.id})`,
    );
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        username,
        passwordHash,
        isActive: true,
        accountStatus: "ACTIVE",
      },
    });

    const userRoleExists = await prisma.userRole.findFirst({
      where: { userId: existingUser.id, roleId },
    });

    if (!userRoleExists) {
      await prisma.userRole.create({
        data: { userId: existingUser.id, roleId },
      });
      console.log(`Assigned role to existing user: ${existingUser.username}`);
    }
    return;
  }

  const person = await prisma.person.create({
    data: {
      firstName,
      lastName,
      email,
      status: "ACTIVE",
    },
  });

  const user = await prisma.user.create({
    data: {
      personId: person.id,
      username,
      passwordHash,
      isActive: true,
      accountStatus: "ACTIVE",
      invitationAcceptedAt: new Date(),
    },
  });

  await prisma.userRole.create({
    data: { userId: user.id, roleId },
  });

  console.log(`Created super user: ${username} (${user.id})`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
