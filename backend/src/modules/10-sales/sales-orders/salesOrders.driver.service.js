import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";
import { validateStatusTransition, recordStatusChange } from "./salesOrders.status.service.js";

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
    throw new AppError("User record not found", 404);
  }

  const isPrivileged = dbUser.userRoles?.some((ur) =>
    ["ADMIN", "SUPER_ADMIN", "WAREHOUSE_MANAGER"].includes(ur.role.name)
  );

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
  proofs: true,
};

export async function getAssignedDeliveries(reqQuery, user) {
  const page = parseInt(reqQuery.page, 10) || 1;
  const limit = parseInt(reqQuery.limit, 10) || 10;
  const { status } = reqQuery;

  const { employee, isPrivileged } = await resolveUserAndEmployee(user);

  const where = {
    isArchived: false,
  };

  if (!isPrivileged && employee) {
    where.driverId = employee.id;
  }

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
  const { employee, isPrivileged } = await resolveUserAndEmployee(user);

  const where = { id: deliveryId };
  if (!isPrivileged && employee) {
    where.driverId = employee.id;
  }

  const delivery = await prisma.delivery.findFirst({
    where,
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

export async function startDelivery(deliveryId, userArg) {
  const { user: dbUser, employee, isPrivileged } = await resolveUserAndEmployee(userArg);

  const where = { id: deliveryId };
  if (!isPrivileged && employee) {
    where.driverId = employee.id;
  }

  const delivery = await prisma.delivery.findFirst({
    where,
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

  const actorRole = isPrivileged ? "ADMIN" : "DRIVER";
  await validateStatusTransition("DELIVERY_SCHEDULED", "OUT_FOR_DELIVERY", actorRole);

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
      dbUser.id
    );

    return updated;
  });

  return updatedDelivery;
}

export async function completeDelivery(deliveryId, proofData, userArg) {
  const { user: dbUser, employee, isPrivileged } = await resolveUserAndEmployee(userArg);

  const where = { id: deliveryId };
  if (!isPrivileged && employee) {
    where.driverId = employee.id;
  }

  const delivery = await prisma.delivery.findFirst({
    where,
    include: {
      salesOrder: true,
      driver: { include: { person: true } },
    },
  });

  if (!delivery) {
    throw new AppError("Delivery not found or not assigned to you", 404);
  }

  if (delivery.driverConfirmedAt) {
    throw new AppError("Delivery handover has already been confirmed by the driver", 400);
  }

  const currentStatus = delivery.salesOrder.status;
  if (!["OUT_FOR_DELIVERY", "DELIVERED"].includes(currentStatus)) {
    throw new AppError(
      `Sales order status must be OUT_FOR_DELIVERY or DELIVERED to confirm handover, but was ${currentStatus}`,
      400
    );
  }

  const isCustomerAlreadyApproved = Boolean(delivery.customerConfirmedAt);
  const nextStatus = isCustomerAlreadyApproved ? "COMPLETED" : "DELIVERED";
  const actorRole = isPrivileged ? "ADMIN" : "DRIVER";

  await validateStatusTransition(currentStatus, nextStatus, actorRole);

  const updatedDelivery = await prisma.$transaction(async (tx) => {
    const updated = await tx.delivery.update({
      where: { id: deliveryId },
      data: {
        status: "DELIVERED",
        driverConfirmedAt: new Date(),
        driverNotes: proofData?.notes || null,
        deliveryDate: isCustomerAlreadyApproved ? new Date() : (delivery.deliveryDate || new Date()),
      },
      include: DELIVERY_INCLUDE,
    });

    if (proofData) {
      await tx.deliveryProof.create({
        data: {
          deliveryId,
          proofType: proofData.proofType || "DRIVER_HANDOVER",
          recipientName: proofData.recipientName || null,
          notes: proofData.notes || null,
          createdById: dbUser.id,
        },
      });
    }

    await tx.salesOrder.update({
      where: { id: delivery.salesOrderId },
      data: {
        status: nextStatus,
      },
    });

    const driverName = delivery.driver?.person
      ? `${delivery.driver.person.firstName} ${delivery.driver.person.lastName || ""}`.trim()
      : "Assigned Driver";

    const reason = isCustomerAlreadyApproved
      ? `Delivery handover dual-confirmed by both Driver (${driverName}) and Customer. Sales order COMPLETED.`
      : `Driver (${driverName}) confirmed delivery handover. Waiting for Customer confirmation to complete sales order.`;

    await recordStatusChange(
      delivery.salesOrderId,
      currentStatus,
      nextStatus,
      isCustomerAlreadyApproved ? "COMPLETED" : "DELIVERED",
      reason,
      dbUser.id
    );

    return updated;
  });

  return updatedDelivery;
}
