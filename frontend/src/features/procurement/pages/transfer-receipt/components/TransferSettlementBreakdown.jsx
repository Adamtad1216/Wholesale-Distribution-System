import React from 'react';
import { FileText } from 'lucide-react';

export default function TransferSettlementBreakdown({
  gr,
  id,
  goodsSubtotal = 0,
  vatAmount = 0,
  withholdingAmount = 0,
  shippingFee = 0,
  amount = 0,
  formatCurrency,
}) {
  return (
    <>
      <div className="p-6 sm:p-8 space-y-5 bg-white">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200">
          <FileText className="w-4 h-4 text-amber-600" />
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Linked Procurement Settlement Breakdown
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-1">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Goods Receipt</span>
            <span className="text-sm font-mono font-black text-slate-900">
              {gr?.receiptNumber || (id ? `GR-${id.slice(0, 8)}` : 'N/A')}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Purchase Order</span>
            <span className="text-sm font-mono font-black text-indigo-700">
              {gr?.purchaseOrder?.poNumber || 'N/A'}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Warehouse</span>
            <span className="text-sm font-bold text-slate-900">
              {gr?.warehouse?.name || 'Main Distribution Center'}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Settled By</span>
            <span className="text-sm font-bold text-slate-900">
              {gr?.approvedBy?.username || gr?.updatedBy?.username || 'Authorized Finance Officer'}
            </span>
          </div>
        </div>

        {/* Financial Ledger Table */}
        <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/90 text-slate-800 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Line Item / Charge</th>
                <th className="py-3 px-4 text-right">Accounting Rate</th>
                <th className="py-3 px-4 text-right">Amount (ETB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 bg-white font-medium">
              <tr className="hover:bg-slate-50/50 transition">
                <td className="py-3 px-4 font-bold text-slate-900">
                  Goods Accepted Subtotal ({gr?.items?.length || 0} line items)
                </td>
                <td className="py-3 px-4 text-right text-slate-500">Base Net</td>
                <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                  {formatCurrency(goodsSubtotal)}
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition">
                <td className="py-3 px-4 font-bold text-slate-900">
                  Value Added Tax (VAT)
                </td>
                <td className="py-3 px-4 text-right text-slate-500">+15.00%</td>
                <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                  +{formatCurrency(vatAmount)}
                </td>
              </tr>
              {withholdingAmount > 0 && (
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    Withholding Tax Deduction
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500">-2.00%</td>
                  <td className="py-3 px-4 text-right font-mono font-black text-rose-600">
                    -{formatCurrency(withholdingAmount)}
                  </td>
                </tr>
              )}
              {shippingFee > 0 && (
                <tr className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    Logistics & Freight Handling
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500">Fixed Flat</td>
                  <td className="py-3 px-4 text-right font-mono font-black text-indigo-700">
                    +{formatCurrency(shippingFee)}
                  </td>
                </tr>
              )}
              <tr className="bg-emerald-50/90 font-bold border-t-2 border-emerald-400 text-emerald-900">
                <td className="py-3.5 px-4 text-slate-900 font-black uppercase tracking-wide text-sm">
                  Net Disbursed Total
                </td>
                <td className="py-3.5 px-4 text-right text-xs text-emerald-700 font-extrabold">100% Settled</td>
                <td className="py-3.5 px-4 text-right font-mono text-base font-black text-emerald-800">
                  {formatCurrency(amount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Sign-off & Footer */}
      <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-200">
        <div className="hidden print:grid grid-cols-2 gap-12 pt-8 text-xs text-black">
          <div className="space-y-12">
            <div>
              <div className="border-b border-black w-48 mb-1"></div>
              <p className="font-bold">Prepared & Disbursed By</p>
              <p className="text-[10px] text-gray-500">Finance & Disbursement Officer</p>
            </div>
          </div>
          <div className="space-y-12 text-right">
            <div>
              <div className="border-b border-black w-48 ml-auto mb-1"></div>
              <p className="font-bold">Authorized Signatory / Stamp</p>
              <p className="text-[10px] text-gray-500">Wholesale Distribution Management</p>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 font-medium">
          Official electronic receipt voucher verified and settled via Chapa Payment Gateway.
        </div>
      </div>
    </>
  );
}
