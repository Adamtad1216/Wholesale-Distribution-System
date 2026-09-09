import paymentService from './payment.service.js';
import prisma from '../../../config/prisma.js';
import { uploadToCloudinary } from '../../../utils/cloudinary.js';

class PaymentController {
  /**
   * Initialize Payment Session
   * POST /api/v1/payments/initialize
   */
  async initialize(req, res) {
    try {
      const { amount, email, firstName, lastName, orderId, provider = 'chapa' } = req.body;

      if (!orderId && (!amount || amount <= 0)) {
        return res.status(400).json({ message: 'Either orderId or valid transaction amount is required' });
      }

      const txRef = paymentService.generateTxRef('REST');
      const cleanTitle = 'Restaurant Payment';
      const cleanDesc = `Order ${orderId || 'Checkout'}`.replace(/[^a-zA-Z0-9.\-_ ]/g, '').substring(0, 50);
      const clientOrigin = req.get('referer') ? new URL(req.get('referer')).origin : (process.env.FRONTEND_URL || 'http://localhost:5173');

      const result = await paymentService.initializePayment({
        provider,
        amount,
        email: email || req.user?.email || 'customer@restaurant.com',
        firstName: firstName || req.user?.name || 'Customer',
        lastName: lastName || 'User',
        txRef,
        orderId,
        processedById: req.user?.id,
        callbackUrl: `${req.protocol}://${req.get('host')}/api/v1/payments/webhook`,
        returnUrl: `${clientOrigin}/receipt?tx_ref=${txRef}`,
        customization: {
          title: cleanTitle,
          description: cleanDesc
        }
      });

      res.status(200).json({
        message: 'Payment session initialized successfully',
        data: result
      });
    } catch (err) {
      console.error('[Payment Controller Error] Initialization failed:', err.message);
      res.status(500).json({ message: err.message || 'Payment initialization failed' });
    }
  }

  /**
   * Verify Payment Status
   * GET /api/v1/payments/verify/:txRef?provider=chapa
   */
  async verify(req, res) {
    try {
      const { txRef } = req.params;
      const provider = req.query.provider || 'chapa';

      const verification = await paymentService.verifyPayment({
        provider,
        txRef,
        processedById: req.user?.id
      });

      res.status(200).json({
        message: 'Payment verification completed',
        data: verification
      });
    } catch (err) {
      console.error('[Payment Controller Error] Verification failed:', err.message);
      res.status(500).json({ message: err.message || 'Payment verification failed' });
    }
  }

  /**
   * Handle Webhook Event
   * POST /api/v1/payments/webhook?provider=chapa
   */
  async webhook(req, res) {
    try {
      const provider = req.query.provider || 'chapa';
      const result = await paymentService.handleWebhook({
        provider,
        body: req.body,
        headers: req.headers
      });

      res.status(200).json({
        message: 'Webhook processed successfully',
        data: result
      });
    } catch (err) {
      console.error('[Payment Controller Error] Webhook error:', err.message);
      res.status(500).json({ message: err.message || 'Webhook processing failed' });
    }
  }

