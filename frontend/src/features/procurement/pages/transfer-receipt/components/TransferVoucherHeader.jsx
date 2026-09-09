import React from 'react';
import {
  CheckCircle2,
  Copy,
  ShieldCheck,
  Receipt as ReceiptIcon
} from 'lucide-react';

export default function TransferVoucherHeader({
  statusLabel = 'VERIFIED & SETTLED',
  reference = '',
  onCopyRef,
  amount = 0,
  timestamp,
  formatCurrency,
}) {
  return (
    <>
      {/* Top Emerald Gradient Ribbon */}
      <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600" />

      {/* Header Bar */}
      <div className="bg-white p-6 sm:p-8 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm flex-shrink-0">
              <ReceiptIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Official Disbursement Receipt
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  {statusLabel}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Procurement Vendor Payment • Chapa Direct Payout Gateway
              </p>
            </div>
          </div>

          {/* Reference Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:text-right shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Disbursement Reference
            </span>
            <div className="flex items-center sm:justify-end gap-2 mt-0.5">
              <span className="font-mono text-sm font-extrabold text-indigo-700">
                {reference || 'TR-PENDING'}
              </span>
              <button
                type="button"
                onClick={onCopyRef}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition print:hidden"
                title="Copy reference code"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Amount Showcase Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-b from-emerald-50/70 to-emerald-50/20 border-b border-slate-200 text-center relative overflow-hidden">
        <span className="text-xs uppercase tracking-widest font-extrabold text-slate-500 block mb-1">
          Total Net Disbursed Amount
        </span>
        <div className="text-4xl sm:text-5xl font-black font-mono text-emerald-700 tracking-tight">
          {formatCurrency(amount)}
        </div>
        <div className="flex items-center justify-center gap-2 mt-2 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Electronically settled and verified via Chapa API • {new Date(timestamp).toLocaleDateString()} at {new Date(timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    </>
  );
}
