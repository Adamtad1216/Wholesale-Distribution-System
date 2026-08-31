import paymentService from './payment.service.js';

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
        returnUrl: `${clientOrigin}?status=success&tx_ref=${txRef}`,
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
        message: 'Payment verification status',
        data: verification
      });
    } catch (err) {
      console.error('[Payment Controller Error] Verification failed:', err.message);
      res.status(500).json({ message: err.message || 'Payment verification failed' });
    }
  }

  /**
   * Handle Provider Webhooks (Idempotent)
   * POST /api/v1/payments/webhook
   */
  async webhook(req, res) {
    try {
      const provider = req.query.provider || 'chapa';
      const result = await paymentService.handleWebhook({
        provider,
        body: req.body,
        headers: req.headers
      });

      res.status(200).json({ status: 'ACKNOWLEDGED', data: result });
    } catch (err) {
      console.error('[Payment Controller Webhook Error]:', err.message);
      res.status(400).json({ message: err.message });
    }
  }

  /**
   * Upload Manual Payment Proof (Receipt)
   * POST /api/v1/payments/:id/proof
   */
  async uploadProof(req, res) {
    try {
      const { id: paymentId } = req.params;
      const { fileUrl, fileName, fileType, fileSize } = req.body;

      if (!fileUrl) {
        return res.status(400).json({ message: 'Receipt image/document URL is required' });
      }

      const proof = await paymentService.uploadPaymentProof({
        paymentId,
        fileUrl,
        fileName,
        fileType,
        fileSize,
        uploadedById: req.user?.id
      });

      res.status(201).json({
        message: 'Payment proof receipt uploaded successfully. Pending verification.',
        proofId: proof.id,
        data: {
          proofId: proof.id,
          ...proof
        }
      });
    } catch (err) {
      console.error('[Payment Controller Error] Upload proof failed:', err.message);
      res.status(500).json({ message: err.message || 'Proof upload failed' });
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
}

export default new PaymentController();
