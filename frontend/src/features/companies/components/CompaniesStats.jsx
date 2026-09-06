import React from 'react';

export default function CompaniesStats({
  companies = [],
  loading = false,
}) {
  const activeCompanies = companies.filter((c) => c.status === 'ACTIVE').length;
  const vatRegistered = companies.filter((c) => c.isVatRegistered).length;
  const withTin = companies.filter((c) => Boolean(c.tinNumber)).length;
  const totalBranches = companies.reduce(
    (sum, c) =>
      sum +
      (typeof c.branchCount === 'number'
        ? c.branchCount
        : Array.isArray(c.branches)
        ? c.branches.length
        : 0),
    0
  );

  const stats = [
    {
      label: 'Total Enterprises',
      value: companies.length,
      subtext: `${activeCompanies} Active Companies`,
      icon: '🏛️',
      color: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30',
    },
    {
      label: 'VAT Registered',
      value: vatRegistered,
      subtext: `${companies.length ? Math.round((vatRegistered / companies.length) * 100) : 0}% Registered Entities`,
      icon: '📑',
      color: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30',
    },
    {
      label: 'Tax Compliant (TIN)',
      value: withTin,
      subtext: 'Verified TIN Credentials',
      icon: '🛡️',
      color: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30',
    },
    {
      label: 'Branch Network',
      value: totalBranches,
      subtext: 'Operating Branch Offices',
      icon: '🏢',
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
