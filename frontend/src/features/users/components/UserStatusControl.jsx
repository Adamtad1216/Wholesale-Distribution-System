import React, { useState } from 'react';
import Card from '../../../components/ui/Card';

export default function UserStatusControl({ user, handleStatusChange, canUpdate }) {
  const [changingStatus, setChangingStatus] = useState(false);

  if (!canUpdate || !user) return null;

  const currentStatus = user.status || user.accountStatus || (user.isActive ? 'ACTIVE' : 'INACTIVE');

  const onSelectStatus = async (newStatus) => {
    if (newStatus === currentStatus) return;
    setChangingStatus(true);
    const isNowActive = newStatus === 'ACTIVE';
    await handleStatusChange(user.id, isNowActive, newStatus);
    setChangingStatus(false);
  };

  return (
    <Card className="p-4 border border-border bg-card900/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
          disabled={changingStatus}
          onClick={() => onSelectStatus('INACTIVE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
            currentStatus === 'INACTIVE'
              ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/20'
              : 'bg-muted800 text-muted-foreground border-border hover:text-foreground'
          }`}
        >
          🔴 Set INACTIVE
        </button>

        <button
          type="button"
          disabled={changingStatus}
          onClick={() => onSelectStatus('SUSPENDED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
            currentStatus === 'SUSPENDED'
              ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20'
              : 'bg-muted800 text-muted-foreground border-border hover:text-foreground'
          }`}
        >
          🟡 Set SUSPENDED
        </button>
      </div>
    </Card>
  );
}