  /**
   * Upload Manual Payment Proof (Receipt)
   * POST /api/v1/payments/:id/proof
   */
  async uploadProof(req, res) {
    try {
      const { id: paymentId } = req.params;
      let { fileUrl, fileName, fileType, fileSize } = req.body || {};

      // If physical file buffer uploaded, send directly to Cloudinary 'paymentproof' folder
      if (req.file) {
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, 'paymentproof');
        fileUrl = cloudinaryResult.secure_url;
        fileName = req.file.originalname;
        fileType = req.file.mimetype;
        fileSize = req.file.size;
      }

      if (!fileUrl) {
        return res.status(400).json({ message: 'Receipt image or document file is required' });
      }

      const proof = await paymentService.uploadPaymentProof({
        paymentId,
        fileUrl,
        fileName: fileName || 'Payment Receipt',
        fileType: fileType || 'application/octet-stream',
        fileSize: fileSize ? Number(fileSize) : null,
        uploadedById: req.user?.id
      });

      res.status(201).json({
        message: 'Payment proof receipt uploaded successfully. Pending verification.',
        proofId: proof.id,
        data: proof
      });
    } catch (err) {
      console.error('[Payment Controller Error] Upload proof failed:', err.message);
      res.status(500).json({ message: err.message || 'Proof upload failed' });
    }
  }

  /**
   * Stream / View Payment Proof File (Proxy to avoid 401/CORS errors)
   * GET /api/v1/payments/proof/:proofId/file
   */
  async getProofFile(req, res) {
    try {
      const { proofId } = req.params;
      const download = req.query.download === 'true';

      const proof = await prisma.paymentProof.findUnique({
        where: { id: proofId }
      });

      if (!proof || !proof.fileUrl) {
        return res.status(404).json({ message: 'Proof file not found' });
      }

      if (proof.fileUrl.startsWith('http://') || proof.fileUrl.startsWith('https://')) {
        let fileResponse = await fetch(proof.fileUrl);

        // If Cloudinary returned 401 Unauthorized, retry with server Cloudinary API credentials
        if (!fileResponse.ok && (fileResponse.status === 401 || fileResponse.status === 403)) {
          const apiKey = process.env.CLOUDINARY_API_KEY;
          const apiSecret = process.env.CLOUDINARY_API_SECRET;
          if (apiKey && apiSecret) {
            const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;
            fileResponse = await fetch(proof.fileUrl, {
              headers: { Authorization: authHeader }
            });
          }
        }

        if (!fileResponse.ok) {
          return res.redirect(proof.fileUrl);
        }

        const contentType = proof.fileType || fileResponse.headers.get('content-type') || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);

        if (download) {
          res.setHeader('Content-Disposition', `attachment; filename="${proof.fileName || 'payment_proof'}"`);
        } else {
          res.setHeader('Content-Disposition', 'inline');
        }

        const arrayBuffer = await fileResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return res.send(buffer);
      }

      res.status(400).json({ message: 'Invalid file reference' });
    } catch (err) {
      console.error('[Payment Controller Error] Get proof file error:', err.message);
      res.status(500).json({ message: err.message || 'Failed to retrieve proof file' });
    }
  }

  /**
   * Verify Payment Proof (Employee Approve/Reject)
   * PATCH /api/v1/payments/proof/:proofId/verify
   */
  async verifyProof(req, res) {
    try {
      const { proofId } = req.params;
      const { approved, rejectionReason } = req.body;

      if (typeof approved !== 'boolean') {
        return res.status(400).json({ message: 'Approval status (approved: true/false) is required' });
      }

      const proof = await paymentService.verifyPaymentProof({
        proofId,
        approved,
        rejectionReason,
        verifiedById: req.user?.id
      });

      res.status(200).json({
        message: approved ? 'Payment proof approved and payment confirmed.' : 'Payment proof rejected.',
        data: proof
      });
    } catch (err) {
      console.error('[Payment Controller Error] Verify proof failed:', err.message);
      res.status(500).json({ message: err.message || 'Proof verification failed' });
    }
  }

  /**
   * Process Full or Partial Refund
   * POST /api/v1/payments/:id/refund
   */
  async processRefund(req, res) {
    try {
      const { id: paymentId } = req.params;
      const { amount, reason } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Valid refund amount is required' });
      }

      const refund = await paymentService.processRefund({
        paymentId,
        amount,
        reason,
        requestedById: req.user?.id,
        approvedById: req.user?.id
      });

      res.status(200).json({
        message: 'Refund processed successfully',
        data: refund
      });
    } catch (err) {
      console.error('[Payment Controller Error] Refund processing failed:', err.message);
      res.status(500).json({ message: err.message || 'Refund processing failed' });
    }
  }

  /**
   * Get Complete Payment Audit History (All 8 Core Tables)
   * GET /api/v1/payments/:id/history
   */
  async getHistory(req, res) {
    try {
      const { id: paymentId } = req.params;
      const history = await paymentService.getPaymentHistory(paymentId);

      if (!history) {
        return res.status(404).json({ message: `Payment record with ID ${paymentId} not found` });
      }

      // Security Check: Enforce permission scoping
      const permissions = req.user?.userRoles?.flatMap((ur) =>
        ur.role.rolePermissions?.map((rp) => rp.permission.name) || []
      ) || [];
      const roles = req.user?.userRoles?.map((ur) => ur.role.name) || [];
      const isSuperOrAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN') || permissions.includes('*');

      const hasReadAll = isSuperOrAdmin || permissions.includes('payments:read_all') || permissions.includes('payment:read_all');
      const hasRead = permissions.includes('payments:read') || permissions.includes('payment:read') || roles.includes('CUSTOMER');

      if (!hasReadAll && (hasRead || roles.includes('CUSTOMER'))) {
        const customer = await prisma.customer.findFirst({
          where: {
            isArchived: false,
            OR: [
              { personId: req.user?.personId },
              { organization: { contacts: { some: { personId: req.user?.personId } } } }
            ]
          },
          select: { id: true }
        });

        const employee = await prisma.employee.findFirst({
          where: { personId: req.user?.personId },
          select: { id: true }
        });

        const isCustomerOwner = customer && history.customerId === customer.id;
        const isCreator = history.createdById === req.user?.id;
        const isProcessor = history.processedById === req.user?.id;
        const isReceiver = history.receivedBy === req.user?.id;
        const isSalesRep = employee && history.salesOrder?.salesRepId === employee.id;

        if (!isCustomerOwner && !isCreator && !isProcessor && !isReceiver && !isSalesRep) {
          return res.status(403).json({
            message: 'Access denied: You can only view your own payment details'
          });
        }
      } else if (!hasReadAll) {
        return res.status(403).json({
          message: 'Access denied: You do not have permission to view this payment'
        });
      }

      res.status(200).json({
        message: 'Payment audit history and details',
        data: history
      });
    } catch (err) {
      console.error('[Payment Controller Error] Fetch history failed:', err.message);
      res.status(500).json({ message: err.message || 'Failed to fetch payment history' });
    }
  }

  /**
   * Manually Approve or Reject a Pending Payment
   * PATCH /api/v1/payments/:id/approve
   */
  async approvePayment(req, res) {
    try {
      const { id: paymentId } = req.params;
      const { approved, paymentType = 'FULL', customAmount, rejectionReason } = req.body;

      if (typeof approved !== 'boolean') {
        return res.status(400).json({ message: 'approved (true/false) is required' });
      }

      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      const newStatus = approved ? 'SUCCESSFUL' : 'FAILED';

      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: newStatus,
          paidAt: approved ? new Date() : null,
          processedById: req.user?.id
        }
      });

      // Auto-update invoice if approved
      if (approved && payment.orderId) {
        const invoice = await prisma.invoice.findFirst({
          where: { salesOrderId: payment.orderId }
        });

        if (invoice && invoice.status !== 'PAID') {
          let approvedPaidAmount = 0;

          if (paymentType === 'FULL') {
            approvedPaidAmount = Number(invoice.total) - Number(invoice.paidAmount || 0);
            if (approvedPaidAmount <= 0) approvedPaidAmount = Number(payment.amount);
          } else {
            // Partial payment
            const parsedCustom = parseFloat(customAmount);
            if (!isNaN(parsedCustom) && parsedCustom > 0) {
              approvedPaidAmount = parsedCustom;
            } else {
              approvedPaidAmount = Number(payment.amount);
            }
          }

          const newPaidAmount = Number(invoice.paidAmount || 0) + approvedPaidAmount;
          const newBalance = Math.max(0, Number(invoice.total) - newPaidAmount);
          const invoiceStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

          await prisma.paymentAllocation.create({
            data: { paymentId, invoiceId: invoice.id, amount: approvedPaidAmount }
          });

          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { paidAmount: newPaidAmount, balance: newBalance, status: invoiceStatus }
          });
        }
      }

      // Audit log
      await paymentService.logAudit({
        paymentId,
        action: approved ? 'PAYMENT_MANUALLY_APPROVED' : 'PAYMENT_MANUALLY_REJECTED',
        performedById: req.user?.id,
        oldStatus: payment.status,
        newStatus,
        metadata: { paymentType, customAmount, rejectionReason: rejectionReason || null }
      });

      res.status(200).json({
        message: approved
          ? `Payment approved as ${paymentType} payment.`
          : `Payment rejected. Reason: ${rejectionReason || 'Not specified'}`,
        data: { paymentId, newStatus, paymentType }
      });
    } catch (err) {
      console.error('[Payment Controller Error] Approve/reject failed:', err.message);
      res.status(500).json({ message: err.message || 'Approval action failed' });
    }
  }

  /**
   * List All Payments
   * GET /api/v1/payments
   */
  async getPayments(req, res) {
    try {
      const { status } = req.query;
      let where = {};
      if (status) {
        if (status.includes(',')) {
          where = { status: { in: status.split(',').map(s => s.trim().toUpperCase()) } };
        } else {
          where = { status: status.toUpperCase() };
        }
      }

      // Check user permissions and roles
      const permissions = req.user?.userRoles?.flatMap((ur) =>
        ur.role.rolePermissions?.map((rp) => rp.permission.name) || []
      ) || [];
      const roles = req.user?.userRoles?.map((ur) => ur.role.name) || [];
      const isSuperOrAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN') || permissions.includes('*');

      const hasReadAll = isSuperOrAdmin || permissions.includes('payments:read_all') || permissions.includes('payment:read_all');
      const hasRead = permissions.includes('payments:read') || permissions.includes('payment:read') || roles.includes('CUSTOMER');

      if (hasReadAll && !roles.includes('CUSTOMER')) {
        // Allowed to view all payments across the system
        if (req.query.customerId) where.customerId = req.query.customerId;
        if (req.query.supplierId) where.supplierId = req.query.supplierId;
      } else if (hasRead || roles.includes('CUSTOMER')) {
        // Scoped strictly to own payments
        // 1. Check if user is linked to a customer record
        const customer = await prisma.customer.findFirst({
          where: {
            isArchived: false,
            OR: [
              { personId: req.user?.personId },
              { organization: { contacts: { some: { personId: req.user?.personId } } } }
            ]
          },
          select: { id: true }
        });

        if (customer) {
          where.customerId = customer.id;
        } else {
          // 2. User is staff / sales rep
          const employee = await prisma.employee.findFirst({
            where: { personId: req.user?.personId },
            select: { id: true }
          });

          const ownConditions = [
            { createdById: req.user?.id },
            { processedById: req.user?.id },
            { receivedBy: req.user?.id },
          ];

          if (employee) {
            ownConditions.push({ salesOrder: { salesRepId: employee.id } });
          }

          where.OR = ownConditions;
        }
      } else {
        return res.status(403).json({
          message: 'Access denied: You do not have permission to view payments'
        });
      }

      const payments = await prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          salesOrder: {
            select: {
              orderNumber: true,
              invoices: { select: { id: true, invoiceNumber: true } }
            }
          },
          supplier: {
            select: {
              id: true,
              supplierCode: true,
              person: { select: { firstName: true, middleName: true, lastName: true } },
              organization: { select: { name: true } }
            }
          },
          customer: {
            select: {
              id: true,
              customerCode: true,
              person: { select: { firstName: true, middleName: true, lastName: true } },
              organization: { select: { name: true } }
            }
          },
          allocations: {
            include: {
              invoice: { select: { id: true, invoiceNumber: true } }
            }
          },
          processedBy: { select: { id: true, username: true } }
        }
      });
      res.status(200).json({ message: 'Payments list', data: payments });
    } catch (err) {
      console.error('[Payment Controller Error] Get payments failed:', err.message);
      res.status(500).json({ message: err.message || 'Failed to fetch payments' });
    }
  }

  /**
   * Get Active Payment Providers & Methods
   * GET /api/v1/payments/providers
   */
  async getProviders(req, res) {
    try {
      const providers = await paymentService.getProvidersAndMethods();
      res.status(200).json({
        message: 'Active payment providers and methods',
        data: providers
      });
    } catch (err) {
      console.error('[Payment Controller Error] Get providers failed:', err.message);
      res.status(500).json({ message: err.message || 'Failed to fetch payment providers' });
    }
  }

  /**
   * Create New Payment Provider
   * POST /api/v1/payments/providers
   */
  async createProvider(req, res) {
    try {
      const { name, code, type } = req.body;
      if (!name) {
        return res.status(400).json({ message: 'Payment provider name is required' });
      }

      const provider = await paymentService.createPaymentProvider({ name, code, type });
      res.status(201).json({
        message: 'Payment provider created successfully',
        data: provider
      });
    } catch (err) {
      console.error('[Payment Controller Error] Create provider failed:', err.message);
      res.status(500).json({ message: err.message || 'Failed to create payment provider' });
    }
  }

  /**
   * Update Payment Provider
   * PUT /api/v1/payments/providers/:id
   */
  async updateProvider(req, res) {
    try {
      const { id } = req.params;
      const { name, isActive, type } = req.body;

      const provider = await paymentService.updatePaymentProvider(id, { name, isActive, type });
      res.status(200).json({
        message: 'Payment provider updated successfully',
        data: provider
      });
    } catch (err) {
      console.error('[Payment Controller Error] Update provider failed:', err.message);
      res.status(500).json({ message: err.message || 'Failed to update payment provider' });
    }
  }

  /**
   * Delete Payment Provider
   * DELETE /api/v1/payments/providers/:id
   */
  async deleteProvider(req, res) {
    try {
      const { id } = req.params;
      const result = await paymentService.deletePaymentProvider(id);
      res.status(200).json({
        message: result.message,
        data: result
      });
    } catch (err) {
      console.error('[Payment Controller Error] Delete provider failed:', err.message);
      res.status(500).json({ message: err.message || 'Failed to delete payment provider' });
    }
  }

  /**
   * Create New Payment Method Option
   * POST /api/v1/payments/providers/:providerId/methods
   */
  async createMethodOption(req, res) {
    try {
      const { providerId } = req.params;
      const { name, code, requiresProof } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'Payment method name is required' });
      }

      const option = await paymentService.createPaymentMethodOption(providerId, { name, code, requiresProof });
      res.status(201).json({
        message: 'Payment method option created successfully',
        data: option
      });
    } catch (err) {
      console.error('[Payment Controller Error] Create method option failed:', err.message);
      res.status(500).json({ message: err.message || 'Failed to create payment method option' });
    }
  }

  /**
   * Update Payment Method Option
   * PUT /api/v1/payments/methods/:id
   */
  async updateMethodOption(req, res) {
    try {
      const { id } = req.params;
      const { name, isActive, requiresProof } = req.body;

      const option = await paymentService.updatePaymentMethodOption(id, { name, isActive, requiresProof });
      res.status(200).json({
        message: 'Payment method option updated successfully',
        data: option
      });
    } catch (err) {
      console.error('[Payment Controller Error] Update method option failed:', err.message);
      res.status(500).json({ message: err.message || 'Failed to update payment method option' });
    }
  }

  /**
   * Delete Payment Method Option
   * DELETE /api/v1/payments/methods/:id
   */
  async deleteMethodOption(req, res) {
    try {
      const { id } = req.params;
      const result = await paymentService.deletePaymentMethodOption(id);
      res.status(200).json({
        message: result.message,
        data: result
      });
    } catch (err) {
      console.error('[Payment Controller Error] Delete method option failed:', err.message);
      res.status(500).json({ message: err.message || 'Failed to delete payment method option' });
    }
  }

  /**
   * Get Ethiopian Banks List from Chapa
   * GET /api/v1/payments/chapa/banks
   */
  async getChapaBanks(req, res) {
    try {
      const adapter = paymentService.getAdapter('chapa');
      const banks = await adapter.getBanks();
      res.status(200).json({
        message: 'Ethiopian supported banks retrieved successfully',
        data: banks.data
      });
    } catch (err) {
      console.error('[Payment Controller Error] Get Chapa banks failed:', err.message);
      res.status(500).json({ message: err.message || 'Failed to fetch Ethiopian banks' });
    }
  }

  /**
   * Initiate Chapa Transfer / Payout
   * POST /api/v1/payments/chapa/transfers
   */
  async initiateChapaTransfer(req, res) {
    try {
      const { accountName, accountNumber, amount, bankCode, reference, currency } = req.body;

      if (!accountName || !accountNumber || !amount || !bankCode) {
        return res.status(400).json({
          message: 'accountName, accountNumber, amount, and bankCode are required fields.'
        });
      }

      const adapter = paymentService.getAdapter('chapa');
      const result = await adapter.initiateTransfer({
        accountName,
        accountNumber,
        amount,
        bankCode,
        reference,
        currency
      });

      res.status(200).json({
        message: 'Chapa money transfer initiated successfully',
        data: result
      });
    } catch (err) {
      console.error('[Payment Controller Error] Chapa transfer failed:', err.message);
      res.status(500).json({ message: err.message || 'Transfer initiation failed' });
    }
  }

  /**
   * Verify Chapa Transfer
   * GET /api/v1/payments/chapa/transfers/verify/:reference
   */
  async verifyChapaTransfer(req, res) {
    try {
      const { reference } = req.params;
      const adapter = paymentService.getAdapter('chapa');
      const result = await adapter.verifyTransfer(reference);

      res.status(200).json({
        message: 'Chapa transfer verification status',
        data: result
      });
    } catch (err) {
      console.error('[Payment Controller Error] Verify Chapa transfer failed:', err.message);
      res.status(500).json({ message: err.message || 'Transfer verification failed' });
    }
  }
}

export default new PaymentController();

