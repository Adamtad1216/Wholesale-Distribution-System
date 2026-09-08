import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";
import {
  recordStatusChange,
  getSalesOrderWithHistory,
  validateStatusTransition,
} from "./salesOrders.status.service.js";
import { hasPermission } from "../../../middleware/permission.middleware.js";
import {
  sendNotificationToCustomer,
  sendNotificationToEmployee,
  sendNotificationToRoles,
} from "../../../utils/notifications.js";

function hasRole(userRoles, roleName) {
  return (userRoles || []).some((ur) => (ur.role?.name || ur.role || ur) === roleName);
}

function ensureWarehouseManagerOrAdmin(userRolesOrUser) {
  const userObj = Array.isArray(userRolesOrUser) ? { userRoles: userRolesOrUser } : userRolesOrUser;
  const userRoles = userObj?.userRoles || [];
  const isAuthorized =
    hasRole(userRoles, "WAREHOUSE_MANAGER") ||
    hasRole(userRoles, "ADMIN") ||
    hasRole(userRoles, "SUPER_ADMIN") ||
    hasPermission(userObj, "preparation_tasks:create") ||
    hasPermission(userObj, "preparation_tasks:manage_all") ||
    hasPermission(userObj, "deliveries:create") ||
    hasPermission(userObj, "deliveries:manage_all");

  if (!isAuthorized) {
    throw new AppError("Only authorized logistics personnel, warehouse managers, and admins can perform this action", 403);
  }
}

function getUserRoles(user) {
  return user?.userRoles || [];
}

