import { AlertTriangle, CheckCircle, XCircle, Sliders, Warehouse as WarehouseIcon } from 'lucide-react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';

export default function AdjustmentApprovalModal({
  isOpen,
  onClose,
  adjustment,
  onApprove,
  onReject,
  isProcessing = false,
}) {
  if (!adjustment) return null;

  const items = adjustment.items || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Stock Adjustment"
      subtitle={`Review discrepancies and decide whether to approve or reject adjustment #${adjustment.id?.slice(0, 8)}`}
      icon={<Sliders className="w-5 h-5 text-amber-400" />}
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onReject(adjustment.id)}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Adjustment</span>
            </button>

            <button
              type="button"
              onClick={() => onApprove(adjustment.id)}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve & Apply Stock</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Warning Callout */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-300 text-xs leading-relaxed">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <strong className="font-bold">Important:</strong> Approving this adjustment will immediately modify real-time stock levels in warehouse <strong>"{adjustment.warehouse?.name}"</strong> by the computed discrepancies.
          </div>
        </div>

        {/* Overview Details */}
        <div className="p-3 rounded-xl bg-muted900/50 border border-border space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Warehouse:</span>
            <span className="font-bold text-foreground flex items-center gap-1">
              <WarehouseIcon className="w-3.5 h-3.5 text-violet-400" />
              {adjustment.warehouse?.name} ({adjustment.warehouse?.code || 'N/A'})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reason / Audit:</span>
            <span className="font-medium text-foreground">{adjustment.reason}</span>
          </div>
        </div>

        {/* Line Items Discrepancy Table */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
            Discrepancies to Apply ({items.length})
          </span>

          <div className="max-h-[220px] overflow-y-auto rounded-xl border border-border divide-y divide-border/40">
            {items.map((item) => {
              const diff = Number(item.difference);
              return (
                <div
                  key={item.id}
                  className="p-2.5 flex items-center justify-between gap-3 text-xs bg-card/60"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">
                      {item.product?.name || 'Product'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      SKU: {item.product?.sku || 'N/A'} • System: {item.systemQuantity} ➔ Actual: {item.actualQuantity}
                    </p>
                    {item.reason && (
                      <p className="text-[10px] text-muted-foreground italic mt-0.5">
                        Note: {item.reason}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${
                        diff > 0
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : diff < 0
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : 'bg-muted800 text-foreground border-border'
                      }`}
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
