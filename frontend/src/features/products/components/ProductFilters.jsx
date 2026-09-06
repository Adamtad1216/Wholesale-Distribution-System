import React, { useMemo } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import SearchableSelect from '../../../components/ui/SearchableSelect';

export default function ProductFilters({
  search = '',
  onSearchChange,
  categoryId = '',
  onCategoryChange,
  brandId = '',
  onBrandChange,
  categories = [],
  brands = [],
  onReset,
  viewMode = 'TABLE',
  onViewModeChange,
}) {
  const hasFilters = Boolean(search || categoryId || brandId);

  // Category Options
  const categoryOptions = useMemo(() => [
    { value: '', label: 'All Categories' },
    ...categories.map((c) => ({
      value: c.id,
      label: c.name,
    })),
  ], [categories]);

  // Brand Options
  const brandOptions = useMemo(() => [
    { value: '', label: 'All Brands' },
    ...brands.map((b) => ({
      value: b.id,
      label: b.name,
    })),
  ], [brands]);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedBrand = brands.find((b) => b.id === brandId);

  return (
    <Card className="p-3 sm:p-3.5 relative z-30 overflow-visible space-y-3">
      {/* Row 1: Search + Category + Brand */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full">
        {/* Search Input */}
        <div className="relative w-full sm:w-72 md:w-80 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search product or SKU..."
            className="w-full h-9 pl-9 pr-8 bg-muted800/80 border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground transition"
              title="Clear search"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category & Brand Dropdowns */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 flex-1">
          <div className="w-full sm:w-48">
            <SearchableSelect
              value={categoryId}
              onChange={onCategoryChange}
              options={categoryOptions}
              placeholder="All Categories"
              searchPlaceholder="Search categories..."
              size="sm"
            />
          </div>

          <div className="w-full sm:w-48">
            <SearchableSelect
              value={brandId}
              onChange={onBrandChange}
              options={brandOptions}
              placeholder="All Brands"
              searchPlaceholder="Search brands..."
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Row 2 (Underneath): Table / Cards Toggle & Active Filters / Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-border/40">
        {/* Left: Active Filter Pills & Reset */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {hasFilters ? (
            <>
              <span className="text-[11px] font-medium text-muted-foreground mr-1">Active filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px]">
                  "{search}"
                  <button type="button" onClick={() => onSearchChange('')} className="hover:text-white ml-0.5">✕</button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px]">
                  Category: {selectedCategory.name}
                  <button type="button" onClick={() => onCategoryChange('')} className="hover:text-white ml-0.5">✕</button>
                </span>
              )}
              {selectedBrand && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px]">
                  Brand: {selectedBrand.name}
                  <button type="button" onClick={() => onBrandChange('')} className="hover:text-white ml-0.5">✕</button>
                </span>
              )}
              <button
                type="button"
                onClick={onReset}
                className="h-7 px-2 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 text-[11px] font-medium flex items-center gap-1 transition ml-1"
                title="Clear all active filters"
              >
                ✕ Clear All
              </button>
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground">Filter products by keyword, category, or brand</span>
          )}
        </div>

        {/* Right: Table / Cards View Toggle (always visible on row 2) */}
        {onViewModeChange && (
          <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
            <span className="text-xs text-muted-foreground font-medium mr-1">View:</span>
            <div className="flex items-center h-8 p-0.5 rounded-xl bg-muted800 border border-border">
              <button
                type="button"
                onClick={() => onViewModeChange('TABLE')}
                className={`h-full px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'TABLE'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Table view"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('GRID')}
                className={`h-full px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'GRID'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Visual cards view"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                </svg>
                <span>Cards</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
