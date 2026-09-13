import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Package,
  Warehouse as WarehouseIcon,
  LayoutGrid,
  List,
  ArrowUp,
  Calendar,
  Tag,
  Eye,
  CheckCircle2,
  FileText,
  PackagePlus,
  User,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Modal from '../../../../components/ui/Modal';

const REFERENCE_TYPE_LABELS = {
  MANUAL_INTAKE: 'Manual Intake',
  PURCHASE_RECEIPT: 'Purchase Order Receipt',
  GOODS_RECEIPT: 'Goods Receipt',
  ADJUSTMENT: 'Adjustment Rebalance',
  INITIAL_STOCK: 'Initial Stock',
  TRANSFER: 'Inter-Warehouse Transfer',
  TRANSFER_HOLD: 'Transfer Hold',
  TRANSFER_HOLD_REVERSAL: 'Hold Released',
  TRANSFER_REVERSAL: 'Transfer Reversal',
  OTHER: 'Other Addition',
};

const REFERENCE_TYPE_BADGES = {
  MANUAL_INTAKE: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  PURCHASE_RECEIPT: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  GOODS_RECEIPT: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  ADJUSTMENT: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  INITIAL_STOCK: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  TRANSFER: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  TRANSFER_HOLD: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
  TRANSFER_HOLD_REVERSAL: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  TRANSFER_REVERSAL: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  OTHER: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
};

function formatQty(n) {
  const num = Number(n) || 0;
  return num % 1 === 0 ? num.toLocaleString() : num.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function formatDate(d) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(d));
}

