import React from 'react';
import Card from '../../../../../components/ui/Card';

export default function SettlementItemsPreviewTable({ items = [] }) {
  return (
    <Card className="border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <span>📋</span> Received Items Included in Settlement
        </h3>
        <span className="text-xs font-mono text-muted-foreground">
          {items.length} Line Items
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-muted800/80 border-b border-border text-muted-foreground uppercase font-bold tracking-wider">
              <th className="py-3 px-4">Item Name</th>
              <th className="py-3 px-4 text-center">Net Qty</th>
              <th className="py-3 px-4 text-right">Unit Cost ($)</th>
              <th className="py-3 px-4 text-right">Line Total ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 font-medium">
            {items.map((item, idx) => {
              const netAccepted = Number(item.receivedQuantity || 0) - Number(item.damagedQuantity || 0);
              const singlePrice = Number(item.unitCost || item.product?.costPrice || 0);
              const lineTotal = netAccepted * singlePrice;
              return (
                <tr key={item.id || idx} className="hover:bg-muted800/30 transition">
                  <td className="py-3 px-4 font-bold text-foreground">
                    {item.product?.name || `Product #${item.productId?.slice(0, 8)}`}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-indigo-400">
                    {netAccepted}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-foreground">
                    ${singlePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                    ${lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
