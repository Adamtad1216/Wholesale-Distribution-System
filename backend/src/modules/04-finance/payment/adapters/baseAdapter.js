/**
 * Base Payment Adapter (Interface)
 * Any new payment gateway (e.g., Chapa, Telebirr Direct, Stripe, PayPal) 
 * should extend this class to maintain a plug-and-play architecture across projects.
 */
class BasePaymentAdapter {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Initializes a payment transaction session with the gateway provider.
   * @param {Object} payload 
   * @param {number} payload.amount - Amount to charge
   * @param {string} payload.currency - Currency code (e.g., 'ETB', 'USD')
   * @param {string} payload.email - Customer email
   * @param {string} payload.firstName - Customer first name
   * @param {string} payload.lastName - Customer last name
   * @param {string} payload.txRef - Unique transaction reference code
   * @param {string} payload.callbackUrl - Webhook / status notification URL
   * @param {string} payload.returnUrl - Redirection URL after payment completion
   * @param {Object} [payload.customization] - Brand title, description, logo
   * @returns {Promise<{ status: string, checkoutUrl: string, txRef: string, raw: Object }>}
   */
  async initializePayment(payload) {
    throw new Error('Method initializePayment() must be implemented by payment adapter');
  }

  /**
   * Verifies the completion and authenticity of a transaction reference.
   * @param {string} txRef - Unique transaction reference code
   * @returns {Promise<{ status: 'SUCCESS' | 'FAILED' | 'PENDING', txRef: string, amount: number, raw: Object }>}
   */
  async verifyPayment(txRef) {
    throw new Error('Method verifyPayment() must be implemented by payment adapter');
  }

  /**
   * Process incoming webhook notification payloads.
   * @param {Object} body 
   * @param {Object} headers 
   * @returns {Promise<{ status: string, txRef: string, raw: Object }>}
   */
  async handleWebhook(body, headers) {
    throw new Error('Method handleWebhook() must be implemented by payment adapter');
  }

  /**
   * Process a refund for a payment
   * @param {Object} payload
   * @param {string} payload.txRef
   * @param {number} payload.amount
   * @param {string} [payload.reason]
   * @returns {Promise<{ status: string, providerReference: string, raw: Object }>}
   */
  async refundPayment(payload) {
    throw new Error('Method refundPayment() must be implemented by payment adapter');
  }
}

export default BasePaymentAdapter;
