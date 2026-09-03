import React from 'react';

export default function DocumentHeader({ viewMode, setViewMode, totalDocs, categoryCount }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <span>📂</span> System Document Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore all documents stored across the wholesale distribution system and manage document categories.
        </p>
      </div>

      {/* View Mode Switcher */}
      <div className="flex items-center gap-2 bg-muted800 p-1.5 rounded-2xl border border-border">
        <button
          type="button"
          onClick={() => setViewMode('EXPLORER')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            viewMode === 'EXPLORER'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>📄</span> All Documents ({totalDocs})
        </button>

        <button
          type="button"
          onClick={() => setViewMode('CATEGORIES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            viewMode === 'CATEGORIES'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>🏷️</span> Document Categories ({categoryCount})
        </button>
      </div>
    </div>
  );
}
