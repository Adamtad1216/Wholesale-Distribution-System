import React, { useState, useMemo } from 'react';
import Card from '../../../components/ui/Card';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';

export default function UserPermissionsTab({ userRoles = [] }) {
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');

  // Check if any assigned role has wildcard access
  const hasWildcardAccess = useMemo(() => {
    return userRoles.some((ur) => {
      const role = ur.role || {};
      if (role.name === 'SUPER_ADMIN' || role.name === 'SUPERADMIN') return true;
      const rolePerms = role.rolePermissions || role.permissions || [];
      return rolePerms.some(
        (rp) => (!rp.isArchived) && (rp.permission?.name === '*' || rp.permission?.name === 'all')
      );
    });
  }, [userRoles]);

  // Consolidate all permissions granted to the user across all their assigned roles
  const userPermissionsList = useMemo(() => {
    const permMap = new Map();

    userRoles.forEach((ur) => {
      const role = ur.role || {};
      const roleName = role.name || 'Security Role';
      const rolePerms = role.rolePermissions || role.permissions || [];

      if (Array.isArray(rolePerms)) {
        rolePerms.forEach((rp) => {
          if (rp.isArchived) return;
          const perm = rp.permission || (rp.name ? rp : null);
          if (!perm) return;

          const key = perm.id || perm.name || perm.key;
          if (!permMap.has(key)) {
            permMap.set(key, {
              ...perm,
              grantedRoles: [roleName],
            });
          } else {
            const existing = permMap.get(key);
            if (!existing.grantedRoles.includes(roleName)) {
              existing.grantedRoles.push(roleName);
            }
          }
        });
      }
    });

    return Array.from(permMap.values());
  }, [userRoles]);

  // Extract unique module names for filter dropdown
  const modulesList = useMemo(() => {
    const mods = new Set();
    userPermissionsList.forEach((p) => {
      let mod = p.module;
      if (!mod || mod === 'undefined') {
        const parts = (p.name || p.key || '').split(':');
        mod = parts.length > 1 ? parts[0] : 'system';
      }
      if (mod) mods.add(mod.toLowerCase());
    });
    return ['ALL', ...Array.from(mods).sort()];
  }, [userPermissionsList]);

  // Filter permissions based on search query & module filter
  const filteredPermissions = useMemo(() => {
    return userPermissionsList.filter((p) => {
      const matchesSearch =
        (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
        (p.module && p.module.toLowerCase().includes(search.toLowerCase()));

      let mod = (p.module || (p.name || '').split(':')[0] || 'system').toLowerCase();
      const matchesModule = selectedModule === 'ALL' || mod === selectedModule;

      return matchesSearch && matchesModule;
    });
  }, [userPermissionsList, search, selectedModule]);

  return (
    <div className="space-y-6">
      {/* Security Roles Overview Cards */}
      <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <span>🛡️</span> Assigned Security Roles ({userRoles.length})
          </h3>
          {hasWildcardAccess && (
            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold rounded-lg flex items-center gap-1.5">
              <span>⚡</span> Super Admin Wildcard Access Active
            </span>
          )}
        </div>

        {userRoles.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            No explicit security roles assigned to this user profile.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {userRoles.map((ur, idx) => {
              const role = ur.role || {};
              const permCount = (role.rolePermissions || role.permissions || []).filter(
                (p) => !p.isArchived
              ).length;

              return (
                <div key={idx} className="p-4 rounded-xl bg-muted800/40 border border-border space-y-2">
                  <div className="font-bold text-sm text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>🛡️</span> {role.name || 'Security Role'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      {role.name === 'SUPER_ADMIN' ? 'All Permissions' : `${permCount} Perms`}
                    </span>
                  </div>
                  {role.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{role.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Wildcard Access Notice Banner */}
      {hasWildcardAccess && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-3">
          <span className="text-lg">⚡</span>
          <div>
            <p className="font-bold text-amber-200">Unrestricted System Permission Granted</p>
            <p className="text-[11px] text-amber-300/80">
              Because this account possesses a Super Admin role with wildcard (<code className="bg-amber-950/50 px-1 py-0.5 rounded font-mono">*</code>) authorization, all permission keys across all system modules are automatically granted.
            </p>
          </div>
        </div>
      )}

      {/* Permission Keys Table Card */}
      <Card noPadding className="border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden">
        {/* Table Header & Search Filter Bar */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-foreground">
              Permission Keys Table ({filteredPermissions.length})
            </h4>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search permission keys..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-muted800 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-emerald-500 placeholder:text-muted-foreground"
              />
              <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Module filter */}
            {modulesList.length > 1 && (
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full sm:w-40 px-3 py-1.5 bg-muted800 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-emerald-500"
              >
                {modulesList.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod === 'ALL' ? 'All Modules' : mod.toUpperCase()}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Permissions Data Table */}
        {filteredPermissions.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            {userPermissionsList.length === 0
              ? 'No explicit permission keys found for the assigned roles.'
              : 'No permission keys match your search filter.'}
          </div>
        ) : (
          <Table containerClassName="rounded-none">
            <TableHeader>
              <TableRow className="bg-muted800/40 border-b border-border">
                <TableHead className="font-bold text-foreground text-xs py-3">Permission Key</TableHead>
                <TableHead className="font-bold text-foreground text-xs py-3">Module</TableHead>
                <TableHead className="font-bold text-foreground text-xs py-3">Description</TableHead>
                <TableHead className="font-bold text-foreground text-xs py-3">Granted Via Role(s)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermissions.map((perm) => {
                const mod = (perm.module || (perm.name || '').split(':')[0] || 'system').toUpperCase();

                return (
                  <TableRow key={perm.id || perm.name} className="hover:bg-muted800/20 transition-colors">
                    <TableCell className="font-mono font-bold text-xs text-emerald-400 py-3">
                      {perm.name || perm.key}
                    </TableCell>

                    <TableCell className="py-3">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {mod}
                      </span>
                    </TableCell>

                    <TableCell className="text-muted-foreground text-xs py-3">
                      {perm.description || 'No description provided.'}
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {perm.grantedRoles.map((rName, rIdx) => (
                          <span
                            key={rIdx}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-card border border-border text-foreground"
                          >
                            🛡️ {rName}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
