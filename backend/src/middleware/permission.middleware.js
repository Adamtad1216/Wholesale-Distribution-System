export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const roleNames = (req.user.userRoles || []).map((ur) => ur.role?.name);
    const isSuperOrAdmin =
      roleNames.includes('SUPER_ADMIN') || roleNames.includes('ADMIN');

    const permissions = (req.user.userRoles || []).flatMap((ur) =>
      (ur.role?.rolePermissions || []).map((rp) => rp.permission?.name)
    );

    const required = Array.isArray(permission) ? permission : [permission];
    const hasPermission =
      isSuperOrAdmin ||
      permissions.includes('*') ||
      permissions.includes('all') ||
      required.some((p) => permissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};