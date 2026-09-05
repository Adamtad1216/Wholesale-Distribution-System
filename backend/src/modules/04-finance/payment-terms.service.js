import prisma from '../../config/prisma.js';

class PaymentTermsService {
  /**
   * Create a new Payment Term (e.g., Net 30 Days)
   */
  async createPaymentTerm(data, createdById) {
    const { name, days, description } = data;

    if (!name || days === undefined || days < 0) {
      throw new Error('Name and valid days (>= 0) are required');
    }

    return await prisma.paymentTerms.create({
      data: {
        name,
        days: Number(days),
        description,
        createdById
      }
    });
  }

  /**
   * Get all active Payment Terms
   */
  async getAllPaymentTerms() {
    return await prisma.paymentTerms.findMany({
      where: { isArchived: false },
      orderBy: { days: 'asc' }
    });
  }

  /**
   * Get Payment Term by ID
   */
  async getPaymentTermById(id) {
    const term = await prisma.paymentTerms.findUnique({
      where: { id }
    });

    if (!term || term.isArchived) {
      throw new Error('Payment Term not found');
    }

    return term;
  }

  /**
   * Update Payment Term
   */
  async updatePaymentTerm(id, data, updatedById) {
    await this.getPaymentTermById(id); // Ensures it exists and is not archived

    const { name, days, description } = data;
    
    return await prisma.paymentTerms.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(days !== undefined && { days: Number(days) }),
        ...(description !== undefined && { description }),
        updatedById,
      },
    });
  }

  /**
   * Soft Delete Payment Term
   */
  async deletePaymentTerm(id, updatedById) {
    await this.getPaymentTermById(id);

    return await prisma.paymentTerms.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        updatedById,
      },
    });
  }
}

export default new PaymentTermsService();
