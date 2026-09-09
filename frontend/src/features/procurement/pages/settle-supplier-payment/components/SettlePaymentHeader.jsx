import React from 'react';
import Button from '../../../../../components/ui/Button';

export default function SettlePaymentHeader({
  gr,
  submitting = false,
  onCancel,
  onSubmit,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 mb-2"
        >
          ← Back to Goods Receipt ({gr?.receiptNumber})
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Supplier Payment Settlement
          </h1>
          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-mono font-bold">
            {gr?.receiptNumber}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Linked PO: <span className="font-mono font-bold text-foreground">{gr?.purchaseOrder?.poNumber || 'N/A'}</span> • Receiving Warehouse: <span className="font-bold text-foreground">{gr?.warehouse?.name || 'Main Warehouse'}</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="secondary" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="md"
          disabled={submitting}
          onClick={onSubmit}
          className="px-6 shadow-lg shadow-indigo-500/20"
        >
          {submitting ? 'Processing Settlement...' : '💳 Confirm & Process Payment Settlement'}
        </Button>
      </div>
    </div>
  );
}
