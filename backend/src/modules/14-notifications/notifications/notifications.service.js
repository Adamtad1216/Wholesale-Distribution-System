import prisma from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { getPaginationParams, buildPaginationMeta } from '../../../utils/pagination.js';

export async function createNotification(data) {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || 'GENERAL',
      createdById: data.createdById,
    },
    include: {
      user: { select: { id: true, username: true, person: { select: { firstName: true, lastName: true } } } },
    },
  });
  return notification;
}

export async function getNotifications(filters) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = { isArchived: false };

  if (filters.userId) where.userId = filters.userId;
  if (filters.type) where.type = filters.type;
  if (filters.isRead !== undefined) where.isRead = filters.isRead === 'true' || filters.isRead === true;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, person: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    meta: buildPaginationMeta({ page, limit, total }),
  };
}

export async function getNotificationById(id) {
  const notification = await prisma.notification.findFirst({
    where: { id, isArchived: false },
    include: {
      user: { select: { id: true, username: true, person: { select: { firstName: true, lastName: true } } } },
    },
  });
  if (!notification) throw new AppError('Notification not found', 404);
  return notification;
}

export async function markNotificationAsRead(id, userId) {
  const existing = await prisma.notification.findFirst({
    where: { id, userId, isArchived: false },
  });
  if (!existing) throw new AppError('Notification not found', 404);

  const notification = await prisma.notification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date(),
      updatedById: userId,
      updatedAt: new Date(),
    },
  });
  return notification;
}

export async function markAllNotificationsAsRead(userId) {
  const result = await prisma.notification.updateMany({
    where: { userId, isArchived: false, isRead: false },
    data: {
      isRead: true,
      readAt: new Date(),
      updatedById: userId,
      updatedAt: new Date(),
    },
  });
  return { updated: result.count };
}

export async function deleteNotification(id, deletedById) {
  const existing = await prisma.notification.findFirst({
    where: { id, isArchived: false },
  });
  if (!existing) throw new AppError('Notification not found', 404);

  await prisma.notification.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      updatedById: deletedById,
      updatedAt: new Date(),
    },
  });
  return { id, deleted: true };
}

export async function getUnreadCount(userId) {
  const count = await prisma.notification.count({
    where: { userId, isArchived: false, isRead: false },
  });
  return { count };
}