export async function getApprovedOrders(reqQuery, user) {
  const page = parseInt(reqQuery.page, 10) || 1;
  const limit = parseInt(reqQuery.limit, 10) || 10;
  const { status, customerId, warehouseId } = reqQuery;

  const where = {
    status: status || "SALES_REP_APPROVED",
    isArchived: false,
  };

  if (customerId) {
    where.customerId = customerId;
  }

  const roles = getUserRoles(user);
  const isGlobalView =
    hasRole(roles, "ADMIN") ||
    hasRole(roles, "SUPER_ADMIN") ||
    hasPermission(user, "sales_orders:read_all");

  if (!isGlobalView) {
    if (hasRole(roles, "WAREHOUSE_MANAGER") || hasPermission(user, "preparation_tasks:manage_all")) {
      let managedWarehouseIds = user.employee?.managedWarehouses?.map((w) => w.id) || [];
      if (managedWarehouseIds.length === 0) {
        const employee = await prisma.employee.findFirst({
          where: { personId: user.personId, status: "ACTIVE" },
          include: { managedWarehouses: true },
        });

        managedWarehouseIds = employee?.managedWarehouses?.map((w) => w.id) || [];
      }
      if (managedWarehouseIds.length > 0) {
        where.warehouseId = {
          in: managedWarehouseIds,
        };
      }
    }
  }

  if (hasRole(roles, "ADMIN") && warehouseId) {
    where.warehouseId = warehouseId;
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.salesOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
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
    }),
    prisma.salesOrder.count({ where }),
  ]);

  return {
    data: orders,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function schedulePreparation(salesOrderId, data, user) {
  const { warehouseId, storeKeeperId, scheduledDate, notes } = data;

  const roles = getUserRoles(user);
  ensureWarehouseManagerOrAdmin(roles);

  const salesOrder = await getSalesOrderWithHistory(salesOrderId);

  if (salesOrder.status !== "SALES_REP_APPROVED") {
    throw new AppError("Sales order must be in SALES_REP_APPROVED status to schedule preparation", 400);
  }

  if (!hasRole(roles, "ADMIN") && !hasRole(roles, "SUPER_ADMIN")) {
    let managedWarehouseIds = user.employee?.managedWarehouses?.map((w) => w.id) || [];
    if (managedWarehouseIds.length === 0) {
      const employee = await prisma.employee.findFirst({
        where: { personId: user.personId, status: "ACTIVE" },
        include: { managedWarehouses: true },
      });
      managedWarehouseIds = employee?.managedWarehouses?.map((w) => w.id) || [];
    }
    if (!managedWarehouseIds.includes(warehouseId)) {
      throw new AppError("You can only schedule preparation for warehouses you manage", 403);
    }
  }

  const warehouse = await prisma.warehouse.findFirst({
    where: {
      id: warehouseId,
      isArchived: false,
      status: "ACTIVE",
    },
  });

  if (!warehouse) {
    throw new AppError("Warehouse not found or not active", 404);
  }

  const storeKeeper = await prisma.employee.findFirst({
    where: {
      id: storeKeeperId,
      isArchived: false,
      status: "ACTIVE",
    },
    include: {
      person: true,
    },
  });

  if (!storeKeeper) {
    throw new AppError("Store keeper not found or not active", 404);
  }

  const preparationTask = await prisma.preparationTask.create({
    data: {
      salesOrderId,
      warehouseId,
      storeKeeperId,
      scheduledBy: user.id,
      scheduledDate: new Date(scheduledDate),
      notes: notes || null,
      items: {
        create: salesOrder.items.map((item) => ({
          salesOrderItemId: item.id,
          productId: item.productId,
          quantity: item.quantity,
          preparedQuantity: 0,
          status: "PENDING",
        })),
      },
    },
    include: {
      items: {
        include: {
          product: true,
          salesOrderItem: true,
        },
      },
      warehouse: true,
      storeKeeper: {
        include: {
          person: true,
        },
      },
      salesOrder: true,
    },
  });

  await prisma.salesOrder.update({
    where: { id: salesOrderId },
    data: {
      status: "WAREHOUSE_PREPARATION_SCHEDULED",
    },
  });

  await recordStatusChange(
    salesOrderId,
    "SALES_REP_APPROVED",
    "WAREHOUSE_PREPARATION_SCHEDULED",
    "WAREHOUSE_PREPARATION_SCHEDULED",
    null,
    user.id
  );

  sendNotificationToEmployee({
    employeeId: storeKeeperId,
    title: "Warehouse Preparation Task Assigned",
    message: `You have been assigned to prepare items for order #${salesOrder.orderNumber}.`,
    type: "PREPARATION_TASK_ASSIGNED",
    createdById: user.id,
  });

  sendNotificationToCustomer({
    customerId: salesOrder.customerId,
    title: "Order In Preparation",
    message: `Items for order #${salesOrder.orderNumber} are now being picked and prepared at the warehouse.`,
    type: "ORDER_PREPARING",
    createdById: user.id,
  });

  return preparationTask;
}

export async function scheduleDelivery(salesOrderId, data, user) {
  const { driverId, vehicleId, scheduledDate } = data;

  const roles = getUserRoles(user);
  ensureWarehouseManagerOrAdmin(roles);

  const salesOrder = await getSalesOrderWithHistory(salesOrderId);

  if (salesOrder.status !== "READY_FOR_DELIVERY") {
    throw new AppError("Sales order must be in READY_FOR_DELIVERY status to schedule delivery", 400);
  }

  const driver = await prisma.employee.findFirst({
    where: {
      id: driverId,
      isArchived: false,
      status: "ACTIVE",
    },
    include: {
      person: true,
    },
  });

  if (!driver) {
    throw new AppError("Driver not found or not active", 404);
  }

  if (vehicleId) {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        isArchived: false,
      },
    });

    if (!vehicle) {
      throw new AppError("Vehicle not found", 404);
    }
  }

  const deliveryNumber = `DEL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const delivery = await prisma.delivery.create({
    data: {
      deliveryNumber,
      salesOrder: { connect: { id: salesOrderId } },
      customer: { connect: { id: salesOrder.customerId } },
      warehouse: { connect: { id: salesOrder.warehouseId } },
      driver: { connect: { id: driverId } },
      ...(vehicleId ? { vehicle: { connect: { id: vehicleId } } } : {}),
      scheduledDate: new Date(scheduledDate),
      status: "SCHEDULED",
      deliveryAddress: salesOrder.deliveryAddressText || `${salesOrder.customer.person.firstName} ${salesOrder.customer.person.lastName}`,
      deliveryLatitude: salesOrder.deliveryLatitude,
      deliveryLongitude: salesOrder.deliveryLongitude,
      scheduledByUser: { connect: { id: user.id } },
      notes: data.notes || null,
      items: {
        create: salesOrder.items.map((item) => ({
          salesOrderItemId: item.id,
          productId: item.productId,
          quantity: item.quantity,
          deliveredQuantity: 0,
          returnedQuantity: 0,
        })),
      },
    },
    include: {
      salesOrder: {
        include: {
          customer: {
            include: {
              person: true,
              organization: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
          warehouse: true,
        },
      },
      driver: {
        include: {
          person: true,
        },
      },
      vehicle: true,
      customer: true,
      items: {
        include: {
          product: true,
          salesOrderItem: true,
        },
      },
    },
  });

  await prisma.salesOrder.update({
    where: { id: salesOrderId },
    data: {
      status: "DELIVERY_SCHEDULED",
    },
  });

  await recordStatusChange(
    salesOrderId,
    "READY_FOR_DELIVERY",
    "DELIVERY_SCHEDULED",
    "DELIVERY_SCHEDULED",
    null,
    user.id
  );

  sendNotificationToEmployee({
    employeeId: driverId,
    title: "Delivery Run Assigned",
    message: `Delivery run for order #${salesOrder.orderNumber} assigned to you.`,
    type: "DELIVERY_ASSIGNED",
    createdById: user.id,
  });

  sendNotificationToCustomer({
    customerId: salesOrder.customerId,
    title: "Order Scheduled for Delivery",
    message: `Your order #${salesOrder.orderNumber} has been scheduled for delivery dispatch.`,
    type: "DELIVERY_SCHEDULED",
    createdById: user.id,
  });

  return delivery;
}

