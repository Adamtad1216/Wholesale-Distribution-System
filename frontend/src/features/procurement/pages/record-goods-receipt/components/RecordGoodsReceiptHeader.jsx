import React from 'react';
import Button from '../../../../../components/ui/Button';

export default function RecordGoodsReceiptHeader({ onCancel }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 mb-2"
        >
          ← Back to Procurement Dashboard
        </button>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
          <span>📦</span> Record Incoming Goods Receipt
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Log received inventory deliveries against an approved purchase order and verify item counts.
        </p>
      </div>

      <Button type="button" variant="secondary" size="md" onClick={onCancel}>
        Cancel & Exit
      </Button>
    </div>
  );
}
