import BasePaymentAdapter from './baseAdapter.js';

class ManualPaymentAdapter extends BasePaymentAdapter {
  constructor(config = {}) {
    super(config);
  }

  /**
   * Initialize a manual payment (e.g. Bank Transfer, Cash)
   */
  async initializePayment(payload) {
    const { amount, currency = 'ETB', txRef } = payload;
    return {
      status: 'success',
      checkoutUrl: null,
      txRef,
      requiresProof: true,
      raw: {
        message: 'Manual payment initialized. Receipt upload required for verification.',
        amount,
        currency
      }
    };
  }

  /**
   * Verify manual payment status
   */
  async verifyPayment(txRef) {
    return {
      status: 'PENDING',
      txRef,
      requiresProof: true,
      raw: { message: 'Manual payment verification depends on employee receipt approval.' }
    };
  }

  /**
   * Handle Webhook for manual payments (N/A)
   */
  async handleWebhook(body, headers) {
    return {
      status: 'ACKNOWLEDGED',
      txRef: body.txRef || body.tx_ref,
      raw: body
    };
  }

  /**
   * Refund manual payment
   */
  async refundPayment(payload) {
    return {
      status: 'COMPLETED',
      providerReference: `REF-MANUAL-${Date.now()}`,
      raw: { message: 'Manual refund processed directly.' }
    };
  }
}

export default ManualPaymentAdapter;
