import { Router } from 'express';
import stockRoutes from './stock/stock.routes.js';
import movementsRoutes from './movements/movements.routes.js';
import adjustmentsRoutes from './adjustments/adjustments.routes.js';
import reservationsRoutes from './reservations/reservations.routes.js';
import sellingPricesRoutes from './selling-prices/selling-prices.routes.js';

const router = Router();

router.use('/stocks', stockRoutes);
router.use('/movements', movementsRoutes);
router.use('/adjustments', adjustmentsRoutes);
router.use('/reservations', reservationsRoutes);
router.use('/selling-prices', sellingPricesRoutes);

export default router;
