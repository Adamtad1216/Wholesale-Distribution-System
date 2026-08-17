import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  removeSalesOrder,
} from "./salesOrders.controller.js";
import {
  salesOrderQuerySchema,
  salesOrderIdSchema,
  createSalesOrderSchema,
} from "./salesOrders.validation.js";
import { validate } from "../../middleware/validation.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(salesOrderQuerySchema), getSalesOrders);
router.post("/", validate(createSalesOrderSchema), createSalesOrder);
router.get("/:id", validate(salesOrderIdSchema), getSalesOrderById);
router.delete("/:id", validate(salesOrderIdSchema), removeSalesOrder);

export default router;
