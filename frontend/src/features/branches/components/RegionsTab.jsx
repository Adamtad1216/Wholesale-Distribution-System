import React from 'react';
import Button from '../../../components/ui/Button';

export default function RegionsTab({
  regions = [],
  loading = false,
  onEdit,
  onDelete,
  onOpenCreateModal,
  canCreate = false,
  canUpdate = false,
  canDelete = false,
}) {
  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl">
        <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent mb-2" />
        <p>Loading geographic regions...</p>
      </div>
    );
  }

  if (regions.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl">
        <span className="text-3xl block mb-1">📍</span>
        <p className="font-semibold text-foreground">No geographic regions configured</p>
        <p className="mt-1">Add operational zones and territories to locate branches and warehouses.</p>
        {canCreate && (
          <div className="mt-4">
            <Button variant="primary" size="sm" onClick={onOpenCreateModal}>
              Add First Region
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted800/60 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Region / Code</th>
            <th className="px-4 py-3 font-semibold">Description</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {regions.map((r) => (
            <tr key={r.id} className="hover:bg-muted800/40 transition">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                    📍
                  </span>
                  <div>
                    <div className="font-semibold text-foreground">{r.name}</div>
                    <span className="font-mono text-[10px] text-muted-foreground">{r.code}</span>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                {r.description || 'No description provided'}
              </td>

              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    r.isActive !== false
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-700/20 text-slate-400 border border-slate-700/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      r.isActive !== false ? 'bg-emerald-400' : 'bg-slate-400'
                    }`}
                  />
                  {r.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </td>

              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => onEdit && onEdit(r)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted800 transition"
                      title="Edit Region"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete && onDelete(r)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-muted800 transition"
                      title="Delete Region"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
