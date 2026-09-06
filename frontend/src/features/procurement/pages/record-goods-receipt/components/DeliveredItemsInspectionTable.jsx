import React from 'react';

export default function DeliveredItemsInspectionTable({
  items = [],
  loadingPoDetails = false,
  onUpdateItem,
}) {
  const totalAcceptedQty = items.reduce(
    (acc, item) => acc + Math.max(0, Number(item.receivedQuantity || 0) - Number(item.damagedQuantity || 0)),
    0
  );

  const grandTotalValue = items.reduce((acc, item) => {
    const net = Math.max(0, Number(item.receivedQuantity || 0) - Number(item.damagedQuantity || 0));
    return acc + net * Number(item.unitCost || 0);
  }, 0);

  return (
    <div className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden text-slate-800">
      <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span>2️⃣</span> Verify Delivered Quantities & Inspection
        </h3>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-3 py-1 rounded-full">
          {items.length} Line Items
        </span>
      </div>

      {loadingPoDetails ? (
        <div className="p-8 text-center text-xs text-slate-400">
          Loading PO item details...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider text-[11px]">
                <th className="py-3.5 px-4 font-semibold">Product Item</th>
                <th className="py-3.5 px-4 text-center font-semibold">Ordered</th>
                <th className="py-3.5 px-4 text-center w-28 font-semibold">Received</th>
                <th className="py-3.5 px-4 text-center w-28 font-semibold">Damaged</th>
                <th className="py-3.5 px-4 text-center font-semibold">Accepted Net</th>
                <th className="py-3.5 px-4 text-center w-32 font-semibold">Single Price ($)</th>
                <th className="py-3.5 px-4 text-right font-semibold">Whole Price ($)</th>
                <th className="py-3.5 px-4 pr-6 min-w-[180px] font-semibold">Item Remark / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium">
              {items.map((item, idx) => {
                const netAccepted = Math.max(0, Number(item.receivedQuantity || 0) - Number(item.damagedQuantity || 0));
                const singlePrice = Number(item.unitCost || 0);
                const wholePrice = netAccepted * singlePrice;

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs">{item.productName}</div>
                      {item.productSku && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          SKU: {item.productSku}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-600 font-mono">
                      {item.orderedQuantity}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        value={item.receivedQuantity === 0 ? '' : item.receivedQuantity}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const val = raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0);
                          onUpdateItem(idx, 'receivedQuantity', val);
                        }}
                        className="w-20 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-emerald-700 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        value={item.damagedQuantity === 0 ? '' : item.damagedQuantity}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const val = raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0);
                          onUpdateItem(idx, 'damagedQuantity', val);
                        }}
                        className="w-20 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-rose-700 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold font-mono text-xs border border-indigo-100">
                        {netAccepted}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitCost === 0 ? '' : item.unitCost}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const val = raw === '' ? 0 : Math.max(0, parseFloat(raw) || 0);
                          onUpdateItem(idx, 'unitCost', val);
                        }}
                        className="w-24 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-xs">
                      ${wholePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 pr-6">
                      <input
                        type="text"
                        placeholder="Add item remark..."
                        value={item.remarks || ''}
                        onChange={(e) => {
                          onUpdateItem(idx, 'remarks', e.target.value);
                        }}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Financial Summary Footer Bar - Light Slate Palette */}
      <div className="px-6 py-4 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 font-medium">
          Total Accepted Line Items: <span className="font-bold text-slate-800">{items.length}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-xs">
            <span className="text-slate-400 uppercase font-bold tracking-wider block text-[10px]">Total Accepted Qty</span>
            <span className="text-base font-extrabold text-indigo-600 font-mono">
              {totalAcceptedQty} Units
            </span>
          </div>
          <div className="text-xs text-right">
            <span className="text-slate-400 uppercase font-bold tracking-wider block text-[10px]">Grand Total Goods Receipt Value</span>
            <span className="text-lg font-black text-emerald-600 font-mono">
              ${grandTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
