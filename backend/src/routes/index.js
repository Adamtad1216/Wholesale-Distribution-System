import { Router } from 'express';
import authRoutes from '../modules/01-identity-access/auth/auth.routes.js';
import customersRoutes from '../modules/09-customers/customers/customers.routes.js';
import usersRoutes from '../modules/01-identity-access/users/users.routes.js';
import salesRoutes from '../modules/10-sales/sales.routes.js';
import deliveryRoutes from '../modules/12-delivery-logistics/delivery/delivery.routes.js';
import notificationsRoutes from '../modules/14-notifications/notifications/notifications.routes.js';
import reportingRoutes from '../modules/16-reporting-dashboards/reporting/reporting.routes.js';
import aiRoutes from '../modules/17-ai/ai/ai.routes.js';
import pricingRoutes from '../modules/11-pricing-discounts/pricing.routes.js';

import companiesRoutes from '../modules/06-branches-warehouses/companies/companies.routes.js';
import branchesRoutes from '../modules/06-branches-warehouses/branches/branches.routes.js';
import warehousesRoutes from '../modules/06-branches-warehouses/warehouses/warehouses.routes.js';
import regionsRoutes from '../modules/06-branches-warehouses/regions/regions.routes.js';
import jobSpecificationsRoutes from '../modules/01-identity-access/job-specifications/jobSpecifications.routes.js';
import employeesRoutes from '../modules/01-identity-access/employees/employees.routes.js';

const router = Router();

router.use('/v1/auth', authRoutes);
router.use('/v1/customers', customersRoutes);
router.use('/v1/companies', companiesRoutes);
router.use('/v1/branches', branchesRoutes);
router.use('/v1/warehouses', warehousesRoutes);
router.use('/v1/regions', regionsRoutes);
router.use('/v1/job-specifications', jobSpecificationsRoutes);
router.use('/v1/employees', employeesRoutes);
router.use('/v1/users', usersRoutes);
router.use('/v1/sales', salesRoutes);
router.use('/v1/delivery', deliveryRoutes);
router.use('/v1/notifications', notificationsRoutes);
router.use('/v1/reports', reportingRoutes);
router.use('/v1/ai', aiRoutes);
router.use('/v1/pricing', pricingRoutes);

export const registerRoutes = (app) => {
  app.use('/api', router);
};