import prisma from '../config/prisma.js';
import { verifyAccessToken } from '../utils/jwt.js';

export async function authenticate(req, res, next) {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access token missing or invalid',
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        person: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found or inactive',
      });
    }

    req.user = user;
    next();
  } catch (e) {
    const fs = await import('fs');
    const logData = {
      message: e.message,
      stack: e.stack,
      code: e.code,
      meta: e.meta,
      full: JSON.stringify(e, null, 2),
    };
    fs.appendFileSync('C:/Users/A/AppData/Local/Temp/kilo/auth_error.log', JSON.stringify(logData, null, 2) + '\n---\n');
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
    });
  }
}