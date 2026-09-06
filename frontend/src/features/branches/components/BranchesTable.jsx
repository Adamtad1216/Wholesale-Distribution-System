import React from 'react';
import Button from '../../../components/ui/Button';

export default function BranchesTable({
  branches = [],
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
        <p>Loading branches directory...</p>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl">
        <span className="text-3xl block mb-1">🏢</span>
        <p className="font-semibold text-foreground">No branches found</p>
        <p className="mt-1">Try adjusting your search query or region filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted800/60 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Code / Name</th>
            <th className="px-4 py-3 font-semibold">Region & City</th>
            <th className="px-4 py-3 font-semibold">Head Office</th>
            <th className="px-4 py-3 font-semibold">Manager</th>
            <th className="px-4 py-3 font-semibold">Warehouses</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {branches.map((b) => {
            const managerName = b.manager?.person
              ? `${b.manager.person.firstName || ''} ${b.manager.person.lastName || ''}`.trim()
              : b.manager?.name || null;

            const warehouseCount = Array.isArray(b.warehouses) ? b.warehouses.length : 0;

            return (
              <tr
                key={b.id}
                className="hover:bg-muted800/40 transition group cursor-pointer"
                onClick={() => onView && onView(b)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      🏢
                    </span>
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <span>{b.name}</span>
                        {b.isHeadOffice && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase">
                            HQ
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {b.branchCode || b.code || 'N/A'}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <span className="font-medium text-foreground block">
                    {b.region?.name || '—'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {[b.city, b.subCity].filter(Boolean).join(', ') || 'No city specified'}
                  </span>
                </td>

                <td className="px-4 py-3">
                  {b.isHeadOffice ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      ★ Head Office
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-[11px]">Regional Branch</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  {managerName ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[9px]">
                        {managerName[0]}
                      </div>
                      <span className="text-foreground">{managerName}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">Unassigned</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono font-semibold text-[10px] ${
                      warehouseCount > 0
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-muted800 text-muted-foreground border border-border'
                    }`}
                  >
                    {warehouseCount} {warehouseCount === 1 ? 'facility' : 'facilities'}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      b.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-700/20 text-slate-400 border border-slate-700/40'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        b.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-400'
                      }`}
                    />
                    {b.status || 'ACTIVE'}
                  </span>
                </td>

                <td className="px-4 py-3 text-right">
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onView && onView(b)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted800 transition"
                      title="View Branch Details"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>

                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => onEdit && onEdit(b)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted800 transition"
                        title="Edit Branch"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete && onDelete(b)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-muted800 transition"
                        title="Delete Branch"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
