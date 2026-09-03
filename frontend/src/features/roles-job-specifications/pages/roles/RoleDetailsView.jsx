import React, { useState, useEffect } from 'react';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import { rolesApi } from '../../rolesApi';
import { toast } from 'react-hot-toast';

export default function RoleDetailsView({
  roleId,
  initialRole,
  canUpdateRole,
  canDeleteRole,
  handleOpenRoleForm,
  handleRoleDelete,
  handleBackToList,
}) {
  const [role, setRole] = useState(initialRole || null);
  const [loading, setLoading] = useState(!initialRole);
  const [activeSubTab, setActiveSubTab] = useState('PERMISSIONS'); // 'PERMISSIONS' | 'USERS'
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    }
  }, [initialRole]);

  useEffect(() => {
    const fetchRoleDetails = async () => {
      if (!roleId) return;
      try {
        setLoading(true);
        const res = await rolesApi.getRoleById(roleId);
        const data = res?.data || res;
        setRole(data);
      } catch (err) {
        toast.error(err?.message || 'Failed to load role details');
      } finally {
        setLoading(false);
      }
    };

    fetchRoleDetails();
  }, [roleId]);

  if (loading) {
    return (
      <div className="w-full px-6 py-6 space-y-6">
        <Card className="p-12 text-center text-muted-foreground text-sm rounded-xl">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading security role details...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="w-full px-6 py-6 space-y-6">
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition mb-4"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Roles & Job Specifications
        </button>
        <Card className="p-12 text-center text-muted-foreground text-sm rounded-xl">
          Role details not found.
        </Card>
      </div>
    );
  }

  // Parse permissions and users
  const rawRolePermissions = role.rolePermissions || [];
  const assignedPermissions = rawRolePermissions
    .map((rp) => rp.permission || rp)
    .filter(Boolean);

  const isWildcard = assignedPermissions.some(
    (p) => p === '*' || p?.name === '*' || p?.key === '*'
  );

  const userRoles = role.userRoles || [];
  const assignedUsers = userRoles.map((ur) => ur.user).filter(Boolean);

  // Filtered lists based on search
  const filteredPermissions = assignedPermissions.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.module?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  const filteredUsers = assignedUsers.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const fullName = `${u.person?.firstName || ''} ${u.person?.lastName || ''}`.toLowerCase();
    return (
      fullName.includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.person?.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Roles & Job Specifications
        </button>

        <div className="flex items-center gap-3">
          {canUpdateRole && (
            <Button
              onClick={() => handleOpenRoleForm(role)}
              variant="secondary"
              size="sm"
            >
              Edit Role
            </Button>
          )}
          {canDeleteRole && (
            <Button
              onClick={() => handleRoleDelete(role.id)}
              variant="danger"
              size="sm"
            >
              Delete Role
            </Button>
          )}
        </div>
      </div>

      {/* Role Identity Header Card */}
      <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider badge-violet">
                {role.code || role.name}
              </span>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{role.name}</h1>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
              {role.description || 'No description provided for this security role.'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-muted800 border border-border px-4 py-2.5 rounded-xl text-center">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Assigned Users</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{assignedUsers.length}</p>
            </div>
            <div className="bg-muted800 border border-border px-4 py-2.5 rounded-xl text-center">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Permissions</p>
              <p className="text-xl font-bold text-violet-400 mt-0.5">
                {isWildcard ? 'All (Wildcard)' : assignedPermissions.length}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex border-b border-border space-x-6">
            <button
              onClick={() => {
                setActiveSubTab('PERMISSIONS');
                setSearch('');
              }}
              className={`pb-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                activeSubTab === 'PERMISSIONS'
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Assigned Permissions ({assignedPermissions.length})
            </button>

            <button
              onClick={() => {
                setActiveSubTab('USERS');
                setSearch('');
              }}
              className={`pb-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                activeSubTab === 'USERS'
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Assigned Users ({assignedUsers.length})
            </button>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder={activeSubTab === 'PERMISSIONS' ? 'Search permissions...' : 'Search assigned users...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 bg-muted800 border border-border rounded-xl text-foreground text-xs focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>
      </Card>

      {/* Sub-Tab 1: PERMISSIONS */}
      {activeSubTab === 'PERMISSIONS' && (
        <div className="space-y-4">
          {isWildcard && (
            <Card className="p-4 bg-violet-950/40 border border-violet-500/30 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-violet-500/20 text-violet-400 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-violet-300">Unrestricted Super Admin Access (`*`)</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This role grants wildcard access (`*`) to all system endpoints, operations, modules, and administrative actions without restrictions.
                </p>
              </div>
            </Card>
          )}

          {filteredPermissions.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground text-sm rounded-xl">
              No matching permissions found.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPermissions.map((perm, idx) => (
                <Card
                  key={perm.id || idx}
                  className="p-4 border border-border bg-card900 backdrop-blur-xl rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-muted800 text-violet-400 border border-border">
                      {perm.module || 'System'}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      {perm.action || 'access'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground font-mono">{perm.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {perm.description || 'No detailed description available.'}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: USERS */}
      {activeSubTab === 'USERS' && (
        <Card className="border border-border bg-card900 backdrop-blur-xl rounded-2xl overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No users are currently assigned to this role.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted800 border-b border-border text-muted-foreground font-mono uppercase">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Username</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((u) => {
                    const fullName = `${u.person?.firstName || ''} ${u.person?.lastName || ''}`.trim() || u.username;
                    return (
                      <tr key={u.id} className="hover:bg-muted800/50 transition">
                        <td className="p-4 font-semibold text-foreground flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-xs">
                            {fullName.charAt(0).toUpperCase()}
                          </div>
                          <span>{fullName}</span>
                        </td>
                        <td className="p-4 font-mono text-muted-foreground">{u.username}</td>
                        <td className="p-4 text-muted-foreground">{u.person?.email || 'N/A'}</td>
                        <td className="p-4 text-muted-foreground">{u.person?.employee?.department || 'N/A'}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                              u.isActive || u.accountStatus === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {u.accountStatus || (u.isActive ? 'ACTIVE' : 'INACTIVE')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
