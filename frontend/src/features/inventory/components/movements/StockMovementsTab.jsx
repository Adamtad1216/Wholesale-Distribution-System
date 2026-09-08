import { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Warehouse as WarehouseIcon,
  Package,
  Layers,
  User,
  Calendar,
} from 'lucide-react';
import Button from '../../../../components/ui/Button';

export default function StockMovementsTab({
  movements = [],
  warehouses = [],
  products = [],
  loading = false,
  onRefresh,
}) {
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchSearch =
        !search ||
        m.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.product?.sku?.toLowerCase().includes(search.toLowerCase()) ||
        m.notes?.toLowerCase().includes(search.toLowerCase()) ||
        m.referenceType?.toLowerCase().includes(search.toLowerCase());

      const matchWh = !warehouseFilter || m.warehouseId === warehouseFilter;
      const matchType = !typeFilter || m.movementType === typeFilter;

      return matchSearch && matchWh && matchType;
    });
  }, [movements, search, warehouseFilter, typeFilter]);

  const getMovementBadge = (type) => {
    switch (type) {
      case 'PURCHASE_RECEIPT':
      case 'TRANSFER_IN':
      case 'ADJUSTMENT_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <ArrowDownLeft className="w-3 h-3" />
            <span>{type.replace('_', ' ')}</span>
          </span>
        );
      case 'SALES_FULFILLMENT':
      case 'TRANSFER_OUT':
      case 'ADJUSTMENT_OUT':
      case 'PURCHASE_RETURN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <ArrowUpRight className="w-3 h-3" />
            <span>{type.replace('_', ' ')}</span>
          </span>
        );
      case 'SALES_RESERVATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Layers className="w-3 h-3" />
            <span>RESERVED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30">
            <span>{type?.replace('_', ' ') || 'MOVEMENT'}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU, product name, reference..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-muted/40 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500 transition"
            />
          </div>

          {/* Warehouse Filter */}
          <div className="w-full sm:w-auto min-w-[180px]">
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground font-medium focus:outline-none focus:border-violet-500 transition"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}{w.branch?.name ? ` (${w.branch.name})` : (w.code ? ` (${w.code})` : '')}
                </option>
              ))}
            </select>
          </div>

          {/* Movement Type Filter */}
          <div className="w-full sm:w-auto min-w-[160px]">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground font-medium focus:outline-none focus:border-violet-500 transition"
            >
              <option value="">All Movement Types</option>
              <option value="ADJUSTMENT_IN">Addition / Adjustment In</option>
              <option value="ADJUSTMENT_OUT">Adjustment Out</option>
              <option value="TRANSFER_IN">Transfer In</option>
              <option value="TRANSFER_OUT">Transfer Out</option>
              <option value="SALES_RESERVATION">Sales Reservation</option>
              <option value="SALES_FULFILLMENT">Sales Fulfillment</option>
              <option value="PURCHASE_RECEIPT">Purchase Receipt</option>
              <option value="PURCHASE_RETURN">Purchase Return</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Movements Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 border-b border-border text-foreground font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Product</th>
                <th className="px-4 py-3.5">Warehouse Depot</th>
                <th className="px-4 py-3.5">Movement Type</th>
                <th className="px-4 py-3.5 text-right">Quantity</th>
                <th className="px-4 py-3.5">Reference / Notes</th>
                <th className="px-4 py-3.5">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading stock movement history...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <History className="w-8 h-8 text-muted-foreground/50" />
                      <span className="font-semibold text-foreground">No stock movement history found</span>
                      <span className="text-[11px]">Stock movements will be logged automatically on inventory additions, adjustments, and transfers.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const creatorName = m.createdBy?.person
                    ? `${m.createdBy.person.firstName || ''} ${m.createdBy.person.lastName || ''}`.trim()
                    : m.createdBy?.username || 'System';

                  const branchName = m.warehouse?.branch?.name;

                  return (
                    <tr key={m.id} className="hover:bg-muted/40 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-violet-500" />
                          <span>{new Date(m.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <div>
                            <span className="font-bold text-foreground block">
                              {m.product?.name || 'Product'}
                            </span>
                            {m.product?.sku && (
                              <span className="text-[10px] font-mono text-muted-foreground">
                                SKU: {m.product.sku}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <WarehouseIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-foreground">
                            {m.warehouse?.name || 'Warehouse'}
                            {branchName ? ` (${branchName})` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getMovementBadge(m.movementType)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap text-foreground text-sm">
                        {Number(m.quantity) > 0 ? `+${Number(m.quantity)}` : Number(m.quantity)}
                        {m.product?.unit?.abbreviation ? ` ${m.product.unit.abbreviation}` : ''}
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">
                        {m.notes || m.referenceType || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{creatorName}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
