import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware.js";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
} from "./notifications.controller.js";
import {
  notificationQuerySchema,
  notificationIdSchema,
} from "./notifications.validation.js";
import { validate } from "../../../middleware/validation.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(notificationQuerySchema), getNotifications);
router.patch("/:id/read", validate(notificationIdSchema), markNotificationAsRead);
router.patch("/read-all", markAllNotificationsAsRead);
router.delete("/:id", validate(notificationIdSchema), removeNotification);

export default router;
