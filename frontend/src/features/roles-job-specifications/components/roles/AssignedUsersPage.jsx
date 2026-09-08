import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Shield, 
  User, 
  Plus, 
  Trash2, 
  Search, 
  SlidersHorizontal, 
  RefreshCw, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import Modal from '../../../../components/ui/Modal';
import { rolesApi } from '../../rolesApi';
import { usersApi } from '../../../users/usersApi';

export default function AssignedUsersPage({ roles, canUpdateRole, refreshData, handleOpenAssignUsers }) {
  const [selectedRoleId, setSelectedRoleId] = useState('ALL');
  const [search, setSearch] = useState('');
  
  // All system users state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Modal State for Modifying Roles
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAssignedRoles, setUserAssignedRoles] = useState([]);
  const [newRoleId, setNewRoleId] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // 'adding' | roleId string

  // Fetch all system users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await usersApi.getUsers({ limit: 1000 });
      const data = res?.data || res || [];
      const list = Array.isArray(data) ? data : data.users || data.items || [];
      setUsers(list);
    } catch (err) {
      console.error('Failed to load system users:', err);
      toast.error('Failed to load system users');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Compute each user's assigned roles from user.userRoles and the roles list
  const allUsersWithRoles = useMemo(() => {
    return users.map((u) => {
      const roleMap = new Map();

      // 1. From user.userRoles
      if (Array.isArray(u.userRoles)) {
        u.userRoles.forEach((ur) => {
          if (!ur.isArchived) {
            const r = ur.role || roles?.find((ro) => ro.id === ur.roleId);
            if (r) roleMap.set(r.id, r);
          }
        });
      }

      // 2. From parent roles array
      if (Array.isArray(roles)) {
        roles.forEach((r) => {
          if (r.userRoles?.some((ur) => (ur.userId === u.id || ur.user?.id === u.id) && !ur.isArchived)) {
            roleMap.set(r.id, r);
          }
        });
      }

      return {
        ...u,
        assignedRoles: Array.from(roleMap.values()),
      };
    });
  }, [users, roles]);

  // Filter users by role selection and search query
  const filteredUsers = useMemo(() => {
    let list = allUsersWithRoles;
    if (selectedRoleId === 'UNASSIGNED') {
      list = list.filter((u) => u.assignedRoles.length === 0);
    } else if (selectedRoleId && selectedRoleId !== 'ALL') {
      list = list.filter((u) => u.assignedRoles.some((r) => r.id === selectedRoleId));
    }

    if (!search.trim()) return list;
    const q = search.toLowerCase().trim();
    return list.filter((u) => {
      const fullName = `${u.person?.firstName || ''} ${u.person?.lastName || ''}`.toLowerCase();
      const username = (u.username || '').toLowerCase();
      const email = (u.person?.email || '').toLowerCase();
      const dept = (u.person?.employee?.department || '').toLowerCase();
      const roleNames = u.assignedRoles.map((r) => r.name.toLowerCase()).join(' ');
      return (
        fullName.includes(q) ||
        username.includes(q) ||
        email.includes(q) ||
        dept.includes(q) ||
        roleNames.includes(q)
      );
    });
  }, [allUsersWithRoles, selectedRoleId, search]);

  // Open Modify Modal for a specific user
  const handleOpenModifyModal = (user) => {
    setSelectedUser(user);
    setUserAssignedRoles(user.assignedRoles || []);
    setNewRoleId('');
    setIsModifyModalOpen(true);
  };

  // Add role to user
  const handleAddRole = async () => {
    if (!newRoleId || !selectedUser) return;
    const roleToAdd = roles?.find((r) => r.id === newRoleId);
    try {
      setActionLoading('adding');
      await rolesApi.assignUser(newRoleId, selectedUser.id);
      toast.success(`Assigned role "${roleToAdd?.name || 'Role'}" to @${selectedUser.username || 'user'}`);
      
      // Update local modal state
      if (roleToAdd) {
        setUserAssignedRoles((prev) => [...prev, roleToAdd]);
      }
      setNewRoleId('');

      // Refresh data
      await fetchUsers();
      if (refreshData) refreshData();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to assign role');
    } finally {
      setActionLoading(null);
    }
  };

  // Remove role from user
  const handleRemoveRole = async (roleId) => {
    if (!selectedUser) return;
    const roleToRemove = roles?.find((r) => r.id === roleId) || userAssignedRoles.find((r) => r.id === roleId);
    try {
      setActionLoading(roleId);
      await rolesApi.removeUser(roleId, selectedUser.id);
      toast.success(`Removed role "${roleToRemove?.name || 'Role'}" from @${selectedUser.username || 'user'}`);

      // Update local modal state
      setUserAssignedRoles((prev) => prev.filter((r) => r.id !== roleId));

      // Refresh data
      await fetchUsers();
      if (refreshData) refreshData();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to remove role');
    } finally {
      setActionLoading(null);
    }
  };

  // Available roles for the selected user to add
  const availableRolesToAdd = useMemo(() => {
    if (!roles) return [];
    return roles.filter((r) => !userAssignedRoles.some((ur) => ur.id === r.id));
  }, [roles, userAssignedRoles]);

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <Card className="p-5 border border-border bg-card900 backdrop-blur-xl rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <label className="text-sm font-bold text-foreground whitespace-nowrap flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-violet-400" />
            Filter by Role:
          </label>
          <div className="relative flex-1 md:w-64">
            <select
              value={selectedRoleId}
              onChange={(e) => {
                setSelectedRoleId(e.target.value);
                setSearch('');
              }}
              className="w-full pl-4 pr-10 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm font-semibold focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
            >
              <option value="ALL">All System Users ({allUsersWithRoles.length})</option>
              <option value="UNASSIGNED">Unassigned Users ({allUsersWithRoles.filter(u => u.assignedRoles.length === 0).length})</option>
              {roles?.map((r) => {
                const count = allUsersWithRoles.filter((u) => u.assignedRoles.some((ur) => ur.id === r.id)).length;
                return (
                  <option key={r.id} value={r.id}>
                    {r.name} ({count})
                  </option>
                );
              })}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search user, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
            />
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={() => {
              fetchUsers();
              if (refreshData) refreshData();
            }}
            disabled={loadingUsers}
            loading={loadingUsers}
            icon={<RefreshCw className="w-3.5 h-3.5 text-violet-400" />}
            title="Refresh user directory and roles"
          >
            Refresh
          </Button>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="border border-border bg-card900 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm">
        {loadingUsers ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-8 h-8 text-violet-400 animate-spin mb-3" />
            <p className="text-sm font-semibold text-foreground">Loading system users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-muted800 rounded-2xl flex items-center justify-center mb-4 text-muted-foreground border border-border">
              <User className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No Users Found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {search
                ? `No users match the search query "${search}".`
                : selectedRoleId === 'UNASSIGNED'
                ? 'All users in the system currently have at least one security role.'
                : 'There are no users matching the selected role criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted800/80 border-b border-border text-muted-foreground font-mono uppercase tracking-wider">
                <tr>
                  <th className="p-4">User Identity</th>
                  <th className="p-4">Assigned Roles</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u) => {
                  const fullName = `${u.person?.firstName || ''} ${u.person?.lastName || ''}`.trim() || u.username || 'System User';
                  const hasRoles = u.assignedRoles?.length > 0;
                  const department = u.person?.employee?.department || 'Unassigned';

                  return (
                    <tr key={u.id} className="hover:bg-muted800/40 transition">
                      {/* User Identity */}
                      <td className="p-4 font-semibold text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-violet-600/15 text-violet-400 border border-violet-500/20 flex items-center justify-center font-bold text-sm shrink-0">
                            {fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground truncate">{fullName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ID: {u.id?.substring(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Roles */}
                      <td className="p-4 max-w-xs">
                        {hasRoles ? (
                          <div className="flex flex-wrap gap-1.5">
                            {u.assignedRoles.map((r) => (
                              <span
                                key={r.id}
                                className="px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[11px] font-mono font-bold whitespace-nowrap shadow-sm"
                              >
                                {r.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            No Roles
                          </span>
                        )}
                      </td>

                      {/* Username */}
                      <td className="p-4 font-mono font-semibold text-foreground">
                        @{u.username || 'unassigned'}
                      </td>

                      {/* Contact Email */}
                      <td className="p-4 text-muted-foreground font-mono">
                        {u.person?.email || '-'}
                      </td>

                      {/* Department */}
                      <td className="p-4 text-muted-foreground">
                        {department}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase inline-flex items-center gap-1.5 ${
                            u.accountStatus === 'INVITED'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : u.isActive || u.accountStatus === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.accountStatus === 'INVITED'
                                ? 'bg-amber-400 animate-pulse'
                                : u.isActive || u.accountStatus === 'ACTIVE'
                                ? 'bg-emerald-400'
                                : 'bg-rose-400'
                            }`}
                          />
                          {u.accountStatus || (u.isActive ? 'ACTIVE' : 'INACTIVE')}
                        </span>
                      </td>

                      {/* Action: Modify Button */}
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenModifyModal(u)}
                          icon={<SlidersHorizontal className="w-3.5 h-3.5 text-violet-400" />}
                          className="font-semibold"
                        >
                          Modify
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL: MODIFY USER ROLES                                      */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isModifyModalOpen}
        onClose={() => setIsModifyModalOpen(false)}
        title="Modify User Roles"
        subtitle="Manage security role assignments and permissions for this user"
        icon={<Shield className="w-5 h-5 text-violet-400" />}
        maxWidth="max-w-lg"
        footer={
          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsModifyModalOpen(false)}
          >
            Done
          </Button>
        }
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* User Profile Header Card */}
            <div className="p-3.5 rounded-xl bg-card border border-border flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center font-bold text-base shrink-0">
                {(`${selectedUser.person?.firstName || ''} ${selectedUser.person?.lastName || ''}`.trim() || selectedUser.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-foreground truncate">
                    {`${selectedUser.person?.firstName || ''} ${selectedUser.person?.lastName || ''}`.trim() || selectedUser.username}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      selectedUser.accountStatus === 'INVITED'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : selectedUser.isActive || selectedUser.accountStatus === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {selectedUser.accountStatus || (selectedUser.isActive ? 'ACTIVE' : 'INACTIVE')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                  <span className="font-mono text-violet-400 font-semibold">@{selectedUser.username}</span>
                  {selectedUser.person?.email && <span>• {selectedUser.person.email}</span>}
                  {selectedUser.person?.employee?.department && (
                    <span className="text-[11px] px-1.5 py-0.2 bg-muted rounded text-foreground">
                      {selectedUser.person.employee.department}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 1: Currently Assigned Roles */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Currently Assigned Roles ({userAssignedRoles.length})
                </h5>
              </div>

              {userAssignedRoles.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">No roles assigned</p>
                  <p>This user currently has no system permissions attached.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {userAssignedRoles.map((role) => (
                    <div
                      key={role.id}
                      className="p-3 rounded-xl bg-card border border-border flex items-center justify-between gap-3 hover:border-violet-500/30 transition shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-violet-400">
                            {role.name}
                          </span>
                          {role.code && role.code !== role.name && (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              ({role.code})
                            </span>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                            {role.description}
                          </p>
                        )}
                      </div>

                      <Button
                        size="xs"
                        variant="danger"
                        disabled={actionLoading === role.id}
                        loading={actionLoading === role.id}
                        onClick={() => handleRemoveRole(role.id)}
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        className="shrink-0 font-semibold"
                        title="Remove this role from user"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Add New Role */}
            <div className="space-y-2.5 pt-2 border-t border-border">
              <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Assign New Role
              </h5>

              {availableRolesToAdd.length === 0 ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>All available system roles have already been assigned to this user.</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <div className="relative flex-1 w-full">
                    <select
                      value={newRoleId}
                      onChange={(e) => setNewRoleId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs font-semibold focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
                    >
                      <option value="">-- Choose a Role to Assign --</option>
                      {availableRolesToAdd.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} {r.description ? `— ${r.description}` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!newRoleId || actionLoading === 'adding'}
                    loading={actionLoading === 'adding'}
                    onClick={handleAddRole}
                    icon={<Plus className="w-4 h-4" />}
                    className="w-full sm:w-auto shrink-0 font-semibold"
                  >
                    Add Role
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
