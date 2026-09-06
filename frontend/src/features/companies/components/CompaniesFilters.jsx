import React from 'react';

export default function CompaniesFilters({
  search = '',
  onSearchChange,
  regionId = '',
  onRegionChange,
  status = '',
  onStatusChange,
  vatFilter = '',
  onVatFilterChange,
  regions = [],
  viewMode = 'table',
  onViewModeChange,
  onReset,
}) {
  const hasActiveFilters = search || regionId || status || vatFilter;

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px]">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by company name, TIN, license number..."
          className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60 transition"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Region Filter */}
        <select
          value={regionId}
          onChange={(e) => onRegionChange(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Regions</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        {/* VAT Status */}
        <select
          value={vatFilter}
          onChange={(e) => onVatFilterChange(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All VAT Statuses</option>
          <option value="true">VAT Registered</option>
          <option value="false">Non-VAT</option>
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted800 transition"
          >
            Reset
          </button>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center p-0.5 rounded-lg border border-border bg-muted800/80">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`p-1.5 rounded-md transition ${
              viewMode === 'table'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Table View"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-md transition ${
              viewMode === 'grid'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Grid Cards View"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
