import React from 'react';

export default function CompaniesGrid({
  companies = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  canUpdate = false,
  canDelete = false,
}) {
  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl">
        <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent mb-2" />
        <p>Loading enterprise records...</p>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl">
        <span className="text-3xl block mb-1">🏛️</span>
        <p className="font-semibold text-foreground">No companies found</p>
        <p className="mt-1">Try adjusting your filters or add a new enterprise.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {companies.map((c) => {
        const branchCount =
          typeof c.branchCount === 'number'
            ? c.branchCount
            : Array.isArray(c.branches)
            ? c.branches.length
            : 0;

        return (
          <div
            key={c.id}
            onClick={() => onView && onView(c)}
            className="p-4 rounded-xl border border-border bg-card hover:border-blue-500/50 transition shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer group"
          >
            <div className="space-y-3">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-lg shrink-0">
                    🏛️
                  </div>
                  <div>
                    <h3 className="font-normal text-foreground text-sm group-hover:text-blue-500 dark:group-hover:text-blue-400 transition truncate max-w-[190px]">
                      {c.name}
                    </h3>
                    <span className="text-[11px] text-muted-foreground truncate block max-w-[190px]">
                      {c.legalName || 'Registered Enterprise'}
                    </span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-normal shrink-0 ${
                    c.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-700/20 text-slate-400 border border-slate-700/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      c.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  {c.status || 'ACTIVE'}
                </span>
              </div>

              {/* Tax & Registration Pills */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-muted800/40 p-2.5 rounded-lg border border-border/70 font-mono">
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-sans">TIN Number</span>
                  <span className="font-normal text-foreground truncate block">
                    {c.tinNumber || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-sans">VAT Status</span>
                  <span
                    className={`text-[10px] font-normal ${
                      c.isVatRegistered ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
                    }`}
                  >
                    {c.isVatRegistered ? 'Registered' : 'Non-VAT'}
                  </span>
                </div>
              </div>

              {/* Location & Contact Details */}
              <div className="space-y-1.5 text-[11px] text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Region:</span>
                  <span className="text-foreground font-normal">{c.region?.name || '—'}</span>
                </div>

                {c.city && (
                  <div className="flex items-center justify-between">
                    <span>City:</span>
                    <span className="text-foreground font-normal">{c.city}</span>
                  </div>
                )}

                {c.phone && (
                  <div className="flex items-center justify-between">
                    <span>Phone:</span>
                    <span className="font-mono text-foreground font-normal">{c.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card Footer */}
            <div
              className="pt-3 mt-3 border-t border-border flex items-center justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[10px] font-normal ${
                  branchCount > 0
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    : 'bg-muted800 text-muted-foreground'
                }`}
              >
                🏢 {branchCount} {branchCount === 1 ? 'branch' : 'branches'}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onView && onView(c)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted800 transition"
                  title="View Details"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>

                {canUpdate && (
                  <button
                    type="button"
                    onClick={() => onEdit && onEdit(c)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted800 transition"
                    title="Edit Company"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete && onDelete(c)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted800 transition"
                    title="Delete Company"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

