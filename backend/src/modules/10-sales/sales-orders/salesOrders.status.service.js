import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";
import { logAudit } from "../../../middleware/audit.middleware.js"; // eslint-disable-line no-unused-vars

const STATUS_TRANSITIONS = {
  PENDING_REVIEW: {
    SALES_REPRESENTATIVE: ["SALES_REP_APPROVED", "REJECTED", "ADJUSTMENT_REQUIRED"],
    ADMIN: [
      "SALES_REP_APPROVED",
      "REJECTED",
      "ADJUSTMENT_REQUIRED",
      "WAREHOUSE_PREPARATION_SCHEDULED",
      "PREPARING",
      "READY_FOR_DELIVERY",
      "DELIVERY_SCHEDULED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ],
  },
  ADJUSTMENT_REQUIRED: {
    CUSTOMER: ["PENDING_REVIEW"],
    ADMIN: [
      "PENDING_REVIEW",
      "SALES_REP_APPROVED",
      "REJECTED",
      "ADJUSTMENT_REQUIRED",
      "WAREHOUSE_PREPARATION_SCHEDULED",
      "PREPARING",
      "READY_FOR_DELIVERY",
      "DELIVERY_SCHEDULED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ],
  },
  SALES_REP_APPROVED: {
    WAREHOUSE_MANAGER: ["WAREHOUSE_PREPARATION_SCHEDULED"],
    ADMIN: [
      "WAREHOUSE_PREPARATION_SCHEDULED",
      "PREPARING",
      "READY_FOR_DELIVERY",
      "DELIVERY_SCHEDULED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ],
  },
  WAREHOUSE_PREPARATION_SCHEDULED: {
    STORE_KEEPER: ["PREPARING"],
    ADMIN: [
      "PREPARING",
      "READY_FOR_DELIVERY",
      "DELIVERY_SCHEDULED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ],
  },
  PREPARING: {
    STORE_KEEPER: ["READY_FOR_DELIVERY"],
    WAREHOUSE_MANAGER: ["READY_FOR_DELIVERY"],
    ADMIN: [
      "READY_FOR_DELIVERY",
      "DELIVERY_SCHEDULED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ],
  },
  READY_FOR_DELIVERY: {
    WAREHOUSE_MANAGER: ["DELIVERY_SCHEDULED"],
    ADMIN: [
      "DELIVERY_SCHEDULED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ],
  },
  DELIVERY_SCHEDULED: {
    DRIVER: ["OUT_FOR_DELIVERY"],
    ADMIN: [
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ],
  },
  OUT_FOR_DELIVERY: {
    DRIVER: ["DELIVERED"],
    ADMIN: [
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ],
  },
  DELIVERED: {
    ADMIN: ["COMPLETED", "CANCELLED"],
  },
};

export async function validateStatusTransition(currentStatus, newStatus, userRole) {
  const allowedStatuses = STATUS_TRANSITIONS[currentStatus]?.[userRole];

  if (!allowedStatuses || !allowedStatuses.includes(newStatus)) {
    throw new AppError(
      `Invalid status transition from ${currentStatus} to ${newStatus} for role ${userRole}`,
      400
    );
  }

  return true;
}

export async function recordStatusChange(salesOrderId, fromStatus, toStatus, action, reason, userId) {
  const history = await prisma.salesOrderStatusHistory.create({
    data: {
      salesOrderId,
      fromStatus,
      toStatus,
      action,
      reason,
      changedById: userId,
    },
  });

  return history;
}

export async function getSalesOrderWithHistory(salesOrderId) {
  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: {
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
    },
  });

  if (!salesOrder) {
    throw new AppError("Sales order not found", 404);
  }

  return salesOrder;
}
