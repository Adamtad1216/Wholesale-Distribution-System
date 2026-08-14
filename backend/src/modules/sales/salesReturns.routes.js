import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  getSalesReturns,
  getSalesReturnById,
  createSalesReturn,
} from "./salesReturns.controller.js";
import {
  salesReturnQuerySchema,
  salesReturnIdSchema,
  createSalesReturnSchema,
} from "./salesReturns.validation.js";
import { validate } from "../../middleware/validation.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(salesReturnQuerySchema), getSalesReturns);
router.post("/", validate(createSalesReturnSchema), createSalesReturn);
router.get("/:id", validate(salesReturnIdSchema), getSalesReturnById);

export default router;
