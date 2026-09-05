import api from '../../services/api';

export const financeApi = {
  // Invoices
  getInvoices: (params) => api.get('/invoices', { params }),
  getInvoiceById: (id) => api.get(`/invoices/${id}`),
  
  // Payments
  getProviders: () => api.get('/payments/providers'),
  initiatePayment: (data) => api.post('/payments/initialize', data),
  verifyPayment: (txRef) => api.get(`/payments/verify/${txRef}`),
  getPayments: () => api.get('/payments'),
  getPendingPayments: () => api.get('/payments?status=PROCESSING'),
  getPaymentHistory: (id) => api.get(`/payments/${id}/history`),
  approvePayment: (id, data) => api.patch(`/payments/${id}/approve`, data),
  submitPaymentProof: (paymentId, proofData) => {
    if (proofData instanceof FormData) {
      return api.post(`/payments/${paymentId}/proof`, proofData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.post(`/payments/${paymentId}/proof`, proofData);
  },
  
  // Credit
  getAllCredits: (params) => api.get('/credits', { params }),
  getCustomerCredits: (customerId) => api.get(`/credits/customer/${customerId}`),
  getCustomerCreditSummary: (customerId) => api.get(`/credits/customer/${customerId}/summary`),
  getCreditHistory: (id) => api.get(`/credits/${id}/history`),
  createManualCredit: (data) => api.post('/credits/manual', data),
  applyCreditToInvoice: (id, data) => api.post(`/credits/${id}/apply`, data),
  
  // Payment Terms
  getPaymentTerms: () => api.get('/payment-terms'),
  createPaymentTerm: (data) => api.post('/payment-terms', data),
  updatePaymentTerm: (id, data) => api.put(`/payment-terms/${id}`, data),
  deletePaymentTerm: (id) => api.delete(`/payment-terms/${id}`),
};
