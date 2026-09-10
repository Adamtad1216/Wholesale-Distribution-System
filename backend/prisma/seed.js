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
    name: "products:read",
    module: "products",
    action: "read",
    description: "Read products",
  },

  {
    name: "sales_orders:create",
    module: "sales_orders",
    action: "create",
    description: "Create sales orders",
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

  // ─── Inventory: Warehouse Stock ────────────────────────────
  {
    name: "inventory:stock:read",
    module: "inventory",
    action: "read",
    description: "View warehouse stock levels",
  },
  {
    name: "inventory:stock:create",
    module: "inventory",
    action: "create",
    description: "Create warehouse stock entries",
  },
  {
    name: "inventory:stock:update",
    module: "inventory",
    action: "update",
    description: "Update warehouse stock entries",
  },
  {
    name: "inventory:stock:delete",
    module: "inventory",
    action: "delete",
    description: "Delete/archive warehouse stock entries",
  },

  // ─── Inventory: Stock Adjustments ─────────────────────────
  {
    name: "inventory:adjustments:read",
    module: "inventory",
    action: "read",
    description: "View stock adjustments",
  },
  {
    name: "inventory:adjustments:create",
    module: "inventory",
    action: "create",
    description: "Create stock adjustment requests",
  },
  {
    name: "inventory:adjustments:update",
    module: "inventory",
    action: "update",
    description: "Edit pending stock adjustments",
  },
  {
    name: "inventory:adjustments:approve",
    module: "inventory",
    action: "approve",
    description: "Approve or reject stock adjustment requests",
  },
  {
    name: "inventory:adjustments:delete",
    module: "inventory",
    action: "delete",
    description: "Delete/archive stock adjustments",
  },

  // ─── Inventory: Stock Transfers ───────────────────────────
  {
    name: "inventory:transfers:read",
    module: "inventory",
    action: "read",
    description: "View inter-warehouse stock transfers",
  },
  {
    name: "inventory:transfers:create",
    module: "inventory",
    action: "create",
    description: "Dispatch inter-warehouse stock transfers",
  },
  {
    name: "inventory:transfers:update",
    module: "inventory",
    action: "update",
    description: "Update pending stock transfers",
  },
  {
    name: "inventory:transfers:approve",
    module: "inventory",
    action: "approve",
    description: "Authorize or reject inter-warehouse stock transfers",
  },
  {
    name: "inventory:transfers:delete",
    module: "inventory",
    action: "delete",
    description: "Cancel or reverse stock transfers",
  },

  // ─── Inventory: Stock Reservations ────────────────────────
  {
    name: "inventory:reservations:read",
    module: "inventory",
    action: "read",
    description: "View stock reservations",
  },
  {
    name: "inventory:reservations:create",
    module: "inventory",
    action: "create",
    description: "Create stock reservations for sales orders",
  },
  {
    name: "inventory:reservations:approve",
    module: "inventory",
    action: "approve",
    description: "Approve (fulfill) or reject stock reservations",
  },
  {
    name: "inventory:reservations:release",
    module: "inventory",
    action: "release",
    description: "Release reserved stock back to available inventory",
  },
  {
    name: "inventory:reservations:delete",
    module: "inventory",
    action: "delete",
    description: "Delete/archive stock reservation records",
  },
];

async function ensureCustomerPermissions() {
  const customerRole = await prisma.role.upsert({
    where: { name: "CUSTOMER" },
    update: { description: "Customer portal user" },
    create: { name: "CUSTOMER", description: "Customer portal user" },
  });

  if (!customerRole) return;

  const allPermissions = await prisma.permission.findMany();
  const customerPermissions = [
    "customers:read",
    "warehouses:read",
    "products:read",
    "sales_orders:create",
  ];

  for (const permName of customerPermissions) {
    const perm = allPermissions.find((p) => p.name === permName);
    if (!perm) continue;
    const existing = await prisma.rolePermission.findFirst({
      where: { roleId: customerRole.id, permissionId: perm.id },
    });
    if (!existing) {
      await prisma.rolePermission.create({
        data: { roleId: customerRole.id, permissionId: perm.id },
      });
      console.log(`Granted ${permName} to CUSTOMER role.`);
    }
  }
}

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

