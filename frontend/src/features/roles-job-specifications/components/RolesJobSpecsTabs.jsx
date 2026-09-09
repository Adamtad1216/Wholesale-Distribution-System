import React from 'react';

export default function RolesJobSpecsTabs({
  activeTab,
  onTabChange,
  rolesCount = 0,
  jobSpecsCount = 0,
}) {
  return (
    <div className="flex border-b border-border space-x-6">
      <button
        onClick={() => onTabChange('ROLES')}
        className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
          activeTab === 'ROLES'
            ? 'border-violet-500 text-violet-400'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        System Security Roles ({rolesCount})
      </button>

      <button
        onClick={() => onTabChange('JOB_SPECS')}
        className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
          activeTab === 'JOB_SPECS'
            ? 'border-violet-500 text-violet-400'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Job Specifications ({jobSpecsCount})
      </button>

      <button
        onClick={() => onTabChange('ASSIGNED_USERS')}
        className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
          activeTab === 'ASSIGNED_USERS'
            ? 'border-violet-500 text-violet-400'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        Assigned Users
      </button>
    </div>
  );
}
