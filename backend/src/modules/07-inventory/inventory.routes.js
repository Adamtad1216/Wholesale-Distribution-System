import { Router } from 'express';
import stockRoutes from './stock/stock.routes.js';
import adjustmentsRoutes from './adjustments/adjustments.routes.js';
import reservationsRoutes from './reservations/reservations.routes.js';
import transfersRoutes from './transfers/transfers.routes.js';
import stockAdditionsRoutes from './stock-additions/stock-additions.routes.js';
import { listReservableSalesOrders } from './reservations/reservations.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.use('/stocks', stockRoutes);
router.use('/adjustments', adjustmentsRoutes);
router.use('/reservations', reservationsRoutes);
router.use('/transfers', transfersRoutes);
router.use('/stock-additions', stockAdditionsRoutes);
router.get(
  '/sales-orders',
  authenticate,
  requirePermission(['inventory:reservations:read', 'inventory:reservations:create']),
  listReservableSalesOrders,
);

export default router;