export async function confirmCustomerPickup(salesOrderId, payload = {}, user) {
  if (!user) {
    throw new AppError("Authentication required", 401);
  }

  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: {
      customer: {
        include: {
          person: true,
          organization: true,
        },
      },
      warehouse: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!salesOrder) {
    throw new AppError("Sales order not found", 404);
  }

  if (salesOrder.fulfillmentType !== "SELF_PICKUP") {
    throw new AppError("This sales order is not configured for self-pickup", 400);
  }

  if (salesOrder.status !== "READY_FOR_PICKUP") {
    throw new AppError(
      `Sales order must be in READY_FOR_PICKUP status to confirm pickup, but was ${salesOrder.status}`,
      400
    );
  }

  if (salesOrder.pickedUpAt) {
    throw new AppError("Pickup has already been confirmed by the warehouse storekeeper", 400);
  }

  const roles = getUserRoles(user);
  const isAuthorized =
    hasRole(roles, "ADMIN") ||
    hasRole(roles, "SUPER_ADMIN") ||
    hasRole(roles, "WAREHOUSE_MANAGER") ||
    hasRole(roles, "STORE_KEEPER") ||
    hasRole(roles, "STOREKEEPER") ||
    hasPermission(user, "preparation_tasks:update") ||
    hasPermission(user, "warehouses:read") ||
    hasPermission(user, "deliveries:update");

  if (!isAuthorized) {
    throw new AppError("You are not authorized to confirm warehouse pickup for this order", 403);
  }

  const isCustomerAlreadyApproved = Boolean(salesOrder.customerPickupConfirmedAt);
  const nextStatus = isCustomerAlreadyApproved ? "COMPLETED" : "READY_FOR_PICKUP";
  const actorRole = hasRole(roles, "ADMIN") || hasRole(roles, "SUPER_ADMIN") ? "ADMIN" : "STORE_KEEPER";

  if (isCustomerAlreadyApproved) {
    await validateStatusTransition("READY_FOR_PICKUP", "COMPLETED", actorRole);
  }

  const recipientName =
    payload.recipientName?.trim() ||
    salesOrder.pickupPersonName ||
    salesOrder.customer?.organization?.name ||
    (salesOrder.customer?.person
      ? `${salesOrder.customer.person.firstName} ${salesOrder.customer.person.lastName || ""}`.trim()
      : "Customer");

  const recipientPhone = payload.recipientPhone?.trim() || salesOrder.pickupPhone || null;
  const vehiclePlate = payload.vehiclePlateNumber?.trim() || salesOrder.pickupVehiclePlate || null;
  const notes = payload.notes?.trim() || salesOrder.pickupNotes || null;

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updated = await tx.salesOrder.update({
      where: { id: salesOrderId },
      data: {
        status: nextStatus,
        pickedUpAt: new Date(),
        pickedUpBy: user.id,
        pickupPersonName: recipientName,
        pickupPhone: recipientPhone,
        pickupVehiclePlate: vehiclePlate,
        pickupNotes: notes,
      },
      include: {
        customer: {
          include: {
            person: true,
            organization: true,
          },
        },
        warehouse: true,
        items: true,
      },
    });

    if (isCustomerAlreadyApproved) {
      await recordStatusChange(
        salesOrderId,
        "READY_FOR_PICKUP",
        "COMPLETED",
        "COMPLETED",
        `Warehouse self-pickup dual-confirmed by Storekeeper (${user.username || user.id}) and Customer (${salesOrder.customerPickupRecipientName || 'Customer'}). Sales order COMPLETED.`,
        user.id
      );
    } else {
      await recordStatusChange(
        salesOrderId,
        "READY_FOR_PICKUP",
        "READY_FOR_PICKUP",
        "READY_FOR_PICKUP",
        `Storekeeper (${user.username || user.id}) verified collector (${recipientName}) and confirmed physical handover. Awaiting Customer sign-off to complete sales order.`,
        user.id
      );
    }

    return updated;
  });

  if (isCustomerAlreadyApproved) {
    sendNotificationToCustomer({
      customerId: salesOrder.customerId,
      title: "Order Picked Up & Completed",
      message: `Your order #${salesOrder.orderNumber} self-pickup has been dual-confirmed and completed. Thank you!`,
      type: "SALES_ORDER_COMPLETED",
      createdById: user.id,
    });

    sendNotificationToRoles({
      roleNames: ["WAREHOUSE_MANAGER", "ADMIN", "SUPER_ADMIN"],
      title: "Order Self-Pickup Completed",
      message: `Order #${salesOrder.orderNumber} self-pickup dual-confirmed by both Storekeeper and Customer. Order completed.`,
      type: "SALES_ORDER_COMPLETED",
      createdById: user.id,
    });
  } else {
    sendNotificationToCustomer({
      customerId: salesOrder.customerId,
      title: "Warehouse Handover Verified - Please Sign Off",
      message: `Warehouse storekeeper has verified and handed over items for Order #${salesOrder.orderNumber}. Please confirm receipt on your portal to complete your order.`,
      type: "SALES_ORDER_PICKUP_READY",
      createdById: user.id,
    });
  }

  return updatedOrder;
}

