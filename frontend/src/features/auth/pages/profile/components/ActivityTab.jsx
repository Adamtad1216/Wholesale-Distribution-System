import React from 'react';
import Card from '../../../../../components/ui/Card';

export default function ActivityTab({ user, personData }) {
  const realActivities = [];

  // 1. Audit Logs from DB if populated
  if (Array.isArray(user?.auditLogs) && user.auditLogs.length > 0) {
    user.auditLogs.forEach((log, idx) => {
      const actionName = (log.action || 'ACTIVITY').replace(/_/g, ' ');
      realActivities.push({
        id: log.id || `audit-${idx}`,
        action: actionName,
        detail: log.entityType ? `${log.entityType} ${log.entityId ? `#${log.entityId.slice(0, 8)}` : ''}` : 'System action recorded',
        category: (log.action || 'AUDIT').split('_')[0] || 'AUDIT',
        time: log.createdAt ? new Date(log.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : 'Recently',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30',
      });
    });
  }

  // 2. Direct real user object timestamps
  if (realActivities.length === 0) {
    if (user?.lastLoginAt) {
      realActivities.push({
        id: 'login',
        action: 'Login Authenticated',
        detail: `Successfully logged in as ${user?.username || user?.email || 'user'}`,
        category: 'LOGIN',
        time: new Date(user.lastLoginAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
      });
    }

    const profileUpdatedTime = personData?.updatedAt || user?.person?.updatedAt || user?.updatedAt;
    if (profileUpdatedTime) {
      realActivities.push({
        id: 'profile-update',
        action: 'Profile Updated',
        detail: 'Personal details and contact information updated',
        category: 'PROFILE',
        time: new Date(profileUpdatedTime).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
      });
    }

    if (user?.createdAt) {
      realActivities.push({
        id: 'account-created',
        action: 'Account Registered',
        detail: `Account initialized in system (Status: ${user?.accountStatus || 'ACTIVE'})`,
        category: 'ACCOUNT',
        time: new Date(user.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30',
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-semibold">Activity Log</h2>
          <p className="text-sm font-medium text-muted">Real audit history for {user?.username || 'current profile'}</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
          {realActivities.length} Real Event{realActivities.length !== 1 ? 's' : ''}
        </span>
      </div>

      {realActivities.length === 0 ? (
        <Card className="py-12 text-center border border-slate-200 dark:border-slate-800">
          <svg className="w-10 h-10 mx-auto text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-muted">No activity logs recorded for this account yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {realActivities.map((act) => (
            <Card key={act.id} noPadding className="p-4 border border-slate-200 dark:border-slate-800 hoverEffect">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${act.color}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={act.icon} />
                    </svg>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold truncate">{act.action}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border ${act.color}`}>
                        {act.category}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-muted truncate">{act.detail}</p>
                  </div>
                </div>

                <div className="shrink-0 text-right space-y-1 pl-2">
                  <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{act.time}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
