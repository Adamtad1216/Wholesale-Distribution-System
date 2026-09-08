import prisma from '../config/prisma.js';
import { logger } from './logger.js';

/**
 * Send a notification to a single user
 */
export async function sendNotification({ userId, title, message, type = 'GENERAL', createdById = null }) {
  if (!userId) return null;
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        createdById,
      },
    });
  } catch (err) {
    logger.warn({ err: err.message, userId, title }, 'Failed to send notification to user');
    return null;
  }
}

/**
 * Send a notification to multiple users
 */
export async function sendNotificationsToUsers({ userIds = [], title, message, type = 'GENERAL', createdById = null }) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return [];
  try {
    return await prisma.notification.createMany({
      data: uniqueIds.map((userId) => ({
        userId,
        title,
        message,
        type,
        createdById,
      })),
    });
  } catch (err) {
    logger.warn({ err: err.message, count: uniqueIds.length, title }, 'Failed to send bulk notifications');
    return null;
  }
}

/**
 * Send a notification to all active users with specified role names (e.g. ['SALES_REP', 'ADMIN'])
 */
export async function sendNotificationToRoles({ roleNames = [], title, message, type = 'GENERAL', createdById = null }) {
  try {
    const users = await prisma.user.findMany({
      where: {
        isArchived: false,
        userRoles: {
          some: {
            role: {
              name: { in: roleNames },
            },
          },
        },
      },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    return await sendNotificationsToUsers({ userIds, title, message, type, createdById });
  } catch (err) {
    logger.warn({ err: err.message, roleNames, title }, 'Failed to send notifications to roles');
    return null;
  }
}

/**
 * Send a notification to the customer (individual user account or organization contacts)
 */
export async function sendNotificationToCustomer({ customerId, title, message, type = 'GENERAL', createdById = null }) {
  if (!customerId) return null;
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        person: { select: { user: { select: { id: true } } } },
        organization: {
          include: {
            contacts: {
              include: {
                person: { select: { user: { select: { id: true } } } },
              },
            },
          },
        },
      },
    });

    if (!customer) return null;

    const userIds = [];
    if (customer.person?.user?.id) userIds.push(customer.person.user.id);
    if (customer.createdById) userIds.push(customer.createdById);
    if (customer.organization?.contacts) {
      for (const contact of customer.organization.contacts) {
        if (contact.person?.user?.id) userIds.push(contact.person.user.id);
      }
    }

    return await sendNotificationsToUsers({ userIds, title, message, type, createdById });
  } catch (err) {
    logger.warn({ err: err.message, customerId, title }, 'Failed to send notification to customer');
    return null;
  }
}

/**
 * Send a notification to an employee (finds their associated user account)
 */
export async function sendNotificationToEmployee({ employeeId, title, message, type = 'GENERAL', createdById = null }) {
  if (!employeeId) return null;
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        person: { select: { user: { select: { id: true } } } },
      },
    });
    const userId = employee?.person?.user?.id || employee?.userId;
    if (userId) {
      return await sendNotification({ userId, title, message, type, createdById });
    }
  } catch (err) {
    logger.warn({ err: err.message, employeeId, title }, 'Failed to send notification to employee');
    return null;
  }
}
