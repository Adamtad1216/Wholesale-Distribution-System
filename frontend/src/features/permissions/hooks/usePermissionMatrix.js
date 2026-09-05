import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { permissionsApi } from '../permissionsApi';
import { rolesApi } from '../../roles-job-specifications/rolesApi';

export function usePermissionMatrix() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('MATRIX'); // 'MATRIX' | 'DIRECTORY'
  const [togglingMap, setTogglingMap] = useState({});

  // Load roles and permissions in parallel
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        rolesApi.getRoles(),
        permissionsApi.getPermissions(),
      ]);

      const rolesData = rolesRes?.data || rolesRes || [];
      const permsData = permsRes?.data || permsRes || [];

      setRoles(Array.isArray(rolesData) ? rolesData : rolesData.items || []);
      setPermissions(Array.isArray(permsData) ? permsData : permsData.items || []);
    } catch (err) {
      console.error('Failed to load matrix data:', err);
      toast.error(err?.message || 'Failed to fetch permission matrix data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check if a specific role has a permission assigned
  const isPermissionAssigned = useCallback((role, permissionId) => {
    if (!role || !role.rolePermissions) return false;
    
    // Check if role has wildcard '*' permission
    const hasWildcard = role.rolePermissions.some(
      (rp) => (!rp.isArchived) && (rp.permission?.name === '*' || rp.permission?.name === 'all' || rp.permission?.name === 'system:all')
    );
    if (hasWildcard) return true;

    return role.rolePermissions.some(
      (rp) => !rp.isArchived && (rp.permissionId === permissionId || rp.permission?.id === permissionId)
    );
  }, []);

  // Check if role is Super Admin or wildcard
  const isWildcardRole = useCallback((role) => {
    if (!role) return false;
    if (role.name === 'SUPER_ADMIN' || role.name === 'SUPERADMIN') return true;
    return (role.rolePermissions || []).some(
      (rp) => !rp.isArchived && (rp.permission?.name === '*' || rp.permission?.name === 'all')
    );
  }, []);

  // Toggle single permission for a role with optimistic UI
  const handleTogglePermission = async (roleId, permissionId) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    if (isWildcardRole(role)) {
      toast.error(`"${role.name}" has wildcard access. All permissions are granted by default.`);
      return;
    }

    const key = `${roleId}-${permissionId}`;
    if (togglingMap[key]) return; // Prevent concurrent toggles

    const currentlyAssigned = isPermissionAssigned(role, permissionId);

    // Optimistic Update
    setRoles((prevRoles) =>
      prevRoles.map((r) => {
        if (r.id !== roleId) return r;

        let updatedRolePermissions = [...(r.rolePermissions || [])];
        if (currentlyAssigned) {
          // Remove
          updatedRolePermissions = updatedRolePermissions.filter(
            (rp) => rp.permissionId !== permissionId && rp.permission?.id !== permissionId
          );
        } else {
          // Add
          const targetPerm = permissions.find((p) => p.id === permissionId);
          updatedRolePermissions.push({
            roleId,
            permissionId,
            isArchived: false,
            permission: targetPerm || { id: permissionId },
          });
        }
        return { ...r, rolePermissions: updatedRolePermissions };
      })
    );

    setTogglingMap((prev) => ({ ...prev, [key]: true }));

    try {
      if (currentlyAssigned) {
        await permissionsApi.removePermissionFromRole(roleId, permissionId);
        toast.success('Permission revoked successfully');
      } else {
        await permissionsApi.assignPermissionToRole(roleId, permissionId);
        toast.success('Permission granted successfully');
      }
    } catch (err) {
      console.error('Failed to toggle permission:', err);
      toast.error(err?.response?.data?.error || err?.message || 'Failed to update permission');
      
      // Revert Optimistic Update
      fetchData();
    } finally {
      setTogglingMap((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    const map = {};
    permissions.forEach((perm) => {
      // Determine module name
      let mod = perm.module || 'system';
      if (!mod || mod === 'undefined') {
        const parts = (perm.name || perm.key || '').split(':');
        mod = parts.length > 1 ? parts[0] : 'general';
      }
      mod = mod.toLowerCase().trim();

      if (!map[mod]) map[mod] = [];
      map[mod].push(perm);
    });

    return map;
  }, [permissions]);

  // List of all module names
  const modulesList = useMemo(() => {
    return ['ALL', ...Object.keys(groupedPermissions).sort()];
  }, [groupedPermissions]);

  // Filtered roles based on filter
  const filteredRoles = useMemo(() => {
    if (selectedRoleFilter === 'ALL') return roles;
    return roles.filter((r) => r.id === selectedRoleFilter);
  }, [roles, selectedRoleFilter]);

  // Filtered module keys based on search and selectedModule
  const filteredModules = useMemo(() => {
    let modKeys = Object.keys(groupedPermissions);

    if (selectedModule !== 'ALL') {
      modKeys = modKeys.filter((m) => m === selectedModule);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      modKeys = modKeys.filter((m) => {
        const moduleMatches = m.includes(q);
        const permsInMod = groupedPermissions[m] || [];
        const permMatches = permsInMod.some(
          (p) =>
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.description && p.description.toLowerCase().includes(q))
        );
        return moduleMatches || permMatches;
      });
    }

    return modKeys.sort();
  }, [groupedPermissions, selectedModule, search]);

  return {
    roles,
    permissions,
    loading,
    search,
    setSearch,
    selectedModule,
    setSelectedModule,
    selectedRoleFilter,
    setSelectedRoleFilter,
    viewMode,
    setViewMode,
    togglingMap,
    groupedPermissions,
    modulesList,
    filteredRoles,
    filteredModules,
    isPermissionAssigned,
    isWildcardRole,
    handleTogglePermission,
    refreshMatrix: fetchData,
  };
}
