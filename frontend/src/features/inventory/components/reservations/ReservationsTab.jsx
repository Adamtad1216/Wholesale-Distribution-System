import {
  BookmarkCheck,
  RotateCcw,
  Trash2,
  Plus,
  Search,
  Warehouse as WarehouseIcon,
  FileSpreadsheet,
  Eye,
  Edit2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../../components/ui/Button';

export default function ReservationsTab({
  reservations = [],
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
  onOpenReleaseModal,
  onOpenApprovalModal,
  onDeleteReservation,
  canCreate = true,
  canUpdate = true,
  canRelease = true,
  canApprove = false,
  canDelete = true,
}) {
  const navigate = useNavigate();
  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESERVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span>Awaiting Review</span>
          </span>
        );
      case 'PARTIALLY_FULFILLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <Clock className="w-3 h-3" /><span>Partial</span>
          </span>
        );
      case 'FULFILLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /><span>Fulfilled</span>
          </span>
        );
      case 'RELEASED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <XCircle className="w-3 h-3" /><span>Released</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3" /><span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-normal bg-muted800 text-foreground border border-border">
            {status?.replace(/_/g, ' ')}
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
              placeholder="Search product or sales order..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500 transition"
            />
          </div>

          {/* Warehouse */}
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

          {/* Status */}
          <div className="min-w-[160px]">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition"
            >
              <option value="">All Statuses</option>
              <option value="RESERVED">Reserved</option>
              <option value="PARTIALLY_FULFILLED">Partially Fulfilled</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="RELEASED">Released</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Action button */}
        {canCreate && (
          <Button
            variant="primary"
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 self-end lg:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Reservation</span>
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl border border-border bg-card space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Loading stock reservations...</p>
        </div>
      ) : reservations.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-border bg-card flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-muted800 border border-border flex items-center justify-center text-muted-foreground">
            <BookmarkCheck className="w-7 h-7 opacity-50" />
          </div>
          <h3 className="text-base font-normal text-foreground">No Stock Reservations</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Reservations allocate stock for customer sales orders to avoid double-allocation.
          </p>
          {canCreate && (
            <Button
              variant="outline"
              onClick={onOpenCreateModal}
              className="mt-2 text-xs"
            >
              Reserve Stock for Order
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted900/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-normal">Sales Order #</th>
                <th className="py-3 px-4 font-normal">Product</th>
                <th className="py-3 px-4 font-normal">Warehouse</th>
                <th className="py-3 px-4 font-normal text-right">Reserved Qty</th>
                <th className="py-3 px-4 font-normal">Status</th>
                <th className="py-3 px-4 font-normal">Reserved Date</th>
                <th className="py-3 px-4 font-normal text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {reservations.map((res) => {
                const isReserved = res.status === 'RESERVED';
                const isPendingReview = isReserved && canApprove;

                return (
                  <tr
                    key={res.id}
                    className="hover:bg-muted800/40 transition-colors group"
                  >
                    {/* Sales Order */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-normal text-foreground">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          #{res.salesOrder?.orderNumber || res.salesOrderId?.slice(0, 8)}
                        </span>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <span className="font-normal text-foreground block">
                        {res.product?.name}
                      </span>
                      {res.product?.sku && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          SKU: {res.product.sku}
                        </span>
                      )}
                    </td>

                    {/* Warehouse */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-normal text-foreground">
                        <WarehouseIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>
                          {res.warehouse?.name}
                          {res.warehouse?.branch?.name ? ` (${res.warehouse.branch.name})` : ''}
                        </span>
                      </div>
                    </td>

                    {/* Reserved Qty */}
                    <td className="py-3.5 px-4 text-right font-normal text-sm text-cyan-400">
                      {Number(res.quantity).toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(res.status)}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                      {new Date(res.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View reservation details */}
                        <button
                          type="button"
                          onClick={() => navigate(`/inventory/reservations/${res.id}`)}
                          className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                          title="View complete reservation details"
                        >
                          <Eye className="w-4 h-4 text-black dark:text-white" />
                        </button>

                        {/* Edit reservation */}
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => onOpenEditModal?.(res)}
                            className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                            title={isReserved ? "Edit active reservation" : "Edit reservation details"}
                          >
                            <Edit2 className="w-4 h-4 text-black dark:text-white" />
                          </button>
                        )}

                        {/* Review & Authorize (approve/release) */}
                        {isPendingReview && (
                          <button
                            type="button"
                            onClick={() => onOpenApprovalModal?.(res)}
                            className="px-2.5 py-1 rounded-lg border border-border bg-card text-black dark:text-white font-normal text-xs flex items-center gap-1 hover:bg-muted transition"
                            title="Review and authorize this reservation"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-black dark:text-white" />
                            <span>Review</span>
                          </button>
                        )}

                        {/* Release reservation (when no approve permission) */}
                        {isReserved && canRelease && !isPendingReview && (
                          <button
                            type="button"
                            onClick={() => onOpenReleaseModal(res)}
                            className="px-2.5 py-1 rounded-lg border border-border bg-card text-black dark:text-white font-normal text-xs flex items-center gap-1 hover:bg-muted transition"
                            title="Release reservation back to stock"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-black dark:text-white" />
                            <span>Release</span>
                          </button>
                        )}

                        {/* Delete reservation */}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDeleteReservation(res)}
                            className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                            title="Delete reservation record"
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

