import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';

export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  oldValues,
  newValues,
  req,
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.get?.('user-agent'),
      },
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create audit log');
  }
}