import { useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
  LayoutGrid,
  List,
  ArrowLeftRight,
  Sliders,
  Warehouse as WarehouseIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../../components/ui/Button';

export default function StocksTab({
  stocks = [],
  warehouses = [],
  loading = false,
  selectedWarehouseId = '',
  onWarehouseChange,
  search = '',
  onSearchChange,
  lowStockOnly = false,
  onLowStockToggle,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteStock,
  onQuickTransfer,
  onQuickAdjust,
  canCreate = true,
  canUpdate = true,
  canDelete = true,
}) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Determine stock health badge & color
  const getStockHealth = (stock) => {
    const available = Number(stock.availableQuantity) || 0;
    const reorder = Number(stock.reorderLevel) || 0;
    const min = Number(stock.minimumStock) || 0;

    if (available <= 0) {
      return {
        label: 'Out of Stock',
        badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
        dotClass: 'bg-rose-500',
        progressClass: 'bg-rose-500',
        icon: <XCircle className="w-3.5 h-3.5" />,
      };
    }
    if (min > 0 && available <= min) {
      return {
        label: 'Critical Low',
        badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
        dotClass: 'bg-rose-500 animate-ping',
        progressClass: 'bg-rose-500',
        icon: <AlertCircle className="w-3.5 h-3.5" />,
      };
    }
    if (reorder > 0 && available <= reorder) {
      return {
        label: 'Reorder Needed',
        badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
        dotClass: 'bg-amber-500 animate-pulse',
        progressClass: 'bg-amber-500',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
      };
    }
    return {
      label: 'Optimal Level',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      dotClass: 'bg-emerald-500',
      progressClass: 'bg-emerald-500',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    };
  };

  // Count low stock items for alert banner (only when reorder level or min stock is configured by user)
  const lowStockCount = stocks.filter((s) => {
    const avail = Number(s.availableQuantity) || 0;
    const reorder = Number(s.reorderLevel) || 0;
    const min = Number(s.minimumStock) || 0;
    return (reorder > 0 && avail <= reorder) || (min > 0 && avail <= min);
  }).length;

  return (
    <div className="space-y-4">
      {/* Low Stock Warning Banner if items need attention */}
      {lowStockCount > 0 && !lowStockOnly && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-normal text-amber-950 dark:text-amber-100">
                Low Inventory Alert: {lowStockCount} item{lowStockCount > 1 ? 's are' : ' is'} at or below reorder threshold
              </p>
              <p className="text-xs text-amber-900/80 dark:text-amber-300/80 font-medium">
                Stock levels require purchase procurement or inter-warehouse transfer rebalancing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLowStockToggle}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-normal text-amber-950 dark:text-amber-100 transition shrink-0 self-start sm:self-auto"
          >
            Show Low Stock Items ({lowStockCount})
          </button>
        </div>
      )}

      {/* Filter & Action Toolbar */}
      <div className="p-4 rounded-2xl border border-border bg-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Search & Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search product or SKU..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500 transition"
            />
            {search && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
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

          {/* Low Stock Filter Button */}
          <button
            type="button"
            onClick={onLowStockToggle}
            className={`px-3 py-2 rounded-xl border text-xs font-normal flex items-center gap-1.5 transition ${lowStockOnly
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-800 dark:text-amber-200 font-medium'
              : 'bg-muted800/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted800'
              }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Only</span>
            {lowStockCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-200">
                {lowStockCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: View Toggle & Add Button */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          {/* View mode toggle */}
          <div className="flex items-center p-1 rounded-xl bg-muted900/60 border border-border">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition ${viewMode === 'table'
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
              className={`p-1.5 rounded-lg text-xs transition ${viewMode === 'grid'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Add Stock Button */}
          {canCreate && (
            <Button
              variant="primary"
              onClick={onOpenCreateModal}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stock Item</span>
            </Button>
          )}
        </div>
      </div>

      {/* Loading Skeleton or Content */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl border border-border bg-card space-y-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Loading warehouse stock levels...</p>
        </div>
      ) : stocks.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-border bg-card flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-muted800 border border-border flex items-center justify-center text-muted-foreground">
            <Package className="w-7 h-7 opacity-100" />
          </div>
          <h3 className="text-base font-normal text-foreground">No Stock Records Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            {search || selectedWarehouseId || lowStockOnly
              ? 'No warehouse stock matches your search filters. Try resetting the filters.'
              : 'Start tracking inventory by creating your first product stock entry for a warehouse.'}
          </p>
          {canCreate && (
            <Button
              variant="outline"
              onClick={onOpenCreateModal}
              className="mt-2 text-xs"
            >
              Add Stock Entry
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted900/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-normal">Product / SKU</th>
                <th className="py-3 px-4 font-normal">Warehouse</th>
                <th className="py-3 px-4 font-normal">Status</th>
                <th className="py-3 px-4 font-normal text-right">Available</th>
                <th className="py-3 px-4 font-normal text-right">Reserved</th>
                <th className="py-3 px-4 font-normal text-right">Total On Hand</th>
                <th className="py-3 px-4 font-normal text-right">Reorder / Min</th>
                <th className="py-3 px-4 font-normal text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {stocks.map((stock) => {
                const health = getStockHealth(stock);
                const avail = Number(stock.availableQuantity) || 0;
                const total = Number(stock.quantity) || 0;
                const reserved = Number(stock.reservedQuantity) || 0;
                const reorder = Number(stock.reorderLevel) || 0;
                const min = Number(stock.minimumStock) || 0;

                return (
                  <tr
                    key={stock.id}
                    className="hover:bg-muted800/40 transition-colors group"
                  >
                    {/* Product Name & SKU */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-normal text-foreground block truncate">
                            {stock.product?.name || 'Unknown Product'}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                            {stock.product?.sku && (
                              <span className="font-mono bg-muted800 px-1.5 py-0.2 rounded text-[10px]">
                                {stock.product.sku}
                              </span>
                            )}
                            {stock.product?.unit?.name && (
                              <span>• {stock.product.unit.name}</span>
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
                          {stock.warehouse?.name || 'Warehouse'}
                          {stock.warehouse?.branch?.name ? ` (${stock.warehouse.branch.name})` : ''}
                        </span>
                      </div>
                      {stock.warehouse?.code && (
                        <span className="text-[10px] text-muted-foreground">
                          Code: {stock.warehouse.code}
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-normal border ${health.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${health.dotClass}`} />
                        <span>{health.label}</span>
                      </span>
                    </td>

                    {/* Available Quantity */}
                    <td className="py-3.5 px-4 text-right font-normal text-sm text-foreground">
                      {avail.toLocaleString()}
                    </td>

                    {/* Reserved Quantity */}
                    <td className="py-3.5 px-4 text-right text-muted-foreground font-normal">
                      {reserved > 0 ? (
                        <span className="text-cyan-600 dark:text-cyan-400 font-medium">
                          {reserved.toLocaleString()}
                        </span>
                      ) : (
                        '0'
                      )}
                    </td>

                    {/* Total Quantity */}
                    <td className="py-3.5 px-4 text-right font-normal text-foreground">
                      {total.toLocaleString()}
                    </td>

                    {/* Reorder / Min Stock */}
                    <td className="py-3.5 px-4 text-right">
                      {reorder > 0 || min > 0 ? (
                        <div className="inline-flex items-center justify-end gap-1.5 font-mono text-xs">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30"
                            title={`Reorder Point: ${reorder > 0 ? reorder.toLocaleString() : 'Unset'}`}
                          >
                            {reorder > 0 ? reorder.toLocaleString() : '—'}
                          </span>
                          <span className="text-slate-400 dark:text-slate-500 font-bold">/</span>
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-rose-700 dark:text-rose-300 bg-rose-500/15 border border-rose-500/30"
                            title={`Minimum Safety Stock: ${min > 0 ? min.toLocaleString() : 'Unset'}`}
                          >
                            {min > 0 ? min.toLocaleString() : '—'}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                          Unset
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => navigate(`/inventory/stocks/${stock.id}`)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 transition"
                          title="View complete stock details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Quick Transfer */}
                        <button
                          type="button"
                          onClick={() => onQuickTransfer && onQuickTransfer(stock)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted800 transition"
                          title="Transfer stock to another warehouse"
                        >
                          <ArrowLeftRight className="w-4 h-4" />
                        </button>

                        {/* Quick Adjust */}
                        <button
                          type="button"
                          onClick={() => onQuickAdjust && onQuickAdjust(stock)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted800 transition"
                          title="Stock Adjustment / Count audit"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>

                        {/* Edit thresholds */}
                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => onOpenEditModal(stock)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted800 transition"
                            title="Edit thresholds & quantity"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete/Archive */}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDeleteStock(stock)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted800 transition"
                            title="Archive Stock"
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
      ) : (
        /* Grid / Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stocks.map((stock) => {
            const health = getStockHealth(stock);
            const avail = Number(stock.availableQuantity) || 0;
            const total = Number(stock.quantity) || 0;
            const reserved = Number(stock.reservedQuantity) || 0;
            const reorder = Number(stock.reorderLevel) || 0;
            const min = Number(stock.minimumStock) || 0;

            return (
              <div
                key={stock.id}
                className="p-4 rounded-2xl border border-border bg-card hover:border-violet-500/30 transition shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-normal border mb-1.5 ${health.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${health.dotClass}`} />
                      <span>{health.label}</span>
                    </span>
                    <h4 className="text-sm font-normal text-foreground truncate">
                      {stock.product?.name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      SKU: {stock.product?.sku || 'N/A'} • {stock.warehouse?.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => onOpenEditModal(stock)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted800 transition"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDeleteStock(stock)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted800 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Metric Strip */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-muted900/40 border border-border/50 text-center">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Available</span>
                    <span className="text-base font-normal text-foreground">
                      {avail.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Reserved</span>
                    <span className="text-base font-medium text-cyan-600 dark:text-cyan-400">
                      {reserved.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Total</span>
                    <span className="text-base font-normal text-foreground">
                      {total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Progress Level */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      Reorder:{' '}
                      <strong className="font-semibold text-amber-700 dark:text-amber-400">
                        {reorder > 0 ? reorder.toLocaleString() : 'Unset'}
                      </strong>
                    </span>
                    <span className="text-muted-foreground">
                      Safety Buffer:{' '}
                      <strong className="font-semibold text-rose-700 dark:text-rose-400">
                        {min > 0 ? min.toLocaleString() : 'Unset'}
                      </strong>
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${health.progressClass}`}
                      style={{
                        width: `${Math.min(100, Math.max(8, reorder > 0 ? (avail / reorder) * 100 : 100))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="pt-1 flex items-center gap-2 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => navigate(`/inventory/stocks/${stock.id}`)}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted800 text-xs font-normal text-muted-foreground hover:text-foreground flex items-center justify-center transition shrink-0"
                    title="View complete stock details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickTransfer && onQuickTransfer(stock)}
                    className="flex-1 py-1.5 rounded-lg border border-border hover:border-sky-500/40 hover:bg-sky-500/10 text-xs font-normal text-muted-foreground hover:text-sky-300 flex items-center justify-center gap-1.5 transition"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>Transfer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickAdjust && onQuickAdjust(stock)}
                    className="flex-1 py-1.5 rounded-lg border border-border hover:border-violet-500/40 hover:bg-violet-500/10 text-xs font-normal text-muted-foreground hover:text-violet-300 flex items-center justify-center gap-1.5 transition"
                    acity                  >
                    <Sliders className="w-3 h-3" />
                    <span>Audit Count</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

