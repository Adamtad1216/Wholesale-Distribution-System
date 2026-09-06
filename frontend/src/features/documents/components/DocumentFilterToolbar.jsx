import React from 'react';
import Card from '../../../components/ui/Card';

export default function DocumentFilterToolbar({
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  layoutStyle,
  setLayoutStyle,
  selectedCategory,
  setSelectedCategory,
  docTypes = [],
  totalDocsCount = 0,
  rawDocs = [],
}) {
  return (
    <Card className="p-4 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-4">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search bar */}
        <div className="relative flex-1">
          <svg
            className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search system documents by title, entity, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Category, Status & View Layout Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
            className="px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL" className="bg-[#0f172a] text-slate-100">
              All Categories ({totalDocsCount})
            </option>
            {docTypes.map((type) => {
              const count = rawDocs.filter(
                (d) => d.documentTypeId === type.id || d.documentType?.code === type.code || d.documentType?.id === type.id
              ).length;

              return (
                <option key={type.id || type.code} value={type.id || type.code} className="bg-[#0f172a] text-slate-100">
                  {type.name} ({count})
                </option>
              );
            })}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
            className="px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL" className="bg-[#0f172a] text-slate-100">All Statuses</option>
            <option value="APPROVED" className="bg-[#0f172a] text-slate-100">Verified / Approved</option>
            <option value="PENDING_REVIEW" className="bg-[#0f172a] text-slate-100">Pending Review</option>
            <option value="REJECTED" className="bg-[#0f172a] text-slate-100">Rejected</option>
          </select>

          {/* Grid / List Toggle */}
          <div className="flex bg-muted800 p-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setLayoutStyle('GRID')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                layoutStyle === 'GRID'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setLayoutStyle('TABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                layoutStyle === 'TABLE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
