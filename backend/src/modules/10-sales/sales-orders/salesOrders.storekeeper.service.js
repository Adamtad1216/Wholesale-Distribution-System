import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";
import { validateStatusTransition, recordStatusChange } from "./salesOrders.status.service.js";

async function getEmployeeForUser(user) {
  const employee = await prisma.employee.findFirst({
    where: {
      personId: user.personId,
      isArchived: false,
    },
  });

  if (!employee) {
    throw new AppError("Employee record not found for this user", 404);
  }

  return employee;
}

export async function getAssignedTasks(reqQuery, user) {
  const page = parseInt(reqQuery.page, 10) || 1;
  const limit = parseInt(reqQuery.limit, 10) || 10;
  const { status } = reqQuery;

  const employee = await getEmployeeForUser(user);

  const where = {
    storeKeeperId: employee.id,
    isArchived: false,
  };

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
  const employee = await getEmployeeForUser(user);

  const task = await prisma.preparationTask.findFirst({
    where: {
      id: taskId,
      storeKeeperId: employee.id,
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
  const employee = await getEmployeeForUser(user);

  const task = await prisma.preparationTask.findFirst({
    where: {
      id: taskId,
      storeKeeperId: employee.id,
    },
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

    if (salesOrder && salesOrder.status !== "READY_FOR_DELIVERY") {
      await prisma.salesOrder.update({
        where: { id: task.salesOrderId },
        data: {
          status: "READY_FOR_DELIVERY",
        },
      });

      await recordStatusChange(
        task.salesOrderId,
        "PREPARING",
        "READY_FOR_DELIVERY",
        "READY_FOR_DELIVERY",
        null,
        user.id
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

export async function completeTask(taskId, userId) {
  const employee = await getEmployeeForUser(userId);

  const task = await prisma.preparationTask.findFirst({
    where: {
      id: taskId,
      storeKeeperId: employee.id,
    },
    include: {
      items: true,
    },
  });

  if (!task) {
    throw new AppError("Preparation task not found or not assigned to you", 404);
  }

  const allItemsValid = task.items.every(
    (item) =>
      (item.status === "PREPARED" || item.status === "PARTIAL") &&
      Number(item.preparedQuantity) > 0
  );

  if (!allItemsValid) {
    throw new AppError("All items must be prepared or partially prepared before completing the task", 400);
  }

  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: task.salesOrderId },
  });

  if (!salesOrder) {
    throw new AppError("Related sales order not found", 404);
  }

  await validateStatusTransition(salesOrder.status, "READY_FOR_DELIVERY", "STORE_KEEPER");

  await prisma.preparationTask.update({
    where: { id: taskId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

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
    null,
    user.id
  );

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