export async function confirmCustomerPickupReceipt(salesOrderId, payload = {}, user) {
  if (!user) {
    throw new AppError("Authentication required", 401);
  }

  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: {
      customer: {
        include: {
          person: true,
          organization: true,
        },
      },
      warehouse: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!salesOrder) {
    throw new AppError("Sales order not found", 404);
  }

  if (salesOrder.fulfillmentType !== "SELF_PICKUP") {
    throw new AppError("This sales order is not configured for self-pickup", 400);
  }

  if (salesOrder.status !== "READY_FOR_PICKUP") {
    throw new AppError(
      `Sales order must be in READY_FOR_PICKUP status to confirm collection receipt, but was ${salesOrder.status}`,
      400
    );
  }

  if (salesOrder.customerPickupConfirmedAt) {
    throw new AppError("Collection receipt has already been confirmed by the customer", 400);
  }

  const isPrivileged =
    user.userRoles?.some((ur) =>
      ["ADMIN", "SUPER_ADMIN"].includes(ur.role?.name || ur.role)
    ) ||
    hasPermission(user, "deliveries:confirm_any");

  let userCustomerId = user.customer?.id || user.person?.customer?.id;
  if (!userCustomerId && user.personId) {
    const custRecord = await prisma.customer.findFirst({
      where: { personId: user.personId },
      select: { id: true },
    });
    userCustomerId = custRecord?.id;
  }

  const isCustomerOwner =
    salesOrder.createdById === user.id ||
    salesOrder.customer?.personId === user.personId ||
    (userCustomerId && salesOrder.customerId === userCustomerId);

  if (!isPrivileged && !isCustomerOwner) {
    throw new AppError("You are not authorized to confirm pickup receipt for this sales order", 403);
  }

  const isStorekeeperAlreadyApproved = Boolean(salesOrder.pickedUpAt);
  const nextStatus = isStorekeeperAlreadyApproved ? "COMPLETED" : "READY_FOR_PICKUP";
  const actorRole = isPrivileged ? "ADMIN" : "CUSTOMER";

  if (isStorekeeperAlreadyApproved) {
    await validateStatusTransition("READY_FOR_PICKUP", "COMPLETED", actorRole);
  }

  const customerName =
    payload.recipientName?.trim() ||
    salesOrder.customer?.organization?.name ||
    (salesOrder.customer?.person
      ? `${salesOrder.customer.person.firstName} ${salesOrder.customer.person.lastName || ""}`.trim()
      : user.username || "Customer");

  const notes = payload.notes?.trim() || null;

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updated = await tx.salesOrder.update({
      where: { id: salesOrderId },
      data: {
        status: nextStatus,
        customerPickupConfirmedAt: new Date(),
        customerPickupConfirmedBy: user.id,
        customerPickupRecipientName: customerName,
        customerPickupNotes: notes,
      },
      include: {
        customer: {
          include: {
            person: true,
            organization: true,
          },
        },
        warehouse: true,
        items: true,
      },
    });

    if (isStorekeeperAlreadyApproved) {
      await recordStatusChange(
        salesOrderId,
        "READY_FOR_PICKUP",
        "COMPLETED",
        "COMPLETED",
        `Warehouse self-pickup dual-confirmed by Customer (${customerName}) and Storekeeper. Sales order COMPLETED.`,
        user.id
      );
    } else {
      await recordStatusChange(
        salesOrderId,
        "READY_FOR_PICKUP",
        "READY_FOR_PICKUP",
        "READY_FOR_PICKUP",
        `Customer (${customerName}) confirmed collection & acceptance of goods. Awaiting Storekeeper verification sign-off to complete sales order.`,
        user.id
      );
    }

    return updated;
  });

  if (isStorekeeperAlreadyApproved) {
    sendNotificationToCustomer({
      customerId: salesOrder.customerId,
      title: "Order Picked Up & Completed",
      message: `Your order #${salesOrder.orderNumber} self-pickup has been dual-confirmed and completed. Thank you!`,
      type: "SALES_ORDER_COMPLETED",
      createdById: user.id,
    });

    sendNotificationToRoles({
      roleNames: ["STORE_KEEPER", "STOREKEEPER", "WAREHOUSE_MANAGER", "ADMIN", "SUPER_ADMIN"],
      title: "Customer Pickup Dual-Confirmed",
      message: `Customer ${customerName} confirmed goods receipt for Order #${salesOrder.orderNumber}. Order completed.`,
      type: "SALES_ORDER_COMPLETED",
      createdById: user.id,
    });
  } else {
    sendNotificationToRoles({
      roleNames: ["STORE_KEEPER", "STOREKEEPER", "WAREHOUSE_MANAGER", "ADMIN", "SUPER_ADMIN"],
      title: "Customer Signed Off Pickup - Awaiting Storekeeper",
      message: `Customer ${customerName} has signed off collection for Order #${salesOrder.orderNumber} at ${salesOrder.warehouse?.name || "warehouse"}. Please verify and sign off handover.`,
      type: "SALES_ORDER_PICKUP_READY",
      createdById: user.id,
    });
  }

  return updatedOrder;
}

