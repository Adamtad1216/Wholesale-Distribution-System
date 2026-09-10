import React from 'react';
import {
  Building2,
  Warehouse,
  MapPin,
  Eye,
  Edit2,
  Trash2,
  UserCheck,
  Phone,
} from 'lucide-react';

export default function BranchesGrid({
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
        <p className="mt-1 text-muted-foreground">Try adjusting your filters or register a new branch office.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {branches.map((b) => {
        const managerName = b.manager?.person
          ? `${b.manager.person.firstName || ''} ${b.manager.person.lastName || ''}`.trim()
          : b.manager?.name || null;

        const warehousesList = Array.isArray(b.warehouses) ? b.warehouses : [];
        const warehouseCount = warehousesList.length;

        return (
          <div
            key={b.id}
            onClick={() => onView && onView(b)}
            className="p-4 rounded-2xl border border-border bg-card hover:border-blue-500/50 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer group relative overflow-hidden"
          >
            {/* Top gradient glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/50 via-sky-500/30 to-transparent" />

            <div className="space-y-3.5">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm group-hover:text-blue-400 transition flex items-center gap-1.5">
                      <span className="truncate max-w-[180px]">{b.name}</span>
                      {b.isHeadOffice && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase shrink-0">
                          HQ
                        </span>
                      )}
                    </h3>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {b.branchCode || b.code || 'N/A'}
                    </span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
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
              </div>

              {/* Specs / Region & City */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-muted800/40 p-2.5 rounded-xl border border-border/70">
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Region</span>
                  <span className="font-medium text-foreground truncate block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                    {b.region?.name || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">City</span>
                  <span className="font-medium text-foreground truncate block">
                    {b.city || '—'}
                  </span>
                </div>
              </div>

              {/* Branch Manager & Phone */}
              <div className="space-y-1.5 text-[11px] text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-purple-400" />
                    Manager:
                  </span>
                  <strong className="text-foreground font-medium">
                    {managerName || 'Unassigned'}
                  </strong>
                </div>

                {b.phone && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 opacity-60" />
                      Phone:
                    </span>
                    <span className="font-mono text-foreground">{b.phone}</span>
                  </div>
                )}
              </div>

              {/* Warehouses Under This Branch Section */}
              <div className="space-y-1.5 pt-2.5 border-t border-border/70">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Warehouse className="w-3.5 h-3.5 text-sky-400" />
                    Operating Warehouses:
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
                    {warehouseCount}
                  </span>
                </div>

                {warehouseCount > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {warehousesList.slice(0, 3).map((wh) => (
                      <span
                        key={wh.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted800/80 hover:bg-muted700 text-foreground border border-border text-[10px] transition"
                        title={`${wh.name} (${wh.code})`}
                      >
                        <Warehouse className="w-2.5 h-2.5 text-sky-400" />
                        <span className="truncate max-w-[90px]">{wh.name}</span>
                        <span className="font-mono text-[9px] text-muted-foreground">({wh.code})</span>
                      </span>
                    ))}
                    {warehouseCount > 3 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono bg-muted800 text-muted-foreground border border-border">
                        +{warehouseCount - 3} more
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">
                    No storage facilities currently attached
                  </p>
                )}
              </div>
            </div>

            {/* Card Footer: Actions */}
            <div
              className="pt-3 mt-3 border-t border-border flex items-center justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => onView && onView(b)}
                className="text-[11px] text-black dark:text-white hover:underline font-medium flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5 text-black dark:text-white" />
                View Facility Details
              </button>

              <div className="flex items-center gap-1">
                {canUpdate && (
                  <button
                    type="button"
                    onClick={() => onEdit && onEdit(b)}
                    className="p-1.5 text-black dark:text-white hover:bg-muted rounded-lg transition"
                    title="Edit Branch"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-black dark:text-white" />
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete && onDelete(b)}
                    className="p-1.5 text-black dark:text-white hover:bg-muted rounded-lg transition"
                    title="Delete Branch"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-black dark:text-white" />
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
