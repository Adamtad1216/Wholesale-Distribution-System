import prisma from '../config/prisma.js';
import { AppError } from './errors.js';

/**
 * Returns the warehouseId assigned to a user if the user is not an ADMIN.
 * If the user is an ADMIN, returns null (indicating full system-wide access).
 * If the user is an inventory manager / warehouse employee, resolves their managed warehouse ID.
 *
 * @param {Object} user - The authenticated req.user object
 * @returns {Promise<string|null>} The assigned warehouse ID or null
 */
export async function getAssignedWarehouseId(user) {
  if (!user) return null;

  const isAdmin = user.userRoles?.some((ur) => ur.role?.name === 'ADMIN');
  if (isAdmin) return null;

  if (user.personId) {
    const managedWarehouse = await prisma.warehouse.findFirst({
      where: {
        manager: { personId: user.personId, isArchived: false },
        isArchived: false,
      },
      select: { id: true },
    });
    if (managedWarehouse) {
      return managedWarehouse.id;
    }
  }

  return null;
}

/**
 * Enforces that a non-admin user can only operate on their assigned warehouse.
 * Throws 403 if a user tries to access or modify a warehouse other than their assigned one.
 *
 * @param {Object} user - The authenticated req.user object
 * @param {string} warehouseId - The warehouse ID being accessed or operated on
 * @throws {AppError} 403 Forbidden if not authorized
 */
export async function enforceWarehouseScope(user, warehouseId) {
  const assignedId = await getAssignedWarehouseId(user);
  if (assignedId && warehouseId && assignedId !== warehouseId) {
    throw new AppError('You are not authorized to perform operations for this warehouse', 403);
  }
  return assignedId;
}
