import prisma from "../../../config/prisma.js";
import {
  buildDateRangeFilter,
  toNumber,
  getUserRoleNames,
  getEmployeeForUser,
} from "./reporting.utils.js";

function buildOrderWhere(filters = {}) {
  const { startDate, endDate, salesRepId, customerId, productId, status } = filters;
  const dateFilter = buildDateRangeFilter("orderDate", startDate, endDate);
  return {
    ...(dateFilter || {}),
    ...(salesRepId && { salesRepId }),
    ...(customerId && { customerId }),
    ...(status && { status }),
    ...(productId && { items: { some: { productId } } }),
  };
}

export async function getDashboardMetrics() {
  const [
    totalCustomers,
    totalProducts,
    statusGroups,
    orderAgg,
    deliveredAgg,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.product.count(),
    prisma.salesOrder.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.salesOrder.aggregate({
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.salesOrder.aggregate({
      where: { status: { in: ["DELIVERED", "COMPLETED"] } },
      _sum: { total: true },
    }),
  ]);

  const statusCounts = {};
  let pending = 0;
  let approved = 0;
  let delivered = 0;
  let cancelled = 0;
  let rejected = 0;

  for (const group of statusGroups) {
    const count = group._count._all;
    statusCounts[group.status] = count;
    if (group.status === "PENDING_REVIEW") pending = count;
    else if (group.status === "APPROVED") approved = count;
    else if (group.status === "DELIVERED") delivered = count;
    else if (group.status === "CANCELLED") cancelled = count;
    else if (group.status === "REJECTED") rejected = count;
  }

  return {
    orders: {
      total: orderAgg._count._all,
      pending,
      approved,
      delivered,
      cancelled,
      rejected,
      byStatus: statusCounts,
    },
    customers: { total: totalCustomers },
    products: { total: totalProducts },
    revenue: {
      totalOrderValue: toNumber(orderAgg._sum.total),
      deliveredRevenue: toNumber(deliveredAgg._sum.total),
    },
  };
}

export async function getSalesReport(filters) {
  const orderWhere = buildOrderWhere(filters);

  const [orderAgg, quantityAgg] = await Promise.all([
    prisma.salesOrder.aggregate({
      where: orderWhere,
      _count: { _all: true },
      _sum: { subtotal: true, discount: true, tax: true, total: true },
    }),
    prisma.salesOrderItem.aggregate({
      where: { salesOrder: orderWhere },
      _sum: { quantity: true },
    }),
  ]);

  return {
    totalOrders: orderAgg._count._all,
    totalQuantity: toNumber(quantityAgg._sum.quantity),
    subtotal: toNumber(orderAgg._sum.subtotal),
    discount: toNumber(orderAgg._sum.discount),
    tax: toNumber(orderAgg._sum.tax),
    total: toNumber(orderAgg._sum.total),
  };
}

export async function getProductSalesReport(filters) {
  const { startDate, endDate, categoryId, productId, page, limit } = filters;

  const dateFilter = buildDateRangeFilter("orderDate", startDate, endDate);

  const itemWhere = {
    ...(dateFilter && { salesOrder: dateFilter }),
    ...(productId && { productId }),
    ...(categoryId && { product: { categoryId } }),
  };

  const groups = await prisma.salesOrderItem.groupBy({
    by: ["productId"],
    where: itemWhere,
    _sum: { quantity: true, total: true },
  });

  groups.sort((a, b) => toNumber(b._sum.total) - toNumber(a._sum.total));
  const total = groups.length;
  const start = (page - 1) * limit;
  const pageGroups = groups.slice(start, start + limit);

  const productIds = pageGroups.map((g) => g.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      sku: true,
      name: true,
      category: { select: { id: true, name: true } },
    },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const data = pageGroups.map((g) => {
    const product = productMap.get(g.productId);
    return {
      product: product
        ? {
            id: product.id,
            sku: product.sku,
            name: product.name,
            category: product.category,
          }
        : { id: g.productId, sku: null, name: null, category: null },
      quantitySold: toNumber(g._sum.quantity),
      revenue: toNumber(g._sum.total),
    };
  });

  return { data, total };
}

export async function getCustomerReport(filters) {
  const { startDate, endDate, page, limit } = filters;
  const dateFilter = buildDateRangeFilter("orderDate", startDate, endDate);

  const groups = await prisma.salesOrder.groupBy({
    by: ["customerId"],
    where: dateFilter || {},
    _count: { _all: true },
    _sum: { total: true },
  });

  groups.sort((a, b) => toNumber(b._sum.total) - toNumber(a._sum.total));
  const total = groups.length;
  const start = (page - 1) * limit;
  const pageGroups = groups.slice(start, start + limit);

  const customerIds = pageGroups.map((g) => g.customerId);
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: {
      id: true,
      customerCode: true,
      customerType: true,
      person: { select: { firstName: true, lastName: true } },
      organization: { select: { name: true } },
    },
  });
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const data = pageGroups.map((g) => {
    const customer = customerMap.get(g.customerId);
    return {
      customer: customer
        ? {
            id: customer.id,
            customerCode: customer.customerCode,
            customerType: customer.customerType,
            name: customer.customerType === "PERSON"
              ? [customer.person?.firstName, customer.person?.lastName].filter(Boolean).join(" ")
              : customer.organization?.name || null,
          }
        : { id: g.customerId, customerCode: null, customerType: null, name: null },
      orderCount: g._count._all,
      totalPurchase: toNumber(g._sum.total),
    };
  });

  return { data, total };
}

