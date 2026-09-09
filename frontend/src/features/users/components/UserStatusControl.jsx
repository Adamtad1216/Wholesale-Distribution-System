import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import Card from '../../../components/ui/Card';

export default function UserStatusControl({ user, handleStatusChange, canUpdate }) {
  const [changingStatus, setChangingStatus] = useState(false);

  const currentUser = useSelector((state) => state.auth?.user);
  const currentRole = useSelector((state) => state.auth?.role);

  if (!canUpdate || !user) return null;

  const isSelf = Boolean(currentUser && user && String(currentUser.id) === String(user.id));
  const isSuperAdmin = Boolean(
    currentRole === 'SUPER_ADMIN' ||
    user?.userRoles?.some((ur) => ur.role?.name === 'SUPER_ADMIN' || ur.role?.code === 'SUPER_ADMIN') ||
    user?.roles?.some((r) => r.name === 'SUPER_ADMIN' || r.code === 'SUPER_ADMIN' || r === 'SUPER_ADMIN') ||
    currentUser?.roles?.some((r) => r.name === 'SUPER_ADMIN' || r.code === 'SUPER_ADMIN' || r === 'SUPER_ADMIN')
  );

  const isSelfSuperAdmin = isSelf && isSuperAdmin;
  const currentStatus = user.status || user.accountStatus || (user.isActive ? 'ACTIVE' : 'INACTIVE');

  const onSelectStatus = async (newStatus) => {
    if (newStatus === currentStatus) return;

    if (isSelfSuperAdmin && (newStatus === 'INACTIVE' || newStatus === 'SUSPENDED')) {
      toast.error('A Super Admin cannot deactivate or suspend their own account');
      return;
    }

    setChangingStatus(true);
    const isNowActive = newStatus === 'ACTIVE';
    await handleStatusChange(user.id, isNowActive, newStatus);
    setChangingStatus(false);
  };

  return (
    <Card className="p-4 border border-border bg-card900/60 rounded-2xl flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <span>⚡</span> Manage Account Login Status
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Instantly toggle account access rights between Active, Inactive, and Suspended states.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={changingStatus}
            onClick={() => onSelectStatus('ACTIVE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              currentStatus === 'ACTIVE'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                : 'bg-muted800 text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            🟢 Set ACTIVE
          </button>

          <button
            type="button"
            disabled={changingStatus || isSelfSuperAdmin}
            onClick={() => onSelectStatus('INACTIVE')}
            title={isSelfSuperAdmin ? 'A Super Admin cannot deactivate their own account' : 'Set user account to Inactive'}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              currentStatus === 'INACTIVE'
                ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/20'
                : isSelfSuperAdmin
                ? 'bg-muted800/40 text-muted-foreground/40 border-border/50 cursor-not-allowed'
                : 'bg-muted800 text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            🔴 Set INACTIVE
          </button>

          <button
            type="button"
            disabled={changingStatus || isSelfSuperAdmin}
            onClick={() => onSelectStatus('SUSPENDED')}
            title={isSelfSuperAdmin ? 'A Super Admin cannot suspend their own account' : 'Suspend user account access'}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              currentStatus === 'SUSPENDED'
                ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20'
                : isSelfSuperAdmin
                ? 'bg-muted800/40 text-muted-foreground/40 border-border/50 cursor-not-allowed'
                : 'bg-muted800 text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            🟡 Set SUSPENDED
          </button>
        </div>
      </div>

      {isSelfSuperAdmin && (
        <div className="pt-2 border-t border-border/50 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Security Policy: A Super Admin cannot deactivate or suspend their own account.</span>
        </div>
      )}
    </Card>
  );
}
