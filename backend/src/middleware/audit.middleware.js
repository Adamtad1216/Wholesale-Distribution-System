import prisma from '../config/prisma.js';
import { env } from '../utils/env.js';

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
    console.error('Failed to create audit log:', error);
  }
}