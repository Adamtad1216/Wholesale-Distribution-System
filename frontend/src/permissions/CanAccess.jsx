import { usePermission } from '../hooks/usePermission';

/**
 * CanAccess — Conditionally renders children based on permission check.
 *
 * @param {string|string[]} permission - Required permission key(s)
 * @param {'any'|'all'} mode          - 'any' (default): one of them. 'all': every one.
 * @param {React.ReactNode} fallback  - Optional fallback UI (default: nothing)
 *
 * Usage:
 *   <CanAccess permission="users:create">
 *     <Button>Create User</Button>
 *   </CanAccess>
 *
 *   <CanAccess permission={["orders:approve", "orders:update"]} mode="any">
 *     <ApproveButton />
 *   </CanAccess>
 *
 *   <CanAccess permission="users:delete" fallback={<span>No access</span>}>
 *     <DeleteButton />
 *   </CanAccess>
 */
export default function CanAccess({ permission, mode = 'any', fallback = null, children }) {
  const { can } = usePermission(permission, mode);
  return can ? children : fallback;
}
