import { Router } from "express";
import salesRequestRoutes from "./salesRequests.routes.js";
import quotationRoutes from "./quotations.routes.js";
import salesOrderRoutes from "./salesOrders.routes.js";
import salesReturnRoutes from "./salesReturns.routes.js";

const router = Router();

router.use("/requests", salesRequestRoutes);
router.use("/quotations", quotationRoutes);
router.use("/orders", salesOrderRoutes);
router.use("/returns", salesReturnRoutes);

export default router;
