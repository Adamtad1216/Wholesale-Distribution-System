import { logAudit } from './audit.middleware.js';

// Actions to SKIP from audit logging (noise / not useful)
const SKIP_AUDIT_PATHS = [
  '/health',
  '/api/docs',
  '/api/v1/auth/refresh', // token refresh is internal, not a user action
];

// HTTP methods that are read-only — don't need failure auditing
const SKIP_AUDIT_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;

  // Fire-and-forget failure audit log for all non-trivial errors
  const shouldAudit =
    !SKIP_AUDIT_METHODS.includes(req.method) &&
    !SKIP_AUDIT_PATHS.some((p) => req.path?.startsWith(p)) &&
    statusCode !== 429; // don't log rate limit hits as failures

  if (shouldAudit) {
    const userId = req.user?.id || null;

    // Derive a clean action name from the route e.g. POST /api/v1/orders → ORDER_CREATE_FAILED
    const pathSegments = req.path?.replace('/api/v1/', '').split('/').filter(Boolean);
    const resource = (pathSegments[0] || 'RESOURCE').toUpperCase().replace(/-/g, '_');
    const methodMap = { POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE' };
    const verb = methodMap[req.method] || req.method;
    const action = `${resource}_${verb}_FAILED`;

    logAudit({
      createdById: userId,
      userId,
      action,
      entityType: pathSegments[0] || 'Unknown',
      entityId: req.params?.id || '00000000-0000-0000-0000-000000000000',
      newValues: {
        reason: err.message || 'Internal Server Error',
        method: req.method,
        path: req.path,
        statusCode,
      },
      req,
    }).catch(() => {}); // never block the response
  }

  res.status(statusCode).json({
    status: err.status || 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};