export default function StockAdditionsTab({
  stockAdditions = [],
  warehouses = [],
  loading = false,
  search = '',
  onSearchChange,
  selectedWarehouseId = '',
  onWarehouseChange,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteAddition,
  canCreate = true,
  canUpdate = true,
  canDelete = true,
}) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [filterType, setFilterType] = useState('');
  const [detailAddition, setDetailAddition] = useState(null);

  const filtered = stockAdditions.filter((a) => {
    const term = (search || '').toLowerCase();
    const matchSearch =
      !term ||
      a.product?.name?.toLowerCase().includes(term) ||
      a.product?.sku?.toLowerCase().includes(term) ||
      a.warehouse?.name?.toLowerCase().includes(term) ||
      a.referenceType?.toLowerCase().includes(term) ||
      a.notes?.toLowerCase().includes(term);

    const matchWarehouse =
      !selectedWarehouseId ||
      a.warehouseId === selectedWarehouseId ||
      a.warehouse?.id === selectedWarehouseId;

    const matchType = !filterType || a.referenceType === filterType;

    return matchSearch && matchWarehouse && matchType;
  });

  const totalAddedQty = filtered.reduce((sum, a) => sum + Number(a.addedQuantity || 0), 0);

  return (
    <div className="space-y-4">
      {/* Filter & Action Toolbar matching StocksTab */}
      <div className="p-4 rounded-2xl border border-border bg-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Search & Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search product, SKU, warehouse..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange?.('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground p-0.5"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Warehouse Selector */}
          <div className="min-w-[180px]">
            <select
              value={selectedWarehouseId}
              onChange={(e) => onWarehouseChange?.(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                  {w.branch?.name ? ` (${w.branch.name})` : w.code ? ` (${w.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Reference Type Filter */}
          <div className="min-w-[170px]">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition"
            >
              <option value="">All Reference Types</option>
              {Object.entries(REFERENCE_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: View Toggle & Add Button */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-muted900/60 border border-border">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'table'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'grid'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Add Quantity Button */}
          {canCreate && (
            <Button
              variant="primary"
              onClick={onOpenCreateModal}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Quantity</span>
            </Button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl border border-border bg-card space-y-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Loading stock additions history...</p>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="p-16 text-center rounded-2xl border border-border bg-card flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-muted800 border border-border flex items-center justify-center text-muted-foreground">
            <PackagePlus className="w-7 h-7 opacity-100 text-emerald-500" />
          </div>
          <h3 className="text-base font-normal text-foreground">No Stock Additions Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            {search || selectedWarehouseId || filterType
              ? 'No stock additions match your filter criteria. Try resetting your search or warehouse filter.'
              : 'Start tracking incoming inventory by recording your first stock quantity addition.'}
          </p>
          {canCreate && (
            <Button
              variant="outline"
              onClick={onOpenCreateModal}
              className="mt-2 text-xs"
            >
              Add Stock Quantity
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View matching StocksTab */
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted900/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-normal">Product / SKU</th>
                <th className="py-3 px-4 font-normal">Warehouse</th>
                <th className="py-3 px-4 font-normal">Reference Type</th>
                <th className="py-3 px-4 font-normal text-right">Prev. Total</th>
                <th className="py-3 px-4 font-normal text-right">Added Qty</th>
                <th className="py-3 px-4 font-normal text-right">New Available Total</th>
                <th className="py-3 px-4 font-normal">Date & User</th>
                <th className="py-3 px-4 font-normal text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((addition) => {
                const addedQty = Number(addition.addedQuantity) || 0;
                const isNegative = addedQty < 0;
                const prevTotal = Number(addition.previousTotalQty) || 0;
                const newTotal = Number(addition.currentTotalAvailableQty) || (prevTotal + addedQty);
                const badgeClass =
                  REFERENCE_TYPE_BADGES[addition.referenceType] || REFERENCE_TYPE_BADGES.OTHER;

                return (
                  <tr
                    key={addition.id}
                    className="hover:bg-muted800/40 transition-colors group"
                  >
                    {/* Product Name & SKU */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0">
                          <PackagePlus className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-normal text-foreground block truncate">
                            {addition.product?.name || 'Product'}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                            {addition.product?.sku && (
                              <span className="font-mono bg-muted800 px-1.5 py-0.2 rounded text-[10px]">
                                {addition.product.sku}
                              </span>
                            )}
                            {addition.product?.unit?.name && (
                              <span>• {addition.product.unit.name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Warehouse */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-foreground font-normal">
                        <WarehouseIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>
                          {addition.warehouse?.name || 'Warehouse'}
                          {addition.warehouse?.branch?.name ? ` (${addition.warehouse.branch.name})` : ''}
                        </span>
                      </div>
                      {addition.warehouse?.code && (
                        <span className="text-[10px] text-muted-foreground">
                          Code: {addition.warehouse.code}
                        </span>
                      )}
                    </td>

                    {/* Reference Type Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-normal border ${badgeClass}`}
                      >
                        <Tag className="w-3 h-3 opacity-70" />
                        <span>
                          {REFERENCE_TYPE_LABELS[addition.referenceType] || addition.referenceType || 'Addition'}
                        </span>
                      </span>
                    </td>

                    {/* Previous Total */}
                    <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                      {formatQty(prevTotal)}
                    </td>

                    {/* Added Quantity */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span
                        className={`inline-flex items-center justify-end font-semibold text-sm ${
                          isNegative ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isNegative ? '' : '+'}
                        {formatQty(addedQty)}
                      </span>
                    </td>

                    {/* New Available Total */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground text-sm">
                      {formatQty(newTotal)}
                    </td>

                    {/* Date & User */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs">{formatDate(addition.addedAt || addition.createdAt)}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        By:{' '}
                        {addition.createdBy?.person
                          ? `${addition.createdBy.person.firstName} ${addition.createdBy.person.lastName}`
                          : addition.createdBy?.username || 'System'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => navigate(`/inventory/stock-additions/${addition.id}`)}
                          className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                          title="View addition details"
                        >
                          <Eye className="w-4 h-4 text-black dark:text-white" />
                        </button>

                        {/* Edit */}
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => onOpenEditModal?.(addition)}
                            className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                            title="Edit addition"
                          >
                            <Edit2 className="w-4 h-4 text-black dark:text-white" />
                          </button>
                        )}

                        {/* Delete / Archive */}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDeleteAddition?.(addition)}
                            className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                            title="Archive addition record"
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
      ) : (
        /* Grid / Cards View matching StocksTab */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((addition) => {
            const addedQty = Number(addition.addedQuantity) || 0;
            const isNegative = addedQty < 0;
            const prevTotal = Number(addition.previousTotalQty) || 0;
            const newTotal = Number(addition.currentTotalAvailableQty) || (prevTotal + addedQty);
            const badgeClass =
              REFERENCE_TYPE_BADGES[addition.referenceType] || REFERENCE_TYPE_BADGES.OTHER;

            return (
              <div
                key={addition.id}
                className="p-4 rounded-2xl border border-border bg-card hover:border-emerald-500/30 transition shadow-sm space-y-3"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-normal border mb-1.5 ${badgeClass}`}
                    >
                      <Tag className="w-3 h-3 opacity-70" />
                      <span>{REFERENCE_TYPE_LABELS[addition.referenceType] || addition.referenceType}</span>
                    </span>
                    <h4 className="text-sm font-normal text-foreground truncate">
                      {addition.product?.name || 'Product'}
                    </h4>
                    <p className="text-[11px] text-muted-foreground truncate">
                      SKU: {addition.product?.sku || 'N/A'} • {addition.warehouse?.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => onOpenEditModal?.(addition)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted800 transition"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDeleteAddition?.(addition)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Metric Strip matching StocksTab */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-muted900/40 border border-border/50 text-center">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Prev Total</span>
                    <span className="text-base font-normal font-mono text-muted-foreground">
                      {formatQty(prevTotal)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Added</span>
                    <span
                      className={`text-base font-semibold font-mono ${
                        isNegative ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isNegative ? '' : '+'}
                      {formatQty(addedQty)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">New Available</span>
                    <span className="text-base font-bold font-mono text-foreground">
                      {formatQty(newTotal)}
                    </span>
                  </div>
                </div>

                {/* Notes if available */}
                {addition.notes && (
                  <p className="text-xs text-muted-foreground italic truncate bg-muted900/30 px-2 py-1 rounded-lg">
                    &quot;{addition.notes}&quot;
                  </p>
                )}

                {/* Card Footer */}
                <div className="pt-2 flex items-center justify-between border-t border-border/40 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span className="truncate text-[11px]">
                      {formatDate(addition.addedAt || addition.createdAt)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/inventory/stock-additions/${addition.id}`)}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-xs font-normal text-black dark:text-white flex items-center justify-center transition shrink-0"
                    title="View details"
                  >
                    <Eye className="w-3.5 h-3.5 text-black dark:text-white" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Footer Ribbon matching design */}
      {filtered.length > 0 && (
        <div className="p-3.5 rounded-2xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{filtered.length}</span>
            <span>record{filtered.length !== 1 ? 's' : ''} shown</span>
            {stockAdditions.length !== filtered.length && (
              <span>(filtered from {stockAdditions.length} total)</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Net Quantity Added:</span>
            <strong className="font-mono text-foreground text-sm font-semibold">
              +{formatQty(totalAddedQty)} units
            </strong>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {detailAddition && (
        <Modal
          isOpen={Boolean(detailAddition)}
          onClose={() => setDetailAddition(null)}
          title="Stock Addition Record"
          subtitle={`Details of intake event recorded on ${formatDate(detailAddition.addedAt || detailAddition.createdAt)}`}
          icon={<PackagePlus className="w-5 h-5 text-emerald-400" />}
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-end w-full">
              <Button variant="outline" onClick={() => setDetailAddition(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Product & Warehouse Banner */}
            <div className="p-3 rounded-xl bg-muted900/40 border border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-medium text-foreground truncate">
                  {detailAddition.product?.name || 'Product'}
                </h4>
                <p className="text-muted-foreground">
                  SKU: {detailAddition.product?.sku || 'N/A'} • {detailAddition.warehouse?.name}
                </p>
              </div>
            </div>

            {/* Balances Grid */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-card border border-border text-center">
              <div>
                <span className="text-[10px] text-muted-foreground block">Previous Total</span>
                <span className="text-sm font-mono font-medium text-muted-foreground">
                  {formatQty(detailAddition.previousTotalQty)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Added Units</span>
                <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  +{formatQty(detailAddition.addedQuantity)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">New Available</span>
                <span className="text-sm font-mono font-bold text-foreground">
                  {formatQty(detailAddition.currentTotalAvailableQty)}
                </span>
              </div>
            </div>

            {/* Details List */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-400" />
                  Reason / Reference Type:
                </span>
                <span className="font-medium text-foreground">
                  {REFERENCE_TYPE_LABELS[detailAddition.referenceType] || detailAddition.referenceType}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <WarehouseIcon className="w-3.5 h-3.5 text-violet-400" />
                  Warehouse Location:
                </span>
                <span className="font-medium text-foreground">
                  {detailAddition.warehouse?.name}
                  {detailAddition.warehouse?.branch?.name ? ` (${detailAddition.warehouse.branch.name})` : ''}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Date & Time:
                </span>
                <span className="font-medium text-foreground">
                  {formatDate(detailAddition.addedAt || detailAddition.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  Logged By:
                </span>
                <span className="font-medium text-foreground">
                  {detailAddition.createdBy?.person
                    ? `${detailAddition.createdBy.person.firstName} ${detailAddition.createdBy.person.lastName}`
                    : detailAddition.createdBy?.username || 'System'}
                </span>
              </div>

              {detailAddition.warehouseStock && (
                <div className="grid grid-cols-2 gap-2 py-1.5">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Min Safety Stock:</span>
                    <strong className="font-mono text-foreground font-semibold">
                      {formatQty(detailAddition.warehouseStock.minimumStock)}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reorder Level:</span>
                    <strong className="font-mono text-foreground font-semibold">
                      {formatQty(detailAddition.warehouseStock.reorderLevel)}
                    </strong>
                  </div>
                </div>
              )}

              {detailAddition.notes && (
                <div className="pt-2">
                  <span className="text-muted-foreground block mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-violet-400" />
                    Notes & Reference Details:
                  </span>
                  <p className="p-2.5 rounded-xl bg-muted900/50 border border-border text-foreground leading-relaxed">
                    {detailAddition.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
