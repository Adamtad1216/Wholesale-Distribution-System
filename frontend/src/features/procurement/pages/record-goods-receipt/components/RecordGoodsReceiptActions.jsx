import React from 'react';
import Button from '../../../../../components/ui/Button';

export default function RecordGoodsReceiptActions({
  submittingGr = false,
  disabled = false,
  onCancel,
}) {
  return (
    <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
      <Button type="button" variant="secondary" size="md" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={disabled || submittingGr}
        className="px-8 shadow-lg shadow-indigo-500/20"
      >
        {submittingGr ? 'Creating Goods Receipt...' : '✅ Create Goods Receipt'}
      </Button>
    </div>
  );
}
