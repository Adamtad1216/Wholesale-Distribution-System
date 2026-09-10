import React, { useState } from 'react';
import {
  ShieldCheck,
  BookmarkCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Warehouse as WarehouseIcon,
  Package,
  FileSpreadsheet,
  User,
  Layers,
  TrendingDown,
  ClipboardList,
} from 'lucide-react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';

export default function ReservationApprovalModal({
  isOpen,
  onClose,
  reservation,
  onApprove,
  onRelease,
  isProcessing = false,
}) {
  const [notes, setNotes] = useState('');

  if (!reservation) return null;

  const handleApprove = () => {
    onApprove(reservation.id, notes);
    setNotes('');
  };

  const handleRelease = () => {
    onRelease(reservation.id, notes);
    setNotes('');
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  const reservedQty = Number(reservation.quantity);
  const currentStock = reservation.currentStock;
  const availableQty = currentStock ? Number(currentStock.availableQuantity) : null;
  const totalQty = currentStock ? Number(currentStock.quantity) : null;

  const customerName =
    reservation.salesOrder?.customer?.customerCode ||
    reservation.salesOrder?.customer?.id?.slice(0, 8) ||
    '—';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Review Stock Reservation"
      subtitle={`Confirm allocation or release reserved stock for order #${reservation.salesOrder?.orderNumber || reservation.salesOrderId?.slice(0, 8)}`}
      icon={<ShieldCheck className="w-5 h-5 text-cyan-400" />}
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {/* Release / Reject */}
            <button
              type="button"
              onClick={handleRelease}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-normal text-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>Release / Reject</span>
            </button>

            {/* Confirm Allocation */}
            <button
              type="button"
              onClick={handleApprove}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-normal text-xs shadow-md shadow-cyan-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Allocation</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">

        {/* Workflow Notice */}
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-2.5 text-cyan-300 text-xs leading-relaxed">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
          <div>
            <span className="font-medium">Approval Notice: </span>
            <span className="font-normal">
              Confirming will mark this reservation as{' '}
              <strong>Fulfilled</strong> and commit the allocation for order fulfillment.
              Releasing will restore the reserved units back to{' '}
              <strong>available inventory</strong>, freeing them for other orders.
            </span>
          </div>
        </div>

        {/* Sales Order & Customer */}
        <div className="p-4 rounded-2xl bg-muted900/50 border border-border space-y-3">
          <p className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Sales Order</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground">Order Number</p>
              <p className="text-xs font-normal text-foreground flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                #{reservation.salesOrder?.orderNumber || reservation.salesOrderId?.slice(0, 8)}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground">Customer</p>
              <p className="text-xs font-normal text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                {customerName}
              </p>
            </div>
          </div>
        </div>

        {/* Product & Warehouse */}
        <div className="p-4 rounded-2xl bg-muted900/50 border border-border space-y-3">
          <p className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            <span>Product & Stock</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground">Product</p>
              <p className="text-xs font-normal text-foreground truncate">
                {reservation.product?.name || '—'}
              </p>
              {reservation.product?.sku && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  SKU: {reservation.product.sku}
                </p>
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground">Warehouse</p>
              <p className="text-xs font-normal text-foreground flex items-center gap-1.5 truncate">
                <WarehouseIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {reservation.warehouse?.name || '—'}
              </p>
              {reservation.warehouse?.code && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  {reservation.warehouse.code}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stock Levels */}
        <div className="p-4 rounded-2xl bg-muted900/50 border border-border space-y-3">
          <p className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Stock Levels</span>
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {/* Reserved Quantity */}
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <p className="text-[10px] text-cyan-400 uppercase tracking-wider mb-1">Reserved</p>
              <p className="text-lg font-semibold text-cyan-300">{reservedQty.toLocaleString()}</p>
            </div>
            {/* Available */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Available</p>
              <p className="text-lg font-semibold text-emerald-300">
                {availableQty !== null ? availableQty.toLocaleString() : '—'}
              </p>
            </div>
            {/* Total Stock */}
            <div className="p-3 rounded-xl bg-muted800/60 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Stock</p>
              <p className="text-lg font-semibold text-foreground">
                {totalQty !== null ? totalQty.toLocaleString() : '—'}
              </p>
            </div>
          </div>

          {/* Release Impact */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <TrendingDown className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              If released, <strong>{reservedQty.toLocaleString()} units</strong> will be returned to available inventory
              {availableQty !== null
                ? ` (new available: ${(availableQty + reservedQty).toLocaleString()} units)`
                : ''}.
            </span>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Notes / Reason (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any context or reason for your decision..."
            rows={2}
            maxLength={500}
            disabled={isProcessing}
            className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500 transition resize-none disabled:opacity-50"
          />
        </div>

      </div>
    </Modal>
  );
}
