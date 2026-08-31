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
}

export default new PaymentTermsService();
