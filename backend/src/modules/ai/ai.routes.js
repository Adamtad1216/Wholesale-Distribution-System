import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  submitAiQuery,
  getAiQueries,
  getAiQueryById,
  removeAiQuery,
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
router.delete("/queries/:id", validate(aiQueryIdSchema), removeAiQuery);

export default router;
