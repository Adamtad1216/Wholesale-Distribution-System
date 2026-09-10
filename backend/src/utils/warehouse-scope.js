import prisma from '../config/prisma.js';
import { AppError } from './errors.js';

/**
 * Resolves the branch and warehouse scope for an authenticated user.
 *
 * Scoping Rules:
 * 1. ADMIN and SUPER_ADMIN:
 *    - isGlobal: true (full access across all branches and warehouses).
 * 2. BRANCH_MANAGER:
 *    - Bound to their assigned Branch (via BranchManager assignment or employee.branchId).
 *    - Authorized for ALL active warehouses located in their branch.
 *    - Can only access inventory, stock, adjustments, reservations, and transfers belonging to their branch.
 * 3. WAREHOUSE_MANAGER:
 *    - Strictly bound to the specific warehouse(s) explicitly assigned (via WarehouseManager assignment or warehouse.managerId).
 *    - Authorized ONLY for that specific warehouse.
 * 4. General employees:
 *    - Bound to their assigned warehouse or branch.
 * 5. Users without assignment:
 *    - Empty scope (cannot operate on any warehouse).
 *
 * @param {Object} user - The authenticated req.user object
 * @returns {Promise<Object>} Scope object containing isGlobal, roles, branchIds, warehouseIds, etc.
 */
export async function getUserScope(user) {
  if (!user) {
    return {
      isGlobal: false,
      roles: [],
      branchIds: [],
      warehouseIds: [],
      canAccessAll: false,
      primaryWarehouseId: null,
      primaryBranchId: null,
    };
  }

  const roleNames = user.userRoles?.map((ur) => ur.role?.name).filter(Boolean) || [];
  const isGlobal = roleNames.includes('ADMIN') || roleNames.includes('SUPER_ADMIN');

  if (isGlobal) {
    return {
      isGlobal: true,
      roles: roleNames,
      branchIds: null,
      warehouseIds: null,
      canAccessAll: true,
      primaryWarehouseId: null,
      primaryBranchId: null,
    };
  }

  if (!user.personId) {
    return {
      isGlobal: false,
      roles: roleNames,
      branchIds: [],
      warehouseIds: [],
      canAccessAll: false,
      primaryWarehouseId: null,
      primaryBranchId: null,
    };
  }

  // Fetch employee record with all branch & warehouse links
  const employee = await prisma.employee.findFirst({
    where: {
      personId: user.personId,
      isArchived: false,
      status: 'ACTIVE',
    },
    include: {
      branch: {
        include: {
          warehouses: {
            where: { isArchived: false },
            select: { id: true },
          },
        },
      },
      branchManagerAssignments: {
        where: { isCurrent: true, isArchived: false },
        include: {
          branch: {
            include: {
              warehouses: {
                where: { isArchived: false },
                select: { id: true },
              },
            },
          },
        },
      },
      warehouseManagerAssignments: {
        where: { isCurrent: true, isArchived: false },
        include: {
          warehouse: {
            select: { id: true, isArchived: false, branchId: true },
          },
        },
      },
      managedWarehouses: {
        where: { isArchived: false },
        select: { id: true, branchId: true },
      },
    },
  });

  if (!employee) {
    return {
      isGlobal: false,
      roles: roleNames,
      branchIds: [],
      warehouseIds: [],
      canAccessAll: false,
      primaryWarehouseId: null,
      primaryBranchId: null,
    };
  }

  const branchIdSet = new Set();
  const warehouseIdSet = new Set();

  const isBranchManager = roleNames.includes('BRANCH_MANAGER');
  const isWarehouseManager = roleNames.includes('WAREHOUSE_MANAGER');

  // 1. Branch Manager Scope:
  if (employee.branchManagerAssignments?.length > 0) {
    for (const bma of employee.branchManagerAssignments) {
      if (bma.branch && !bma.branch.isArchived) {
        branchIdSet.add(bma.branch.id);
        if (isBranchManager) {
          for (const wh of bma.branch.warehouses || []) {
            warehouseIdSet.add(wh.id);
          }
        }
      }
    }
  }

  // Fallback for Branch Manager if no explicit assignment record: use employee's home branch
  if (isBranchManager && branchIdSet.size === 0 && employee.branch && !employee.branch.isArchived) {
    branchIdSet.add(employee.branch.id);
    for (const wh of employee.branch.warehouses || []) {
      warehouseIdSet.add(wh.id);
    }
  }

  // Ensure all warehouses belonging to the branch are included for Branch Manager
  if (isBranchManager && branchIdSet.size > 0) {
    const branchWarehouses = await prisma.warehouse.findMany({
      where: {
        branchId: { in: Array.from(branchIdSet) },
        isArchived: false,
      },
      select: { id: true },
    });
    for (const wh of branchWarehouses) {
      warehouseIdSet.add(wh.id);
    }
  }

  // 2. Warehouse Manager Scope (strictly assigned warehouse):
  if (employee.warehouseManagerAssignments?.length > 0) {
    for (const wma of employee.warehouseManagerAssignments) {
      if (wma.warehouse && !wma.warehouse.isArchived) {
        warehouseIdSet.add(wma.warehouse.id);
        if (wma.warehouse.branchId) {
          branchIdSet.add(wma.warehouse.branchId);
        }
      }
    }
  }

  // Warehouses where employee is direct warehouse.manager
  for (const mw of employee.managedWarehouses || []) {
    warehouseIdSet.add(mw.id);
    if (mw.branchId) {
      branchIdSet.add(mw.branchId);
    }
  }

  // Fallback for general employee without explicit manager assignment
  if (warehouseIdSet.size === 0 && employee.branch && !isBranchManager) {
    branchIdSet.add(employee.branch.id);
    for (const wh of employee.branch.warehouses || []) {
      warehouseIdSet.add(wh.id);
    }
  }

  const branchIds = Array.from(branchIdSet);
  const warehouseIds = Array.from(warehouseIdSet);

  return {
    isGlobal: false,
    roles: roleNames,
    isBranchManager,
    isWarehouseManager,
    branchIds,
    warehouseIds,
    canAccessAll: false,
    primaryWarehouseId: warehouseIds[0] || null,
    primaryBranchId: branchIds[0] || null,
  };
}

