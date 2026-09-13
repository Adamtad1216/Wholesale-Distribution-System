import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Warehouse as WarehouseIcon,
  Package,
  PackagePlus,
  Edit2,
  Trash2,
  RefreshCw,
  ExternalLink,
  Calendar,
  User,
  Tag,
  FileText,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  RotateCcw,
  Layers,
  Building2,
  Clock,
} from 'lucide-react';

import { inventoryApi } from '../inventoryApi';
import { usePermission } from '../../../hooks/usePermission';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import StockAdditionFormModal from '../components/stock-additions/StockAdditionFormModal';
import ProductThumbnail from '../components/ProductThumbnail';

const REFERENCE_TYPE_LABELS = {
  MANUAL_INTAKE: 'Manual Intake / Replenishment',
  PURCHASE_RECEIPT: 'Purchase Order Receipt',
  GOODS_RECEIPT: 'Goods Receipt',
  ADJUSTMENT: 'Inventory Adjustment',
  INITIAL_STOCK: 'Initial Stock Balance',
  TRANSFER: 'Inter-Warehouse Transfer',
  TRANSFER_HOLD: 'Transfer Hold',
  TRANSFER_HOLD_REVERSAL: 'Transfer Hold Reversal',
  TRANSFER_REVERSAL: 'Transfer Reversal',
  OTHER: 'Other Stock Addition',
};

