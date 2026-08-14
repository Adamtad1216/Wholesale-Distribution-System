import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  getQuotations,
  getQuotationById,
  createQuotation,
} from "./quotations.controller.js";
import {
  quotationQuerySchema,
  quotationIdSchema,
  createQuotationSchema,
} from "./quotations.validation.js";
import { validate } from "../../middleware/validation.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(quotationQuerySchema), getQuotations);
router.post("/", validate(createQuotationSchema), createQuotation);
router.get("/:id", validate(quotationIdSchema), getQuotationById);

export default router;
