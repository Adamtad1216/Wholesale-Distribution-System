import { useSelector } from 'react-redux';

export function usePermission(required, mode = 'any') {
  const { permissions = [], role } = useSelector((state) => state.auth);

  if (!required) return { can: true, permissions };

  // Super Admin or Admin override, or wildcard permission token
  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const hasWildcard = permissions.includes('*') || permissions.includes('all') || permissions.includes('system:all');

  if (isSuperAdmin || hasWildcard) {
    return { can: true, permissions };
  }

  const keys = Array.isArray(required) ? required : [required];

  const can =
    mode === 'all'
      ? keys.every((k) => permissions.includes(k))
      : keys.some((k) => permissions.includes(k));

  return { can, permissions };
}
