import { Router } from 'express';
import stockRoutes from './stock/stock.routes.js';
import adjustmentsRoutes from './adjustments/adjustments.routes.js';
import reservationsRoutes from './reservations/reservations.routes.js';
import transfersRoutes from './transfers/transfers.routes.js';

const router = Router();

router.use('/stocks', stockRoutes);
router.use('/adjustments', adjustmentsRoutes);
router.use('/reservations', reservationsRoutes);
router.use('/transfers', transfersRoutes);

export default router;


