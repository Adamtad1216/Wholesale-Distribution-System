import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  BookmarkCheck,
  Warehouse as WarehouseIcon,
  Package,
  FileText,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Building2,
  TrendingDown,
  Layers,
} from 'lucide-react';

import { inventoryApi } from '../inventoryApi';
import { usePermission } from '../../../hooks/usePermission';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';

export default function ReservationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('');

  const { can: canApprove } = usePermission([
    'inventory:reservations:approve',
    'reservations:approve',
    'inventory:reservations:release',
    'ADMIN',
    'SALES_MANAGER',
  ]);

  const fetchReservation = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await inventoryApi.getReservationById(id);
      const data = res?.data || res;
      setReservation(data);
    } catch (err) {
      toast.error(err?.message || 'Failed to load stock reservation record');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  const handleConfirmFulfill = async () => {
    if (!reservation) return;
    setProcessing(true);
    try {
      await inventoryApi.approveReservation(reservation.id, {
        action: 'APPROVE',
        status: 'FULFILLED',
      });
      toast.success('Stock reservation confirmed and allocated successfully');
      fetchReservation();
    } catch (err) {
      toast.error(err?.message || 'Failed to confirm reservation allocation');
    } finally {
      setProcessing(false);
    }
  };

  const handleReleaseReservation = async () => {
    if (!reservation) return;
    setProcessing(true);
    try {
      await inventoryApi.approveReservation(reservation.id, {
        action: 'REJECT',
        status: 'RELEASED',
        notes: releaseNotes.trim() || undefined,
      });
      toast.success('Reserved stock released back to available inventory');
      setIsReleaseModalOpen(false);
      setReleaseNotes('');
      fetchReservation();
    } catch (err) {
      toast.error(err?.message || 'Failed to release reservation');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground">Loading stock reservation details...</p>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 my-12">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <BookmarkCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Stock Reservation Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The requested stock reservation record does not exist or has been removed.
        </p>
        <Button variant="outline" onClick={() => navigate('/inventory?tab=reservations')}>
          Back to Reservations
        </Button>
      </div>
    );
  }

  const isReserved = reservation.status === 'RESERVED';
  const isFulfilled = reservation.status === 'FULFILLED';
  const isReleased = reservation.status === 'RELEASED';
  const isCancelled = reservation.status === 'CANCELLED';

  const reservedQty = Number(reservation.quantity) || 0;
  const availableQty = Number(reservation.currentStock?.availableQuantity) || 0;
  const onHandQty = Number(reservation.currentStock?.quantity) || 0;

  const warehouseName = reservation.warehouse?.name || 'Warehouse';
  const branchName = reservation.warehouse?.branch?.name;
  const warehouseDisplay = branchName ? `${warehouseName} (${branchName})` : warehouseName;

  const creatorName = reservation.createdBy?.person
    ? `${reservation.createdBy.person.firstName || ''} ${reservation.createdBy.person.lastName || ''}`.trim()
    : reservation.createdBy?.username || 'Sales Rep';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
      {/* Top Header / Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory?tab=reservations')}
            className="p-2 rounded-xl bg-card border border-border hover:bg-muted800 text-muted-foreground hover:text-foreground transition"
            title="Back to Reservations"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted800 text-muted-foreground border border-border">
                #{reservation.id?.slice(0, 8)}
              </span>
              {isReserved && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>Reserved Stock Allocation</span>
                </span>
              )}
              {isFulfilled && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Fulfilled / Dispatched</span>
                </span>
              )}
              {isReleased && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Released to Available Stock</span>
                </span>
              )}
              {isCancelled && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancelled</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight mt-1 flex items-center gap-2">
              <BookmarkCheck className="w-6 h-6 text-emerald-400" />
              <span>Stock Reservation Details</span>
            </h1>
          </div>
        </div>

        {/* Dynamic Action Bar */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchReservation} className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          {isReserved && canApprove && (
            <>
              <button
                type="button"
                disabled={processing}
                onClick={() => setIsReleaseModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Release Stock</span>
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={handleConfirmFulfill}
                className="px-4 py-2 rounded-xl font-bold text-xs text-white shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 flex items-center gap-1.5 transition active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Allocation</span>
              </button>
            </>
          )}

          {reservation.salesOrderId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/sales-orders/${reservation.salesOrderId}`)}
              className="flex items-center gap-1.5"
            >
              <span>Sales Order</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}

          {reservation.productId && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/products/${reservation.productId}`)}
              className="flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <span>View Product</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Overview Metric Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reserved Volume</span>
          </span>
          <p className="text-2xl sm:text-3xl font-black text-foreground font-mono">
            {reservedQty.toLocaleString()}
          </p>
          <span className="text-xs text-muted-foreground block">
            {reservation.product?.unit?.name || 'Units'} locked for order
          </span>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Facility Available</span>
          </span>
          <p className="text-2xl sm:text-3xl font-black text-foreground font-mono">
            {availableQty.toLocaleString()}
          </p>
          <span className="text-xs text-muted-foreground block">Uncommitted depot stock</span>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-indigo-400" />
            <span>Total Depot On-Hand</span>
          </span>
          <p className="text-2xl sm:text-3xl font-black text-foreground font-mono">
            {onHandQty.toLocaleString()}
          </p>
          <span className="text-xs text-muted-foreground block">Physical count in facility</span>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Status / Condition</span>
          </span>
          <p className="text-lg font-black text-foreground mt-1">
            {isReserved ? 'Active Hold' : isFulfilled ? 'Fulfilled' : isReleased ? 'Released' : 'Cancelled'}
          </p>
          <span className="text-xs text-muted-foreground block">
            {isReserved ? 'Securing order delivery' : 'No active stock hold'}
          </span>
        </div>
      </div>

      {/* Detail Breakdown Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Linked Sales Order Card */}
        <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Linked Sales Order</h3>
                <span className="text-xs text-muted-foreground">Sales requisition holding this stock</span>
              </div>
            </div>

            {reservation.salesOrderId && (
              <Link
                to={`/sales-orders/${reservation.salesOrderId}`}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                View Order
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Order Number</span>
              <p className="font-mono font-bold text-foreground mt-0.5">
                {reservation.salesOrder?.orderNumber || 'SO-PENDING'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">Order Status</span>
              <p className="font-bold text-foreground mt-0.5">
                <span className="px-2 py-0.5 rounded-md text-xs bg-muted800 text-muted-foreground border border-border">
                  {reservation.salesOrder?.status || 'PENDING'}
                </span>
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">Client / Customer</span>
              <p className="font-bold text-foreground mt-0.5">
                {reservation.salesOrder?.customer?.name || 'Customer'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">Client Contact</span>
              <p className="font-semibold text-muted-foreground mt-0.5">
                {reservation.salesOrder?.customer?.phone || reservation.salesOrder?.customer?.email || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Warehouse Facility Card */}
        <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <WarehouseIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Depot Facility</h3>
                <span className="text-xs text-muted-foreground">Warehouse location where items are secured</span>
              </div>
            </div>

            {reservation.warehouseId && (
              <Link
                to={`/inventory/stocks/${reservation.warehouseId}`}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                Depot Stocks
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Warehouse & Branch</span>
              <p className="font-bold text-foreground mt-0.5">{warehouseDisplay}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">Facility Code</span>
              <p className="font-mono font-bold text-foreground mt-0.5">
                {reservation.warehouse?.code || 'WH-CODE'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">Branch Affiliation</span>
              <p className="font-bold text-foreground mt-0.5">
                {branchName || 'Headquarters'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">Depot Manager</span>
              <p className="font-semibold text-muted-foreground mt-0.5">
                {reservation.warehouse?.manager?.person
                  ? `${reservation.warehouse.manager.person.firstName || ''} ${reservation.warehouse.manager.person.lastName || ''}`.trim()
                  : 'Facility Lead'}
              </p>
            </div>
          </div>
        </div>

        {/* Product Card */}
        <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Reserved Product</h3>
                <span className="text-xs text-muted-foreground">Item catalog specifications</span>
              </div>
            </div>

            {reservation.productId && (
              <Link
                to={`/products/${reservation.productId}`}
                className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                Catalog View
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Product Name</span>
              <p className="font-bold text-foreground mt-0.5">{reservation.product?.name || 'Product'}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">SKU</span>
              <p className="font-mono font-bold text-foreground mt-0.5">
                {reservation.product?.sku || 'SKU-NONE'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">Standard Selling Price</span>
              <p className="font-mono font-bold text-foreground mt-0.5">
                ${Number(reservation.product?.sellingPrice || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">Wholesale Price</span>
              <p className="font-mono font-bold text-emerald-400 mt-0.5">
                ${Number(reservation.product?.wholesalePrice || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Audit Trail Card */}
        <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-border/80 pb-3">
            <div className="p-2 rounded-xl bg-muted800 text-muted-foreground border border-border">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Audit Trail & Timestamps</h3>
              <span className="text-xs text-muted-foreground">Historical reservation record</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Reserved By</span>
              <p className="font-bold text-foreground mt-0.5">{creatorName}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">Reservation Date</span>
              <p className="font-mono font-semibold text-foreground mt-0.5">
                {reservation.createdAt ? new Date(reservation.createdAt).toLocaleString() : '—'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">Released At</span>
              <p className="font-mono font-semibold text-muted-foreground mt-0.5">
                {reservation.releasedAt ? new Date(reservation.releasedAt).toLocaleString() : 'Not Released'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium">Last Modified</span>
              <p className="font-mono font-semibold text-muted-foreground mt-0.5">
                {reservation.updatedAt ? new Date(reservation.updatedAt).toLocaleString() : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Release Stock Modal */}
      <Modal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
        title="Release Reserved Stock"
      >
        <div className="space-y-4 p-4">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Release stock hold?</p>
              <p className="mt-0.5 text-rose-300/80">
                This will unlock {reservedQty} units of {reservation.product?.name} from {warehouseDisplay} and return them to available uncommitted stock.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              Reason / Release Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="e.g. Sales order cancelled by client or changed items..."
              className="w-full rounded-xl bg-card border border-border p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReleaseModalOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={processing}
              onClick={handleReleaseReservation}
              className="flex items-center gap-1.5"
            >
              {processing ? 'Releasing...' : 'Confirm Release'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
