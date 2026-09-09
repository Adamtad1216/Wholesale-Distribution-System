import React from 'react';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';

export default function EmployeeSecurityTab({
  userAccount,
  userRole,
  selectedEmployee,
  handleOpenEdit,
  canUpdate = true,
  formatDateTime,
  getStatusBadge,
}) {
  return (
    <div className="space-y-6">
      {userAccount ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Identity & Account Information */}
          <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Login Credentials & Status
                </h3>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-semibold ${getStatusBadge(userAccount.accountStatus || (userAccount.isActive ? 'ACTIVE' : 'INACTIVE'))}`}>
                {userAccount.accountStatus || (userAccount.isActive ? 'ACTIVE' : 'INACTIVE')}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Username</span>
                <span className="font-mono font-bold text-foreground">@{userAccount.username}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Login Access Active</span>
                <span className={`font-semibold ${userAccount.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {userAccount.isActive ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Last Recorded Login</span>
                <span className="text-foreground">
                  {userAccount.lastLoginAt ? formatDateTime(userAccount.lastLoginAt) : 'Never logged in yet'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono text-xs text-muted-foreground break-all">{userAccount.id}</span>
              </div>
            </div>
          </Card>

          {/* Assigned Security Role Details */}
          <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Assigned Security Role
              </h3>
              {userRole && (
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  {userRole.code || 'ROLE'}
                </span>
              )}
            </div>

            {userRole ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-bold text-foreground">{userRole.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {userRole.description || 'Standard system privileges and operational access.'}
                  </p>
                </div>

                {userAccount.roles && userAccount.roles.length > 1 && (
                  <div className="pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground block mb-2">All Assigned Roles:</span>
                    <div className="flex flex-wrap gap-2">
                      {userAccount.roles.map((r) => (
                        <span key={r.id || r.code} className="px-2 py-1 rounded bg-card border border-border text-xs text-foreground font-medium">
                          {r.name || r.code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm py-4">
                User account is created but no specific Security Role has been assigned.
              </div>
            )}
          </Card>

          {/* Wildcard Access Notice if Super Admin */}
          {(userRole?.code === 'SUPER_ADMIN' || userRole?.name === 'SUPER_ADMIN' || userAccount.roles?.some(r => r.code === 'SUPER_ADMIN' || r.name === 'SUPER_ADMIN')) && (
            <div className="lg:col-span-2 p-4 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 text-xs flex items-start sm:items-center gap-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0 font-bold text-base shadow-inner">
                ⚡
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-amber-800 dark:text-amber-300 text-sm tracking-tight">
                  Unrestricted System Permission Granted
                </p>
                <p className="text-xs text-amber-900/85 dark:text-amber-200/90 leading-relaxed">
                  Because this account possesses a Super Admin role with wildcard (<code className="bg-amber-500/20 dark:bg-amber-900/60 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-bold text-amber-950 dark:text-amber-200">*</code>) authorization, all permission keys across all system modules are automatically granted.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card className="p-8 border border-border bg-card900 backdrop-blur-xl rounded-2xl text-center space-y-4 shadow-md">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-400 mx-auto flex items-center justify-center border border-violet-500/20">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">No System User Account Linked</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              This employee is currently registered as staff/personnel without system login credentials.
            </p>
          </div>
          {canUpdate && (
            <div className="pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => handleOpenEdit(selectedEmployee)}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                }
              >
                Create User Login Account
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
