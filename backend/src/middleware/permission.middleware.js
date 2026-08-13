export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const permissions = req.user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.name)
    );

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};