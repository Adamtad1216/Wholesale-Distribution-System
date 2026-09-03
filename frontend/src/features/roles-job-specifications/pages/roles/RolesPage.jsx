import React from 'react';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';

export default function RolesPage({
  roles = [],
  loading,
  canUpdateRole,
  canDeleteRole,
  handleOpenRoleForm,
  handleRoleDelete,
  handleViewRole,
}) {
  if (loading) {
    return (
      <Card className="p-12 text-center text-muted-foreground text-sm rounded-xl">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading security roles...</span>
        </div>
      </Card>
    );
  }

  if (roles.length === 0) {
    return <Card className="p-12 text-center text-muted-foreground text-sm rounded-xl">No security roles found.</Card>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {roles.map((role) => (
        <Card
          key={role.id}
          hoverEffect
          onClick={() => handleViewRole && handleViewRole(role)}
          className="flex flex-col justify-between rounded-xl border border-border bg-card900 backdrop-blur-xl p-5 cursor-pointer group hover:border-violet-500/50 transition-all duration-200"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider badge-violet">
                {role.code || role.name}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {(() => {
                  const perms = role.rolePermissions || role.permissions || [];
                  if (!Array.isArray(perms)) return '0 permissions';
                  const isWildcard = perms.some(
                    (p) => p === '*' || p?.permission?.name === '*' || p?.name === '*'
                  );
                  if (isWildcard) return 'All permissions';
                  const count = perms.length;
                  return `${count} ${count === 1 ? 'permission' : 'permissions'}`;
                })()}
              </span>
            </div>
            <h3 className="text-lg font-bold group-hover:text-violet-400 transition-colors">{role.name}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {role.description || 'No description provided.'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-5 mt-4 border-t border-border">
            <span className="text-[11px] font-semibold text-violet-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              View Details & Users &rarr;
            </span>

            <div className="flex items-center gap-2">
              {canUpdateRole && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenRoleForm(role);
                  }}
                  variant="secondary"
                  size="sm"
                >
                  Edit
                </Button>
              )}
              {canDeleteRole && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRoleDelete(role.id);
                  }}
                  variant="danger"
                  size="sm"
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
