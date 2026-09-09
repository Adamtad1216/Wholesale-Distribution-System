import React from 'react';
import Card from '../../../../../components/ui/Card';

export default function SupplierOrdersTab({
  supplierName = '',
  purchaseOrders = [],
}) {
  return (
    <Card className="border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
      <div className="p-4 bg-muted800/80 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">
          Purchase Orders Sourced from {supplierName}
        </h3>
        <span className="text-xs text-muted-foreground font-mono">
          {purchaseOrders.length} Orders
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-muted800/40 border-b border-border text-muted-foreground uppercase font-bold tracking-wider">
              <th className="py-3.5 px-4">PO Number</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-center">Line Items</th>
              <th className="py-3.5 px-4 text-right pr-6">Total Value (ETB)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 font-medium">
            {purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-muted-foreground">
                  No purchase orders recorded for this supplier yet.
                </td>
              </tr>
            ) : (
              purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-muted800/30 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                    {po.poNumber || `PO-${po.id.substring(0, 8)}`}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        po.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : po.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-muted-foreground">
                    {po.items?.length || 1} Items
                  </td>
                  <td className="py-3.5 px-4 text-right pr-6 font-mono font-bold text-emerald-400">
                    {Number(po.total || 0).toLocaleString()} ETB
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
