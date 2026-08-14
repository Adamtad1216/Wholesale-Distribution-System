import { Router } from "express";
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "./customers.controller.js";
import {
  customerQuerySchema,
  customerIdSchema,
  createCustomerSchema,
  updateCustomerSchema,
} from "./customers.validation.js";
import { validate } from "../../middleware/validation.middleware.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(customerQuerySchema), getCustomers);
router.post("/", validate(createCustomerSchema), createCustomer);
router.get("/:id", validate(customerIdSchema), getCustomerById);
router.put("/:id", validate(customerIdSchema), validate(updateCustomerSchema), updateCustomer);
router.delete("/:id", validate(customerIdSchema), deleteCustomer);

export default router;
