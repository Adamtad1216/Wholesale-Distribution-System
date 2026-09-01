import React from 'react';
import Card from '../../../../../components/ui/Card';
import Button from '../../../../../components/ui/Button';

export default function OverviewTab({ personData, user, role, onEditProfile }) {
  const infoTiles = [
    {
      label: 'Email', value: personData.email || user?.email || (user?.username ? `${user.username}@system.com` : 'N/A'),
      icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
    },
    {
      label: 'Phone', value: personData.phone || 'N/A',
      icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30',
    },
    {
      label: 'Role', value: role || 'User',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-400 dark:border-violet-500/30',
    },
    {
      label: 'Address', value: personData.address || 'N/A',
      icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
      color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* About Card */}
        <Card className="lg:col-span-2 space-y-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold">About</h2>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={onEditProfile}
              icon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              }
            >
              Edit Profile
            </Button>
          </div>

          <p className="text-sm font-normal text-muted leading-relaxed">
            {personData.bio || 'No bio available yet.'}
          </p>

          {/* Info Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {infoTiles.map(({ label, value, icon, color }) => (
              <div key={label} className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-transparent">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-medium text-muted uppercase tracking-wide">{label}</span>
                  <span className="block text-sm font-semibold truncate mt-0.5">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Account Details & Activity Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 px-1 pb-1 border-b border-slate-200 dark:border-slate-800">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold">Account & Activity</h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              {
                label: 'Account Status',
                value: (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {user?.accountStatus || 'ACTIVE'}
                  </span>
                ),
                icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
              },
              {
                label: 'System Username',
                value: <span className="text-xs font-semibold font-mono">{user?.username || 'N/A'}</span>,
                icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
                color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
              },
              {
                label: 'Member Since',
                value: <span className="text-xs font-semibold">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'September 2026'}</span>,
                icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
                color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30',
              },
              {
                label: 'Last Profile Update',
                value: <span className="text-xs font-semibold">{user?.person?.updatedAt || user?.updatedAt ? new Date(user?.person?.updatedAt || user?.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}</span>,
                icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
                color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
              },
              {
                label: 'Last Active',
                value: <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Active now'}</span>,
                icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                color: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/20 dark:text-teal-400 dark:border-teal-500/30',
              },
              {
                label: 'Uploaded Documents',
                value: (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30">
                    {user?._count?.documents ?? user?.documents?.length ?? 0} Docs
                  </span>
                ),
                icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
                color: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30',
              },
            ].map(({ label, value, icon, color }) => (
              <Card key={label} noPadding className="p-3 flex items-center justify-between border border-slate-200 dark:border-slate-800 hoverEffect">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${color}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-muted uppercase tracking-wide truncate">{label}</span>
                </div>
                <div className="shrink-0 pl-2">{value}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
