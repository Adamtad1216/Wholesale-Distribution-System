import prisma from "../../../../config/prisma.js";
import { AppError } from "../../../../utils/errors.js";
import { logAudit } from "../../../../middleware/audit.middleware.js";

export async function createCustomerAddress(customerId, data, createdById, req) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, isArchived: false },
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  if (data.isDefault) {
    await prisma.customerAddress.updateMany({
      where: { customerId, isActive: true },
      data: { isDefault: false },
    });
  }

  const address = await prisma.customerAddress.create({
    data: {
      customerId,
      label: data.label,
      address: data.address,
      city: data.city,
      subCity: data.subCity,
      woreda: data.woreda,
      landmark: data.landmark,
      latitude: data.latitude,
      longitude: data.longitude,
      isDefault: data.isDefault || false,
      isActive: data.isActive !== false,
      createdById,
      updatedById: createdById,
    },
    include: {
      createdBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      updatedBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  await logAudit({
    createdById,
    action: 'CUSTOMER_ADDRESS_CREATED',
    entityType: 'CustomerAddress',
    entityId: address.id,
    newValues: { customerId, address: address.address, isDefault: address.isDefault },
    req,
  });

  return address;
}

export async function getCustomerAddresses(customerId) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, isArchived: false },
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  const addresses = await prisma.customerAddress.findMany({
    where: { customerId, isActive: true },
    include: {
      createdBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      updatedBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: { isDefault: 'desc' },
  });

  return addresses;
}

export async function getCustomerAddressById(customerId, addressId) {
  const address = await prisma.customerAddress.findFirst({
    where: { id: addressId, customerId, isActive: true },
    include: {
      createdBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      updatedBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!address) {
    throw new AppError('Address not found', 404);
  }

  return address;
}

export async function updateCustomerAddress(customerId, addressId, data, createdById, req) {
  const existingAddress = await prisma.customerAddress.findFirst({
    where: { id: addressId, customerId, isActive: true },
  });

  if (!existingAddress) {
    throw new AppError('Address not found', 404);
  }

  if (data.isDefault) {
    await prisma.customerAddress.updateMany({
      where: { customerId, isActive: true, id: { not: addressId } },
      data: { isDefault: false },
    });
  }

  const address = await prisma.customerAddress.update({
    where: { id: addressId },
    data: {
      label: data.label,
      address: data.address,
      city: data.city,
      subCity: data.subCity,
      woreda: data.woreda,
      landmark: data.landmark,
      latitude: data.latitude,
      longitude: data.longitude,
      isDefault: data.isDefault,
      isActive: data.isActive,
      updatedById: createdById,
    },
    include: {
      createdBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      updatedBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  await logAudit({
    createdById,
    action: 'CUSTOMER_ADDRESS_UPDATED',
    entityType: 'CustomerAddress',
    entityId: addressId,
    oldValues: { address: existingAddress.address },
    newValues: { address: address.address },
    req,
  });

  return address;
}

export async function deleteCustomerAddress(customerId, addressId, createdById, req) {
  const existingAddress = await prisma.customerAddress.findFirst({
    where: { id: addressId, customerId, isActive: true },
  });

  if (!existingAddress) {
    throw new AppError('Address not found', 404);
  }

  await prisma.customerAddress.update({
    where: { id: addressId },
    data: {
      isActive: false,
      updatedById: createdById,
    },
  });

  await logAudit({
    createdById,
    action: 'CUSTOMER_ADDRESS_DELETED',
    entityType: 'CustomerAddress',
    entityId: addressId,
    oldValues: { address: existingAddress.address },
    req,
  });

  return { message: 'Address deleted successfully' };
}