async function ensureDefaultOrganizationAndBranch() {
  const region = await prisma.region.upsert({
    where: { code: "AA" },
    update: { name: "Addis Ababa" },
    create: {
      code: "AA",
      name: "Addis Ababa",
      description: "Capital Region",
      isActive: true,
    },
  });

  const company = await prisma.company.upsert({
    where: { tradeLicenseNumber: "TL-HQ-001" },
    update: {
      name: "Main Wholesale Distribution Enterprise",
      regionId: region.id,
    },
    create: {
      name: "Main Wholesale Distribution Enterprise",
      legalName: "Main Wholesale Distribution Enterprise PLC",
      tradeLicenseNumber: "TL-HQ-001",
      tinNumber: "TIN-000112233",
      vatRegistrationNumber: "VAT-998877",
      isVatRegistered: true,
      email: "contact@wholesaledistribution.com",
      phone: "+251 11 123 4567",
      city: "Addis Ababa",
      regionId: region.id,
      status: "ACTIVE",
    },
  });

  const branch = await prisma.branch.upsert({
    where: { branchCode: "BR-HQ-01" },
    update: {
      name: "Headquarters Main Branch",
      companyId: company.id,
      regionId: region.id,
    },
    create: {
      branchCode: "BR-HQ-01",
      name: "Headquarters Main Branch",
      isHeadOffice: true,
      companyId: company.id,
      regionId: region.id,
      city: "Addis Ababa",
      phone: "+251 11 123 4567",
      email: "hq@wholesaledistribution.com",
    },
  });

  console.log(
    `Seeded organization: ${company.name} and branch: ${branch.name}`,
  );
  return { region, company, branch };
}

