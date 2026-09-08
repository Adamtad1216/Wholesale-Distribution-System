import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeftRight,
  Warehouse as WarehouseIcon,
  Package,
  ArrowRight,
} from 'lucide-react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';

export default function TransferApprovalModal({
  isOpen,
  onClose,
  transfer,
  onApprove,
  onReject,
  isProcessing = false,
}) {
  const [notes, setNotes] = useState('');

  if (!transfer) return null;

  const handleApprove = () => {
    onApprove(transfer.id, notes);
    setNotes('');
  };

  const handleReject = () => {
    onReject(transfer.id, notes);
    setNotes('');
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  const reasonFormatted = transfer.transferReason?.replace(/_/g, ' ') || 'Rebalancing';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Authorize Inter-Warehouse Transfer"
      subtitle={`Review transit route, product volumes, and authorize or reject transfer #${transfer.id?.slice(0, 8)}`}
      icon={<ArrowLeftRight className="w-5 h-5 text-sky-400" />}
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReject}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Transfer</span>
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Move Stock</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Warning Callout */}
        <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-start gap-2.5 text-sky-300 text-xs leading-relaxed">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-sky-400" />
          <div>
            <strong className="font-bold">Workflow Notice:</strong> Approving this transfer will finalize stock deduction from source <strong>"{transfer.fromWarehouse?.name}"</strong> and immediately credit available inventory in destination <strong>"{transfer.toWarehouse?.name}"</strong>. Rejecting releases the reserved stock back to available source inventory.
          </div>
        </div>

        {/* Transfer Route Visual */}
        <div className="p-4 rounded-2xl bg-muted900/50 border border-border grid grid-cols-1 sm:grid-cols-7 gap-3 items-center">
          {/* Source */}
          <div className="sm:col-span-3 p-3 rounded-xl bg-muted800/40 border border-border/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
              <WarehouseIcon className="w-3 h-3" />
              <span>Source Warehouse</span>
            </span>
            <p className="font-bold text-foreground text-xs truncate">
              {transfer.fromWarehouse?.name || 'Origin Depot'}
            </p>
            {transfer.fromWarehouse?.code && (
              <span className="text-[10px] text-muted-foreground font-mono">
                Code: {transfer.fromWarehouse.code}
              </span>
            )}
          </div>

          {/* Arrow */}
          <div className="sm:col-span-1 flex justify-center">
            <div className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Destination */}
          <div className="sm:col-span-3 p-3 rounded-xl bg-muted800/40 border border-border/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
              <WarehouseIcon className="w-3 h-3" />
              <span>Destination</span>
            </span>
            <p className="font-bold text-foreground text-xs truncate">
              {transfer.toWarehouse?.name || 'Destination Hub'}
            </p>
            {transfer.toWarehouse?.code && (
              <span className="text-[10px] text-muted-foreground font-mono">
                Code: {transfer.toWarehouse.code}
              </span>
            )}
          </div>
        </div>

        {/* Product Details & Volume */}
        <div className="p-3.5 rounded-xl bg-muted800/30 border border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-foreground truncate">
                {transfer.product?.name || 'Transferred Product'}
              </h4>
              <p className="text-[10px] text-muted-foreground font-mono">
                SKU: {transfer.product?.sku || 'N/A'} • Reason: {reasonFormatted}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Quantity
            </span>
            <span className="text-lg font-black text-sky-400">
              {Number(transfer.quantity).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Initiator Remark */}
        {transfer.remark && (
          <div className="p-3 rounded-xl bg-muted800/20 border border-border/60 text-xs">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
              Initiator Remark
            </span>
            <p className="text-foreground italic">{transfer.remark}</p>
          </div>
        )}

        {/* Reviewer Notes / Justification */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground block">
            Approval / Rejection Notes <span className="text-muted-foreground font-normal">(Optional for approval, recommended for rejection)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add operational justification or transit instructions..."
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500 transition resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}
