import React from 'react';

export default function WarehousesGrid({
  warehouses = [],
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
        <p>Loading warehouses...</p>
      </div>
    );
  }

  if (warehouses.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl">
        <span className="text-3xl block mb-1">🏬</span>
        <p className="font-semibold text-foreground">No warehouses found</p>
        <p className="mt-1">Try adjusting your filters or register a new storage warehouse.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {warehouses.map((w) => {
        const managerName = w.manager?.person
          ? `${w.manager.person.firstName || ''} ${w.manager.person.lastName || ''}`.trim()
          : w.manager?.name || null;

        return (
          <div
            key={w.id}
            onClick={() => onView && onView(w)}
            className="p-4 rounded-xl border border-border bg-card hover:border-emerald-500/50 transition shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer group"
          >
            <div className="space-y-3">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg shrink-0">
                    🏬
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm group-hover:text-emerald-400 transition truncate max-w-[190px]">
                      {w.name}
                    </h3>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {w.code}
                    </span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                    w.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-700/20 text-slate-400 border border-slate-700/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      w.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-400'
                    }`}
                  />
                  {w.status || 'ACTIVE'}
                </span>
              </div>

              {/* Parent Branch Info */}
              <div className="p-2.5 rounded-lg bg-muted800/40 border border-border/70 text-xs">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                  Parent Branch Office
                </span>
                <p className="font-semibold text-foreground mt-0.5 truncate">
                  {w.branch?.name || 'Unassigned'}
                </p>
                {w.branch?.company?.name && (
                  <span className="text-[10px] text-muted-foreground truncate block">
                    Enterprise: {w.branch.company.name}
                  </span>
                )}
              </div>

              {/* Location & Manager Details */}
              <div className="space-y-1.5 text-[11px] text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Region:</span>
                  <strong className="text-foreground">{w.region?.name || '—'}</strong>
                </div>

                {w.location && (
                  <div className="flex items-center justify-between">
                    <span>Location:</span>
                    <span className="text-foreground truncate max-w-[170px]">{w.location}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span>Manager:</span>
                  <span className="text-foreground font-medium">
                    {managerName || 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div
              className="pt-3 mt-3 border-t border-border flex items-center justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[10px] font-mono text-muted-foreground">
                ID: {w.id.slice(0, 8)}...
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onView && onView(w)}
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
                    onClick={() => onEdit && onEdit(w)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted800 transition"
                    title="Edit Warehouse"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete && onDelete(w)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-muted800 transition"
                    title="Delete Warehouse"
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