/**
 * Returns the primary warehouseId assigned to a user if not an admin.
 * Kept for backward compatibility.
 *
 * @param {Object} user - The authenticated req.user object
 * @returns {Promise<string|null>} The assigned warehouse ID or null
 */
export async function getAssignedWarehouseId(user) {
  const scope = await getUserScope(user);
  if (scope.isGlobal) return null;
  return scope.primaryWarehouseId;
}

/**
 * Returns all assigned warehouseIds for a user if not an admin.
 *
 * @param {Object} user - The authenticated req.user object
 * @returns {Promise<string[]|null>} Array of warehouse IDs or null if global
 */
export async function getAssignedWarehouseIds(user) {
  const scope = await getUserScope(user);
  if (scope.isGlobal) return null;
  return scope.warehouseIds;
}

/**
 * Enforces that a non-admin user can only operate on their assigned warehouse(s).
 * Throws 403 Forbidden if not authorized.
 *
 * @param {Object} user - The authenticated req.user object
 * @param {string} warehouseId - The warehouse ID being operated on
 * @throws {AppError} 403 Forbidden if not authorized
 */
export async function enforceWarehouseScope(user, warehouseId) {
  const scope = await getUserScope(user);
  if (scope.isGlobal) return null;

  if (!warehouseId) {
    throw new AppError('Warehouse ID is required for this operation', 400);
  }

  if (!scope.warehouseIds.includes(warehouseId)) {
    throw new AppError(
      'You are not authorized to perform operations for this warehouse. Access is restricted to your assigned branch/warehouse.',
      403
    );
  }

  return warehouseId;
}

/**
 * Enforces that a non-admin user can only initiate transfers FROM their assigned warehouse(s).
 *
 * @param {Object} user - The authenticated req.user object
 * @param {string} fromWarehouseId - Source warehouse ID
 * @throws {AppError} 403 Forbidden if unauthorized
 */
export async function enforceTransferSourceScope(user, fromWarehouseId) {
  const scope = await getUserScope(user);
  if (scope.isGlobal) return null;

  if (!fromWarehouseId) {
    throw new AppError('Source warehouse ID is required', 400);
  }

  if (!scope.warehouseIds.includes(fromWarehouseId)) {
    throw new AppError(
      'You can only initiate transfers from your assigned warehouse(s).',
      403
    );
  }

  return fromWarehouseId;
}

/**
 * Enforces that a non-admin user can only view or manage transfers that involve their assigned warehouse(s).
 *
 * @param {Object} user - The authenticated req.user object
 * @param {Object} transfer - The transfer object containing fromWarehouseId and toWarehouseId
 * @throws {AppError} 403 Forbidden if unauthorized
 */
export async function enforceTransferAccess(user, transfer) {
  const scope = await getUserScope(user);
  if (scope.isGlobal) return null;

  const hasAccess =
    scope.warehouseIds.includes(transfer.fromWarehouseId) ||
    scope.warehouseIds.includes(transfer.toWarehouseId);

  if (!hasAccess) {
    throw new AppError(
      'You are not authorized to access or manage transfers for this warehouse.',
      403
    );
  }

  return true;
}
