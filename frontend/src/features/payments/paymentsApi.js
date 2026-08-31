import api from '../../services/api';

export const paymentsApi = {
  // Invoices
  getInvoices: (params) => api.get('/finance/invoices', { params }),
  createInvoice: (invoiceData) => api.post('/finance/invoices', invoiceData),
  
  // Payments
  getPayments: (params) => api.get('/finance/payments', { params }),
  initiatePayment: (paymentData) => api.post('/finance/payments', paymentData),
  submitPaymentProof: (paymentId, proofData) => api.post(`/finance/payments/${paymentId}/proof`, proofData),
  
  // Payment Terms
  getPaymentTerms: () => api.get('/finance/payment-terms'),
};
