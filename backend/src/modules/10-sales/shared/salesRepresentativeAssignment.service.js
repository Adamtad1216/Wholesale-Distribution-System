import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";

export async function assignSalesRepresentative(params = {}) {
  const { warehouseId } = params;

  // 1. If warehouse is provided, check if the warehouse has an assigned manager/rep who is available for sales
  if (warehouseId) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: {
        manager: {
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
        },
      },
    });

    if (
      warehouse?.manager &&
      warehouse.manager.status === "ACTIVE" &&
      !warehouse.manager.isArchived &&
      warehouse.manager.isAvailableForSales
    ) {
      return {
        salesRepId: warehouse.manager.id,
        salesRep: warehouse.manager,
      };
    }
  }

  // 2. Query eligible active sales representative employees
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
