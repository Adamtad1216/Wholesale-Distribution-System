import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { assignSalesRepresentative } from "../shared/salesRepresentativeAssignment.service.js";
import { calculateSalesOrderPricing } from "../../11-pricing-discounts/shared/pricing.service.js";
import {
  generateCustomerCode,
  ensureUniqueCode,
} from "../../09-customers/customers/customers.service.js";
import { recordStatusChange } from "./salesOrders.status.service.js";
import invoiceService from "../../04-finance/invoice/invoice.service.js";
import { hasPermission } from "../../../middleware/permission.middleware.js";
import {
  sendNotificationToEmployee,
  sendNotificationToRoles,
  sendNotificationToCustomer,
} from "../../../utils/notifications.js";

export async function previewSalesOrder({ items, customerId, warehouseId, requestingUser }) {
  const pricing = await calculateSalesOrderPricing({
    items,
    customerId,
    warehouseId,
    requestingUser,
    enforceQuota: false,
  });

  return {
    items: pricing.items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      discount: item.discount,
      finalAmount: item.total,
      priceTierId: item.priceTierId,
      discountRuleId: item.discountRuleId,
    })),
    priceTier: pricing.priceTier,
    subtotal: pricing.subtotal,
    discount: pricing.discount,
    tax: pricing.tax,
    total: pricing.total,
    quotaWarnings: pricing.quotaWarnings,
  };
}

