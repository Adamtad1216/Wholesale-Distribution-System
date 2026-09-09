import React from 'react';
import Card from '../../../../../components/ui/Card';

export default function SuppliersTable({
  suppliers = [],
  loading = false,
  onView,
  onEdit,
  onArchive,
}) {
  return (
    <Card className="border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-muted800/80 border-b border-border text-muted-foreground uppercase font-bold tracking-wider">
              <th className="py-3.5 px-4">Vendor Name</th>
              <th className="py-3.5 px-4">Contact Details</th>
              <th className="py-3.5 px-4 text-center">TIN Number</th>
              <th className="py-3.5 px-4 text-center">Payment Terms</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right pr-6">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/50 font-medium">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <p>Loading suppliers directory...</p>
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  No suppliers match your search filter.
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-muted800/30 transition">
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => onView(s.id)}
                      className="font-bold text-foreground hover:text-indigo-400 text-left transition"
                    >
                      {s.name || s.companyName}
                    </button>
                    <div className="text-[10px] mt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-muted800 text-muted-foreground uppercase font-bold font-sans">
                        {s.supplierType === 'INDIVIDUAL' || s.person ? 'Individual' : 'Company'}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-0.5">
                      {s.phone ? (
                        <span className="font-mono font-bold text-foreground text-[12px]">📞 {s.phone}</span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">— No phone</span>
                      )}
                      {s.email ? (
                        <span className="font-mono text-indigo-400 text-[11px]">📧 {s.email}</span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">— No email</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">
                    {s.tin || 'N/A'}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-bold rounded-lg">
                      {s.paymentTerms || 'Net 30'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        s.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right pr-6 space-x-2">
                    <button
                      type="button"
                      onClick={() => onView(s.id)}
                      className="px-2.5 py-1 bg-muted800 text-foreground hover:bg-muted700 border border-border rounded-lg text-[11px] font-bold transition"
                    >
                      👁️ View
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(s.id)}
                      className="px-2.5 py-1 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-[11px] font-bold transition"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onArchive(s.id)}
                      className="px-2.5 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-[11px] font-bold transition"
                    >
                      🗑️ Archive
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
