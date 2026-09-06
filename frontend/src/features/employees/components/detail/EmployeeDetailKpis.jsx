import React from 'react';
import Card from '../../../../components/ui/Card';

export default function EmployeeDetailKpis({
  jobTitle,
  primarySpec,
  branch,
  selectedEmployee,
  formatDate,
  tenure,
  userAccount,
  userRole,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 border border-border bg-card900 backdrop-blur-xl rounded-2xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job Specification</p>
          <p className="text-sm font-bold text-foreground truncate">{jobTitle}</p>
          <p className="text-xs text-violet-400 font-mono">{primarySpec?.code || 'N/A'}</p>
        </div>
      </Card>

      <Card className="p-4 border border-border bg-card900 backdrop-blur-xl rounded-2xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned Branch</p>
          <p className="text-sm font-bold text-foreground truncate">{branch?.name || 'Unassigned'}</p>
          <p className="text-xs text-indigo-400">{branch?.city || branch?.subCity || 'Main Location'}</p>
        </div>
      </Card>

      <Card className="p-4 border border-border bg-card900 backdrop-blur-xl rounded-2xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hire Date</p>
          <p className="text-sm font-bold text-foreground">{formatDate(selectedEmployee?.hireDate)}</p>
          <p className="text-xs text-cyan-400">{tenure || 'Registered'}</p>
        </div>
      </Card>

      <Card className="p-4 border border-border bg-card900 backdrop-blur-xl rounded-2xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Account</p>
          <p className="text-sm font-bold text-foreground truncate">
            {userAccount ? `@${userAccount.username}` : 'No User Account'}
          </p>
          <p className="text-xs text-emerald-400 truncate">
            {userRole?.name || userRole?.code || (userAccount ? 'Standard User' : 'Profile Only')}
          </p>
        </div>
      </Card>
    </div>
  );
}
