import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDeliveryStatus,
  createDeliveryProof,
  removeDelivery,
} from "./delivery.controller.js";
import {
  deliveryQuerySchema,
  deliveryIdSchema,
  createDeliverySchema,
  updateDeliveryStatusSchema,
  createDeliveryProofSchema,
} from "./delivery.validation.js";
import { validate } from "../../../middleware/validation.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(deliveryQuerySchema), getDeliveries);
router.post("/", validate(createDeliverySchema), createDelivery);
router.get("/:id", validate(deliveryIdSchema), getDeliveryById);
router.patch("/:id/status", validate(deliveryIdSchema), validate(updateDeliveryStatusSchema), updateDeliveryStatus);
router.post("/:id/proof", validate(deliveryIdSchema), validate(createDeliveryProofSchema), createDeliveryProof);
router.delete("/:id", validate(deliveryIdSchema), removeDelivery);

export default router;
