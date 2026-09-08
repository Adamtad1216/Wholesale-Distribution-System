import {
  BookmarkCheck,
  RotateCcw,
  Trash2,
  Plus,
  Search,
  Warehouse as WarehouseIcon,
  FileSpreadsheet,
  Eye,
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
  onOpenReleaseModal,
  onDeleteReservation,
  canCreate = true,
  canRelease = true,
  canDelete = true,
}) {
  const navigate = useNavigate();
  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESERVED':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'PARTIALLY_FULFILLED':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'FULFILLED':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'RELEASED':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'CANCELLED':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-muted800 text-foreground border-border';
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
          <h3 className="text-base font-bold text-foreground">No Stock Reservations</h3>
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
                <th className="py-3 px-4 font-bold">Sales Order #</th>
                <th className="py-3 px-4 font-bold">Product</th>
                <th className="py-3 px-4 font-bold">Warehouse</th>
                <th className="py-3 px-4 font-bold text-right">Reserved Qty</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Reserved Date</th>
                <th className="py-3 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {reservations.map((res) => {
                const isReserved = res.status === 'RESERVED';

                return (
                  <tr
                    key={res.id}
                    className="hover:bg-muted800/40 transition-colors group"
                  >
                    {/* Sales Order */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          #{res.salesOrder?.orderNumber || res.salesOrderId?.slice(0, 8)}
                        </span>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-foreground block">
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
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <WarehouseIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>
                          {res.warehouse?.name}
                          {res.warehouse?.branch?.name ? ` (${res.warehouse.branch.name})` : ''}
                        </span>
                      </div>
                    </td>

                    {/* Reserved Qty */}
                    <td className="py-3.5 px-4 text-right font-black text-sm text-cyan-400">
                      {Number(res.quantity).toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                          res.status
                        )}`}
                      >
                        {res.status?.replace(/_/g, ' ')}
                      </span>
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
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted800 transition"
                          title="View complete reservation details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Release reservation */}
                        {isReserved && canRelease && (
                          <button
                            type="button"
                            onClick={() => onOpenReleaseModal(res)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs flex items-center gap-1 transition"
                            title="Release reservation back to stock"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Release</span>
                          </button>
                        )}

                        {/* Delete reservation */}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDeleteReservation(res)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Delete reservation record"
                          >
                            <Trash2 className="w-4 h-4" />
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
