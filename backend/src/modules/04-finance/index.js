import paymentRoutes from './payment.routes.js';
import paymentService from './payment.service.js';
import BasePaymentAdapter from './adapters/baseAdapter.js';
import ChapaAdapter from './adapters/chapaAdapter.js';

/**
 * Reusable Modular Payment System
 * Can be copied into any Node.js/Express project.
 */
export { paymentRoutes, paymentService, BasePaymentAdapter, ChapaAdapter };
