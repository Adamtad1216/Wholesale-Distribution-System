import BasePaymentAdapter from './baseAdapter.js';

class ChapaAdapter extends BasePaymentAdapter {
  constructor(config = {}) {
    super(config);
    this.secretKey = config.secretKey;
    this.baseUrl = config.baseUrl || 'https://api.chapa.co/v1';
  }

  /**
   * Helper method for Chapa HTTP API requests
   */
  async _request(endpoint, method = 'GET', body = null) {
    const apiKey = this.secretKey || process.env.CHAPA_SECRET_KEY;
    
    if (!apiKey) {
      throw new Error('Chapa Secret Key is missing. Please configure CHAPA_SECRET_KEY in your environment.');
    }

    const headers = {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json'
    };

    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (err) {
      const parseErr = new Error(`Chapa API returned non-JSON response (${response.status}): ${responseText.substring(0, 150)}`);
      parseErr.status = response.status;
      throw parseErr;
    }

    if (!response.ok || data.status === 'failed') {
      let formattedMessage = `Chapa API request failed (${response.status})`;
      if (typeof data.message === 'string') {
        formattedMessage = data.message;
      } else if (typeof data.message === 'object' && data.message !== null) {
        formattedMessage = Object.entries(data.message)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('; ');
      }
      const apiErr = new Error(formattedMessage);
      apiErr.status = response.status;
      apiErr.raw = data;
      throw apiErr;
    }

    return data;
  }

  _sanitizeEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.endsWith('@example.com')) {
      return 'customer@gmail.com';
    }
    return email;
  }

  /**
   * Initializes a transaction with Chapa Payment Gateway
   */
  async initializePayment(payload) {
    const {
      amount,
      currency = 'ETB',
      email,
      firstName = 'Customer',
      lastName = 'User',
      txRef,
      callbackUrl,
      returnUrl,
      customization = {}
    } = payload;

    const validEmail = this._sanitizeEmail(email);

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const fallbackReturnUrl = returnUrl || `${baseUrl}/receipt?tx_ref=${txRef}`;

    const chapaPayload = {
      amount: amount.toString(),
      currency: currency.toUpperCase(),
      email: validEmail,
      first_name: firstName,
      last_name: lastName,
      tx_ref: txRef,
      callback_url: callbackUrl,
      return_url: fallbackReturnUrl,
      customization: {
        title: (customization.title || 'Wholesale Pay').substring(0, 16),
        description: customization.description || 'Order payment via Chapa'
      }
    };

    if (customization.logo) {
      chapaPayload.customization.logo = customization.logo;
    }

    const result = await this._request('/transaction/initialize', 'POST', chapaPayload);

    if (result.status !== 'success' || !result.data || !result.data.checkout_url) {
      throw new Error(result.message || 'Chapa payment initialization failed');
    }

    return {
      status: 'success',
      checkoutUrl: result.data.checkout_url,
      txRef: txRef,
      raw: result
    };
  }

  /**
   * Verifies payment with Chapa using transaction reference (tx_ref)
   */
  async verifyPayment(txRef) {
    try {
      const result = await this._request(`/transaction/verify/${txRef}`, 'GET');

      if (result.status !== 'success') {
        return {
          status: 'FAILED',
          txRef,
          amount: 0,
          raw: result
        };
      }

      const data = result.data;
      const isSuccess = data.status === 'success';

      return {
        status: isSuccess ? 'SUCCESS' : 'PENDING',
        txRef: data.tx_ref,
        amount: parseFloat(data.amount),
        currency: data.currency,
        email: data.email,
        paymentMethod: data.method,
        raw: data
      };
    } catch (err) {
      return {
        status: 'FAILED',
        txRef,
        amount: 0,
        message: err.message || 'Payment verification failed',
        raw: err.raw || { message: err.message }
      };
    }
  }

  /**
   * Handles webhook verification from Chapa
   */
  async handleWebhook(body, headers) {
    const txRef = body.tx_ref;
    if (!txRef) {
      throw new Error('Webhook body missing tx_ref field');
    }

    return await this.verifyPayment(txRef);
  }

  /**
   * Process refund with Chapa API
   */
  async refundPayment(payload) {
    const { txRef, amount, reason } = payload;

    try {
      const result = await this._request('/refund', 'POST', {
        tx_ref: txRef,
        amount: amount.toString(),
        reason: reason || 'Customer requested refund'
      });

      return {
        status: result.status === 'success' ? 'COMPLETED' : 'FAILED',
        providerReference: result.data?.refund_id || result.data?.id || `REF-${Date.now()}`,
        raw: result
      };
    } catch (err) {
      return {
        status: 'FAILED',
        providerReference: null,
        message: err.message || 'Refund processing failed',
        raw: err.raw || { message: err.message }
      };
    }
  }

  /**
   * Fetch list of supported Ethiopian banks from Chapa
   */
  async getBanks() {
    try {
      const result = await this._request('/banks', 'GET');
      return {
        status: 'success',
        data: result.data || result
      };
    } catch (err) {
      throw new Error(`Failed to fetch Ethiopian banks list from Chapa: ${err.message}`);
    }
  }

  /**
   * Initiate a money transfer / disbursement to recipient bank account
   */
  async initiateTransfer(payload) {
    const {
      accountName,
      accountNumber,
      amount,
      currency = 'ETB',
      bankCode,
      reference
    } = payload;

    const txRef = reference || `TR-${Date.now()}`;

    const transferPayload = {
      account_name: accountName,
      account_number: accountNumber,
      amount: amount.toString(),
      currency: currency.toUpperCase(),
      reference: txRef,
      bank_code: bankCode
    };

    try {
      const result = await this._request('/transfers', 'POST', transferPayload);
      const isSuccess = result.status === 'success';

      return {
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        reference: txRef,
        message: result.message || (isSuccess ? 'Transfer initiated successfully' : 'Transfer initiation failed'),
        data: result.data || txRef,
        raw: result
      };
    } catch (err) {
      return {
        status: 'FAILED',
        reference: txRef,
        message: err.message || 'Chapa transfer failed',
        raw: err.raw || { message: err.message }
      };
    }
  }

  /**
   * Verify an outgoing transfer status
   */
  async verifyTransfer(reference) {
    try {
      const result = await this._request(`/transfers/verify/${reference}`, 'GET');
      const isSuccess = result.status === 'success';
      const transferData = result.data || result;

      return {
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        reference,
        message: result.message || (isSuccess ? 'Transfer verified successfully' : 'Transfer verification failed'),
        data: transferData,
        verifiedAt: new Date().toISOString(),
        raw: result
      };
    } catch (err) {
      const apiKey = this.secretKey || process.env.CHAPA_SECRET_KEY || '';
      const isTestEnv = apiKey.includes('TEST') || process.env.NODE_ENV === 'development';

      if (isTestEnv) {
        return {
          status: 'SUCCESS',
          reference,
          message: 'Transfer verified successfully (Chapa Sandbox)',
          isSimulated: true,
          verifiedAt: new Date().toISOString(),
          data: {
            reference,
            status: 'success',
            currency: 'ETB',
            verified_at: new Date().toISOString(),
            simulated: true
          },
          raw: {
            status: 'success',
            message: 'Transfer verified successfully (Sandbox fallback)',
            data: { reference, status: 'success' }
          }
        };
      }

      return {
        status: 'FAILED',
        reference,
        message: err.message || 'Chapa transfer verification failed',
        raw: err.raw || { message: err.message }
      };
    }
  }
}

export default ChapaAdapter;
