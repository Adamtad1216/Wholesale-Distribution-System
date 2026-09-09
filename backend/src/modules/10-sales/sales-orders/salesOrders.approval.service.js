import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";
import {
  validateStatusTransition,
  recordStatusChange,
  getSalesOrderWithHistory,
} from "./salesOrders.status.service.js";
import invoiceService from "../../04-finance/invoice/invoice.service.js";
import {
  sendNotificationToCustomer,
  sendNotificationToRoles,
} from "../../../utils/notifications.js";

function extractRoleNames(userOrRoles) {
  if (!userOrRoles) return [];
  if (typeof userOrRoles === "string") return [userOrRoles.toUpperCase()];
  if (Array.isArray(userOrRoles)) {
    return userOrRoles
      .map((ur) => {
        if (typeof ur === "string") return ur.toUpperCase();
        if (ur?.role?.name) return ur.role.name.toUpperCase();
        if (ur?.name) return ur.name.toUpperCase();
        return "";
      })
      .filter(Boolean);
  }
  if (typeof userOrRoles === "object") {
    if (userOrRoles.userRoles) return extractRoleNames(userOrRoles.userRoles);
    if (userOrRoles.roles) return extractRoleNames(userOrRoles.roles);
    if (userOrRoles.role) return extractRoleNames(userOrRoles.role);
  }
  return [];
}

import { hasPermission } from "../../../middleware/permission.middleware.js";

function ensureSalesRepOrAdmin(userRoles = []) {
  const roleNames = extractRoleNames(userRoles);
  const isSuperAdmin = roleNames.includes("SUPER_ADMIN") || roleNames.includes("ADMIN");
  const isSalesRep =
    roleNames.includes("SALES_REPRESENTATIVE") ||
    roleNames.includes("SALES_REP") ||
    roleNames.includes("SALES_REPRESENTATIVE_ROLE");

  const userObj = Array.isArray(userRoles) ? { userRoles } : userRoles;
  const canApprove = isSuperAdmin || isSalesRep || hasPermission(userObj, "sales_orders:approve");

  if (!canApprove) {
    throw new AppError("Only an authorized user, Sales Representative, or Administrator can review sales orders", 403);
  }

  return isSuperAdmin ? "ADMIN" : "SALES_REPRESENTATIVE";
}


const salesOrderInclude = {
  customer: {
    include: {
      person: true,
      organization: true,
      paymentTerms: true,
    },
  },
  salesRep: {
    include: {
      person: true,
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
  items: {
    include: {
      product: true,
    },
  },
  invoices: {
    orderBy: { createdAt: "desc" },
  },
  reservations: true,
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

  // Check customer's payment term and auto-create commercial invoice if one does not exist
  try {
    const existingInvoice = await prisma.invoice.findFirst({
      where: { salesOrderId },
    });
    if (!existingInvoice) {
      await invoiceService.createInvoiceFromOrder(salesOrderId, userId);
    }
  } catch (err) {
    // Log warning if invoice already exists or failed gracefully
    console.warn("Invoice auto-creation note:", err?.message);
  }

  // Return fresh order including the newly generated invoice
  const freshOrder = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: salesOrderInclude,
  });

  sendNotificationToCustomer({
    customerId: updated.customerId,
    title: "Sales Order Approved & Commercial Invoice Issued",
    message: `Your order #${updated.orderNumber} has been approved. Invoice has been issued. Review invoice and proceed with payment.`,
    type: "SALES_ORDER_APPROVED",
    createdById: userId,
  });

  sendNotificationToRoles({
    roleNames: ["WAREHOUSE_MANAGER", "ADMIN", "SUPER_ADMIN"],
    title: "Order Approved - Ready to Schedule Preparation",
    message: `Order #${updated.orderNumber} approved. Schedule warehouse preparation & staging.`,
    type: "SALES_ORDER_APPROVED",
    createdById: userId,
  });

  return freshOrder || updated;
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

  sendNotificationToCustomer({
    customerId: updated.customerId,
    title: "Sales Order Rejected",
    message: `Order #${updated.orderNumber} was rejected: ${reason || 'No reason provided'}`,
    type: "SALES_ORDER_REJECTED",
    createdById: userId,
  });

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

  sendNotificationToCustomer({
    customerId: updated.customerId,
    title: "Sales Order Adjustment Requested",
    message: `Sales representative requested adjustment for order #${updated.orderNumber}: ${reason || 'Review required'}`,
    type: "SALES_ORDER_ADJUSTMENT",
    createdById: userId,
  });

  return updated;
}
