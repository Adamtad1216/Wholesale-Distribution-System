/**
 * Checks if a user has a specific permission or wildcard access
 * Always grants access to SUPER_ADMIN and ADMIN roles
 *
 * @param {Object} user - The req.user object with userRoles
 * @param {string} permissionName - The permission name to check
 * @returns {boolean}
 */
export function hasPermission(user, permissionName) {
  if (!user) return false;

  const userRoles = user.userRoles || user.roles || [];

  const roleNames = userRoles
    .map((ur) => {
      if (typeof ur === 'string') return ur.toUpperCase();
      if (ur?.role?.name) return ur.role.name.toUpperCase();
      if (ur?.name) return ur.name.toUpperCase();
      return '';
    })
    .filter(Boolean);

  if (roleNames.includes('SUPER_ADMIN') || roleNames.includes('ADMIN')) {
    return true;
  }

  const permissions = userRoles
    .flatMap((ur) => {
      if (ur?.role?.rolePermissions) {
        return ur.role.rolePermissions.map((rp) => rp.permission?.name || '');
      }
      return [];
    })
    .filter(Boolean);

  if (Array.isArray(user.permissions)) {
    permissions.push(...user.permissions);
  }

  if (Array.isArray(permissionName)) {
    return permissionName.some((p) => permissions.includes(p) || permissions.includes('*'));
  }

  return permissions.includes(permissionName) || permissions.includes('*');
}

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

export const requireAnyPermission = (...permissions) => {
  const permList = permissions.flat();
  return requirePermission(permList);
};
