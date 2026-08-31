import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import {
  listNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  getUnread,
} from "./notifications.controller.js";
import {
  notificationQuerySchema,
  notificationIdSchema,
} from "./notifications.validation.js";
import { validate } from "../../../middleware/validation.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(notificationQuerySchema), listNotifications);
router.get("/unread-count", getUnread);
router.get("/:id", validate(notificationIdSchema), getNotification);
router.patch("/:id/read", validate(notificationIdSchema), markAsRead);
router.patch("/read-all", markAllAsRead);
router.delete("/:id", validate(notificationIdSchema), removeNotification);

export default router;
