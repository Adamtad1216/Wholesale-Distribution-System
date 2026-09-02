import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';

export async function logAudit({
  createdById,
  userId,
  action,
  entityType,
  entityId,
  oldValues,
  newValues,
  req,
}) {
  try {
    // activeUserId is the performing user — used for BOTH createdById and userId
    // so the log shows up in user.auditLogs (userId) AND has a creator (createdById)
    const activeUserId = createdById || userId;

    await prisma.auditLog.create({
      data: {
        // Link as creator of the log row
        ...(activeUserId ? { createdBy: { connect: { id: activeUserId } } } : {}),
        // Link as the subject user — this populates user.auditLogs on the User model
        ...(activeUserId ? { user: { connect: { id: activeUserId } } } : {}),
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