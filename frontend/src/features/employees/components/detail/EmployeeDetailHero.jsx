import React from 'react';
import Card from '../../../../components/ui/Card';

export default function EmployeeDetailHero({
  fullName,
  selectedEmployee,
  jobTitle,
  branch,
  tenure,
  userAccount,
  getStatusBadge,
}) {
  return (
    <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl relative overflow-hidden shadow-lg">
      {/* Subtle decorative glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-5">
          {/* Avatar Badge */}
          <div className="w-18 h-18 p-4 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center font-bold text-2xl shrink-0 shadow-inner">
            <span className="tracking-wider">
              {fullName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'EM'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">{fullName}</h1>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20 shadow-sm">
                {selectedEmployee?.employeeCode || `EMP-${selectedEmployee?.id?.substring(0, 6)}`}
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 ${getStatusBadge(selectedEmployee?.status || (userAccount?.accountStatus === 'INVITED' ? 'INVITED' : 'ACTIVE'))}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  (selectedEmployee?.status === 'ACTIVE' && userAccount?.accountStatus !== 'INVITED')
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-amber-400 animate-pulse'
                }`} />
                {(selectedEmployee?.status === 'INVITED' || userAccount?.accountStatus === 'INVITED')
                  ? 'INVITED'
                  : selectedEmployee?.status || 'ACTIVE'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="text-violet-400 font-semibold flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {jobTitle}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {branch?.name ? `${branch.name} (${branch.branchCode || 'BR'})` : 'No Branch Assigned'}
              </span>
              {tenure && (
                <>
                  <span>•</span>
                  <span className="text-xs bg-muted/40 px-2 py-0.5 rounded text-foreground font-medium">
                    Tenure: {tenure}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Key tags on hero banner */}
        <div className="flex flex-wrap lg:flex-col items-end gap-2 shrink-0">
          {selectedEmployee?.isAvailableForSales && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Available for Sales
            </span>
          )}
          {selectedEmployee?.driverLicenseNumber && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Licensed Driver
            </span>
          )}
          {userAccount && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Active User Account (@{userAccount.username})
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
