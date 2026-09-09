import React from 'react';
import Card from '../../../components/ui/Card';

// Helper to format permission action titles into clean readable header text
const formatActionTitle = (perm) => {
  if (perm.description) return perm.description;
  const parts = (perm.name || perm.key || '').split(':');
  if (parts.length > 1) {
    const action = parts[1].toLowerCase();
    const actionMap = {
      create: 'Create',
      read: 'View / Read',
      update: 'Edit / Update',
      delete: 'Delete',
      export: 'Export Data',
      all: 'Full Access',
    };
    return actionMap[action] || `${parts[1].charAt(0).toUpperCase() + parts[1].slice(1)}`;
  }
  return perm.name || perm.key;
};

// Helper to format role names into clean titles
const formatRoleTitle = (roleName) => {
  if (!roleName) return 'Role';
  return roleName
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function PermissionMatrixGrid({
  filteredModules,
  groupedPermissions,
  filteredRoles,
  isPermissionAssigned,
  isWildcardRole,
  handleTogglePermission,
  togglingMap,
}) {
  if (filteredModules.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground text-sm rounded-xl border border-border bg-card">
        No matching modules or permissions found for the current search filter.
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {filteredModules.map((moduleKey) => {
        const modulePermissions = groupedPermissions[moduleKey] || [];
        const formattedModuleName = moduleKey.toUpperCase();

        return (
          <div key={moduleKey} className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            {/* Module Card Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                {/* Module Action Headers */}
                <thead>
                  <tr className="border-b border-border/80 bg-muted800/40">
                    <th className="p-4 text-sm font-bold text-foreground w-64 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="capitalize">{formattedModuleName}</span>
                      </div>
                    </th>

                    {modulePermissions.map((perm) => (
                      <th
                        key={perm.id}
                        className="p-4 text-xs font-semibold text-muted-foreground text-center min-w-[140px]"
                        title={perm.name || perm.key}
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="font-bold text-foreground">
                            {formatActionTitle(perm)}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground opacity-75">
                            {perm.name || perm.key}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Role Rows */}
                <tbody className="divide-y divide-border/40">
                  {filteredRoles.map((role) => {
                    const isWildcard = isWildcardRole(role);

                    return (
                      <tr
                        key={role.id}
                        className="hover:bg-muted800/20 transition-colors"
                      >
                        {/* Role Name */}
                        <td className="p-4 text-sm font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <span>{formatRoleTitle(role.name)}</span>
                            {isWildcard && (
                              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold rounded-md">
                                Wildcard Access
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Permission Checkbox Cells */}
                        {modulePermissions.map((perm) => {
                          const assigned = isPermissionAssigned(role, perm.id);
                          const isToggling = Boolean(togglingMap[`${role.id}-${perm.id}`]);

                          return (
                            <td
                              key={perm.id}
                              className="p-4 text-center align-middle"
                            >
                              <button
                                type="button"
                                disabled={isWildcard || isToggling}
                                onClick={() => handleTogglePermission(role.id, perm.id)}
                                className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all mx-auto ${
                                  isWildcard || assigned
                                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/20 scale-100'
                                    : 'border-border bg-muted800/50 hover:border-emerald-500/60 hover:bg-emerald-500/10 text-transparent'
                                } ${isWildcard ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'} ${
                                  isToggling ? 'opacity-50 animate-pulse' : ''
                                }`}
                                title={
                                  isWildcard
                                    ? 'Super Admin has wildcard access to all permissions'
                                    : assigned
                                    ? `Click to revoke "${perm.name}" for ${role.name}`
                                    : `Click to grant "${perm.name}" for ${role.name}`
                                }
                              >
                                {isToggling ? (
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg
                                    className={`w-4 h-4 transition-transform ${
                                      assigned || isWildcard ? 'scale-100' : 'scale-0'
                                    }`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
