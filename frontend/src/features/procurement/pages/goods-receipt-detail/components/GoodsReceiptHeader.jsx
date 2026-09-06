import React from 'react';
import Button from '../../../../../components/ui/Button';

export default function GoodsReceiptHeader({
  receiptNumber,
  status = 'PENDING',
  receivedAt,
  id,
  submittingAction = false,
  onBack,
  onReject,
  onSettle,
  onViewTransferReceipt,
}) {
  const getStatusBadge = (st) => {
    switch (st) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'PAID':
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
      <div>
        <button
          onClick={onBack}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition flex items-center gap-1 mb-2"
        >
          ← Back to Procurement Dashboard
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight font-mono">
            {receiptNumber}
          </h1>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadge(status)}`}>
            {status || 'PENDING'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Received on {receivedAt ? new Date(receivedAt).toLocaleDateString() : 'N/A'} • Reference ID: {id}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="secondary" size="md" onClick={onBack}>
          Back to List
        </Button>

        {(status === 'PAID' || status === 'APPROVED') && onViewTransferReceipt && (
          <Button
            variant="secondary"
            size="md"
            onClick={onViewTransferReceipt}
            className="px-4 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold flex items-center gap-1.5 shadow-sm"
          >
            <span>🧾</span> View Transfer Receipt
          </Button>
        )}

        {(status === 'PENDING' || !status) && (
          <>
            <Button
              variant="danger"
              size="md"
              disabled={submittingAction}
              onClick={onReject}
            >
              ❌ Reject Receipt
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={submittingAction}
              onClick={onSettle}
              className="px-6 shadow-lg shadow-indigo-500/20"
            >
              💳 Settle Payment
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
