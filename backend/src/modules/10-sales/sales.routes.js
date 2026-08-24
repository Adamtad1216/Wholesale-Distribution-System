import { Router } from "express";
import salesRequestRoutes from "./sales-requests/salesRequests.routes.js";
import quotationRoutes from "./quotations/quotations.routes.js";
import salesOrderRoutes from "./sales-orders/salesOrders.routes.js";
import salesReturnRoutes from "../13-sales-returns/sales-returns/salesReturns.routes.js";

const router = Router();

router.use("/requests", salesRequestRoutes);
router.use("/quotations", quotationRoutes);
router.use("/orders", salesOrderRoutes);
router.use("/returns", salesReturnRoutes);

export default router;