async function ensureSalesManagerRole() {
  const TARGET_WAREHOUSE_CODE = "WH-TEST-001";
  const SM_USERNAME = "salesmanager";
  const SM_EMAIL = "salesmanager@wholesaledistribution.com";
  const SM_PASSWORD = "Password@123";

  // 1. Ensure Target Warehouse exists
  let warehouse = await prisma.warehouse.findFirst({
    where: { OR: [{ code: TARGET_WAREHOUSE_CODE }, { name: "Central Warehouse" }], isArchived: false },
  });

  if (!warehouse) {
    let region = await prisma.region.findFirst({ where: { code: "AA" } });
    if (!region) {
      region = await prisma.region.create({
        data: { code: "AA", name: "Addis Ababa", description: "Capital Region", isActive: true },
      });
    }

    let branch = await prisma.branch.findFirst({ where: { isArchived: false } });
    if (!branch) {
      let company = await prisma.company.findFirst({ where: { isArchived: false } });
      if (!company) {
        company = await prisma.company.create({
          data: { name: "Main Wholesale PLC", tradeLicenseNumber: "TL-SM-001", regionId: region.id, status: "ACTIVE" },
        });
      }
      branch = await prisma.branch.create({
        data: { branchCode: "BR-SM-01", name: "Main Distribution Branch", companyId: company.id, regionId: region.id, status: "ACTIVE" },
      });
    }

    warehouse = await prisma.warehouse.create({
      data: {
        code: TARGET_WAREHOUSE_CODE,
        name: "Central Warehouse",
        branchId: branch.id,
        regionId: region.id,
        status: "ACTIVE",
      },
    });
  }

  // Ensure 3 additional warehouses exist for distribution operations
  const additionalWarehouses = [
    { code: "WH-EAST-002", name: "Eastern Distribution Center", city: "Bole" },
    { code: "WH-NORTH-003", name: "Northern Logistics Hub", city: "Gullele" },
    { code: "WH-WEST-004", name: "Western Regional Depot", city: "Kolfe Keranio" },
  ];

  for (const wh of additionalWarehouses) {
    const exists = await prisma.warehouse.findFirst({ where: { code: wh.code } });
    if (!exists && warehouse?.branchId) {
      await prisma.warehouse.create({
        data: {
          code: wh.code,
          name: wh.name,
          city: wh.city,
          branchId: warehouse.branchId,
          regionId: warehouse.regionId,
          status: "ACTIVE",
        },
      });
    }
  }

  // 2. Ensure Permissions exist
  const salesManagerPermNames = [
    "products:create",
    "products:read",
    "products:update",
    "warehouse-selling-prices:create",
    "warehouse-selling-prices:read",
    "warehouse-selling-prices:update",
    "warehouses:read",
    "brands:read",
    "sales_orders:create",
    "sales_orders:read",
    "sales_orders:update",
    "customers:read",
    "customers:create",
    "REPORT_VIEW_DASHBOARD",
    "REPORT_VIEW_SALES",
    "REPORT_VIEW_PRODUCTS",
    "REPORT_VIEW_WAREHOUSE",
  ];

  for (const permName of salesManagerPermNames) {
    await prisma.permission.upsert({
      where: { name: permName },
      update: {},
      create: {
        name: permName,
        module: permName.split(":")[0] || "general",
        action: permName.split(":")[1] || "access",
        description: `Permission ${permName}`,
      },
    });
  }

  // 3. Upsert SALES_MANAGER Role
  const salesManagerRole = await prisma.role.upsert({
    where: { name: "SALES_MANAGER" },
    update: { description: "Sales Manager for warehouse product catalog and pricing" },
    create: {
      name: "SALES_MANAGER",
      description: "Sales Manager for warehouse product catalog and pricing",
    },
  });

  // Explicitly remove read permissions for Unit, Category, and Company from SALES_MANAGER role
  const revokedPerms = await prisma.permission.findMany({
    where: { name: { in: ["categories:read", "units:read", "companies:read"] } },
  });
  if (revokedPerms.length > 0) {
    await prisma.rolePermission.deleteMany({
      where: {
        roleId: salesManagerRole.id,
        permissionId: { in: revokedPerms.map((p) => p.id) },
      },
    });
  }

  const permissionsToAssign = await prisma.permission.findMany({
    where: { name: { in: salesManagerPermNames } },
  });

  for (const perm of permissionsToAssign) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: salesManagerRole.id, permissionId: perm.id } },
      update: { isArchived: false },
      create: { roleId: salesManagerRole.id, permissionId: perm.id },
    });
  }

  // 4. Ensure ADMIN role has ALL permissions (making it possible for admins too)
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: { description: "System Administrator with full access" },
    create: { name: "ADMIN", description: "System Administrator with full access" },
  });

  const allSystemPermissions = await prisma.permission.findMany();
  for (const perm of allSystemPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: { isArchived: false },
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // 5. Create Person & Employee for Sales Manager
  let person = await prisma.person.findFirst({
    where: { email: SM_EMAIL },
  });

  if (!person) {
    person = await prisma.person.create({
      data: {
        firstName: "Warehouse",
        lastName: "SalesManager",
        email: SM_EMAIL,
        phone: "+251 91 122 3344",
        status: "ACTIVE",
      },
    });
  }

  let employee = await prisma.employee.findFirst({
    where: { personId: person.id },
  });

  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        personId: person.id,
        employeeCode: "EMP-SM-001",
        hireDate: new Date(),
        department: "Sales",
        status: "ACTIVE",
      },
    });
  }

  // Link employee as the manager of the specific warehouse
  await prisma.warehouse.update({
    where: { id: warehouse.id },
    data: { managerId: employee.id },
  });

  // 6. Create or Update User for Sales Manager
  const passwordHash = await bcrypt.hash(SM_PASSWORD, 12);
  let user = await prisma.user.findFirst({
    where: { OR: [{ username: SM_USERNAME }, { personId: person.id }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        personId: person.id,
        username: SM_USERNAME,
        passwordHash,
        isActive: true,
        accountStatus: "ACTIVE",
        invitationAcceptedAt: new Date(),
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        personId: person.id,
        passwordHash,
        isActive: true,
        accountStatus: "ACTIVE",
      },
    });
  }

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: salesManagerRole.id } },
    update: { isArchived: false },
    create: { userId: user.id, roleId: salesManagerRole.id },
  });

  console.log(`Seeded Sales Manager (${SM_USERNAME}) for warehouse: ${warehouse.name} (${warehouse.code})`);
}

async function main() {
  console.log("Starting seed...");

  await ensureDefaultPriceTiers();
  await ensureDefaultOrganizationAndBranch();

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
    await ensureSalesManagerRole();
    await ensureCustomerPermissions();
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

  await ensureCustomerPermissions();

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
