import React from 'react';

export default function BranchesStats({
  branches = [],
  warehouses = [],
  regions = [],
  loading = false,
}) {
  const activeBranches = branches.filter((b) => b.status === 'ACTIVE').length;
  const headOffices = branches.filter((b) => b.isHeadOffice).length;
  const activeWarehouses = warehouses.filter((w) => w.status === 'ACTIVE').length;
  const activeRegions = regions.filter((r) => r.isActive !== false).length;

  const stats = [
    {
      label: 'Total Branches',
      value: branches.length,
      subtext: `${activeBranches} Active • ${headOffices} Head Office`,
      icon: '🏢',
      color: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30',
    },
    {
      label: 'Storage Warehouses',
      value: warehouses.length,
      subtext: `${activeWarehouses} Active Facilities`,
      icon: '🏬',
      color: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30',
    },
    {
      label: 'Geographic Regions',
      value: regions.length,
      subtext: `${activeRegions} Active Operational Zones`,
      icon: '📍',
      color: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30',
    },
    {
      label: 'Storage Density',
      value: branches.length > 0 ? (warehouses.length / branches.length).toFixed(1) : '0.0',
      subtext: 'Avg. Warehouses per Branch',
      icon: '📈',
      color: 'from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className={`p-3.5 rounded-xl border bg-gradient-to-br ${stat.color} bg-card/60 backdrop-blur-sm transition hover:border-border`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </span>
            <span className="text-xl">{stat.icon}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-foreground">
              {loading ? '—' : stat.value}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">
            {stat.subtext}
          </p>
        </div>
      ))}
    </div>
  );
}
