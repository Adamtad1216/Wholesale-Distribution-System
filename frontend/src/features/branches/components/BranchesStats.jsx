import React from 'react';
import {
  Building2,
  Warehouse,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

export default function BranchesStats({
  branches = [],
  warehouses = [],
  regions = [],
  loading = false,
  onSelectTab,
}) {
  const activeBranches = branches.filter((b) => b.status === 'ACTIVE').length;
  const headOffices = branches.filter((b) => b.isHeadOffice).length;
  const activeWarehouses = warehouses.filter((w) => w.status === 'ACTIVE').length;
  const activeRegions = regions.filter((r) => r.isActive !== false).length;
  const assignedManagers = branches.filter(
    (b) => b.manager || (b.managerAssignments && b.managerAssignments.some((a) => a.isCurrent))
  ).length;

  const statCards = [
    {
      id: 'branches',
      label: 'Total Branches',
      value: branches.length.toLocaleString(),
      subValue: `${activeBranches} Active • ${headOffices} Head Office`,
      icon: <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      bg: 'bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400',
      gradient: 'from-blue-500/10 to-transparent',
      onClick: () => onSelectTab && onSelectTab('branches'),
    },
    {
      id: 'warehouses',
      label: 'Storage Warehouses',
      value: warehouses.length.toLocaleString(),
      subValue: `${activeWarehouses} Active fulfillment facilities`,
      icon: <Warehouse className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400',
      gradient: 'from-emerald-500/10 to-transparent',
      onClick: () => onSelectTab && onSelectTab('warehouses'),
    },
    {
      id: 'regions',
      label: 'Geographic Regions',
      value: regions.length.toLocaleString(),
      subValue: `${activeRegions} Active operational zones`,
      icon: <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      bg: 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400',
      gradient: 'from-amber-500/10 to-transparent',
      onClick: () => onSelectTab && onSelectTab('regions'),
    },
    {
      id: 'managers',
      label: 'Branch Leadership',
      value: assignedManagers.toLocaleString(),
      subValue:
        branches.length - assignedManagers > 0
          ? `${branches.length - assignedManagers} branches need manager`
          : 'All branches staffed',
      icon: <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      bg: 'bg-purple-500/10 border-purple-500/25 text-purple-600 dark:text-purple-400',
      gradient: 'from-purple-500/10 to-transparent',
      badge: branches.length - assignedManagers > 0 ? 'Review Staffing' : null,
      onClick: () => onSelectTab && onSelectTab('branches'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, idx) => (
        <div
          key={idx}
          onClick={card.onClick}
          className="relative p-4 rounded-2xl border border-border bg-card hover:border-violet-500/40 transition-all duration-200 cursor-pointer overflow-hidden group shadow-sm hover:shadow-md"
          style={{ backgroundColor: 'var(--color-card)' }}
        >
          {/* Subtle gradient glow matching inventory design */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-40 pointer-events-none group-hover:opacity-80 transition duration-300`}
          />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-normal uppercase tracking-wider text-muted-foreground truncate block">
                {card.label}
              </span>
              <div className="text-2xl font-normal text-foreground tracking-tight flex items-center gap-2">
                {loading ? '—' : card.value}
                {card.badge && (
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-900 dark:text-purple-300 border border-purple-500/30">
                    {card.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {card.subValue}
              </p>
            </div>

            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition group-hover:scale-105 ${card.bg}`}
            >
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
