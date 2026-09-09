import React from 'react';
import { Building2, CreditCard, CheckCircle2 } from 'lucide-react';

export default function TransferBeneficiaryDetails({
  supplierName = 'Vendor Supplier',
  payoutAccountName = '',
  bankName = 'Commercial Bank of Ethiopia (CBE)',
  payoutAccountNumber = '1000123456789',
  statusLabel = 'VERIFIED & SETTLED',
  verifyMessage = 'Transfer confirmed with payment gateway',
  transactionId = 'N/A',
  timestamp,
}) {
  return (
    <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border-b border-slate-200">
      {/* Payee / Beneficiary Details */}
      <div className="space-y-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Beneficiary & Destination Account
          </h2>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-semibold">Vendor / Supplier:</span>
            <span className="font-extrabold text-slate-900">{supplierName}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-semibold">Account Holder Name:</span>
            <span className="font-bold text-slate-800">{payoutAccountName || supplierName}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-semibold">Destination Bank / Wallet:</span>
            <span className="font-extrabold text-indigo-600">{bankName}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-semibold">Account Number:</span>
            <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {payoutAccountNumber}
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-semibold">Currency:</span>
            <span className="font-extrabold text-slate-900">ETB (Ethiopian Birr)</span>
          </div>
        </div>
      </div>

      {/* Gateway Verification Response Details */}
      <div className="space-y-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Gateway Verification Response
          </h2>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-semibold">Gateway Provider:</span>
            <span className="font-extrabold text-slate-900 flex items-center gap-1">
              <span>⚡</span> Chapa Transfer API
            </span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-semibold">Verification Status:</span>
            <span className="inline-flex items-center gap-1 font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {statusLabel}
            </span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-semibold">Gateway Response:</span>
            <span className="font-semibold text-slate-700 italic text-right max-w-[200px] truncate" title={verifyMessage}>
              {verifyMessage}
            </span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-semibold">Transaction ID / Ref:</span>
            <span className="font-mono text-xs font-bold text-slate-700">
              {transactionId}
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-semibold">Verification Timestamp:</span>
            <span className="font-mono font-medium text-slate-600">
              {new Date(timestamp).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
