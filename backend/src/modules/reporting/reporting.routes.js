import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  getReports,
  getReportById,
  generateSalesReport,
  generateDeliveryReport,
} from "./reporting.controller.js";
import {
  reportQuerySchema,
  reportIdSchema,
  salesReportSchema,
  deliveryReportSchema,
} from "./reporting.validation.js";
import { validate } from "../../middleware/validation.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/sales", validate(salesReportSchema), generateSalesReport);
router.get("/delivery", validate(deliveryReportSchema), generateDeliveryReport);

export default router;
