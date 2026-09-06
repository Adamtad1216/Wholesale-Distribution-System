import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { usersApi } from '../../../users/usersApi';
import { rolesApi } from '../../rolesApi';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';

export default function RoleUserAssignmentView({
  role,
  roles,
  onRoleChange,
  handleBackToList,
  onSuccess
}) {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [originalSet, setOriginalSet] = useState(new Set());
  const [draftSet, setDraftSet] = useState(new Set());

  useEffect(() => {
    if (role && role.userRoles) {
      const assignedIds = role.userRoles.map(ur => ur.user?.id || ur.userId).filter(Boolean);
      setOriginalSet(new Set(assignedIds));
      setDraftSet(new Set(assignedIds));
    }
  }, [role]);

  // Debounced search
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await usersApi.getUsers({ search, limit: 50 });
        const usersData = res?.data || res || [];
        setSearchResults(Array.isArray(usersData) ? usersData : usersData.items || []);
      } catch (err) {
        toast.error('Failed to search users');
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleToggle = (user) => {
    setDraftSet(prev => {
      const newSet = new Set(prev);
      if (newSet.has(user.id)) newSet.delete(user.id);
      else newSet.add(user.id);
      return newSet;
    });
  };

  const handleSave = async () => {
    const toAssign = [...draftSet].filter(id => !originalSet.has(id));
    const toRemove = [...originalSet].filter(id => !draftSet.has(id));

    if (toAssign.length === 0 && toRemove.length === 0) {
      toast.success("No changes made.");
      handleBackToList();
      return;
    }

    setIsSaving(true);
    try {
      const promises = [];
      for (const id of toAssign) promises.push(rolesApi.assignUser(role.id, id));
      for (const id of toRemove) promises.push(rolesApi.removeUser(role.id, id));

      await Promise.all(promises);
      toast.success(`Successfully updated assignments for ${role.name}`);
      if (onSuccess) onSuccess();
      handleBackToList(); // Go back after successful save
    } catch (err) {
      toast.error('Failed to update some user assignments.');
    } finally {
      setIsSaving(false);
    }
  };

  const assignedUsers = (role?.userRoles || []).map(ur => ur.user).filter(Boolean);
  const displayUsers = search.trim() ? searchResults : assignedUsers;

  const changesCount = [...draftSet].filter(id => !originalSet.has(id)).length + [...originalSet].filter(id => !draftSet.has(id)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={handleBackToList}
            className="flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            &larr; Back to previous view
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Assign Users to {role?.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search for users to assign, or easily revoke access from currently assigned users.
          </p>
        </div>
      </div>

      <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-6">

        {/* Top Controls: Dropdown & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          {/* Role Dropdown */}
          <div className="flex-1">
            {roles && roles.length > 0 && onRoleChange && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-foreground">Target Role:</label>
                <div className="relative w-full sm:w-80">
                  <select
                    value={role?.id || ''}
                    onChange={(e) => onRoleChange(roles.find(r => r.id === e.target.value))}
                    className="w-full pl-4 pr-10 py-2.5 bg-muted800 border border-border rounded-xl text-violet-400 text-sm font-bold focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-violet-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:items-end gap-2">
            <div className="text-xs font-semibold sm:text-right">
              <span className="text-foreground">{draftSet.size}</span> <span className="text-muted-foreground">users selected</span>
              {changesCount > 0 && (
                <span className="ml-1 text-violet-400">({changesCount} pending)</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleBackToList} disabled={isSaving}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={isSaving || changesCount === 0}>
                {isSaving ? 'Saving...' : 'Save Assignments'}
              </Button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search users by name, username, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 bg-muted800 border border-border rounded-xl text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        {/* User List */}
        <div className="bg-card900 border border-border rounded-xl overflow-hidden flex flex-col min-h-[400px]">
          {loading ? (
            <div className="flex-1 flex justify-center items-center py-24">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-muted800 rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <p className="text-muted-foreground">
                {search.trim() ? 'No users found matching your search.' : 'No users are currently assigned to this role.'}
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto p-2 space-y-2">
              {displayUsers.map((user) => {
                const isAssigned = draftSet.has(user.id);
                const fullName = `${user.person?.firstName || ''} ${user.person?.lastName || ''}`.trim() || user.username;

                return (
                  <div
                    key={user.id}
                    onClick={() => handleToggle(user)}
                    className={`flex items-center p-4 rounded-xl border transition-all duration-200 cursor-pointer group ${isAssigned
                      ? 'bg-violet-500/5 border-violet-500/30 shadow-[inset_0_0_20px_rgba(139,92,246,0.05)]'
                      : 'bg-transparent border-transparent hover:bg-muted800/50 hover:border-border'
                      }`}
                  >
                    {/* Custom Checkbox */}
                    <div className={`mr-4 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${isAssigned ? 'bg-violet-500 text-white' : 'border border-muted-foreground/40 bg-transparent group-hover:border-violet-500/50'
                      }`}>
                      {isAssigned && (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isAssigned ? 'bg-violet-500/20 text-violet-400' : 'bg-muted800 text-muted-foreground'
                        }`}>
                        {fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${isAssigned ? 'text-violet-300' : 'text-foreground'}`}>
                          {fullName}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground mt-0.5">
                          @{user.username} &middot; {user.person?.email || 'No Email'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </Card>
    </div>
  );
}
