import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  submitAiQuery,
  getAiQueries,
  getAiQueryById,
} from "./ai.controller.js";
import {
  aiQuerySchema,
  aiQueryIdSchema,
  aiQueryListSchema,
} from "./ai.validation.js";
import { validate } from "../../middleware/validation.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/query", validate(aiQuerySchema), submitAiQuery);
router.get("/queries", validate(aiQueryListSchema), getAiQueries);
router.get("/queries/:id", validate(aiQueryIdSchema), getAiQueryById);

export default router;
