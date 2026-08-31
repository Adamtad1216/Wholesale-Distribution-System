import prisma from '../../config/prisma.js';

class SupplierService {
  async createSupplier(data, createdById) {
    const supplierCode = data.supplierCode || `SUP-${Date.now()}`;
    
    return await prisma.supplier.create({
      data: {
        ...data,
        supplierCode,
        createdById
      },
      include: {
        person: true,
        organization: true,
        paymentTerms: true
      }
    });
  }

  async getSuppliers(filters = {}, options = {}) {
    const skip = options.skip ? parseInt(options.skip, 10) : 0;
    const take = options.take ? parseInt(options.take, 10) : 50;
    
    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where: filters,
        skip,
        take,
        include: {
          person: true,
          organization: true,
          paymentTerms: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.supplier.count({ where: filters })
    ]);
    
    return { suppliers, total, skip, take };
  }

  async getSupplierById(id) {
    return await prisma.supplier.findUnique({
      where: { id },
      include: {
        person: true,
        organization: true,
        paymentTerms: true,
        purchaseOrders: true,
        supplierInvoices: true
      }
    });
  }

  async updateSupplier(id, data, updatedById) {
    return await prisma.supplier.update({
      where: { id },
      data: {
        ...data,
        updatedById
      },
      include: {
        person: true,
        organization: true,
        paymentTerms: true
      }
    });
  }

  async archiveSupplier(id, updatedById) {
    return await prisma.supplier.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        status: 'ARCHIVED',
        updatedById
      }
    });
  }
}

export default new SupplierService();
