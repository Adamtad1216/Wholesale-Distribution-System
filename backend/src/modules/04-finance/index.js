import paymentRoutes from './payment/payment.routes.js';
import paymentService from './payment/payment.service.js';
import BasePaymentAdapter from './payment/adapters/baseAdapter.js';
import ChapaAdapter from './payment/adapters/chapaAdapter.js';

/**
 * Reusable Modular Payment System
 * Can be copied into any Node.js/Express project.
 */
export { paymentRoutes, paymentService, BasePaymentAdapter, ChapaAdapter };
