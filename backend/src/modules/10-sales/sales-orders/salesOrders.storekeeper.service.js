import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";
import { validateStatusTransition, recordStatusChange } from "./salesOrders.status.service.js";
import { hasPermission } from "../../../middleware/permission.middleware.js";
import {
  sendNotificationToCustomer,
  sendNotificationToEmployee,
  sendNotificationToRoles,
} from "../../../utils/notifications.js";


async function resolveUserAndEmployee(user) {
  let dbUser;
  if (typeof user === "string") {
    dbUser = await prisma.user.findUnique({
      where: { id: user },
      include: {
        person: true,
        userRoles: { include: { role: true } },
      },
    });
  } else {
    dbUser = user;
    if (!dbUser.userRoles) {
      dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          person: true,
          userRoles: { include: { role: true } },
        },
      });
    }
  }

  if (!dbUser) {
    throw new AppError("User not found", 404);
  }

  const isPrivileged =
    dbUser.userRoles?.some((ur) =>
      ["ADMIN", "SUPER_ADMIN", "WAREHOUSE_MANAGER"].includes(ur.role?.name || ur.role)
    ) ||
    hasPermission(dbUser, "preparation_tasks:manage_all");


  let employee = null;
  if (dbUser.personId) {
    employee = await prisma.employee.findFirst({
      where: {
        personId: dbUser.personId,
        isArchived: false,
      },
    });
  }

  if (!employee && !isPrivileged) {
    throw new AppError("Employee record not found for this user", 404);
  }

  return { user: dbUser, employee, isPrivileged };
}

async function getEmployeeForUser(user) {
  const { employee, isPrivileged } = await resolveUserAndEmployee(user);
  if (!employee && isPrivileged) return null;
  return employee;
}

