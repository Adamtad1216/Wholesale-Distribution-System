import { Router } from "express";
import salesOrderRoutes from "./sales-orders/salesOrders.routes.js";
import salesReturnRoutes from "../13-sales-returns/sales-returns/salesReturns.routes.js";

const router = Router();

router.use("/orders", salesOrderRoutes);
router.use("/returns", salesReturnRoutes);

export default router;
