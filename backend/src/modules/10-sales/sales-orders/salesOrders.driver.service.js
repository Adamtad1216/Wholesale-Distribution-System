import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";
import { validateStatusTransition, recordStatusChange } from "./salesOrders.status.service.js";

async function getEmployeeForUser(user) {
  let personId;

  if (typeof user === "string") {
    const dbUser = await prisma.user.findUnique({
      where: { id: user },
      select: { personId: true },
    });

    if (!dbUser) {
      throw new AppError("User record not found", 404);
    }

    personId = dbUser.personId;
  } else {
    personId = user.personId;
  }

  const employee = await prisma.employee.findFirst({
    where: {
      personId,
      isArchived: false,
    },
  });

  if (!employee) {
    throw new AppError("Employee record not found for this user", 404);
  }

  return employee;
}

const DELIVERY_INCLUDE = {
  salesOrder: {
    include: {
      customer: true,
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
};

export async function getAssignedDeliveries(reqQuery, user) {
  const page = parseInt(reqQuery.page, 10) || 1;
  const limit = parseInt(reqQuery.limit, 10) || 10;
  const { status } = reqQuery;

  const employee = await getEmployeeForUser(user);

  const where = {
    driverId: employee.id,
    isArchived: false,
  };

  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;

  const [deliveries, total] = await Promise.all([
    prisma.delivery.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        scheduledDate: "asc",
      },
      include: DELIVERY_INCLUDE,
    }),
    prisma.delivery.count({ where }),
  ]);

  return {
    data: deliveries,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getDeliveryDetails(deliveryId, user) {
  const employee = await getEmployeeForUser(user);

  const delivery = await prisma.delivery.findFirst({
    where: {
      id: deliveryId,
      driverId: employee.id,
    },
    include: {
      ...DELIVERY_INCLUDE,
      items: {
        include: {
          product: true,
          salesOrderItem: true,
        },
      },
    },
  });

  if (!delivery) {
    throw new AppError("Delivery not found or not assigned to you", 404);
  }

  return delivery;
}

export async function startDelivery(deliveryId, userId) {
  const employee = await getEmployeeForUser(userId);

  const delivery = await prisma.delivery.findFirst({
    where: {
      id: deliveryId,
      driverId: employee.id,
    },
    include: {
      salesOrder: true,
    },
  });

  if (!delivery) {
    throw new AppError("Delivery not found or not assigned to you", 404);
  }

  if (delivery.salesOrder.status !== "DELIVERY_SCHEDULED") {
    throw new AppError(
      `Sales order status must be DELIVERY_SCHEDULED to start delivery, but was ${delivery.salesOrder.status}`,
      400
    );
  }

  await validateStatusTransition("DELIVERY_SCHEDULED", "OUT_FOR_DELIVERY", "DRIVER");

  const updatedDelivery = await prisma.$transaction(async (tx) => {
    const updated = await tx.delivery.update({
      where: { id: deliveryId },
      data: {
        status: "DISPATCHED",
        deliveryDate: new Date(),
      },
      include: DELIVERY_INCLUDE,
    });

    await tx.salesOrder.update({
      where: { id: delivery.salesOrderId },
      data: {
        status: "OUT_FOR_DELIVERY",
      },
    });

    await recordStatusChange(
      delivery.salesOrderId,
      "DELIVERY_SCHEDULED",
      "OUT_FOR_DELIVERY",
      "OUT_FOR_DELIVERY",
      null,
      userId
    );

    return updated;
  });

  return updatedDelivery;
}

export async function completeDelivery(deliveryId, proofData, userId) {
  const employee = await getEmployeeForUser(userId);

  const delivery = await prisma.delivery.findFirst({
    where: {
      id: deliveryId,
      driverId: employee.id,
    },
    include: {
      salesOrder: true,
    },
  });

  if (!delivery) {
    throw new AppError("Delivery not found or not assigned to you", 404);
  }

  if (delivery.salesOrder.status !== "OUT_FOR_DELIVERY") {
    throw new AppError(
      `Sales order status must be OUT_FOR_DELIVERY to complete delivery, but was ${delivery.salesOrder.status}`,
      400
    );
  }

  await validateStatusTransition("OUT_FOR_DELIVERY", "DELIVERED", "DRIVER");

  const updatedDelivery = await prisma.$transaction(async (tx) => {
    const updated = await tx.delivery.update({
      where: { id: deliveryId },
      data: {
        status: "DELIVERED",
        deliveryDate: new Date(),
      },
      include: DELIVERY_INCLUDE,
    });

    if (proofData) {
      await tx.deliveryProof.create({
        data: {
          deliveryId,
          proofType: proofData.proofType,
          recipientName: proofData.recipientName,
          notes: proofData.notes,
        },
      });
    }

    await tx.salesOrder.update({
      where: { id: delivery.salesOrderId },
      data: {
        status: "DELIVERED",
      },
    });

    await recordStatusChange(
      delivery.salesOrderId,
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "DELIVERED",
      null,
      userId
    );

    return updated;
  });

  return updatedDelivery;
}