export async function getSalesRepReport(filters, requestingUser) {
  const { startDate, endDate, page, limit } = filters;
  const dateFilter = buildDateRangeFilter("orderDate", startDate, endDate);

  const orderWhere = {
    ...(dateFilter || {}),
    salesRepId: { not: null },
  };

  if (requestingUser) {
    const roles = getUserRoleNames(requestingUser);
    const isManagement = roles.some((r) =>
      ["ADMIN", "WAREHOUSE_MANAGER"].includes(r)
    );
    if (!isManagement && roles.includes("SALES_REPRESENTATIVE")) {
      const employee = await getEmployeeForUser(requestingUser);
      if (!employee) {
        return { data: [], total: 0 };
      }
      orderWhere.salesRepId = employee.id;
    }
  }

  const [totalsGroups, statusGroups] = await Promise.all([
    prisma.salesOrder.groupBy({
      by: ["salesRepId"],
      where: orderWhere,
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.salesOrder.groupBy({
      by: ["salesRepId", "status"],
      where: orderWhere,
      _count: { _all: true },
    }),
  ]);

  const statusByRep = {};
  for (const sg of statusGroups) {
    if (!statusByRep[sg.salesRepId]) statusByRep[sg.salesRepId] = {};
    statusByRep[sg.salesRepId][sg.status] = sg._count._all;
  }

  const enriched = totalsGroups.map((g) => {
    const statuses = statusByRep[g.salesRepId] || {};
    return {
      salesRepId: g.salesRepId,
      assignedOrders: g._count._all,
      approvedOrders: statuses.APPROVED || 0,
      rejectedOrders: statuses.REJECTED || 0,
      adjustmentRequests: statuses.ADJUSTMENT_REQUIRED || 0,
      deliveredOrders: statuses.DELIVERED || 0,
      salesAmount: toNumber(g._sum.total),
    };
  });

  enriched.sort((a, b) => b.salesAmount - a.salesAmount);
  const total = enriched.length;
  const start = (page - 1) * limit;
  const pageData = enriched.slice(start, start + limit);

  const repIds = pageData.map((r) => r.salesRepId);
  const employees = await prisma.employee.findMany({
    where: { id: { in: repIds } },
    select: {
      id: true,
      employeeCode: true,
      person: { select: { firstName: true, lastName: true } },
    },
  });
  const empMap = new Map(employees.map((e) => [e.id, e]));

  const data = pageData.map((r) => {
    const emp = empMap.get(r.salesRepId);
    return {
      salesRepresentative: emp
        ? {
            id: emp.id,
            employeeCode: emp.employeeCode,
            name: [emp.person?.firstName, emp.person?.lastName].filter(Boolean).join(" "),
          }
        : { id: r.salesRepId, employeeCode: null, name: null },
      ...r,
    };
  });

  return { data, total };
}

export async function getOrderStatusReport() {
  const groups = await prisma.salesOrder.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return groups.map((g) => ({
    status: g.status,
    count: g._count._all,
  }));
}

export async function getWarehouseReport() {
  const [taskGroups, totalTasks, itemAgg] = await Promise.all([
    prisma.preparationTask.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.preparationTask.count(),
    prisma.preparationTaskItem.aggregate({
      _sum: { quantity: true, preparedQuantity: true },
    }),
  ]);

  const statusCounts = {};
  let completed = 0;
  let pending = 0;
  for (const g of taskGroups) {
    statusCounts[g.status] = g._count._all;
    if (g.status === "COMPLETED") completed = g._count._all;
    else if (g.status === "PENDING") pending = g._count._all;
  }

  return {
    preparationTasks: {
      total: totalTasks,
      completed,
      pending,
      byStatus: statusCounts,
    },
    preparedQuantities: {
      total: toNumber(itemAgg._sum.quantity),
      prepared: toNumber(itemAgg._sum.preparedQuantity),
    },
  };
}

export async function getDeliveryReport(filters, requestingUser) {
  const { startDate, endDate, driverId, status } = filters;
  const dateFilter = buildDateRangeFilter("scheduledDate", startDate, endDate);

  const where = {
    ...(dateFilter || {}),
    ...(status && { status }),
  };

  if (requestingUser) {
    const roles = getUserRoleNames(requestingUser);
    const isManagement = roles.some((r) =>
      ["ADMIN", "WAREHOUSE_MANAGER"].includes(r)
    );
    if (!isManagement && roles.includes("DRIVER")) {
      const employee = await getEmployeeForUser(requestingUser);
      if (!employee) {
        return {
          total: 0,
          completed: 0,
          pending: 0,
          byStatus: [],
          byDriver: [],
        };
      }
      where.driverId = employee.id;
    } else if (driverId) {
      where.driverId = driverId;
    }
  } else if (driverId) {
    where.driverId = driverId;
  }

  const [total, statusGroups, driverGroups] = await Promise.all([
    prisma.delivery.count({ where }),
    prisma.delivery.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),
    prisma.delivery.groupBy({
      by: ["driverId"],
      where,
      _count: { _all: true },
    }),
  ]);

  const byStatus = statusGroups.map((g) => ({
    status: g.status,
    count: g._count._all,
  }));

  let completed = 0;
  let pending = 0;
  for (const g of statusGroups) {
    if (g.status === "DELIVERED") completed = g._count._all;
    else if (g.status === "SCHEDULED") pending = g._count._all;
  }

  const driverIds = driverGroups.map((g) => g.driverId).filter(Boolean);
  const employees = driverIds.length
    ? await prisma.employee.findMany({
        where: { id: { in: driverIds } },
        select: {
          id: true,
          employeeCode: true,
          person: { select: { firstName: true, lastName: true } },
        },
      })
    : [];
  const empMap = new Map(employees.map((e) => [e.id, e]));

  const byDriver = driverGroups.map((g) => {
    const emp = g.driverId ? empMap.get(g.driverId) : null;
    return {
      driver: emp
        ? {
            id: emp.id,
            employeeCode: emp.employeeCode,
            name: [emp.person?.firstName, emp.person?.lastName].filter(Boolean).join(" "),
          }
        : g.driverId
          ? { id: g.driverId, employeeCode: null, name: null }
          : null,
      count: g._count._all,
    };
  });

  return { total, completed, pending, byStatus, byDriver };
}
