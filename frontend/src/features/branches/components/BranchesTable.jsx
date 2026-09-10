import React from 'react';
import {
  Building2,
  Warehouse,
  Eye,
  Edit2,
  Trash2,
  User,
} from 'lucide-react';

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
        <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
          <Building2 className="w-6 h-6" />
        </div>
        <p className="font-semibold text-foreground text-sm">No branches found</p>
        <p className="mt-1 text-muted-foreground">Try adjusting your search query or region filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted800/60 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3.5 font-semibold">Code / Name</th>
            <th className="px-4 py-3.5 font-semibold">Region & City</th>
            <th className="px-4 py-3.5 font-semibold">Type</th>
            <th className="px-4 py-3.5 font-semibold">Branch Manager</th>
            <th className="px-4 py-3.5 font-semibold">Operating Warehouses</th>
            <th className="px-4 py-3.5 font-semibold">Status</th>
            <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {branches.map((b) => {
            const managerName = b.manager?.person
              ? `${b.manager.person.firstName || ''} ${b.manager.person.lastName || ''}`.trim()
              : b.manager?.name || null;

            const warehousesList = Array.isArray(b.warehouses) ? b.warehouses : [];
            const warehouseCount = warehousesList.length;

            return (
              <tr
                key={b.id}
                className="hover:bg-muted800/40 transition group cursor-pointer"
                onClick={() => onView && onView(b)}
              >
                {/* Branch Code & Name */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
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

                {/* Region & City */}
                <td className="px-4 py-3">
                  <span className="font-medium text-foreground block">
                    {b.region?.name || '—'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {[b.city, b.subCity].filter(Boolean).join(', ') || 'No city specified'}
                  </span>
                </td>

                {/* Head Office / Regional */}
                <td className="px-4 py-3">
                  {b.isHeadOffice ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      ★ Head Office
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-[11px]">Regional Branch</span>
                  )}
                </td>

                {/* Manager */}
                <td className="px-4 py-3">
                  {managerName ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-blue-500/30">
                        {managerName[0]}
                      </div>
                      <div>
                        <span className="text-foreground font-medium block">{managerName}</span>
                        <span className="text-[10px] text-muted-foreground block">
                          {b.manager?.employeeCode ? `Code: ${b.manager.employeeCode}` : 'Branch Manager'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic flex items-center gap-1">
                      <User className="w-3 h-3 opacity-40" />
                      Unassigned
                    </span>
                  )}
                </td>

                {/* Operating Warehouses: Number/Count Only */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold transition ${
                      warehouseCount > 0
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/25 group-hover:border-sky-500/40'
                        : 'bg-muted800 text-muted-foreground border border-border'
                    }`}
                  >
                    <Warehouse className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {warehouseCount} {warehouseCount === 1 ? 'warehouse' : 'warehouses'}
                    </span>
                  </span>
                </td>

                {/* Status */}
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

                {/* Actions */}
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onView && onView(b)}
                      className="p-1.5 text-black dark:text-white hover:bg-muted rounded-lg transition"
                      title="View Branch Details"
                    >
                      <Eye className="w-4 h-4 text-black dark:text-white" />
                    </button>

                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => onEdit && onEdit(b)}
                        className="p-1.5 text-black dark:text-white hover:bg-muted rounded-lg transition"
                        title="Edit Branch"
                      >
                        <Edit2 className="w-4 h-4 text-black dark:text-white" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete && onDelete(b)}
                        className="p-1.5 text-black dark:text-white hover:bg-muted rounded-lg transition"
                        title="Delete Branch"
                      >
                        <Trash2 className="w-4 h-4 text-black dark:text-white" />
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
