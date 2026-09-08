import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Warehouse as WarehouseIcon,
  Package,
  Sliders,
  ArrowLeftRight,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  BarChart3,
} from 'lucide-react';

import { inventoryApi } from '../inventoryApi';
import { usePermission } from '../../../hooks/usePermission';
import Button from '../../../components/ui/Button';
import StockFormModal from '../components/stocks/StockFormModal';

export default function StockDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { can: canUpdate } = usePermission('inventory:stock:update');

  const fetchStock = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await inventoryApi.getStockById(id);
      const data = res?.data || res;
      setStock(data);
    } catch (err) {
      toast.error(err?.message || 'Failed to load stock detail');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const handleUpdateStock = async (formData) => {
    if (!stock) return;
    setSubmitting(true);
    try {
      await inventoryApi.updateStock(stock.id, formData);
      toast.success('Stock thresholds and balance updated');
      setIsEditModalOpen(false);
      fetchStock();
    } catch (err) {
      toast.error(err?.message || 'Failed to update stock');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground">Loading facility stock balance...</p>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 my-12">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Stock Record Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The requested warehouse stock balance record does not exist or has been removed.
        </p>
        <Button variant="outline" onClick={() => navigate('/inventory?tab=stocks')}>
          Back to Warehouse Stocks
        </Button>
      </div>
    );
  }

  const avail = Number(stock.availableQuantity) || 0;
  const reserved = Number(stock.reservedQuantity) || 0;
  const total = Number(stock.quantity) || 0;
  const min = Number(stock.minimumStock) || 0;
  const reorder = Number(stock.reorderLevel) || 0;

  // Stock health computation
  let health = {
    label: 'Optimal Balance',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-500',
    icon: <CheckCircle2 className="w-4 h-4" />,
    description: 'Current inventory level exceeds replenishment thresholds. No immediate procurement needed.',
  };

  if (avail <= 0) {
    health = {
      label: 'Out of Stock',
      badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      dotClass: 'bg-rose-500',
      icon: <XCircle className="w-4 h-4" />,
      description: 'Zero available stock in this facility depot. Sales orders cannot be fulfilled from this depot.',
    };
  } else if (avail <= min) {
    health = {
      label: 'Critical Safety Deficit',
      badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      dotClass: 'bg-rose-500 animate-ping',
      icon: <AlertCircle className="w-4 h-4" />,
      description: 'Inventory has dropped below the minimum safety buffer. Urgent replenishment recommended.',
    };
  } else if (avail <= reorder) {
    health = {
      label: 'Reorder Point Reached',
      badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      dotClass: 'bg-amber-500 animate-pulse',
      icon: <AlertTriangle className="w-4 h-4" />,
      description: 'Stock is at or below the reorder trigger. Dispatch an inter-warehouse transfer or purchase order.',
    };
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
      {/* Top Header / Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory?tab=stocks')}
            className="p-2 rounded-xl bg-card border border-border hover:bg-muted800 text-muted-foreground hover:text-foreground transition"
            title="Back to Stocks"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted800 text-muted-foreground border border-border">
                {stock.warehouse?.name || 'Warehouse Depot'}
                {stock.warehouse?.branch?.name ? ` (${stock.warehouse.branch.name})` : ''}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${health.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${health.dotClass}`} />
                <span>{health.label}</span>
              </span>
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight mt-1 flex items-center gap-2">
              <Package className="w-6 h-6 text-violet-400" />
              <span>{stock.product?.name || 'Inventory Product'}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Button variant="outline" size="sm" onClick={fetchStock} className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          {stock.productId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/products/${stock.productId}`)}
              className="flex items-center gap-1.5"
            >
              <span>Product Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}

          {canUpdate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 shadow-lg shadow-violet-500/20"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Thresholds</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stock Health Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${health.badgeClass} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-background/50 border border-current flex items-center justify-center shrink-0">
            {health.icon}
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Stock Assessment: {health.label}</h4>
            <p className="text-xs opacity-90">{health.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/inventory?tab=transfers`)}
            className="text-xs flex items-center gap-1.5 bg-background/40"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transfer Stock</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/inventory?tab=adjustments`)}
            className="text-xs flex items-center gap-1.5 bg-background/40"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Audit Count</span>
          </Button>
        </div>
      </div>

      {/* Primary Inventory Balances Grid (Wide) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Available Qty */}
        <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
            Available For Sale
          </span>
          <span className="text-3xl font-black text-emerald-400 block font-mono">
            {avail.toLocaleString()}
          </span>
          <span className="text-[11px] text-muted-foreground">Uncommitted physical units</span>
        </div>

        {/* Reserved Qty */}
        <div className="p-5 rounded-2xl border border-sky-500/20 bg-sky-500/5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block">
            Reserved / Allocated
          </span>
          <span className="text-3xl font-black text-sky-400 block font-mono">
            {reserved.toLocaleString()}
          </span>
          <span className="text-[11px] text-muted-foreground">Held for pending sales orders</span>
        </div>

        {/* Total Qty On Hand */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
            Total Facility On Hand
          </span>
          <span className="text-3xl font-black text-foreground block font-mono">
            {total.toLocaleString()}
          </span>
          <span className="text-[11px] text-muted-foreground">Available + Reserved units</span>
        </div>

        {/* Reorder Level */}
        <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
            Reorder Threshold
          </span>
          <span className="text-3xl font-black text-amber-400 block font-mono">
            {reorder.toLocaleString()}
          </span>
          <span className="text-[11px] text-muted-foreground">Restock trigger point</span>
        </div>

        {/* Minimum Stock */}
        <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block">
            Minimum Safety Stock
          </span>
          <span className="text-3xl font-black text-rose-400 block font-mono">
            {min.toLocaleString()}
          </span>
          <span className="text-[11px] text-muted-foreground">Absolute critical threshold</span>
        </div>
      </div>

      {/* Facility & Catalog Item Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Depot Facility Details */}
        <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border/80 pb-3">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <WarehouseIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Depot Facility Profile</h3>
              <p className="text-[11px] text-muted-foreground">Operating warehouse storing this inventory item</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
              <span className="text-[10px] text-muted-foreground block mb-0.5">Facility Name</span>
              <strong className="text-foreground">
                {stock.warehouse?.name || '—'}
                {stock.warehouse?.branch?.name ? ` (${stock.warehouse.branch.name})` : ''}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
              <span className="text-[10px] text-muted-foreground block mb-0.5">Facility Code</span>
              <strong className="font-mono text-foreground">{stock.warehouse?.code || '—'}</strong>
            </div>

            <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
              <span className="text-[10px] text-muted-foreground block mb-0.5">Facility Record ID</span>
              <span className="font-mono text-[11px] text-muted-foreground truncate block">
                {stock.warehouseId}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
              <span className="text-[10px] text-muted-foreground block mb-0.5">Depot Operational Status</span>
              <span className="font-bold text-emerald-400">Active Distribution Depot</span>
            </div>
          </div>
        </div>

        {/* Catalog Item Details */}
        <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border/80 pb-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Catalog Product Attributes</h3>
              <p className="text-[11px] text-muted-foreground">Base product unit specifications and identifier</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
              <span className="text-[10px] text-muted-foreground block mb-0.5">Catalog Title</span>
              <strong className="text-foreground truncate block">{stock.product?.name || '—'}</strong>
            </div>

            <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
              <span className="text-[10px] text-muted-foreground block mb-0.5">SKU Identifier</span>
              <strong className="font-mono text-foreground">{stock.product?.sku || '—'}</strong>
            </div>

            <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
              <span className="text-[10px] text-muted-foreground block mb-0.5">Measurement Unit</span>
              <strong className="text-foreground">
                {stock.product?.unit?.name || 'Standard Unit'}
                {stock.product?.unit?.abbreviation ? ` (${stock.product.unit.abbreviation})` : ''}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
              <span className="text-[10px] text-muted-foreground block mb-0.5">Product Detail Link</span>
              <Link
                to={`/products/${stock.productId}`}
                className="text-violet-400 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Open Full Page</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Thresholds Modal */}
      <StockFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateStock}
        stock={stock}
        warehouses={stock.warehouse ? [stock.warehouse] : []}
        products={stock.product ? [stock.product] : []}
        submitting={submitting}
      />
    </div>
  );
}
