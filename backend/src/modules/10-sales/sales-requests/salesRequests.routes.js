import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import {
  getSalesRequests,
  getSalesRequestById,
  createSalesRequest,
  removeSalesRequest,
} from "./salesRequests.controller.js";
import {
  salesRequestQuerySchema,
  salesRequestIdSchema,
  createSalesRequestSchema,
} from "./salesRequests.validation.js";
import { validate } from "../../../middleware/validation.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(salesRequestQuerySchema), getSalesRequests);
router.post("/", validate(createSalesRequestSchema), createSalesRequest);
router.get("/:id", validate(salesRequestIdSchema), getSalesRequestById);
router.delete("/:id", validate(salesRequestIdSchema), removeSalesRequest);

export default router;
