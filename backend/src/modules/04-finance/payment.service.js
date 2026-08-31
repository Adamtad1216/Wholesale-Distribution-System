import ChapaAdapter from './adapters/chapaAdapter.js';
import ManualPaymentAdapter from './adapters/manualPaymentAdapter.js';
import prisma from '../../config/prisma.js';

class PaymentService {
  constructor() {
    this.adapters = new Map();
    
    // Register default payment adapters
    this.registerAdapter('chapa', new ChapaAdapter());
    this.registerAdapter('bank_transfer', new ManualPaymentAdapter());
    this.registerAdapter('cash', new ManualPaymentAdapter());
    this.registerAdapter('manual', new ManualPaymentAdapter());
  }

  /**
   * Register a new payment adapter dynamically (e.g. 'stripe', 'telebirr')
   */
  registerAdapter(providerName, adapterInstance) {
    this.adapters.set(providerName.toLowerCase(), adapterInstance);
  }

  /**
   * Get registered adapter instance by provider name
   */
  getAdapter(providerName = 'chapa') {
    const key = providerName.toLowerCase();
    const adapter = this.adapters.get(key) || this.adapters.get('chapa');
    if (!adapter) {
      throw new Error(`Payment provider adapter '${providerName}' is not registered`);
    }
    return adapter;
  }

