import React from 'react';

export default function EmployeeDetailTabs({
  activeTab,
  setActiveTab,
  specsCount = 0,
}) {
  return (
    <div className="flex border-b border-border space-x-2">
      <button
        onClick={() => setActiveTab('jobSpec')}
        className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
          activeTab === 'jobSpec'
            ? 'border-violet-500 text-violet-400'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Job Specification ({specsCount})
      </button>

      <button
        onClick={() => setActiveTab('personal')}
        className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
          activeTab === 'personal'
            ? 'border-violet-500 text-violet-400'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Personal & Employment
      </button>

      <button
        onClick={() => setActiveTab('branch')}
        className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
          activeTab === 'branch'
            ? 'border-violet-500 text-violet-400'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        Branch & Facilities
      </button>

      <button
        onClick={() => setActiveTab('security')}
        className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
          activeTab === 'security'
            ? 'border-violet-500 text-violet-400'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        User Account & Security
      </button>
    </div>
  );
}