const REFERENCE_TYPE_BADGES = {
  MANUAL_INTAKE: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  PURCHASE_RECEIPT: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  GOODS_RECEIPT: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  ADJUSTMENT: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  INITIAL_STOCK: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  TRANSFER: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  OTHER: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

export default function StockAdditionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [addition, setAddition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { can: canUpdate } = usePermission('inventory:stock-additions:update');
  const { can: canDelete } = usePermission('inventory:stock-additions:delete');

  const fetchAddition = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await inventoryApi.getStockAdditionById(id);
      const data = res?.data || res;
      setAddition(data);
    } catch (err) {
      toast.error(err?.message || 'Failed to load stock addition record');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAddition();
  }, [fetchAddition]);

  const handleUpdateAddition = async (formData) => {
    if (!addition) return;
    setSubmitting(true);
    try {
      await inventoryApi.updateStockAddition(addition.id, formData);
      toast.success('Stock addition updated successfully');
      setIsEditModalOpen(false);
      fetchAddition();
    } catch (err) {
      toast.error(err?.message || 'Failed to update stock addition');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddition = async () => {
    if (!addition) return;
    setDeleting(true);
    try {
      await inventoryApi.deleteStockAddition(addition.id);
      toast.success('Stock addition archived');
      setIsDeleteModalOpen(false);
      navigate('/inventory?tab=stock-additions');
    } catch (err) {
      toast.error(err?.message || 'Failed to archive stock addition');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground">Loading stock addition record...</p>
      </div>
    );
  }

  if (!addition) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 my-12">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <PackagePlus className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-normal text-foreground">Stock Addition Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The requested stock addition ledger entry does not exist or has been archived.
        </p>
        <Button variant="outline" onClick={() => navigate('/inventory?tab=stock-additions')}>
          Back to Stock Additions
        </Button>
      </div>
    );
  }

  const prevTotal = Number(addition.previousTotalQty) || 0;
  const addedQty = Number(addition.addedQuantity) || 0;
  const newTotal = Number(addition.currentTotalAvailableQty) || (prevTotal + addedQty);
  const isNegative = addedQty < 0;

  const minStock = Number(addition.warehouseStock?.minimumStock) || 0;
  const reorderLevel = Number(addition.warehouseStock?.reorderLevel) || 0;

  const creatorName = addition.createdBy?.person
    ? `${addition.createdBy.person.firstName} ${addition.createdBy.person.lastName}`.trim()
    : addition.createdBy?.username || 'System Administrator';

  const updaterName = addition.updatedBy?.person
    ? `${addition.updatedBy.person.firstName} ${addition.updatedBy.person.lastName}`.trim()
    : addition.updatedBy?.username;

  const refBadge = REFERENCE_TYPE_BADGES[addition.referenceType] || REFERENCE_TYPE_BADGES.OTHER;
  const refLabel = REFERENCE_TYPE_LABELS[addition.referenceType] || addition.referenceType || 'Manual Intake';

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
      {/* Top Header / Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory?tab=stock-additions')}
            className="p-2 rounded-xl bg-card border border-border hover:bg-muted text-black dark:text-white transition"
            title="Back to Stock Additions"
          >
            <ArrowLeft className="w-4 h-4 text-black dark:text-white" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-normal border ${refBadge}`}>
                <Tag className="w-3 h-3" />
                <span>{refLabel}</span>
              </span>
              <span className="font-mono text-xs font-normal px-2 py-0.5 rounded-md bg-muted800 text-muted-foreground border border-border">
                {addition.warehouse?.name || 'Warehouse Depot'}
              </span>
            </div>
            <div className="flex items-center gap-3.5 mt-2">
              <ProductThumbnail product={addition.product} size="lg" className="rounded-2xl shadow-sm border border-border" />
              <div>
                <h1 className="text-2xl font-normal text-foreground tracking-tight">
                  Stock Addition: {addition.product?.name || 'Inventory Product'}
                </h1>
                {addition.product?.sku && (
                  <span className="text-xs font-mono text-muted-foreground">
                    SKU: {addition.product.sku}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAddition}
            className="flex items-center gap-1.5 text-black dark:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5 text-black dark:text-white" />
            <span>Refresh</span>
          </Button>

          {addition.productId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/products/${addition.productId}`)}
              className="flex items-center gap-1.5 text-black dark:text-white"
            >
              <span>Product Page</span>
              <ExternalLink className="w-3.5 h-3.5 text-black dark:text-white" />
            </Button>
          )}

          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 text-black dark:text-white"
            >
              <Edit2 className="w-3.5 h-3.5 text-black dark:text-white" />
              <span>Edit Record</span>
            </Button>
          )}

          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-1.5 text-black dark:text-white hover:bg-muted"
            >
              <Trash2 className="w-3.5 h-3.5 text-black dark:text-white" />
              <span>Archive</span>
            </Button>
          )}
        </div>
      </div>

      {/* Intake Event Assessment Banner */}
      <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            {isNegative ? <TrendingDown className="w-5 h-5 text-rose-500" /> : <TrendingUp className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>{isNegative ? 'Inventory Deduction Entry' : 'Verified Stock Intake Entry'}</span>
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                {isNegative ? '' : '+'}{addedQty.toLocaleString()} units
              </span>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Logged on {formatDate(addition.addedAt || addition.createdAt)} by <span className="text-foreground font-medium">{creatorName}</span>
              {addition.referenceType ? ` via ${refLabel}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/inventory?tab=stocks')}
            className="text-xs flex items-center gap-1.5 bg-background/50 text-black dark:text-white"
          >
            <WarehouseIcon className="w-3.5 h-3.5 text-black dark:text-white" />
            <span>View Warehouse Stock</span>
          </Button>
        </div>
      </div>

      {/* Primary Inventory Balances Grid (Wide) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Previous Total Available */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-normal text-muted-foreground tracking-wider block">
            Previous Available Total
          </span>
          <span className="text-3xl font-normal text-muted-foreground block font-mono">
            {prevTotal.toLocaleString()}
          </span>
          <span className="text-[11px] text-muted-foreground">Running balance before addition</span>
        </div>

        {/* Added Quantity */}
        <div className={`p-5 rounded-2xl border shadow-sm space-y-1 ${
          isNegative
            ? 'border-rose-500/30 bg-rose-500/5'
            : 'border-emerald-500/30 bg-emerald-500/5'
        }`}>
          <span className={`text-[10px] uppercase font-normal tracking-wider block ${
            isNegative ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {isNegative ? 'Units Deducted' : 'Units Added (+)'}
          </span>
          <span className={`text-3xl font-bold block font-mono ${
            isNegative ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {isNegative ? '' : '+'}{addedQty.toLocaleString()}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {addition.product?.unit?.abbreviation ? `in ${addition.product.unit.abbreviation}` : 'physical count units'}
          </span>
        </div>

        {/* New Running Available Balance */}
        <div className="p-5 rounded-2xl border border-emerald-500/20 bg-card shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-normal text-foreground tracking-wider block">
            New Available Balance
          </span>
          <span className="text-3xl font-bold text-foreground block font-mono">
            {newTotal.toLocaleString()}
          </span>
          <span className="text-[11px] text-muted-foreground">Available balance after intake</span>
        </div>

        {/* Warehouse Reorder Level */}
        <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-medium text-amber-700 dark:text-amber-400 tracking-wider block">
            Reorder Alert Threshold
          </span>
          <span className="text-3xl font-medium text-amber-700 dark:text-amber-400 block font-mono">
            {reorderLevel > 0 ? reorderLevel.toLocaleString() : 'Unset'}
          </span>
          <span className="text-[11px] text-muted-foreground">Depot restock trigger level</span>
        </div>

        {/* Minimum Safety Stock */}
        <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-medium text-rose-700 dark:text-rose-400 tracking-wider block">
            Minimum Safety Stock
          </span>
          <span className="text-3xl font-medium text-rose-700 dark:text-rose-400 block font-mono">
            {minStock > 0 ? minStock.toLocaleString() : 'Unset'}
          </span>
          <span className="text-[11px] text-muted-foreground">Critical depot buffer reserve</span>
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
              <h3 className="text-sm font-normal text-foreground">Depot Facility Profile</h3>
              <p className="text-[11px] text-muted-foreground">Operating warehouse receiving this inventory addition</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
              <span className="text-[10px] text-muted-foreground block mb-0.5">Facility Name</span>
              <span className="text-foreground font-normal">
                {addition.warehouse?.name || '—'}
                {addition.warehouse?.branch?.name ? ` (${addition.warehouse.branch.name})` : ''}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
              <span className="text-[10px] text-muted-foreground block mb-0.5">Facility Code</span>
              <span className="font-mono text-foreground font-normal">{addition.warehouse?.code || '—'}</span>
            </div>

            <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
              <span className="text-[10px] text-muted-foreground block mb-0.5">Branch Location</span>
              <span className="text-foreground font-normal truncate block">
                {addition.warehouse?.branch?.name || 'Main Regional Branch'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
              <span className="text-[10px] text-muted-foreground block mb-0.5">Depot Operational Status</span>
              <span className="font-normal text-emerald-400">Active Intake Depot</span>
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
              <h3 className="text-sm font-normal text-foreground">Catalog Product Attributes</h3>
              <p className="text-[11px] text-muted-foreground">Product specifications, unit of measure, and identifier</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <ProductThumbnail product={addition.product} size="xl" className="rounded-2xl shadow-sm border border-border/80" />
            <div className="grid grid-cols-2 gap-3 text-xs flex-1 w-full">
              <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Catalog Title</span>
                <span className="text-foreground truncate block font-normal">{addition.product?.name || '—'}</span>
              </div>

              <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
                <span className="text-[10px] text-muted-foreground block mb-0.5">SKU Identifier</span>
                <span className="font-mono text-foreground font-normal">{addition.product?.sku || '—'}</span>
              </div>

              <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Measurement Unit</span>
                <span className="text-foreground font-normal">
                  {addition.product?.unit?.name || 'Standard Unit'}
                  {addition.product?.unit?.abbreviation ? ` (${addition.product.unit.abbreviation})` : ''}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Product Detail Link</span>
                <Link
                  to={`/products/${addition.productId}`}
                  className="text-black dark:text-white hover:underline font-normal flex items-center gap-1"
                >
                  <span>Open Full Page</span>
                  <ExternalLink className="w-3 h-3 text-black dark:text-white" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Intake Audit & Provenance Details */}
      <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-border/80 pb-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-normal text-foreground">Intake Audit & Provenance Records</h3>
            <p className="text-[11px] text-muted-foreground">Historical traceability, timestamp, and audit trail for this addition</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
            <span className="text-[10px] text-muted-foreground block mb-0.5">Intake Timestamp</span>
            <span className="text-foreground font-normal flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{formatDate(addition.addedAt || addition.createdAt)}</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
            <span className="text-[10px] text-muted-foreground block mb-0.5">Logged By User</span>
            <span className="text-foreground font-normal flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{creatorName}</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
            <span className="text-[10px] text-muted-foreground block mb-0.5">Reference Document / Batch</span>
            <span className="font-mono text-foreground font-normal">
              {!addition.referenceId
                ? 'Direct Manual Entry'
                : /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(addition.referenceId)
                ? `${refLabel} Entry`
                : addition.referenceId}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
            <span className="text-[10px] text-muted-foreground block mb-0.5">Last Record Update</span>
            <span className="text-foreground font-normal flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{addition.updatedAt ? formatDate(addition.updatedAt) : 'Never updated'}</span>
            </span>
            {updaterName && (
              <span className="text-[10px] text-muted-foreground block mt-0.5">by {updaterName}</span>
            )}
          </div>
        </div>

        {/* Intake Notes Card */}
        {addition.notes && (
          <div className="p-4 rounded-2xl bg-muted900/30 border border-border/80 text-xs">
            <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider block mb-1">
              Intake Notes & Observations
            </span>
            <p className="text-foreground text-sm font-normal italic leading-relaxed">
              &quot;{addition.notes}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Edit Addition Modal */}
      {isEditModalOpen && (
        <StockAdditionFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateAddition}
          initialData={addition}
          warehouses={addition.warehouse ? [addition.warehouse] : []}
          products={addition.product ? [addition.product] : []}
          isSubmitting={submitting}
        />
      )}

      {/* Confirm Archive / Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Archive Stock Addition"
        subtitle="Remove this addition record and rebalance subsequent quantities"
        icon={<Trash2 className="w-5 h-5 text-rose-500" />}
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteAddition} disabled={deleting}>
              {deleting ? 'Archiving...' : 'Confirm Archive'}
            </Button>
          </div>
        }
      >
        <div className="p-3 text-xs text-muted-foreground leading-relaxed space-y-2">
          <p>
            Are you sure you want to archive this stock addition of{' '}
            <strong className="text-foreground font-semibold">
              {addedQty > 0 ? `+${addedQty}` : addedQty} units
            </strong>{' '}
            for <strong className="text-foreground font-semibold">{addition.product?.name}</strong>?
          </p>
          <p className="text-amber-600 dark:text-amber-400 font-medium">
            Note: Archiving this record will automatically adjust and cascade running balances for all subsequent addition records for this item.
          </p>
        </div>
      </Modal>
    </div>
  );
}
