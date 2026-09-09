import React from 'react';

export default function GoodsReceiptItemsTable({ items = [] }) {
  const formatCurrency = (amt) => {
    return Number(amt || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const totalNetAcceptedQty = items.reduce(
    (acc, item) => acc + (Number(item.receivedQuantity || 0) - Number(item.damagedQuantity || 0)),
    0
  );

  const totalGoodsReceiptValue = items.reduce((acc, item) => {
    const net = Number(item.receivedQuantity || 0) - Number(item.damagedQuantity || 0);
    const price = Number(item.unitCost || item.product?.costPrice || 0);
    return acc + net * price;
  }, 0);

  return (
    <div className="w-full">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-slate-800">
        {/* Table Header Section */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>📋</span> Inspection & Line Item Audit
          </h3>
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-3 py-1 rounded-full">
            {items.length} Items Received
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider text-[11px]">
                <th className="py-3.5 px-4 font-semibold">Product Name</th>
                <th className="py-3.5 px-4 text-center font-semibold">Ordered</th>
                <th className="py-3.5 px-4 text-center font-semibold">Received</th>
                <th className="py-3.5 px-4 text-center font-semibold">Damaged</th>
                <th className="py-3.5 px-4 text-center font-semibold">Net Accepted</th>
                <th className="py-3.5 px-4 text-right font-semibold">Single Price ($)</th>
                <th className="py-3.5 px-4 text-right font-semibold">Whole Price ($)</th>
                <th className="py-3.5 px-4 pr-6 font-semibold">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium">
              {items.map((item, idx) => {
                const netAccepted = Number(item.receivedQuantity || 0) - Number(item.damagedQuantity || 0);
                const singlePrice = Number(item.unitCost || item.product?.costPrice || 0);
                const wholePrice = netAccepted * singlePrice;
                const damaged = Number(item.damagedQuantity || 0);

                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs">
                        {item.product?.name || `Product #${item.productId?.slice(0, 8)}`}
                      </div>
                      {item.product?.sku && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          SKU: {item.product.sku}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-600 font-mono">
                      {item.orderedQuantity}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold font-mono text-xs border border-emerald-100">
                        {item.receivedQuantity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {damaged > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold font-mono text-xs border border-rose-100">
                          {damaged}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs font-semibold">
                          0
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold font-mono text-xs border border-indigo-100">
                        {netAccepted}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 font-medium text-xs">
                      ${formatCurrency(singlePrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-xs">
                      ${formatCurrency(wholePrice)}
                    </td>
                    <td className="py-3.5 px-4 pr-6 text-xs text-slate-400 italic">
                      {item.remarks || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary Footer Bar - Crisp Light Slate Palette */}
        <div className="px-6 py-4 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium">
            Verified Line Items: <span className="font-bold text-slate-800">{items.length}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-xs">
              <span className="text-slate-400 uppercase font-bold tracking-wider block text-[10px]">Net Accepted Qty</span>
              <span className="text-base font-extrabold text-indigo-600 font-mono">
                {totalNetAcceptedQty} Units
              </span>
            </div>
            <div className="text-xs text-right">
              <span className="text-slate-400 uppercase font-bold tracking-wider block text-[10px]">Total Goods Receipt Value</span>
              <span className="text-lg font-black text-emerald-600 font-mono">
                ${formatCurrency(totalGoodsReceiptValue)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

