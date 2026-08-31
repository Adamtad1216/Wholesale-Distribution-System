import prisma from '../../config/prisma.js';

class CreditService {
  /**
   * Create a manual store credit for a customer (Manager / Direct Grant)
   */
  async createManualCredit(data, createdById) {
    const { customerId, amount, reason } = data;

    if (!customerId || !amount || amount <= 0) {
      throw new Error('Valid customerId and positive amount are required');
    }

    const creditNumber = data.creditNumber || `CRD-${Date.now()}`;

    return await prisma.credit.create({
      data: {
        creditNumber,
        customerId,
        amount,
        remainingBalance: amount,
        usedAmount: 0,
        reason: reason || 'Manual Store Credit issued by Manager',
        status: 'ACTIVE',
        createdById
      },
      include: {
        customer: true
      }
    });
  }

  /**
   * Create credit issued from a Sales Return (Return Option 2)
   */
  async createCreditFromReturn(data, createdById) {
    const { salesReturnId, customerId, amount, reason } = data;

    if (!customerId || !amount || amount <= 0) {
      throw new Error('customerId and positive amount are required');
    }

    const creditNumber = data.creditNumber || `CRD-RET-${Date.now()}`;

    return await prisma.credit.create({
      data: {
        creditNumber,
        customerId,
        salesReturnId,
        amount,
        remainingBalance: amount,
        usedAmount: 0,
        reason: reason || `Store Credit generated from Sales Return ${salesReturnId}`,
        status: 'ACTIVE',
        createdById
      },
      include: {
        customer: true,
        salesReturn: true
      }
    });
  }

  /**
   * Get total available credit and credit list for a customer
   */
  async getCustomerCredits(customerId) {
    const credits = await prisma.credit.findMany({
      where: {
        customerId,
        isArchived: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalAvailableBalance = credits
      .filter((c) => c.status === 'ACTIVE')
      .reduce((sum, c) => sum + Number(c.remainingBalance), 0);

    return {
      customerId,
      totalAvailableBalance,
      credits
    };
  }

  /**
   * Get all credits with optional filtering & pagination
   */
  async getAllCredits(query = {}) {
    const { customerId, status } = query;
    const where = { isArchived: false };

    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    return await prisma.credit.findMany({
      where,
      include: {
        customer: true,
        salesReturn: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Apply credit balance toward paying an Invoice
   */
  async applyCreditToInvoice(creditId, invoiceId, amountToApply, updatedById) {
    return await prisma.$transaction(async (tx) => {
      const credit = await tx.credit.findUnique({
        where: { id: creditId }
      });

      if (!credit || credit.isArchived) {
        throw new Error('Credit not found');
      }

      if (credit.status !== 'ACTIVE' || Number(credit.remainingBalance) <= 0) {
        throw new Error('Credit has no remaining active balance');
      }

      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!invoice || invoice.isArchived) {
        throw new Error('Invoice not found');
      }

      const applyAmount = Math.min(
        Number(amountToApply),
        Number(credit.remainingBalance),
        Number(invoice.balance)
      );

      if (applyAmount <= 0) {
        throw new Error('Invoice is already fully paid or application amount invalid');
      }

      // Update Credit
      const newCreditUsed = Number(credit.usedAmount) + applyAmount;
      const newCreditBalance = Number(credit.remainingBalance) - applyAmount;
      const newCreditStatus = newCreditBalance <= 0 ? 'EXHAUSTED' : 'ACTIVE';

      const updatedCredit = await tx.credit.update({
        where: { id: creditId },
        data: {
          usedAmount: newCreditUsed,
          remainingBalance: newCreditBalance,
          status: newCreditStatus,
          updatedById
        }
      });

      // Update Invoice
      const newInvoicePaid = Number(invoice.paidAmount) + applyAmount;
      const newInvoiceBalance = Number(invoice.balance) - applyAmount;
      const newInvoiceStatus = newInvoiceBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newInvoicePaid,
          balance: newInvoiceBalance,
          status: newInvoiceStatus,
          updatedById
        }
      });

      // Create CreditAllocation record for full audit trail
      const creditAllocation = await tx.creditAllocation.create({
        data: {
          creditId,
          invoiceId,
          amount: applyAmount,
          createdById: updatedById
        }
      });

      return {
        appliedAmount: applyAmount,
        credit: updatedCredit,
        invoice: updatedInvoice,
        allocation: creditAllocation
      };
    });
  }

  /**
   * Get full audit history/ledger for a credit (who granted it, where it was spent)
   */
  async getCreditHistory(creditId) {
    const credit = await prisma.credit.findUnique({
      where: { id: creditId },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, username: true }
        },
        creditAllocations: {
          include: {
            invoice: true,
            createdBy: {
              select: { id: true, username: true }
            }
          },
          orderBy: {
            allocatedAt: 'desc'
          }
        }
      }
    });

    if (!credit) {
      throw new Error('Credit not found');
    }

    return credit;
  }

  /**
   * Get complete Trade Credit (Debt / Credit Limit) and Store Credit summary for a customer
   */
  async getCustomerCreditSummary(customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { paymentTerms: true }
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // 1. Calculate Total Outstanding Debt (Unpaid Invoices)
    const openInvoices = await prisma.invoice.findMany({
      where: {
        customerId,
        isArchived: false,
        status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] }
      }
    });

    const totalOutstandingDebt = openInvoices.reduce(
      (sum, inv) => sum + Number(inv.balance),
      0
    );

    const creditLimit = Number(customer.creditLimit || 0);
    const availableCreditLimit = Math.max(0, creditLimit - totalOutstandingDebt);

    // 2. Get Store Credit Balance (Prepaid / Return Credits)
    const storeCreditsResult = await this.getCustomerCredits(customerId);

    return {
      customerId,
      customerCode: customer.customerCode,
      tradeCredit: {
        creditLimit,
        totalOutstandingDebt,
        availableCreditLimit,
        openInvoicesCount: openInvoices.length,
        paymentTerms: customer.paymentTerms?.name || 'Standard'
      },
      storeCredit: {
        totalAvailableBalance: storeCreditsResult.totalAvailableBalance
      }
    };
  }

  /**
   * Validate whether a customer can make a purchase on credit
   */
  async validateCreditLimit(customerId, purchaseAmount) {
    const summary = await this.getCustomerCreditSummary(customerId);
    const { availableCreditLimit } = summary.tradeCredit;

    if (purchaseAmount > availableCreditLimit) {
      throw new Error(
        `Purchase amount of ${purchaseAmount} Birr exceeds customer available credit limit of ${availableCreditLimit} Birr (Current Debt: ${summary.tradeCredit.totalOutstandingDebt} Birr, Max Limit: ${summary.tradeCredit.creditLimit} Birr)`
      );
    }

    return {
      allowed: true,
      summary
    };
  }
}

export default new CreditService();
