import { Router } from 'express';
import * as grController from './goods-receipt.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/', grController.createGoodsReceipt);
router.get('/', grController.getGoodsReceipts);
router.get('/:id', grController.getGoodsReceiptById);
router.patch('/:id/approve', grController.approveGoodsReceipt);
router.patch('/:id/status', grController.updateStatus);

export default router;
