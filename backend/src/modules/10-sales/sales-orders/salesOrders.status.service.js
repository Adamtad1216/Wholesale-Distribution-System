import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";
import { logAudit } from "../../../middleware/audit.middleware.js"; // eslint-disable-line no-unused-vars

const STATUS_TRANSITIONS = {
  DRAFT: {
    CUSTOMER: ["PENDING_REVIEW", "CANCELLED"],
    SALES_REPRESENTATIVE: ["PENDING_REVIEW", "SALES_REP_APPROVED", "REJECTED", "CANCELLED"],
    ADMIN: ["PENDING_REVIEW", "SALES_REP_APPROVED", "REJECTED", "CANCELLED"],
  },
  PENDING_REVIEW: {
    SALES_REPRESENTATIVE: ["SALES_REP_APPROVED", "REJECTED", "ADJUSTMENT_REQUIRED"],
    ADMIN: [
      "SALES_REP_APPROVED",
      "REJECTED",
      "ADJUSTMENT_REQUIRED",
      "WAREHOUSE_PREPARATION_SCHEDULED",
      "PREPARING",
      "READY_FOR_DELIVERY",
      "READY_FOR_PICKUP",
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
      "READY_FOR_PICKUP",
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
      "READY_FOR_PICKUP",
      "DELIVERY_SCHEDULED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ],
  },
  WAREHOUSE_PREPARATION_SCHEDULED: {
    STORE_KEEPER: ["PREPARING", "READY_FOR_DELIVERY", "READY_FOR_PICKUP", "DELIVERY_SCHEDULED"],
    ADMIN: [
      "PREPARING",
      "READY_FOR_DELIVERY",
      "READY_FOR_PICKUP",
      "DELIVERY_SCHEDULED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ],
  },
  PREPARING: {
    STORE_KEEPER: ["READY_FOR_DELIVERY", "READY_FOR_PICKUP", "DELIVERY_SCHEDULED"],
    WAREHOUSE_MANAGER: ["READY_FOR_DELIVERY", "READY_FOR_PICKUP", "DELIVERY_SCHEDULED"],
    ADMIN: [
      "READY_FOR_DELIVERY",
      "READY_FOR_PICKUP",
      "DELIVERY_SCHEDULED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ],
  },
  READY_FOR_DELIVERY: {
    STORE_KEEPER: ["DELIVERY_SCHEDULED"],
    WAREHOUSE_MANAGER: ["DELIVERY_SCHEDULED"],
    ADMIN: [
      "DELIVERY_SCHEDULED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ],
  },
  READY_FOR_PICKUP: {
    STORE_KEEPER: ["COMPLETED", "CANCELLED"],
    WAREHOUSE_MANAGER: ["COMPLETED", "CANCELLED"],
    CUSTOMER: ["COMPLETED"],
    ADMIN: [
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
    DRIVER: ["DELIVERED", "COMPLETED"],
    CUSTOMER: ["DELIVERED", "COMPLETED"],
    ADMIN: [
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ],
  },
  DELIVERED: {
    DRIVER: ["COMPLETED"],
    CUSTOMER: ["COMPLETED"],
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

  if (toStatus === "CANCELLED" || toStatus === "REJECTED") {
    try {
      await prisma.salesQuotaUsage.deleteMany({
        where: { salesOrderId },
      });
    } catch (err) {
      console.warn("Failed to release sales quota usage on cancellation/rejection:", err?.message);
    }
  }

  return history;
}

export async function getSalesOrderWithHistory(salesOrderId) {
  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: {
      deliveryAddress: true,
      customer: {
        include: {
          person: true,
          organization: true,
          paymentTerms: true,
          addresses: true,
        },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
      },
      reservations: {
        include: { product: true },
      },
      salesRep: {
        include: {
          person: true,
          branch: { select: { id: true, name: true, branchCode: true } },
        },
      },
      warehouse: {
        include: {
          manager: {
            include: {
              person: true,
            },
          },
        },
      },
      priceTier: true,
      items: {
        include: {
          product: {
            include: {
              unit: true,
              category: true,
            },
          },
        },
      },
      statusHistory: {
        include: {
          changedBy: {
            include: {
              person: true,
            },
          },
        },
        orderBy: {
          changedAt: "desc",
        },
      },
      preparationTasks: {
        include: {
          storeKeeper: {
            include: {
              person: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      deliveries: {
        include: {
          driver: {
            include: {
              person: true,
            },
          },
          vehicle: true,
          proofs: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });


  if (!salesOrder) {
    throw new AppError("Sales order not found", 404);
  }

  return salesOrder;
}
