import {
  ArrowLeftRight,
  ArrowRight,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Warehouse as WarehouseIcon,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../../components/ui/Button';

export default function TransfersTab({
  transfers = [],
  warehouses = [],
  loading = false,
  selectedSourceId = '',
  onSourceChange,
  selectedDestId = '',
  onDestChange,
  reasonFilter = '',
  onReasonFilterChange,
  statusFilter = '',
  onStatusFilterChange,
  search = '',
  onSearchChange,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenApprovalModal,
  onOpenDetailModal,
  onDeleteTransfer,
  canCreate = true,
  canUpdate = true,
  canApprove = false,
  canDelete = true,
}) {
  const navigate = useNavigate();

  const getReasonBadge = (reason) => {
    switch (reason) {
      case 'REBALANCING':
        return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30';
      case 'RESTOCKING':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'DAMAGED_GOODS':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
      case 'STORE_REQUEST':
        return 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30';
      case 'SEASONAL_ALLOCATION':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
      default:
        return 'bg-muted800 text-foreground border-border';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            <span>Pending Review</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Approved</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-muted800 text-muted-foreground border border-border">
            <span>{status || 'Unknown'}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter and Action Toolbar */}
      <div className="p-4 rounded-2xl border border-border bg-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search product, SKU, or remark..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          {/* Status Filter */}
          <div className="min-w-[140px]">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange?.(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-sky-500 transition"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Source Warehouse */}
          <div className="min-w-[150px]">
            <select
              value={selectedSourceId}
              onChange={(e) => onSourceChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-sky-500 transition"
            >
              <option value="">All Source Depots</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  From: {w.name}{w.branch?.name ? ` (${w.branch.name})` : (w.code ? ` (${w.code})` : '')}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Warehouse */}
          <div className="min-w-[150px]">
            <select
              value={selectedDestId}
              onChange={(e) => onDestChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-sky-500 transition"
            >
              <option value="">All Destinations</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  To: {w.name}{w.branch?.name ? ` (${w.branch.name})` : (w.code ? ` (${w.code})` : '')}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div className="min-w-[140px]">
            <select
              value={reasonFilter}
              onChange={(e) => onReasonFilterChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-sky-500 transition"
            >
              <option value="">All Reasons</option>
              <option value="REBALANCING">Rebalancing</option>
              <option value="RESTOCKING">Restocking</option>
              <option value="DAMAGED_GOODS">Damaged Goods</option>
              <option value="STORE_REQUEST">Store Request</option>
              <option value="SEASONAL_ALLOCATION">Seasonal</option>
              <option value="EXCESS_STOCK">Excess Stock</option>
            </select>
          </div>
        </div>

        {/* Dispatch Transfer Button */}
        {canCreate && (
          <Button
            variant="primary"
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 self-end lg:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Dispatch Stock Transfer</span>
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl border border-border bg-card space-y-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Loading inter-warehouse transfers...</p>
        </div>
      ) : transfers.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-border bg-card flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-muted800 border border-border flex items-center justify-center text-muted-foreground">
            <ArrowLeftRight className="w-7 h-7 opacity-50" />
          </div>
          <h3 className="text-base font-normal text-foreground">No Transfers Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Move inventory smoothly between your central warehouse and distribution hubs.
          </p>
          {canCreate && (
            <Button
              variant="outline"
              onClick={onOpenCreateModal}
              className="mt-2 text-xs"
            >
              Dispatch First Transfer
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted900/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-normal">Transfer Route (From ➔ To)</th>
                <th className="py-3 px-4 font-normal">Product / SKU</th>
                <th className="py-3 px-4 font-normal text-right">Quantity</th>
                <th className="py-3 px-4 font-normal">Reason</th>
                <th className="py-3 px-4 font-normal">Status</th>
                <th className="py-3 px-4 font-normal">Dispatched Date</th>
                <th className="py-3 px-4 font-normal">Approver / Reviewer</th>
                <th className="py-3 px-4 font-normal text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {transfers.map((item) => {
                const isPending = item.status === 'PENDING';
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-muted800/40 transition-colors group"
                  >
                    {/* Route */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 font-normal text-foreground">
                          <WarehouseIcon className="w-3.5 h-3.5 text-rose-400" />
                          <span>
                            {item.fromWarehouse?.name}
                            {item.fromWarehouse?.branch?.name ? ` (${item.fromWarehouse.branch.name})` : ''}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <div className="flex items-center gap-1 font-normal text-foreground">
                          <WarehouseIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            {item.toWarehouse?.name}
                            {item.toWarehouse?.branch?.name ? ` (${item.toWarehouse.branch.name})` : ''}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-normal text-foreground block truncate">
                            {item.product?.name}
                          </span>
                          {item.product?.sku && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              SKU: {item.product.sku}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-4 text-right font-normal text-sm text-sky-400">
                      {Number(item.quantity).toLocaleString()}
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-normal border ${getReasonBadge(
                          item.transferReason
                        )}`}
                      >
                        {item.transferReason?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>

                    {/* Approver / Reviewer */}
                    <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                      {item.approver?.person
                        ? `${item.approver.person.firstName} ${item.approver.person.lastName}`
                        : item.approver?.username || (isPending ? '—' : 'System')}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View transfer details */}
                        <button
                          type="button"
                          onClick={() => navigate(`/inventory/transfers/${item.id}`)}
                          className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                          title="View transfer details"
                        >
                          <Eye className="w-4 h-4 text-black dark:text-white" />
                        </button>

                        {/* Edit transfer */}
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => onOpenEditModal?.(item)}
                            className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                            title={isPending ? "Edit pending transfer" : "Edit transfer details"}
                          >
                            <Edit2 className="w-4 h-4 text-black dark:text-white" />
                          </button>
                        )}

                        {/* Review / Process Approval */}
                        {isPending && canApprove && (
                          <button
                            type="button"
                            onClick={() => onOpenApprovalModal?.(item)}
                            className="px-2.5 py-1 rounded-lg border border-border bg-card text-black dark:text-white font-normal text-xs flex items-center gap-1 hover:bg-muted transition"
                            title="Process Authorization"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-black dark:text-white" />
                            <span>Review</span>
                          </button>
                        )}

                        {/* Cancel/Delete */}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDeleteTransfer(item)}
                            className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                            title={isPending ? 'Cancel pending transfer request' : 'Reverse transfer'}
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
