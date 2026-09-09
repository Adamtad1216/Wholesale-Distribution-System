import React from 'react';
import { ArrowLeft, RefreshCw, Printer } from 'lucide-react';
import Button from '../../../../../components/ui/Button';

export default function TransferReceiptHeader({
  id,
  reverifying = false,
  onNavigateBack,
  onReverify,
  onPrint,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 print:hidden">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateBack}
          className="text-xs font-semibold hover:bg-slate-200/60 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          {id ? 'Back to Goods Receipt' : 'Procurement'}
        </Button>
        <span className="text-muted-foreground/50 font-bold">/</span>
        <span className="text-xs font-bold text-foreground">Official Payout Voucher</span>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Button
          variant="secondary"
          size="sm"
          onClick={onReverify}
          disabled={reverifying}
          className="text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${reverifying ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          {reverifying ? 'Verifying...' : 'Re-verify with Gateway'}
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onPrint}
          className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 px-4"
        >
          <Printer className="w-3.5 h-3.5 mr-1.5" />
          Print / Save PDF
        </Button>
      </div>
    </div>
  );
}
