import { useSelector } from 'react-redux';

export function usePermission(required, mode = 'any') {
  const { permissions = [], role } = useSelector((state) => state.auth);

  if (!required) return { can: true, role, permissions };

  const keys = Array.isArray(required) ? required : [required];

  const can =
    mode === 'all'
      ? keys.every((k) => permissions.includes(k))
      : keys.some((k) => permissions.includes(k));

  return { can, role, permissions };
}

export function useHasRole(roles) {
  const { role } = useSelector((state) => state.auth);
  const list = Array.isArray(roles) ? roles : [roles];
  return list.includes(role);
}
