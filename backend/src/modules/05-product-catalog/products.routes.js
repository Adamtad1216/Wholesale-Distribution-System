import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/permission.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import {
  listProducts,
  getProduct,
} from "./products.controller.js";
import {
  productQuerySchema,
  productIdSchema,
} from "./products.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  validate(productQuerySchema),
  requirePermission("products:read"),
  listProducts,
);

router.get(
  "/:id",
  validate(productIdSchema),
  requirePermission("products:read"),
  getProduct,
);

export default router;
