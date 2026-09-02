import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";
import {
  recordStatusChange,
  getSalesOrderWithHistory,
} from "./salesOrders.status.service.js";

function hasRole(userRoles, roleName) {
  return userRoles.some((ur) => ur.role.name === roleName);
}

function ensureWarehouseManagerOrAdmin(userRoles) {
  if (!hasRole(userRoles, "WAREHOUSE_MANAGER") && !hasRole(userRoles, "ADMIN")) {
    throw new AppError("Only warehouse managers and admins can perform this action", 403);
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

  if (!hasRole(roles, "ADMIN")) {
    if (hasRole(roles, "WAREHOUSE_MANAGER")) {
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

  if (!hasRole(roles, "ADMIN")) {
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

  return delivery;
}