export async function createSalesOrder({
  customerId,
  warehouseId,
  items,
  requiredDate,
  deliveryLocation,
  fulfillmentType,
  pickupPersonName,
  pickupPhone,
  pickupVehiclePlate,
  pickupNotes,
  requestingUser,
}) {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, isArchived: false, status: "ACTIVE" },
  });
  if (!warehouse) {
    throw new AppError("Warehouse not found or not active", 404);
  }

  const assignment = await assignSalesRepresentative({ warehouseId, customerId });

  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const salesOrder = await prisma.$transaction(async (tx) => {
        const pricing = await calculateSalesOrderPricing({
          items,
          customerId,
          warehouseId,
          requestingUser,
          enforceQuota: true,
          client: tx,
        });

        const orderNumber = await generateOrderNumber(tx);

        const order = await tx.salesOrder.create({
          data: {
            orderNumber,
            customerId,
            salesRepId: assignment.salesRepId,
            warehouseId,
            source: "CUSTOMER_PORTAL",
            orderDate: new Date(),
            requiredDate: requiredDate ?? null,
            status: "PENDING_REVIEW",
            priceTierId: pricing.priceTier?.id ?? null,
            fulfillmentType: fulfillmentType || "DELIVERY",
            pickupPersonName: pickupPersonName || null,
            pickupPhone: pickupPhone || null,
            pickupVehiclePlate: pickupVehiclePlate || null,
            pickupNotes: pickupNotes || null,
            deliveryLatitude: deliveryLocation?.latitude ? Number(deliveryLocation.latitude) : null,
            deliveryLongitude: deliveryLocation?.longitude ? Number(deliveryLocation.longitude) : null,
            deliveryAddressText: deliveryLocation?.addressText || null,
            subtotal: pricing.subtotal,
            discount: pricing.discount,
            tax: pricing.tax,
            total: pricing.total,
            createdById: requestingUser.id,
            updatedById: requestingUser.id,
            items: {
              create: pricing.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                priceTierId: item.priceTierId,
                discountRuleId: item.discountRuleId,
                discount: item.discount,
                tax: item.tax,
                total: item.total,
              })),
            },
          },
          include: {
            customer: { include: { person: true, organization: true, priceTier: true } },
            salesRep: { include: { person: true } },
            warehouse: true,
            priceTier: true,
            items: {
              include: {
                product: { include: { category: true, brand: true, unit: true } },
                priceTier: true,
                discountRule: true,
              },
            },
          },
        });

        const now = new Date();
        const productIds = pricing.items.map((i) => i.productId);
        const quotaCandidates = await tx.salesQuota.findMany({
          where: {
            status: "ACTIVE",
            AND: [
              { OR: [{ customerId: null }, { customerId }] },
              { OR: [{ productId: null }, { productId: { in: productIds } }] },
            ],
          },
        });
        const matchingQuotas = quotaCandidates
          .filter((q) => q.startsAt <= now && q.endsAt >= now)
          .filter((q) =>
            pricing.items.some(
              (i) =>
                (!q.productId || q.productId === i.productId) &&
                (!q.priceTierId || q.priceTierId === i.priceTierId) &&
                (!q.warehouseId || q.warehouseId === warehouseId),
            ),
          );

        for (const item of pricing.items) {
          const itemQuotas = matchingQuotas.filter(
            (q) => !q.productId || q.productId === item.productId,
          );
          for (const quota of itemQuotas) {
            await tx.salesQuotaUsage.create({
              data: {
                quotaId: quota.id,
                customerId,
                salesOrderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
              },
            });
          }
        }

        return order;
      });

      await logAudit({
        createdById: requestingUser.id,
        action: "SALES_ORDER_CREATED",
        entityType: "SalesOrder",
        entityId: salesOrder.id,
        newValues: {
          orderNumber: salesOrder.orderNumber,
          customerId: salesOrder.customerId,
          salesRepId: salesOrder.salesRepId,
          warehouseId: salesOrder.warehouseId,
          priceTierId: salesOrder.priceTierId,
          total: Number(salesOrder.total),
          itemCount: salesOrder.items.length,
        },
        req: null,
      });
      // Notify assigned sales rep and administrators
      const customerLabel = salesOrder.customer?.organization?.name || salesOrder.customer?.person?.firstName || 'Customer';
      if (salesOrder.salesRepId) {
        sendNotificationToEmployee({
          employeeId: salesOrder.salesRepId,
          title: "New Sales Order Submitted",
          message: `Order #${salesOrder.orderNumber} placed by ${customerLabel}. Pending review.`,
          type: "SALES_ORDER_SUBMITTED",
          createdById: requestingUser.id,
        });
      }
      sendNotificationToRoles({
        roleNames: ["ADMIN", "SUPER_ADMIN"],
        title: "New Sales Order Created",
        message: `Customer ${customerLabel} submitted order #${salesOrder.orderNumber}.`,
        type: "SALES_ORDER_SUBMITTED",
        createdById: requestingUser.id,
      });
      sendNotificationToCustomer({
        customerId: salesOrder.customerId,
        title: "Sales Order Submitted Successfully",
        message: `Your order #${salesOrder.orderNumber} has been received and submitted for sales review.`,
        type: "SALES_ORDER_SUBMITTED",
        createdById: requestingUser.id,
      });

      return salesOrder;
    } catch (err) {
      lastError = err;
      if (err.code === "P2002" && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}


export async function getSalesOrdersList({ page = 1, limit = 10, customerId, salesRepId, warehouseId, status }) {
  const skip = (Number(page) - 1) * Number(limit);
  const where = {};
  if (customerId) where.customerId = customerId;
  if (salesRepId) where.salesRepId = salesRepId;
  if (warehouseId) where.warehouseId = warehouseId;
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.salesOrder.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      include: {
        customer: { include: { person: true, organization: true } },
        salesRep: { include: { person: true } },
        warehouse: true,
        items: { include: { product: true } },
      },
    }),
    prisma.salesOrder.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

export async function getSalesOrderById(id) {
  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: { include: { person: true, organization: true } },
      salesRep: { include: { person: true } },
      warehouse: true,
      priceTier: true,
      items: {
        include: {
          product: { include: { category: true, brand: true, unit: true } },
          priceTier: true,
          discountRule: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError("Sales order not found", 404);
  }

  return order;
}

async function generateOrderNumber(tx) {
  const year = new Date().getFullYear();
  const prefix = `SO-${year}-`;

  const lastOrder = await tx.salesOrder.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
  });

  let nextSequence = 1;
  if (lastOrder) {
    const parts = lastOrder.orderNumber.split("-");
    const lastSequence = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSequence)) {
      nextSequence = lastSequence + 1;
    }
  }

  return `${prefix}${String(nextSequence).padStart(6, "0")}`;
}

