import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";

export async function assignSalesRepresentative() {
  const eligibleEmployees = await prisma.employee.findMany({
    where: {
      isArchived: false,
      status: "ACTIVE",
      isAvailableForSales: true,
      person: {
        user: {
          isNot: null,
        },
      },
    },
    include: {
      person: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (eligibleEmployees.length === 0) {
    throw new AppError("No eligible sales representative available", 409);
  }

  const selected = eligibleEmployees[0];

  return {
    salesRepId: selected.id,
    salesRep: selected,
  };
}
