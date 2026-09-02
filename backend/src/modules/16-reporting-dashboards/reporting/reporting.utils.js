import prisma from "../../../config/prisma.js";

export function buildDateRangeFilter(field, startDate, endDate) {
  if (!startDate && !endDate) return undefined;
  const filter = {};
  if (startDate) filter.gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.lte = end;
  }
  return { [field]: filter };
}

export function toNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "object" && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function getUserRoleNames(user) {
  return (user.userRoles || []).map((ur) => ur.role.name);
}

export function hasRole(user, roleName) {
  return getUserRoleNames(user).includes(roleName);
}

export async function getEmployeeForUser(user) {
  if (!user?.personId) return null;
  return prisma.employee.findUnique({
    where: { personId: user.personId },
  });
}
