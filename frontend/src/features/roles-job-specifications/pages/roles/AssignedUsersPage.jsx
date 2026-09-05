import React, { useState, useMemo, useEffect } from 'react';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';

export default function AssignedUsersPage({ roles, canUpdateRole, refreshData, handleOpenAssignUsers }) {
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (roles?.length > 0 && !selectedRoleId) {
      setSelectedRoleId('ALL');
    }
  }, [roles, selectedRoleId]);

  const allAssignedUsers = useMemo(() => {
    if (!roles) return [];
    const userMap = new Map();
    roles.forEach(r => {
      if (r.userRoles) {
        r.userRoles.forEach(ur => {
          if (!ur.user) return;
          const u = ur.user;
          if (!userMap.has(u.id)) {
            userMap.set(u.id, { ...u, assignedRoles: [] });
          }
          userMap.get(u.id).assignedRoles.push(r);
        });
      }
    });
    return Array.from(userMap.values());
  }, [roles]);

  const assignedUsers = useMemo(() => {
    if (selectedRoleId === 'ALL') {
      return allAssignedUsers;
    }
    const selectedRole = roles?.find(r => r.id === selectedRoleId);
    if (!selectedRole) return [];
    
    return (selectedRole.userRoles || []).map(ur => {
      if (!ur.user) return null;
      return allAssignedUsers.find(u => u.id === ur.user.id);
    }).filter(Boolean);
  }, [selectedRoleId, roles, allAssignedUsers]);

  const filteredUsers = useMemo(() => {
    if (!search) return assignedUsers;
    const q = search.toLowerCase();
    return assignedUsers.filter(u => {
      const fullName = `${u.person?.firstName || ''} ${u.person?.lastName || ''}`.toLowerCase();
      const username = (u.username || '').toLowerCase();
      const email = (u.person?.email || '').toLowerCase();
      return fullName.includes(q) || username.includes(q) || email.includes(q);
    });
  }, [assignedUsers, search]);

  if (!roles || roles.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground text-sm rounded-xl">
        No security roles available to manage users.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <Card className="p-5 border border-border bg-card900 backdrop-blur-xl rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <label className="text-sm font-bold text-foreground whitespace-nowrap">Select Role:</label>
          <div className="relative">
            <select 
              value={selectedRoleId} 
              onChange={(e) => {
                setSelectedRoleId(e.target.value);
                setSearch('');
              }}
              className="w-full sm:w-64 pl-4 pr-10 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm font-semibold focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
            >
              <option value="ALL">All Assigned Users</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search assigned users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
          {canUpdateRole && (
            <Button 
              onClick={() => handleOpenAssignUsers(selectedRoleId === 'ALL' ? roles[0] : roles.find(r => r.id === selectedRoleId))} 
              size="md"
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Assign Users
            </Button>
          )}
        </div>
      </Card>

      {/* Users Table */}
      <Card className="border border-border bg-card900 backdrop-blur-xl rounded-2xl overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-muted800 rounded-full flex items-center justify-center mb-4 text-muted-foreground">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground">No Users Assigned</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {selectedRoleId === 'ALL' 
                ? "There are currently no users assigned to any roles in the system." 
                : `There are currently no users assigned to the selected role.`}
            </p>
            {canUpdateRole && (
              <Button variant="secondary" className="mt-6" onClick={() => handleOpenAssignUsers(selectedRoleId === 'ALL' ? roles[0] : roles.find(r => r.id === selectedRoleId))}>
                Assign Users Now
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted800 border-b border-border text-muted-foreground font-mono uppercase">
                <tr>
                  <th className="p-4">User Identity</th>
                  <th className="p-4">Assigned Roles</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Contact</th>
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
                        <div className="w-9 h-9 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-sm">
                          {fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span>{fullName}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">ID: {u.id.substring(0,8)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          {u.assignedRoles?.map(r => (
                            <span key={r.id} className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px] font-mono font-bold whitespace-nowrap">
                              {r.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-muted-foreground">@{u.username}</td>
                      <td className="p-4 text-muted-foreground">{u.person?.email || 'N/A'}</td>
                      <td className="p-4 text-muted-foreground">{u.person?.employee?.department || 'Unassigned'}</td>
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
    </div>
  );
}
