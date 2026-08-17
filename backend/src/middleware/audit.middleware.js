import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';

export async function logAudit({
  createdById,
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
        ...(createdById ? { createdBy: { connect: { id: createdById } } } : {}),
        action,
        entityType,
        entityId: entityId || '00000000-0000-0000-0000-000000000000',
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