import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";
import {
  validateStatusTransition,
  recordStatusChange,
  getSalesOrderWithHistory,
} from "./salesOrders.status.service.js";

function getSalesRepRole(userRoles) {
  return userRoles.find(
    (ur) => ur.role.name === "SALES_REPRESENTATIVE" || ur.role.name === "ADMIN"
  )?.role.name;
}

function ensureSalesRepOrAdmin(userRoles) {
  const role = getSalesRepRole(userRoles);
  if (!role) {
    throw new AppError("Only sales representatives and admins can perform this action", 403);
  }
  return role;
}

const salesOrderInclude = {
  customer: {
    include: {
      person: true,
      organization: true,
    },
  },
  salesRep: {
    include: {
      person: true,
    },
  },
  warehouse: true,
  items: {
    include: {
      product: true,
    },
  },
  statusHistory: {
    include: {
      changedBy: true,
    },
    orderBy: {
      changedAt: "desc",
    },
  },
};

export async function approveSalesOrder(salesOrderId, userId, userRoles) {
  const userRole = ensureSalesRepOrAdmin(userRoles);
  const salesOrder = await getSalesOrderWithHistory(salesOrderId);
  const currentStatus = salesOrder.status;

  validateStatusTransition(currentStatus, "SALES_REP_APPROVED", userRole);

  const updated = await prisma.salesOrder.update({
    where: { id: salesOrderId },
    data: {
      status: "SALES_REP_APPROVED",
      approvedBy: userId,
      approvedAt: new Date(),
    },
    include: salesOrderInclude,
  });

  await recordStatusChange(salesOrderId, currentStatus, "SALES_REP_APPROVED", "APPROVED", null, userId);

  return updated;
}

export async function rejectSalesOrder(salesOrderId, userId, userRoles, reason) {
  const userRole = ensureSalesRepOrAdmin(userRoles);
  const salesOrder = await getSalesOrderWithHistory(salesOrderId);
  const currentStatus = salesOrder.status;

  validateStatusTransition(currentStatus, "REJECTED", userRole);

  const updated = await prisma.salesOrder.update({
    where: { id: salesOrderId },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
    },
    include: salesOrderInclude,
  });

  await recordStatusChange(salesOrderId, currentStatus, "REJECTED", "REJECTED", reason, userId);

  return updated;
}

export async function requestAdjustment(salesOrderId, userId, userRoles, reason) {
  const userRole = ensureSalesRepOrAdmin(userRoles);
  const salesOrder = await getSalesOrderWithHistory(salesOrderId);
  const currentStatus = salesOrder.status;

  validateStatusTransition(currentStatus, "ADJUSTMENT_REQUIRED", userRole);

  const updated = await prisma.salesOrder.update({
    where: { id: salesOrderId },
    data: {
      status: "ADJUSTMENT_REQUIRED",
      adjustmentReason: reason,
    },
    include: salesOrderInclude,
  });

  await recordStatusChange(salesOrderId, currentStatus, "ADJUSTMENT_REQUIRED", "ADJUSTMENT_REQUESTED", reason, userId);

  return updated;
}
