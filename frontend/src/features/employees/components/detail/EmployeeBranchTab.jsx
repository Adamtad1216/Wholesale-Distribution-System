import React from 'react';
import Card from '../../../../components/ui/Card';

export default function EmployeeBranchTab({
  branch,
  managedBranches = [],
  managedWarehouses = [],
  counts = {},
  getStatusBadge,
}) {
  return (
    <div className="space-y-6">
      {branch ? (
        <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-6 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
                  Primary Assigned Branch
                </span>
                {branch.isHeadOffice && (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Head Office
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusBadge(branch.status)}`}>
                  {branch.status || 'ACTIVE'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">{branch.name}</h2>
              <p className="text-xs font-mono text-muted-foreground">Code: {branch.branchCode || 'N/A'}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-xl bg-card border border-border text-left">
                <p className="text-xs text-muted-foreground">Facility Contact</p>
                <p className="text-sm font-semibold text-foreground">{branch.phone || 'No phone recorded'}</p>
                <p className="text-xs text-muted-foreground truncate">{branch.email || 'No email recorded'}</p>
              </div>
            </div>
          </div>

          {/* Location & Physical Facility Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-card/60 border border-border">
              <span className="text-muted-foreground block mb-1">City</span>
              <span className="font-semibold text-foreground text-sm">{branch.city || 'N/A'}</span>
            </div>
            <div className="p-3 rounded-lg bg-card/60 border border-border">
              <span className="text-muted-foreground block mb-1">Sub-City</span>
              <span className="font-semibold text-foreground text-sm">{branch.subCity || 'N/A'}</span>
            </div>
            <div className="p-3 rounded-lg bg-card/60 border border-border">
              <span className="text-muted-foreground block mb-1">Woreda / Kebele</span>
              <span className="font-semibold text-foreground text-sm">
                {branch.woreda ? `Woreda ${branch.woreda}` : ''} {branch.kebele ? `Kebele ${branch.kebele}` : (branch.woreda ? '' : 'N/A')}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-card/60 border border-border">
              <span className="text-muted-foreground block mb-1">House / Landmark</span>
              <span className="font-semibold text-foreground text-sm">
                {branch.houseNumber || branch.landmark || 'N/A'}
              </span>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-8 border border-border bg-card900 backdrop-blur-xl rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-foreground">No Branch Assigned</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            This employee has not been assigned to a physical distribution branch or facility yet.
          </p>
        </Card>
      )}

      {/* Managed Entities (Branches & Warehouses) */}
      {(managedBranches.length > 0 || managedWarehouses.length > 0) && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Facility Management Responsibilities
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {managedBranches.map((mb) => (
              <Card key={mb.id} className="p-4 border border-border bg-card900 backdrop-blur-xl rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    Managed Branch
                  </span>
                  <p className="font-bold text-foreground mt-1">{mb.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{mb.branchCode} • {mb.city}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusBadge(mb.status)}`}>
                  {mb.status}
                </span>
              </Card>
            ))}

            {managedWarehouses.map((mw) => (
              <Card key={mw.id} className="p-4 border border-border bg-card900 backdrop-blur-xl rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                    Managed Warehouse
                  </span>
                  <p className="font-bold text-foreground mt-1">{mw.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{mw.warehouseCode}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusBadge(mw.status)}`}>
                  {mw.status}
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Operational Count Statistics */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Associated Operational Workload
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <p className="text-2xl font-extrabold text-foreground">{counts.salesOrders ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Sales Orders</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <p className="text-2xl font-extrabold text-foreground">{counts.deliveries ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Deliveries Handled</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <p className="text-2xl font-extrabold text-foreground">{counts.preparationTasks ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Prep Tasks</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <p className="text-2xl font-extrabold text-foreground">{counts.managedBranches ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Managed Branches</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <p className="text-2xl font-extrabold text-foreground">{counts.managedWarehouses ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Managed Depots</p>
          </div>
        </div>
      </div>
    </div>
  );
}
