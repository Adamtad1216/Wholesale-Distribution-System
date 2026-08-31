import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../paymentsApi';

export default function Payments() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => paymentsApi.getInvoices().catch(() => ({ data: [] })),
  });

  const invoices = response?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Finance & Billing</h2>
        <p className="text-sm text-slate-400">Review generated invoices, trigger payments, and submit bank transfer validation proofs.</p>
      </div>

      <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/20">
                <th className="px-6 py-4">Invoice Number</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    No invoices found. (Database empty or offline)
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/20 transition">
                    <td className="px-6 py-4 font-semibold text-white">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 font-bold text-violet-400">${inv.totalAmount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                        inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' : 'bg-amber-550/10 text-amber-450 border border-amber-500/20'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {inv.status !== 'PAID' && (
                        <button className="px-3 py-1 text-xs font-semibold rounded-lg bg-violet-650 hover:bg-violet-550 transition text-white">
                          Pay Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
