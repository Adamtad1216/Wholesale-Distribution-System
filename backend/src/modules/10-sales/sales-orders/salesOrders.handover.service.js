import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";
import { validateStatusTransition, recordStatusChange } from "./salesOrders.status.service.js";

/**
 * Customer confirms delivery receipt and handover.
 * If driver has also confirmed, order transitions to COMPLETED.
 * If driver has not yet confirmed, order transitions to DELIVERED and waits for driver confirmation.
 */
export async function confirmCustomerHandover(salesOrderId, payload = {}, user) {
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
      deliveries: {
        where: { isArchived: false },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          driver: { include: { person: true } },
          vehicle: true,
          proofs: true,
        },
      },
    },
  });

  if (!salesOrder) {
    throw new AppError("Sales order not found", 404);
  }

  const isPrivileged = user.userRoles?.some((ur) =>
    ["ADMIN", "SUPER_ADMIN"].includes(ur.role?.name || ur.role)
  );

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
    throw new AppError("You are not authorized to confirm handover for this sales order", 403);
  }

  const latestDelivery = salesOrder.deliveries?.[0];
  if (!latestDelivery) {
    throw new AppError("No delivery run has been scheduled for this sales order", 400);
  }

  if (latestDelivery.customerConfirmedAt) {
    throw new AppError("Delivery receipt has already been confirmed by the customer", 400);
  }

  const currentStatus = salesOrder.status;
  if (!["OUT_FOR_DELIVERY", "DELIVERED"].includes(currentStatus)) {
    throw new AppError(
      `Sales order status must be OUT_FOR_DELIVERY or DELIVERED to confirm handover, but was ${currentStatus}`,
      400
    );
  }

  const isDriverAlreadyApproved = Boolean(latestDelivery.driverConfirmedAt);
  const nextStatus = isDriverAlreadyApproved ? "COMPLETED" : "DELIVERED";
  const actorRole = isPrivileged ? "ADMIN" : "CUSTOMER";

  await validateStatusTransition(currentStatus, nextStatus, actorRole);

  const customerName =
    payload.recipientName?.trim() ||
    salesOrder.customer?.organization?.name ||
    (salesOrder.customer?.person
      ? `${salesOrder.customer.person.firstName} ${salesOrder.customer.person.lastName || ""}`.trim()
      : user.username || "Customer");

  const updatedResult = await prisma.$transaction(async (tx) => {
    const updatedDelivery = await tx.delivery.update({
      where: { id: latestDelivery.id },
      data: {
        customerConfirmedAt: new Date(),
        customerConfirmedBy: user.id,
        customerRecipientName: customerName,
        customerNotes: payload.notes || null,
        deliveryDate: isDriverAlreadyApproved ? new Date() : (latestDelivery.deliveryDate || new Date()),
        status: isDriverAlreadyApproved ? "DELIVERED" : latestDelivery.status,
      },
      include: {
        driver: { include: { person: true } },
        vehicle: true,
        proofs: true,
      },
    });

    await tx.deliveryProof.create({
      data: {
        deliveryId: latestDelivery.id,
        proofType: payload.proofType || "CUSTOMER_ACCEPTANCE",
        recipientName: customerName,
        recipientSignature: payload.recipientSignature || null,
        notes: payload.notes || null,
        createdById: user.id,
      },
    });

    await tx.salesOrder.update({
      where: { id: salesOrderId },
      data: {
        status: nextStatus,
      },
    });

    const driverName = latestDelivery.driver?.person
      ? `${latestDelivery.driver.person.firstName} ${latestDelivery.driver.person.lastName || ""}`.trim()
      : "Assigned Driver";

    const reason = isDriverAlreadyApproved
      ? `Delivery handover dual-confirmed by both Customer (${customerName}) and Driver (${driverName}). Sales order COMPLETED.`
      : `Customer (${customerName}) confirmed delivery receipt. Waiting for Driver confirmation to complete sales order.`;

    await recordStatusChange(
      salesOrderId,
      currentStatus,
      nextStatus,
      isDriverAlreadyApproved ? "COMPLETED" : "DELIVERED",
      reason,
      user.id
    );

    return {
      salesOrderId,
      status: nextStatus,
      delivery: updatedDelivery,
      isDualConfirmed: isDriverAlreadyApproved,
      message: isDriverAlreadyApproved
        ? "Handover dual-confirmed by both Customer and Driver! Sales order is now COMPLETED."
        : "Receipt confirmed! Order will be marked COMPLETED once Driver also confirms handover.",
    };
  });

  return updatedResult;
}
