import { sendSuccess, sendPaginatedSuccess, sendDeleted, sendError } from '../../../utils/api-response.js';
import {
  getNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
} from './notifications.service.js';
import { notificationIdSchema } from './notifications.validation.js';

export async function listNotifications(req, res, next) {
  try {
    const { notifications, meta } = await getNotifications({
      ...req.query,
      userId: req.user.id,
    });
    sendPaginatedSuccess(res, notifications, meta);
  } catch (err) {
    next(err);
  }
}

export async function getNotification(req, res, next) {
  try {
    const idResult = notificationIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid notification ID', 400);
    const notification = await getNotificationById(idResult.data.id);
    sendSuccess(res, notification);
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const idResult = notificationIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid notification ID', 400);
    const notification = await markNotificationAsRead(idResult.data.id, req.user.id);
    sendSuccess(res, notification);
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    const result = await markAllNotificationsAsRead(req.user.id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function removeNotification(req, res, next) {
  try {
    const idResult = notificationIdSchema.safeParse({ id: req.params.id });
    if (!idResult.success) return sendError(res, 'Invalid notification ID', 400);
    await deleteNotification(idResult.data.id, req.user.id);
    sendDeleted(res, 'Notification deleted successfully');
  } catch (err) {
    next(err);
  }
}

export async function getUnread(req, res, next) {
  try {
    const result = await getUnreadCount(req.user.id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
