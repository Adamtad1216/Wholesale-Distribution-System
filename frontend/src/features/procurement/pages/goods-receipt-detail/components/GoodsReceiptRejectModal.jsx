import React from 'react';
import Modal from '../../../../../components/ui/Modal';
import Button from '../../../../../components/ui/Button';

export default function GoodsReceiptRejectModal({
  isOpen,
  receiptNumber = '',
  rejectionReason = '',
  submittingAction = false,
  onChangeReason,
  onClose,
  onConfirm,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reject Goods Receipt: ${receiptNumber}`}
      subtitle="Please specify a clear reason for rejecting this goods receipt."
      icon="❌"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 text-xs">
        <div>
          <label className="block text-xs font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider mb-2">
            Rejection Reason *
          </label>
          <textarea
            rows={4}
            value={rejectionReason}
            onChange={(e) => onChangeReason(e.target.value)}
            placeholder="Enter reason for rejecting this shipment (e.g. damaged goods, wrong product delivered, quantity mismatch)..."
            className="w-full p-3 bg-card text-foreground border border-rose-500/40 rounded-xl text-xs focus:outline-none focus:border-rose-500 shadow-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            disabled={submittingAction || !rejectionReason.trim()}
            onClick={onConfirm}
            className="px-6"
          >
            {submittingAction ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