  /**
   * Generate a unique, standard transaction reference string
   * Format: TX-{prefix}-{timestamp}-{random}
   */
  generateTxRef(prefix = 'REST') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `TX-${prefix}-${timestamp}-${random}`;
  }

  /**
   * Log financial action into PaymentAuditLog
   */
  async logAudit({ paymentId, action, performedById, oldStatus, newStatus, metadata }) {
    try {
      if (!paymentId) return;
      await prisma.paymentAuditLog.create({
        data: {
          paymentId,
          action,
          performedById: performedById || null,
          oldStatus: oldStatus || null,
          newStatus: newStatus || null,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
        }
      });
    } catch (err) {
      console.error('[Payment Audit Error]:', err.message);
    }
  }

  /**
   * 1. Initialize Payment & Record Attempt
   */
  async initializePayment({
    provider = 'chapa',
    amount,
    currency = 'ETB',
    email,
    firstName,
    lastName,
    txRef,
    callbackUrl,
    returnUrl,
    customization = {},
    orderId,
    processedById
  }) {
    let validOrderId = null;
    let finalAmount = amount;

    if (orderId) {
      const existingOrder = await prisma.salesOrder.findFirst({
        where: { OR: [{ id: orderId }, { orderNumber: orderId }] }
      });
      if (existingOrder) {
        validOrderId = existingOrder.id;
        if (!finalAmount || finalAmount <= 0) {
          finalAmount = Number(existingOrder.totalAmount);
        }
      } else {
        throw new Error(`Order '${orderId}' not found in database`);
      }
    }

    if (!finalAmount || finalAmount <= 0) {
      throw new Error('Valid transaction amount is required or must be derived from a valid orderId');
    }

    const finalTxRef = txRef || this.generateTxRef();
    const adapter = this.getAdapter(provider);
    const normalizedProvider = provider.toUpperCase();

    const paymentRecord = await prisma.payment.create({
      data: {
        orderId: validOrderId,
        amount: finalAmount,
        currency,
        status: 'PENDING',
        method: provider.toLowerCase() === 'bank_transfer' ? 'OTHER' : 'ONLINE_GATEWAY',
        timing: 'BEFORE_ORDER',
        provider: normalizedProvider,
        transactionRef: finalTxRef,
        processedById: processedById || null
      }
    });

    const initResult = await adapter.initializePayment({
      amount: finalAmount,
      currency,
      email: email || 'customer@restaurant.com',
      firstName,
      lastName,
      txRef: finalTxRef,
      callbackUrl,
      returnUrl,
      customization
    });

    // Record PaymentAttempt (Table #2)
    if (paymentRecord) {
      await prisma.paymentAttempt.create({
        data: {
          paymentId: paymentRecord.id,
          provider: normalizedProvider,
          providerReference: initResult.checkoutUrl || finalTxRef,
          amount: finalAmount,
          status: 'PENDING',
          requestData: { email, firstName, lastName, customization },
          responseData: JSON.parse(JSON.stringify(initResult))
        }
      });

      // Record Audit Log (Table #8)
      await this.logAudit({
        paymentId: paymentRecord.id,
        action: 'PAYMENT_INITIALIZED',
        performedById: processedById,
        oldStatus: null,
        newStatus: 'PENDING',
        metadata: { provider: normalizedProvider, txRef: finalTxRef, checkoutUrl: initResult.checkoutUrl }
      });
    }

    return {
      provider: normalizedProvider,
      paymentId: paymentRecord?.id || null,
      ...initResult
    };
  }

  /**
   * 2. Verify Payment Completion
   */
  async verifyPayment({ provider = 'chapa', txRef, processedById, performedById }) {
    if (!txRef) {
      throw new Error('Transaction reference (txRef) is required for verification');
    }

    const actorId = processedById || performedById || null;
    const adapter = this.getAdapter(provider);
    const verification = await adapter.verifyPayment(txRef);

    const existingPayment = await prisma.payment.findUnique({
      where: { transactionRef: txRef }
    });

    if (existingPayment) {
      const oldStatus = existingPayment.status;
      const newStatus = verification.status === 'SUCCESS' ? 'SUCCESSFUL' : (verification.status === 'FAILED' ? 'FAILED' : 'PENDING');

      if (oldStatus !== newStatus) {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: newStatus,
            paidAt: newStatus === 'SUCCESSFUL' ? new Date() : existingPayment.paidAt
          }
        });

        // Log audit
        await this.logAudit({
          paymentId: existingPayment.id,
          action: `PAYMENT_VERIFIED_${newStatus}`,
          performedById: actorId,
          oldStatus,
          newStatus,
          metadata: verification.raw
        });
      }

      // Always update Order to CONFIRMED if payment is successful and order is PENDING
      if (newStatus === 'SUCCESSFUL' && existingPayment.orderId) {
        const order = await prisma.salesOrder.findUnique({ where: { id: existingPayment.orderId } });
        // Handle SalesOrder status
        if (order && order.status === 'PENDING') {
          await prisma.salesOrder.update({
            where: { id: existingPayment.orderId },
            data: { status: 'CONFIRMED' }
          });

          await prisma.orderStatusHistory.create({
            data: {
              orderId: existingPayment.orderId,
              previousStatus: 'PENDING',
              newStatus: 'CONFIRMED',
              reason: `Payment verified (${existingPayment.provider})`,
              createdById: actorId || null
            }
          }).catch(err => console.error('Order status history log error:', err.message));
        }

        // --- NEW: Automatically Close the Invoice ---
        const invoice = await prisma.invoice.findFirst({
          where: { salesOrderId: existingPayment.orderId }
        });

        if (invoice && invoice.status !== 'PAID') {
          // Create allocation
          await prisma.paymentAllocation.create({
            data: {
              paymentId: existingPayment.id,
              invoiceId: invoice.id,
              amount: existingPayment.amount
            }
          });

          // Update invoice balances and status
          const newPaidAmount = Number(invoice.paidAmount) + Number(existingPayment.amount);
          const newBalance = Number(invoice.total) - newPaidAmount;
          const invoiceStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              paidAmount: newPaidAmount,
              balance: newBalance,
              status: invoiceStatus
            }
          });
        }
      }
    }

    return verification;
  }

  /**
   * 3. PaymentProof Workflow (Manual/Bank Transfer Upload)
   */
  async uploadPaymentProof({ paymentId, fileUrl, fileName, fileType, fileSize, uploadedById }) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found`);
    }

    const proof = await prisma.paymentProof.create({
      data: {
        paymentId,
        fileUrl,
        fileName,
        fileType,
        fileSize,
        uploadedById: uploadedById || null,
        status: 'PENDING'
      }
    });

    // Update payment state to PROCESSING
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'PROCESSING' }
    });

    await this.logAudit({
      paymentId,
      action: 'PROOF_UPLOADED',
      performedById: uploadedById,
      oldStatus: payment.status,
      newStatus: 'PROCESSING',
      metadata: { proofId: proof.id, fileUrl }
    });

    return proof;
  }

  /**
   * Approve or Reject Payment Proof (Employee Action)
   */
  async verifyPaymentProof({ proofId, approved, rejectionReason, verifiedById }) {
    const proof = await prisma.paymentProof.findUnique({
      where: { id: proofId },
      include: { payment: true }
    });

    if (!proof) {
      throw new Error(`Payment Proof with ID ${proofId} not found`);
    }

    const newProofStatus = approved ? 'APPROVED' : 'REJECTED';
    const updatedProof = await prisma.paymentProof.update({
      where: { id: proofId },
      data: {
        status: newProofStatus,
        verifiedById: verifiedById || null,
        verifiedAt: new Date(),
        rejectionReason: approved ? null : rejectionReason
      }
    });

    const oldPaymentStatus = proof.payment.status;
    const newPaymentStatus = approved ? 'SUCCESSFUL' : 'FAILED';

    await prisma.payment.update({
      where: { id: proof.paymentId },
      data: {
        status: newPaymentStatus,
        paidAt: approved ? new Date() : null,
        processedById: verifiedById || null
      }
    });

    if (approved && proof.payment.orderId) {
      // 1. Update Order Status
      await prisma.salesOrder.update({
        where: { id: proof.payment.orderId },
        data: { status: 'CONFIRMED' }
      }).catch(() => {});

      // 2. Automatically Close the Invoice
      const invoice = await prisma.invoice.findFirst({
        where: { salesOrderId: proof.payment.orderId }
      });

      if (invoice && invoice.status !== 'PAID') {
        await prisma.paymentAllocation.create({
          data: {
            paymentId: proof.paymentId,
            invoiceId: invoice.id,
            amount: proof.payment.amount
          }
        });

        const newPaidAmount = Number(invoice.paidAmount) + Number(proof.payment.amount);
        const newBalance = Number(invoice.total) - newPaidAmount;
        
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaidAmount,
            balance: newBalance,
            status: newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID'
          }
        });
      }
    }

    await this.logAudit({
      paymentId: proof.paymentId,
      action: approved ? 'PROOF_APPROVED' : 'PROOF_REJECTED',
      performedById: verifiedById,
      oldStatus: oldPaymentStatus,
      newStatus: newPaymentStatus,
      metadata: { proofId, rejectionReason }
    });

    return updatedProof;
  }

  /**
   * 4. Refund Processing (Full or Partial)
   */
  async processRefund({ paymentId, amount, reason, requestedById, approvedById }) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { refunds: true }
    });

    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found`);
    }

    const currentRefundTotal = payment.refunds
      .filter(r => r.status === 'COMPLETED' || r.status === 'APPROVED')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const refundAmount = Number(amount);
    const totalPaymentAmount = Number(payment.amount);

    if (currentRefundTotal + refundAmount > totalPaymentAmount) {
      throw new Error(`Refund amount (${refundAmount} ETB) exceeds available total (${totalPaymentAmount - currentRefundTotal} ETB)`);
    }

    const adapter = this.getAdapter(payment.provider || 'chapa');
    const refundResult = await adapter.refundPayment({
      txRef: payment.transactionRef,
      amount: refundAmount,
      reason
    });

    const isFullRefund = currentRefundTotal + refundAmount >= totalPaymentAmount;
    const newPaymentStatus = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

    const refundRecord = await prisma.refund.create({
      data: {
        paymentId,
        amount: refundAmount,
        reason,
        status: refundResult.status === 'COMPLETED' ? 'COMPLETED' : 'APPROVED',
        provider: payment.provider,
        providerReference: refundResult.providerReference,
        requestedById: requestedById || null,
        approvedById: approvedById || null,
        processedAt: new Date()
      }
    });

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: newPaymentStatus }
    });

    await this.logAudit({
      paymentId,
      action: 'REFUND_PROCESSED',
      performedById: approvedById || requestedById,
      oldStatus: payment.status,
      newStatus: newPaymentStatus,
      metadata: { refundId: refundRecord.id, refundAmount, isFullRefund }
    });

    return refundRecord;
  }

  /**
   * 5. Webhook Handling with Idempotency Logging
   */
  async handleWebhook({ provider = 'chapa', body, headers }) {
    const txRef = body.tx_ref || body.txRef;
    const providerReference = body.reference || body.id || txRef;

    let existingPayment = null;
    if (txRef) {
      existingPayment = await prisma.payment.findUnique({ where: { transactionRef: txRef } });
    }

    // Idempotent webhook store (Table #5)
    const webhookRecord = await prisma.paymentWebhook.create({
      data: {
        paymentId: existingPayment?.id || null,
        provider: provider.toUpperCase(),
        event: body.event || 'payment.status_change',
        providerReference,
        payload: JSON.parse(JSON.stringify(body)),
        status: 'PENDING'
      }
    });

    const adapter = this.getAdapter(provider);
    const verification = await adapter.handleWebhook(body, headers);

    if (verification && verification.txRef) {
      await this.verifyPayment({ provider, txRef: verification.txRef });
    }

    await prisma.paymentWebhook.update({
      where: { id: webhookRecord.id },
      data: { status: 'PROCESSED', processedAt: new Date() }
    });

    return { webhookId: webhookRecord.id, verification };
  }

  /**
   * Get Full Payment Context & History (All 8 tables breakdown)
   */
  async getPaymentHistory(paymentId) {
    return await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        salesOrder: true,
        attempts: { orderBy: { createdAt: 'desc' } },
        proofs: { orderBy: { createdAt: 'desc' } },
        refunds: { orderBy: { createdAt: 'desc' } },
        webhooks: { orderBy: { createdAt: 'desc' } },
        auditLogs: { orderBy: { createdAt: 'desc' } },
        processedBy: { select: { id: true, name: true, email: true } }
      }
    });
  }

  /**
   * Fetch Active Payment Providers & Methods (Tables #6 & #7)
   */
  async getProvidersAndMethods() {
    return await prisma.paymentProvider.findMany({
      include: { methods: true }
    });
  }

  /**
   * Create a new Payment Provider dynamically from UI
   */
  async createPaymentProvider({ name, code, type = 'MANUAL' }) {
    const cleanCode = (code || name).toLowerCase().replace(/[^a-z0-9_]/g, '_');
    
    // Check if provider exists
    let provider = await prisma.paymentProvider.findFirst({
      where: { code: cleanCode }
    });

    if (provider) {
      throw new Error(`Payment provider with code '${cleanCode}' already exists`);
    }

    provider = await prisma.paymentProvider.create({
      data: {
        name,
        code: cleanCode,
        type: type.toUpperCase() === 'ONLINE' ? 'ONLINE' : 'MANUAL',
        isActive: true,
      }
    });

    // Register adapter for manual payment types if not registered yet
    if (!this.adapters.has(cleanCode)) {
      this.registerAdapter(cleanCode, new ManualPaymentAdapter(cleanCode));
    }

    return provider;
  }

  /**
   * Update an existing Payment Provider
   */
  async updatePaymentProvider(id, { name, isActive, type }) {
    const existing = await prisma.paymentProvider.findUnique({ where: { id } });
    if (!existing) throw new Error('Payment provider not found');

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (type !== undefined) updateData.type = type.toUpperCase() === 'ONLINE' ? 'ONLINE' : 'MANUAL';

    return await prisma.paymentProvider.update({
      where: { id },
      data: updateData,
      include: { methods: true }
    });
  }

  /**
   * Delete a Payment Provider
   */
  async deletePaymentProvider(id) {
    const existing = await prisma.paymentProvider.findUnique({ where: { id } });
    if (!existing) throw new Error('Payment provider not found');

    await prisma.paymentMethodOption.deleteMany({ where: { providerId: id } });
    await prisma.paymentProvider.delete({ where: { id } });

    return { id, message: `Payment provider ${existing.name} deleted successfully` };
  }

  /**
   * Create a new Method Option under a Provider
   */
  async createPaymentMethodOption(providerId, { name, code, requiresProof = true }) {
    const existing = await prisma.paymentProvider.findUnique({ where: { id: providerId } });
    if (!existing) throw new Error('Parent Payment Provider not found');

    const cleanCode = (code || name).toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    const option = await prisma.paymentMethodOption.create({
      data: {
        providerId,
        name,
        code: cleanCode,
        isActive: true,
        requiresProof: Boolean(requiresProof)
      }
    });
    return option;
  }

  /**
   * Update a Method Option
   */
  async updatePaymentMethodOption(id, { name, isActive, requiresProof }) {
    const existing = await prisma.paymentMethodOption.findUnique({ where: { id } });
    if (!existing) throw new Error('Payment method option not found');

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (requiresProof !== undefined) updateData.requiresProof = Boolean(requiresProof);

    return await prisma.paymentMethodOption.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * Delete a Method Option
   */
  async deletePaymentMethodOption(id) {
    const existing = await prisma.paymentMethodOption.findUnique({ where: { id } });
    if (!existing) throw new Error('Payment method option not found');

    await prisma.paymentMethodOption.delete({ where: { id } });
    return { id, message: `Payment method option ${existing.name} deleted successfully` };
  }
}

export default new PaymentService();