/**
 * Create a sales order on behalf of a customer (used by sales reps / admins).
 * Accepts either an existing customerId OR inline newCustomer data.
 */
export async function createSalesRepOrder({
  customerId,
  newCustomer,
  warehouseId,
  items,
  requiredDate,
  deliveryLocation,
  fulfillmentType,
  pickupPersonName,
  pickupPhone,
  pickupVehiclePlate,
  pickupNotes,
  requestingUser,
}) {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, isArchived: false, status: "ACTIVE" },
  });
  if (!warehouse) {
    throw new AppError("Warehouse not found or not active", 404);
  }

  // Resolve the requesting user's employee record (sales rep)
  const employee = await prisma.employee.findFirst({
    where: { personId: requestingUser.personId, status: "ACTIVE", isArchived: false },
  });
  if (!employee) {
    throw new AppError("Your employee profile was not found. Contact an administrator.", 404);
  }

  let resolvedCustomerId = customerId;

  // --- Inline customer creation (inside a transaction) ---
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const salesOrder = await prisma.$transaction(async (tx) => {
        // Create inline customer if needed
        if (!resolvedCustomerId && newCustomer) {
          resolvedCustomerId = await createInlineCustomer(tx, newCustomer, requestingUser);
        }

        if (!resolvedCustomerId) {
          throw new AppError("A customer must be specified or created", 400);
        }

        // Verify customer exists
        const customer = await tx.customer.findFirst({
          where: { id: resolvedCustomerId, isArchived: false },
        });
        if (!customer) {
          throw new AppError("Customer not found or inactive", 404);
        }

        const pricing = await calculateSalesOrderPricing({
          items,
          customerId: resolvedCustomerId,
          warehouseId,
          requestingUser,
          enforceQuota: true,
          client: tx,
        });

        const orderNumber = await generateOrderNumber(tx);

        const order = await tx.salesOrder.create({
          data: {
            orderNumber,
            customerId: resolvedCustomerId,
            salesRepId: employee.id,
            warehouseId,
            source: "SALES_REPRESENTATIVE",
            orderDate: new Date(),
            requiredDate: requiredDate ?? null,
            status: "SALES_REP_APPROVED",
            approvedBy: requestingUser.id,
            approvedAt: new Date(),
            priceTierId: pricing.priceTier?.id ?? null,
            fulfillmentType: fulfillmentType || "DELIVERY",
            pickupPersonName: pickupPersonName || null,
            pickupPhone: pickupPhone || null,
            pickupVehiclePlate: pickupVehiclePlate || null,
            pickupNotes: pickupNotes || null,
            deliveryLatitude: deliveryLocation?.latitude ? Number(deliveryLocation.latitude) : null,
            deliveryLongitude: deliveryLocation?.longitude ? Number(deliveryLocation.longitude) : null,
            deliveryAddressText: deliveryLocation?.addressText || null,
            subtotal: pricing.subtotal,
            discount: pricing.discount,
            tax: pricing.tax,
            total: pricing.total,
            createdById: requestingUser.id,
            updatedById: requestingUser.id,
            items: {
              create: pricing.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                priceTierId: item.priceTierId,
                discountRuleId: item.discountRuleId,
                discount: item.discount,
                tax: item.tax,
                total: item.total,
              })),
            },
          },
          include: {
            customer: { include: { person: true, organization: true, priceTier: true } },
            salesRep: { include: { person: true } },
            warehouse: true,
            priceTier: true,
            items: {
              include: {
                product: { include: { category: true, brand: true, unit: true } },
                priceTier: true,
                discountRule: true,
              },
            },
          },
        });

        // Quota usage tracking
        const now = new Date();
        const productIds = pricing.items.map((i) => i.productId);
        const quotaCandidates = await tx.salesQuota.findMany({
          where: {
            status: "ACTIVE",
            AND: [
              { OR: [{ customerId: null }, { customerId: resolvedCustomerId }] },
              { OR: [{ productId: null }, { productId: { in: productIds } }] },
            ],
          },
        });
        const matchingQuotas = quotaCandidates
          .filter((q) => q.startsAt <= now && q.endsAt >= now)
          .filter((q) =>
            pricing.items.some(
              (i) =>
                (!q.productId || q.productId === i.productId) &&
                (!q.priceTierId || q.priceTierId === i.priceTierId) &&
                (!q.warehouseId || q.warehouseId === warehouseId),
            ),
          );

        for (const item of pricing.items) {
          const itemQuotas = matchingQuotas.filter(
            (q) => !q.productId || q.productId === item.productId,
          );
          for (const quota of itemQuotas) {
            await tx.salesQuotaUsage.create({
              data: {
                quotaId: quota.id,
                customerId: resolvedCustomerId,
                salesOrderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
              },
            });
          }
        }

        return order;
      });

      // Record status transition in history: created directly as SALES_REP_APPROVED
      await recordStatusChange(
        salesOrder.id,
        "PENDING_REVIEW",
        "SALES_REP_APPROVED",
        "APPROVED",
        "Auto-approved upon creation by Sales Representative",
        requestingUser.id,
      );

      // Auto-create commercial invoice for this approved sales order
      try {
        const existingInvoice = await prisma.invoice.findFirst({
          where: { salesOrderId: salesOrder.id },
        });
        if (!existingInvoice) {
          await invoiceService.createInvoiceFromOrder(salesOrder.id, requestingUser.id);
        }
      } catch (err) {
        console.warn("Invoice auto-creation note for sales rep order:", err?.message);
      }

      await logAudit({
        createdById: requestingUser.id,
        action: "SALES_ORDER_CREATED",
        entityType: "SalesOrder",
        entityId: salesOrder.id,
        newValues: {
          orderNumber: salesOrder.orderNumber,
          customerId: salesOrder.customerId,
          salesRepId: salesOrder.salesRepId,
          warehouseId: salesOrder.warehouseId,
          source: "SALES_REPRESENTATIVE",
          status: "SALES_REP_APPROVED",
          priceTierId: salesOrder.priceTierId,
          total: Number(salesOrder.total),
          itemCount: salesOrder.items.length,
          inlineCustomerCreated: !customerId,
        },
        req: null,
      });

      // Fetch fresh order including invoices and status history
      const freshOrder = await prisma.salesOrder.findUnique({
        where: { id: salesOrder.id },
        include: {
          customer: { include: { person: true, organization: true, priceTier: true } },
          salesRep: { include: { person: true } },
          warehouse: true,
          priceTier: true,
          invoices: { orderBy: { createdAt: "desc" } },
          statusHistory: { include: { changedBy: true }, orderBy: { changedAt: "desc" } },
          items: {
            include: {
              product: { include: { category: true, brand: true, unit: true } },
              priceTier: true,
              discountRule: true,
            },
          },
        },
      });

      sendNotificationToCustomer({
        customerId: salesOrder.customerId,
        title: "Sales Order Approved & Commercial Invoice Issued",
        message: `Your order #${salesOrder.orderNumber} was placed and approved. Commercial invoice is ready for payment.`,
        type: "SALES_ORDER_APPROVED",
        createdById: requestingUser.id,
      });
      sendNotificationToRoles({
        roleNames: ["WAREHOUSE_MANAGER", "ADMIN", "SUPER_ADMIN"],
        title: "Order Approved - Ready for Preparation",
        message: `Sales order #${salesOrder.orderNumber} approved. Schedule warehouse preparation & staging.`,
        type: "SALES_ORDER_APPROVED",
        createdById: requestingUser.id,
      });

      return freshOrder || salesOrder;
    } catch (err) {
      lastError = err;
      if (err.code === "P2002" && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * Creates a Person/Organization + Customer record inside an existing transaction.
 * No User account is created (sales rep orders don't give the customer login access).
 */
async function createInlineCustomer(tx, newCustomer, requestingUser) {
  const customerCode = await ensureUniqueCode(tx, generateCustomerCode());
  const createdById = requestingUser.id;

  // Default payment terms (Cash on Delivery)
  let defaultTerms = await tx.paymentTerms.findFirst({
    where: { days: 0, isArchived: false },
  });
  if (!defaultTerms) {
    defaultTerms = await tx.paymentTerms.create({
      data: {
        name: "Cash on Delivery (COD)",
        days: 0,
        description: "Default payment term: Immediate payment required upon receipt (0 Days)",
      },
    });
  }

  if (newCustomer.customerType === "PERSON") {
    const p = newCustomer.person;

    // Check for duplicate email
    if (p.email) {
      const existing = await tx.person.findUnique({ where: { email: p.email } });
      if (existing) {
        throw new AppError("A person with this email already exists", 409);
      }
    }

    const person = await tx.person.create({
      data: {
        firstName: p.firstName,
        middleName: p.middleName || null,
        lastName: p.lastName,
        phone: p.phone || null,
        email: p.email || null,
        address: p.address || null,
        status: "ACTIVE",
        createdById,
        updatedById: createdById,
      },
    });

    const customer = await tx.customer.create({
      data: {
        customerCode,
        customerType: "PERSON",
        personId: person.id,
        creditLimit: 0,
        paymentTermsId: defaultTerms.id,
        status: "ACTIVE",
        createdById,
        updatedById: createdById,
      },
    });

    return customer.id;
  }

  if (newCustomer.customerType === "ORGANIZATION") {
    const o = newCustomer.organization;

    // Check duplicate registration/tax numbers
    if (o.registrationNumber) {
      const existing = await tx.organization.findFirst({
        where: { registrationNumber: o.registrationNumber },
      });
      if (existing) {
        throw new AppError("Organization with this registration number already exists", 409);
      }
    }
    if (o.taxNumber) {
      const existing = await tx.organization.findFirst({
        where: { taxNumber: o.taxNumber },
      });
      if (existing) {
        throw new AppError("Organization with this tax number already exists", 409);
      }
    }

    const organization = await tx.organization.create({
      data: {
        name: o.name,
        registrationNumber: o.registrationNumber || null,
        taxNumber: o.taxNumber || null,
        phone: o.phone || null,
        email: o.email || null,
        address: o.address || null,
        status: "ACTIVE",
        createdById,
        updatedById: createdById,
      },
    });

    // Create contacts if provided
    if (o.contacts && o.contacts.length > 0) {
      for (const contact of o.contacts) {
        if (contact.email) {
          const existingEmail = await tx.person.findUnique({ where: { email: contact.email } });
          if (existingEmail) {
            throw new AppError(`Contact email "${contact.email}" is already registered`, 409);
          }
        }

        const contactPerson = await tx.person.create({
          data: {
            firstName: contact.firstName,
            middleName: contact.middleName || null,
            lastName: contact.lastName,
            phone: contact.phone || null,
            email: contact.email || null,
            address: o.address || null,
            status: "ACTIVE",
            createdById,
            updatedById: createdById,
          },
        });

        await tx.organizationContact.create({
          data: {
            organizationId: organization.id,
            personId: contactPerson.id,
            isPrimary: contact.isPrimary || false,
          },
        });
      }
    }

    const customer = await tx.customer.create({
      data: {
        customerCode,
        customerType: "ORGANIZATION",
        organizationId: organization.id,
        creditLimit: 0,
        paymentTermsId: defaultTerms.id,
        status: "ACTIVE",
        createdById,
        updatedById: createdById,
      },
    });

    return customer.id;
  }

  throw new AppError("Invalid customer type", 400);
}


export async function listSalesOrders(query = {}, requestingUser) {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const userRoles = requestingUser?.userRoles?.map((ur) => ur.role?.name || ur.role) || [];
  const isSuperAdmin = userRoles.includes("SUPER_ADMIN") || userRoles.includes("ADMIN");
  const canReadAllOrders = isSuperAdmin || hasPermission(requestingUser, "sales_orders:read_all");
  const isSalesRep = userRoles.includes("SALES_REPRESENTATIVE") || userRoles.includes("SALES_REP");
  const isWhManager = userRoles.includes("WAREHOUSE_MANAGER") || userRoles.includes("WH_MANAGER");
  const isStoreKeeper = userRoles.includes("STORE_KEEPER") || userRoles.includes("STOREKEEPER");
  const isDriver = userRoles.includes("DRIVER");

  const where = {
    isArchived: false,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.warehouseId) {
    where.warehouseId = query.warehouseId;
  }

  if (canReadAllOrders) {
    if (query.customerId) where.customerId = query.customerId;
    if (query.salesRepId) where.salesRepId = query.salesRepId;
  } else if (isSalesRep) {
    const employee = await prisma.employee.findFirst({
      where: { personId: requestingUser.personId, status: "ACTIVE" },
      include: { managedWarehouses: true },
    });

    if (!employee) {
      return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
    }

    const managedWarehouseIds = employee.managedWarehouses?.map((w) => w.id) || [];

    where.OR = [
      { salesRepId: employee.id },
      ...(managedWarehouseIds.length > 0 ? [{ warehouseId: { in: managedWarehouseIds } }] : []),
    ];

    if (query.customerId) where.customerId = query.customerId;
  } else if (isWhManager) {
    const employee = await prisma.employee.findFirst({
      where: { personId: requestingUser.personId, status: "ACTIVE" },
      include: { managedWarehouses: true },
    });
    const managedWarehouseIds = employee?.managedWarehouses?.map((w) => w.id) || [];
    if (managedWarehouseIds.length > 0) {
      where.warehouseId = { in: managedWarehouseIds };
    }
    if (query.customerId) where.customerId = query.customerId;
  } else if (isStoreKeeper) {
    const employee = await prisma.employee.findFirst({
      where: { personId: requestingUser.personId, status: "ACTIVE" },
    });
    if (employee) {
      where.OR = [
        { preparationTasks: { some: { storeKeeperId: employee.id } } },
        { status: { in: ["SALES_REP_APPROVED", "WAREHOUSE_PREPARATION_SCHEDULED", "PREPARING", "READY_FOR_DELIVERY"] } },
      ];
    }
    if (query.customerId) where.customerId = query.customerId;
  } else if (isDriver) {
    const employee = await prisma.employee.findFirst({
      where: { personId: requestingUser.personId, status: "ACTIVE" },
    });
    if (employee) {
      where.OR = [
        { deliveries: { some: { driverId: employee.id } } },
        { status: { in: ["READY_FOR_DELIVERY", "DELIVERY_SCHEDULED", "OUT_FOR_DELIVERY", "DELIVERED"] } },
      ];
    }
    if (query.customerId) where.customerId = query.customerId;
  } else {
    // Customer
    const customer = await prisma.customer.findFirst({
      where: {
        isArchived: false,
        status: "ACTIVE",
        OR: [
          { personId: requestingUser.personId },
          { organization: { contacts: { some: { personId: requestingUser.personId } } } },
          { createdById: requestingUser.id },
        ],
      },
      select: { id: true },
    });

    where.OR = [
      { createdById: requestingUser.id },
      ...(customer ? [{ customerId: customer.id }] : []),
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.salesOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          include: {
            person: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            organization: { select: { id: true, name: true, phone: true, email: true } },
          },
        },
        salesRep: {
          include: {
            person: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        warehouse: { select: { id: true, name: true, code: true } },
        priceTier: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
        preparationTasks: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            storeKeeper: {
              include: {
                person: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        },
        deliveries: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            driver: {
              include: {
                person: { select: { id: true, firstName: true, lastName: true, phone: true } },
              },
            },
            vehicle: true,
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
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}