export async function getAssignedTasks(reqQuery, user) {
  const page = parseInt(reqQuery.page, 10) || 1;
  const limit = parseInt(reqQuery.limit, 10) || 10;
  const { status } = reqQuery;

  const { employee, isPrivileged } = await resolveUserAndEmployee(user);

  const where = {
    isArchived: false,
  };

  if (!isPrivileged && employee) {
    where.storeKeeperId = employee.id;
  }

  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    prisma.preparationTask.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        salesOrder: {
          include: {
            customer: {
              include: {
                person: true,
              },
            },
            items: {
              include: {
                product: true,
              },
            },
            warehouse: true,
            deliveries: {
              include: {
                driver: {
                  include: {
                    person: true,
                  },
                },
                vehicle: true,
              },
            },
          },
        },
        warehouse: true,
        storeKeeper: {
          include: {
            person: true,
          },
        },
        items: {
          include: {
            product: true,
            salesOrderItem: true,
          },
        },
      },
    }),
    prisma.preparationTask.count({ where }),
  ]);

  return {
    data: tasks,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTaskDetails(taskId, user) {
  const { employee, isPrivileged } = await resolveUserAndEmployee(user);

  const where = { id: taskId };
  if (!isPrivileged && employee) {
    where.storeKeeperId = employee.id;
  }

  const task = await prisma.preparationTask.findFirst({
    where,
    include: {
      salesOrder: {
        include: {
          customer: {
            include: {
              person: true,
            },
          },
          items: {
            include: {
              product: true,
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
            },
          },
        },
      },
      warehouse: true,
      storeKeeper: {
        include: {
          person: true,
        },
      },
      items: {
        include: {
          product: true,
          salesOrderItem: true,
        },
      },
    },
  });

  if (!task) {
    throw new AppError("Preparation task not found or not assigned to you", 404);
  }

  return task;
}

export async function markItemsPrepared(taskId, items, user) {
  const { user: dbUser, employee, isPrivileged } = await resolveUserAndEmployee(user);

  const where = { id: taskId };
  if (!isPrivileged && employee) {
    where.storeKeeperId = employee.id;
  }

  const task = await prisma.preparationTask.findFirst({
    where,
    include: {
      items: true,
    },
  });

  if (!task) {
    throw new AppError("Preparation task not found or not assigned to you", 404);
  }

  for (const item of items) {
    const taskItem = task.items.find((ti) => ti.id === item.preparationTaskItemId);

    if (!taskItem) {
      throw new AppError(`Preparation task item ${item.preparationTaskItemId} not found in this task`, 404);
    }

    const preparedQuantity = item.preparedQuantity;
    const status = preparedQuantity >= Number(taskItem.quantity) ? "PREPARED" : "PARTIAL";

    await prisma.preparationTaskItem.update({
      where: { id: item.preparationTaskItemId },
      data: {
        preparedQuantity,
        status,
      },
    });
  }

  const updatedItems = await prisma.preparationTaskItem.findMany({
    where: {
      preparationTaskId: taskId,
    },
  });

  const allPrepared = updatedItems.every((ti) => ti.status === "PREPARED");

  if (allPrepared) {
    await prisma.preparationTask.update({
      where: { id: taskId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id: task.salesOrderId },
    });

    if (salesOrder) {
      const isPickup = salesOrder.fulfillmentType === "SELF_PICKUP";
      const targetStatus = isPickup ? "READY_FOR_PICKUP" : "READY_FOR_DELIVERY";

      if (salesOrder.status !== targetStatus) {
        await prisma.salesOrder.update({
          where: { id: task.salesOrderId },
          data: {
            status: targetStatus,
          },
        });

        await recordStatusChange(
          task.salesOrderId,
          "PREPARING",
          targetStatus,
          targetStatus,
          isPickup ? "Preparation completed. Staged for customer warehouse collection." : null,
          dbUser.id
        );
      }
    }
  }

  const updatedTask = await prisma.preparationTask.findUnique({
    where: { id: taskId },
    include: {
      salesOrder: {
        include: {
          customer: {
            include: {
              person: true,
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
      warehouse: true,
      storeKeeper: {
        include: {
          person: true,
        },
      },
      items: {
        include: {
          product: true,
          salesOrderItem: true,
        },
      },
    },
  });

  return updatedTask;
}

export async function completeTask(taskId, userArg) {
  const { user: dbUser, employee, isPrivileged } = await resolveUserAndEmployee(userArg);

  const where = { id: taskId };
  if (!isPrivileged && employee) {
    where.storeKeeperId = employee.id;
  }

  const task = await prisma.preparationTask.findFirst({
    where,
    include: {
      items: true,
    },
  });

  if (!task) {
    throw new AppError("Preparation task not found or not assigned to you", 404);
  }

  // If any items are pending or have 0 prepared, auto-fulfill them to match full quantity
  for (const item of task.items) {
    if (Number(item.preparedQuantity) <= 0 || item.status !== "PREPARED") {
      await prisma.preparationTaskItem.update({
        where: { id: item.id },
        data: {
          preparedQuantity: item.quantity,
          status: "PREPARED",
        },
      });
    }
  }

  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: task.salesOrderId },
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

  if (!salesOrder) {
    throw new AppError("Related sales order not found", 404);
  }

  const actorRole = isPrivileged ? "ADMIN" : "STORE_KEEPER";
  const isPickup = salesOrder.fulfillmentType === "SELF_PICKUP";

  // 1. Mark preparation task as completed
  await prisma.preparationTask.update({
    where: { id: taskId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  if (isPickup) {
    // For self-pickup orders, transition directly to READY_FOR_PICKUP without driver/vehicle assignment
    await validateStatusTransition(salesOrder.status, "READY_FOR_PICKUP", actorRole);

    await prisma.salesOrder.update({
      where: { id: task.salesOrderId },
      data: {
        status: "READY_FOR_PICKUP",
      },
    });

    await recordStatusChange(
      task.salesOrderId,
      salesOrder.status,
      "READY_FOR_PICKUP",
      "READY_FOR_PICKUP",
      "Preparation completed. Staged for customer warehouse collection.",
      dbUser.id
    );
  } else {
    // 2. Automatically query an active qualified driver for delivery
    const driver = await prisma.employee.findFirst({
      where: {
        status: "ACTIVE",
        isArchived: false,
        OR: [
          {
            person: {
              user: {
                userRoles: {
                  some: {
                    role: {
                      name: "DRIVER",
                    },
                  },
                },
              },
            },
          },
          {
            driverLicenseNumber: { not: null },
          },
        ],
      },
      include: {
        person: true,
      },
      orderBy: { employeeCode: "asc" },
    });

    // Query an available fleet vehicle if exists
    const vehicle = await prisma.vehicle.findFirst({
      where: { status: "ACTIVE", isArchived: false },
      orderBy: { plateNumber: "asc" },
    });

    if (driver) {
      await validateStatusTransition(salesOrder.status, "DELIVERY_SCHEDULED", actorRole);

      const deliveryNumber = `DEL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const scheduledDate = salesOrder.requiredDate ? new Date(salesOrder.requiredDate) : new Date();
      const recipientName =
        salesOrder.customer?.organization?.name ||
        (salesOrder.customer?.person
          ? `${salesOrder.customer.person.firstName} ${salesOrder.customer.person.lastName || ""}`.trim()
          : "Customer");

      await prisma.delivery.create({
        data: {
          deliveryNumber,
          salesOrder: { connect: { id: task.salesOrderId } },
          customer: { connect: { id: salesOrder.customerId } },
          warehouse: { connect: { id: salesOrder.warehouseId } },
          driver: { connect: { id: driver.id } },
          ...(vehicle ? { vehicle: { connect: { id: vehicle.id } } } : {}),
          scheduledDate,
          status: "SCHEDULED",
          deliveryAddress: salesOrder.deliveryAddressText || recipientName,
          deliveryLatitude: salesOrder.deliveryLatitude,
          deliveryLongitude: salesOrder.deliveryLongitude,
          scheduledByUser: { connect: { id: dbUser.id } },
          notes: "Automated driver assignment upon storekeeper packaging completion",
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
      });

      await prisma.salesOrder.update({
        where: { id: task.salesOrderId },
        data: {
          status: "DELIVERY_SCHEDULED",
        },
      });

      const driverName = driver.person
        ? `${driver.person.firstName} ${driver.person.lastName || ""}`.trim()
        : driver.employeeCode;

      await recordStatusChange(
        task.salesOrderId,
        salesOrder.status,
        "DELIVERY_SCHEDULED",
        "DELIVERY_SCHEDULED",
        `Preparation completed. Driver ${driverName} automatically assigned for dispatch.`,
        dbUser.id
      );
    } else {
      // Fallback if no active drivers are currently found in database
      await validateStatusTransition(salesOrder.status, "READY_FOR_DELIVERY", actorRole);

      await prisma.salesOrder.update({
        where: { id: task.salesOrderId },
        data: {
          status: "READY_FOR_DELIVERY",
        },
      });

      await recordStatusChange(
        task.salesOrderId,
        salesOrder.status,
        "READY_FOR_DELIVERY",
        "READY_FOR_DELIVERY",
        "Preparation completed. Staged for manual driver assignment.",
        dbUser.id
      );
    }
  }

  const updatedTask = await prisma.preparationTask.findUnique({
    where: { id: taskId },
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
          deliveries: {
            include: {
              driver: {
                include: {
                  person: true,
                },
              },
              vehicle: true,
            },
          },
        },
      },
      warehouse: true,
      storeKeeper: {
        include: {
          person: true,
        },
      },
      items: {
        include: {
          product: true,
          salesOrderItem: true,
        },
      },
    },
  });

  if (isPickup) {
    sendNotificationToCustomer({
      customerId: salesOrder.customerId,
      title: "Order Ready for Pickup",
      message: `Your order #${salesOrder.orderNumber} is prepared and ready for collection at ${salesOrder.warehouse?.name || "the warehouse"}.`,
      type: "ORDER_READY_FOR_PICKUP",
      createdById: dbUser.id,
    });

    sendNotificationToRoles({
      roleNames: ["WAREHOUSE_MANAGER", "ADMIN", "SUPER_ADMIN"],
      title: "Order Ready for Customer Pickup",
      message: `Order #${salesOrder.orderNumber} preparation completed by storekeeper. Ready for collection.`,
      type: "ORDER_READY_FOR_PICKUP",
      createdById: dbUser.id,
    });
  } else {
    sendNotificationToCustomer({
      customerId: salesOrder.customerId,
      title: "Order Staged & Ready for Dispatch",
      message: `Items for order #${salesOrder.orderNumber} have been picked, verified, and staged at the warehouse.`,
      type: "ORDER_STAGED",
      createdById: dbUser.id,
    });

    sendNotificationToRoles({
      roleNames: ["WAREHOUSE_MANAGER", "ADMIN", "SUPER_ADMIN"],
      title: "Order Staged for Delivery",
      message: `Order #${salesOrder.orderNumber} preparation completed by storekeeper.`,
      type: "ORDER_STAGED",
      createdById: dbUser.id,
    });
  }

  return updatedTask;
}
