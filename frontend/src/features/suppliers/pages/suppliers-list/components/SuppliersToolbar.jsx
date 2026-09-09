import React from 'react';
import Card from '../../../../../components/ui/Card';

export default function SuppliersToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) {
  return (
    <Card className="p-5 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-lg">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3.5 top-3 text-muted-foreground text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by vendor name, code, contact person, or TIN..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}
            className="px-4 py-2.5 border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
          >
            <option value="ALL" className="bg-[#0f172a] text-slate-100">All Statuses</option>
            <option value="ACTIVE" className="bg-[#0f172a] text-slate-100">Active Vendors Only</option>
            <option value="INACTIVE" className="bg-[#0f172a] text-slate-100">Inactive Vendors Only</option>
          </select>
        </div>
      </div>
    </Card>
  );
}
