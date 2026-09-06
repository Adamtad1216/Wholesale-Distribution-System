import prisma from '../../config/prisma.js';

const isUUID = (str) =>
  typeof str === 'string' &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

class PurchaseOrderService {
  async createPurchaseOrder(data, createdById) {
    const { expectedDate, items = [], subtotal, discount, tax, total } = data;
    const poNumber = data.poNumber || `PO-${Date.now()}`;
    const orderDate = new Date();

    // 1. Resolve Supplier UUID
    let validSupplierId = null;
    if (isUUID(data.supplierId)) {
      const existingSup = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
      if (existingSup) validSupplierId = existingSup.id;
    }
    if (!validSupplierId) {
      const fallbackSup = await prisma.supplier.findFirst({ where: { isArchived: false } });
      if (!fallbackSup) {
        throw new Error('No active supplier found in database. Please register a supplier first.');
      }
      validSupplierId = fallbackSup.id;
    }

    // 2. Resolve Warehouse UUID
    let validWarehouseId = null;
    if (isUUID(data.warehouseId)) {
      const existingWh = await prisma.warehouse.findUnique({ where: { id: data.warehouseId } });
      if (existingWh) validWarehouseId = existingWh.id;
    }
    if (!validWarehouseId) {
      const fallbackWh = await prisma.warehouse.findFirst({ where: { isArchived: false } });
      if (fallbackWh) {
        validWarehouseId = fallbackWh.id;
      } else {
        // Create a default main warehouse if none exists
        const newWh = await prisma.warehouse.create({
          data: {
            code: 'MAIN-01',
            name: 'Main Central Warehouse',
            createdById,
          },
        });
        validWarehouseId = newWh.id;
      }
    }

    // 3. Resolve Product UUIDs for items
    const resolvedItems = [];
    for (const item of items) {
      let resolvedProductId = null;

      if (isUUID(item.productId)) {
        const existingProd = await prisma.product.findUnique({ where: { id: item.productId } });
        if (existingProd) resolvedProductId = existingProd.id;
      }

      if (!resolvedProductId && (item.sku || item.name)) {
        const matchedProd = await prisma.product.findFirst({
          where: {
            OR: [
              ...(item.sku ? [{ sku: item.sku }] : []),
              ...(item.name ? [{ name: item.name }] : []),
            ],
          },
        });
        if (matchedProd) resolvedProductId = matchedProd.id;
      }

      if (!resolvedProductId) {
        const fallbackProd = await prisma.product.findFirst({ where: { isArchived: false } });
        if (fallbackProd) {
          resolvedProductId = fallbackProd.id;
        } else {
          // Find or create default Category & Unit for product creation
          let category = await prisma.category.findFirst();
          if (!category) {
            category = await prisma.category.create({
              data: { name: 'General Products', createdById },
            });
          }
          let unit = await prisma.unit.findFirst();
          if (!unit) {
            unit = await prisma.unit.create({
              data: { name: 'Piece', abbreviation: 'PCS', createdById },
            });
          }
          // Create product on the fly
          const newProd = await prisma.product.create({
            data: {
              sku: item.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name: item.name || 'Standard Wholesale Product',
              categoryId: category.id,
              unitId: unit.id,
              purchasePrice: item.unitPrice || 100,
              sellingPrice: (item.unitPrice || 100) * 1.2,
              createdById,
            },
          });
          resolvedProductId = newProd.id;
        }
      }

      resolvedItems.push({
        productId: resolvedProductId,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        discount: Number(item.discount) || 0,
        tax: Number(item.tax) || 0,
        total: Number(item.total) || (Number(item.quantity || 1) * Number(item.unitPrice || 0)),
        ...(createdById ? { createdById } : {}),
      });
    }

    // 4. Resolve Orderer User ID
    let validUserId = createdById;
    if (!validUserId) {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) validUserId = firstUser.id;
    }

    const newPo = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplier: { connect: { id: validSupplierId } },
        warehouse: { connect: { id: validWarehouseId } },
        ...(validUserId ? { orderer: { connect: { id: validUserId } } } : {}),
        ...(validUserId ? { createdBy: { connect: { id: validUserId } } } : {}),
        status: data.status || 'PENDING',
        orderDate,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        subtotal: Number(subtotal) || 0,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        total: Number(total) || 0,
        items: {
          create: resolvedItems,
        },
      },
      include: {
        items: { include: { product: true } },
        supplier: {
          include: {
            person: true,
            organization: true,
          },
        },
        warehouse: true,
      },
    });

    return this.formatPo(newPo);
  }

  formatPo(po) {
    if (!po) return po;
    const sup = po.supplier;
    if (!sup) return po;

    let name = sup.name || '';
    if (!name && sup.organization?.name) {
      name = sup.organization.name;
    }
    if (!name && sup.person) {
      name = `${sup.person.firstName || ''} ${sup.person.middleName || ''} ${sup.person.lastName || ''}`.replace(/\s+/g, ' ').trim();
    }
    if (!name) {
      name = sup.companyName || sup.supplierCode || 'Supplier Vendor';
    }

    const contactPerson = sup.contactPerson || (sup.person ? name : sup.organization?.name || 'Representative');
    const phone = sup.phone || sup.person?.phone || sup.organization?.phone || '';
    const email = sup.email || sup.person?.email || sup.organization?.email || '';

    return {
      ...po,
      supplier: {
        ...sup,
        name,
        companyName: sup.companyName || sup.organization?.name || name,
        contactPerson,
        phone,
        email,
      },
    };
  }

  async getPurchaseOrders(filters = {}, options = {}) {
    const skip = options.skip ? parseInt(options.skip, 10) : 0;
    const take = options.take ? parseInt(options.take, 10) : 50;

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: filters,
        skip,
        take,
        include: {
          supplier: {
            include: {
              person: true,
              organization: true,
            },
          },
          warehouse: true,
          orderer: { select: { id: true, username: true } },
          approver: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchaseOrder.count({ where: filters }),
    ]);

    const formattedOrders = purchaseOrders.map((po) => this.formatPo(po));

    return { purchaseOrders: formattedOrders, total, skip, take };
  }

  async getPurchaseOrderById(id) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        supplier: {
          include: {
            person: true,
            organization: true,
          },
        },
        warehouse: true,
        goodsReceipts: true,
        orderer: { select: { id: true, username: true } },
        approver: { select: { id: true, username: true } },
      },
    });

    return this.formatPo(po);
  }

  async approvePurchaseOrder(id, approvedById) {
    return await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'APPROVED',
        ...(approvedById ? { approver: { connect: { id: approvedById } } } : {}),
        ...(approvedById ? { updatedBy: { connect: { id: approvedById } } } : {}),
      },
    });
  }

  async updatePurchaseOrderStatus(id, status, updatedById) {
    return await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status,
        ...(updatedById ? { updatedBy: { connect: { id: updatedById } } } : {}),
      },
    });
  }
}

export default new PurchaseOrderService();
