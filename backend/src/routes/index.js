import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import customersRoutes from '../modules/customers/customers.routes.js';
import salesRoutes from '../modules/sales/sales.routes.js';
import deliveryRoutes from '../modules/delivery/delivery.routes.js';
import notificationsRoutes from '../modules/notifications/notifications.routes.js';
import reportingRoutes from '../modules/reporting/reporting.routes.js';
import aiRoutes from '../modules/ai/ai.routes.js';

const router = Router();

router.use('/v1/auth', authRoutes);
router.use('/v1/customers', customersRoutes);
router.use('/v1/sales', salesRoutes);
router.use('/v1/delivery', deliveryRoutes);
router.use('/v1/notifications', notificationsRoutes);
router.use('/v1/reporting', reportingRoutes);
router.use('/v1/ai', aiRoutes);

export const registerRoutes = (app) => {
  app.use('/api', router);
};