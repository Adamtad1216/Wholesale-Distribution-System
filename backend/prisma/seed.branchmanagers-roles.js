import prisma from "../src/config/prisma.js";
import { hashPassword } from "../src/utils/password.js";

async function main() {
  console.log("Starting branch managers and roles seeding...");

  // 1. Fetch Branches
  const branches = await prisma.branch.findMany({
    where: { isArchived: false },
    orderBy: { createdAt: 'asc' },
    take: 2,
  });

  if (branches.length < 2) {
    throw new Error(`Need at least 2 branches in database, found: ${branches.length}`);
  }

  const branch1 = branches[0]; // Main Branch
  const branch2 = branches[1]; // mintell
  console.log(`Branch 1: ${branch1.name} (${branch1.branchCode}) [${branch1.id}]`);
  console.log(`Branch 2: ${branch2.name} (${branch2.branchCode}) [${branch2.id}]`);

  // 2. Fetch 4 Employees
  const employees = await prisma.employee.findMany({
    where: { isArchived: false, status: 'ACTIVE' },
    include: { person: true },
    orderBy: { employeeCode: 'asc' },
    take: 4,
  });

  if (employees.length < 4) {
    throw new Error(`Need at least 4 active employees in database, found: ${employees.length}`);
  }

  const [emp1, emp2, emp3, emp4] = employees;
  console.log(`Emp 1: ${emp1.employeeCode} - ${emp1.person.firstName} ${emp1.person.lastName}`);
  console.log(`Emp 2: ${emp2.employeeCode} - ${emp2.person.firstName} ${emp2.person.lastName}`);
  console.log(`Emp 3: ${emp3.employeeCode} - ${emp3.person.firstName} ${emp3.person.lastName}`);
  console.log(`Emp 4: ${emp4.employeeCode} - ${emp4.person.firstName} ${emp4.person.lastName}`);

  // 3. Define Roles and their Approval / Operational Permissions
  const roleConfigs = [
    {
      name: `${branch1.branchCode.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_BRANCH_MANAGER`,
      description: `Branch Manager for ${branch1.name} - Branch administration and all inventory & sales approvals`,
      permissions: [
        'branches:read',
        'branches:update',
        'warehouses:read',
        'warehouses:update',
        'inventory:stock:read',
        'inventory:transfers:read',
        'inventory:transfers:create',
        'inventory:transfers:update',
        'inventory:transfers:approve',
        'inventory:reservations:read',
        'inventory:reservations:create',
        'inventory:reservations:approve',
        'inventory:reservations:release',
        'inventory:adjustments:read',
        'inventory:adjustments:create',
        'inventory:adjustments:approve',
        'sales_orders:approve',
      ],
      employee: emp1,
      username: 'abebe.bikila',
      assignAsBranchManager: true,
      branchId: branch1.id,
    },
    {
      name: `${branch1.branchCode.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_INVENTORY_APPROVER`,
      description: `Inventory Approver for ${branch1.name} - Stock transfers and adjustments approval`,
      permissions: [
        'branches:read',
        'warehouses:read',
        'inventory:stock:read',
        'inventory:transfers:read',
        'inventory:transfers:approve',
        'inventory:adjustments:read',
        'inventory:adjustments:approve',
        'inventory:reservations:read',
        'inventory:reservations:approve',
      ],
      employee: emp2,
      username: 'selamawit.desta',
      assignAsBranchManager: false,
      branchId: branch1.id,
    },
    {
      name: `${branch2.branchCode.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_BRANCH_MANAGER`,
      description: `Branch Manager for ${branch2.name} - Branch administration and all inventory & sales approvals`,
      permissions: [
        'branches:read',
        'branches:update',
        'warehouses:read',
        'warehouses:update',
        'inventory:stock:read',
        'inventory:transfers:read',
        'inventory:transfers:create',
        'inventory:transfers:update',
        'inventory:transfers:approve',
        'inventory:reservations:read',
        'inventory:reservations:create',
        'inventory:reservations:approve',
        'inventory:reservations:release',
        'inventory:adjustments:read',
        'inventory:adjustments:create',
        'inventory:adjustments:approve',
        'sales_orders:approve',
      ],
      employee: emp3,
      username: 'dawit.tadesse',
      assignAsBranchManager: true,
      branchId: branch2.id,
    },
    {
      name: `${branch2.branchCode.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_OPERATIONS_APPROVER`,
      description: `Operations Approver for ${branch2.name} - Transfer and sales orders approval`,
      permissions: [
        'branches:read',
        'warehouses:read',
        'inventory:stock:read',
        'inventory:transfers:read',
        'inventory:transfers:approve',
        'inventory:reservations:read',
        'inventory:reservations:approve',
        'sales_orders:approve',
      ],
      employee: emp4,
      username: 'tigist.alemu',
      assignAsBranchManager: false,
      branchId: branch2.id,
    },
  ];

  // Fetch all existing permissions
  const allPermissions = await prisma.permission.findMany();
  const permMap = new Map(allPermissions.map((p) => [p.name, p]));

  const defaultPasswordHash = await hashPassword('Password@123');

  for (const config of roleConfigs) {
    console.log(`\nConfiguring role: ${config.name}...`);

    // 1. Create or update Role
    let role = await prisma.role.findFirst({
      where: { name: config.name },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          name: config.name,
          description: config.description,
        },
      });
      console.log(` Created role: ${role.name}`);
    } else {
      role = await prisma.role.update({
        where: { id: role.id },
        data: { description: config.description },
      });
      console.log(` Updated role: ${role.name}`);
    }

    // 2. Attach permissions
    for (const permName of config.permissions) {
      const perm = permMap.get(permName);
      if (!perm) {
        console.warn(` Warning: Permission '${permName}' not found in database!`);
        continue;
      }

      const existingRP = await prisma.rolePermission.findFirst({
        where: { roleId: role.id, permissionId: perm.id },
      });

      if (!existingRP) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: perm.id,
          },
        });
      }
    }
    console.log(` Assigned ${config.permissions.length} permissions to ${role.name}`);

    // 3. Create or update User for the employee
    let user = await prisma.user.findFirst({
      where: { personId: config.employee.person.id },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          personId: config.employee.person.id,
          username: config.username,
          passwordHash: defaultPasswordHash,
          accountStatus: 'ACTIVE',
          isActive: true,
        },
      });
      console.log(` Created user '${config.username}' for employee ${config.employee.employeeCode}`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          username: config.username,
          passwordHash: defaultPasswordHash,
          accountStatus: 'ACTIVE',
          isActive: true,
        },
      });
      console.log(` Updated user '${config.username}' for employee ${config.employee.employeeCode}`);
    }

    // 4. Assign role to user
    const existingUserRole = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: role.id },
    });

    if (!existingUserRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });
      console.log(` Linked user '${user.username}' to role '${role.name}'`);
    }

    // 5. If Branch Manager, update BranchManager table
    if (config.assignAsBranchManager) {
      await prisma.branchManager.updateMany({
        where: { branchId: config.branchId, isCurrent: true },
        data: {
          isCurrent: false,
          unassignedAt: new Date(),
        },
      });

      await prisma.branchManager.create({
        data: {
          branchId: config.branchId,
          employeeId: config.employee.id,
          isCurrent: true,
          assignedAt: new Date(),
          notes: `Assigned as branch manager via role assignment seed (${config.name})`,
        },
      });
      console.log(` Set ${config.employee.person.firstName} ${config.employee.person.lastName} as current Branch Manager for branch ${config.branchId}`);
    }
  }

  console.log("\n Seeding completed successfully!");
}

main()
  .catch((err) => {
    console.error("Seeding error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
