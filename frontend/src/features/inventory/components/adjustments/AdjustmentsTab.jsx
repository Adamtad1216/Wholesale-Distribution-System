import {
  Sliders,
  Plus,
  Search,
  Eye,
  Edit2,
  CheckCircle,
  XCircle,
  Clock,
  Warehouse as WarehouseIcon,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../../components/ui/Button';

export default function AdjustmentsTab({
  adjustments = [],
  warehouses = [],
  loading = false,
  selectedWarehouseId = '',
  onWarehouseChange,
  statusFilter = '',
  onStatusFilterChange,
  search = '',
  onSearchChange,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenApprovalModal,
  onOpenDetailModal,
  onDeleteAdjustment,
  canCreate = true,
  canUpdate = true,
  canApprove = true,
  canDelete = true,
}) {
  const navigate = useNavigate();
  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-normal bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approved</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-normal bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-normal bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="p-4 rounded-2xl border border-border bg-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by reason or note..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500 transition"
            />
          </div>

          {/* Warehouse Selector */}
          <div className="min-w-[180px]">
            <select
              value={selectedWarehouseId}
              onChange={(e) => onWarehouseChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}{w.branch?.name ? ` (${w.branch.name})` : (w.code ? ` (${w.code})` : '')}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="min-w-[150px]">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        {canCreate && (
          <Button
            variant="primary"
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 self-end lg:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Stock Adjustment</span>
          </Button>
        )}
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl border border-border bg-card space-y-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Loading stock adjustments...</p>
        </div>
      ) : adjustments.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-border bg-card flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-muted800 border border-border flex items-center justify-center text-muted-foreground">
            <Sliders className="w-7 h-7 opacity-50" />
          </div>
          <h3 className="text-base font-normal text-foreground">No Adjustments Recorded</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Stock adjustments let you reconcile physical inventory audit findings with system counts.
          </p>
          {canCreate && (
            <Button
              variant="outline"
              onClick={onOpenCreateModal}
              className="mt-2 text-xs"
            >
              Start New Count Audit
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted900/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-normal">Date Submitted</th>
                <th className="py-3 px-4 font-normal">Warehouse</th>
                <th className="py-3 px-4 font-normal">Audit Reason</th>
                <th className="py-3 px-4 font-normal text-center">Items Count</th>
                <th className="py-3 px-4 font-normal">Status</th>
                <th className="py-3 px-4 font-normal">Reviewer</th>
                <th className="py-3 px-4 font-normal text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {adjustments.map((adj) => {
                const itemsCount = adj.items?.length || 0;
                const isPending = adj.status === 'PENDING';

                return (
                  <tr
                    key={adj.id}
                    className="hover:bg-muted800/40 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3.5 px-4">
                      <span className="font-normal text-foreground block">
                        {new Date(adj.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(adj.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Warehouse */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-normal text-foreground">
                        <WarehouseIcon className="w-3.5 h-3.5 text-violet-400" />
                        <span>
                          {adj.warehouse?.name}
                          {adj.warehouse?.branch?.name ? ` (${adj.warehouse.branch.name})` : ''}
                        </span>
                      </div>
                      {adj.warehouse?.code && (
                        <span className="text-[10px] text-muted-foreground">
                          Code: {adj.warehouse.code}
                        </span>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="font-normal text-foreground line-clamp-1">
                        {adj.reason}
                      </span>
                    </td>

                    {/* Items Count */}
                    <td className="py-3.5 px-4 text-center font-normal text-foreground">
                      <span className="px-2 py-0.5 rounded-full bg-muted800 border border-border text-xs">
                        {itemsCount} item{itemsCount !== 1 ? 's' : ''}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getStatusBadge(adj.status)}</td>

                    {/* Reviewer */}
                    <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                      {adj.approver?.person
                        ? `${adj.approver.person.firstName} ${adj.approver.person.lastName}`
                        : adj.status !== 'PENDING'
                        ? 'Manager'
                        : '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View details */}
                        <button
                          type="button"
                          onClick={() => navigate(`/inventory/adjustments/${adj.id}`)}
                          className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                          title="View adjustment details"
                        >
                          <Eye className="w-4 h-4 text-black dark:text-white" />
                        </button>

                        {/* Edit adjustment */}
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => onOpenEditModal?.(adj)}
                            className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                            title={isPending ? "Edit pending adjustment" : "Edit adjustment audit details"}
                          >
                            <Edit2 className="w-4 h-4 text-black dark:text-white" />
                          </button>
                        )}

                        {/* Review / Process (Approve/Reject) */}
                        {isPending && canApprove && (
                          <button
                            type="button"
                            onClick={() => onOpenApprovalModal(adj)}
                            className="px-2.5 py-1 rounded-lg border border-border bg-card text-black dark:text-white font-normal text-xs flex items-center gap-1 hover:bg-muted transition"
                            title="Process Approval"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-black dark:text-white" />
                            <span>Review</span>
                          </button>
                        )}

                        {/* Delete / Archive adjustment */}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDeleteAdjustment(adj)}
                            className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                            title={isPending ? "Delete pending adjustment" : "Archive adjustment audit"}
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
      )}
    </div>
  );
}
