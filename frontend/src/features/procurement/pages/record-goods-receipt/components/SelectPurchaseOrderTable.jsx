import React from 'react';
import Card from '../../../../../components/ui/Card';
import Button from '../../../../../components/ui/Button';

export default function SelectPurchaseOrderTable({
  approvedPos = [],
  loadingPos = false,
  selectedPoId = '',
  onSelectPo,
  onDeselect,
  getSupplierName,
}) {
  const selectedPo = approvedPos.find((p) => p.id === selectedPoId);

  return (
    <Card className="border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
      <div className="p-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <span>1️⃣</span> Select Approved Purchase Order
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose an approved purchase order from the table below to record incoming goods.
          </p>
        </div>
        {selectedPo && (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            ✓ Selected: {selectedPo.poNumber}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-muted800/80 border-b border-border text-muted-foreground uppercase font-bold tracking-wider">
              <th className="py-3.5 px-4">PO Number</th>
              <th className="py-3.5 px-4">Supplier Vendor</th>
              <th className="py-3.5 px-4">Destination Warehouse</th>
              <th className="py-3.5 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 font-medium">
            {loadingPos ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-muted-foreground">
                  <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p>Loading approved purchase orders...</p>
                </td>
              </tr>
            ) : approvedPos.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-muted-foreground">
                  ⚠️ No approved purchase orders currently pending goods receipt.
                </td>
              </tr>
            ) : (
              approvedPos.map((po) => {
                const isSelected = selectedPoId === po.id;
                return (
                  <tr
                    key={po.id}
                    className={`transition ${isSelected ? 'bg-indigo-500/10 font-semibold' : 'hover:bg-muted800/30'}`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                      {po.poNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      {getSupplierName ? getSupplierName(po.supplier) : 'Supplier Vendor'}
                    </td>
                    <td className="py-3.5 px-4 text-foreground">
                      {po.warehouse?.name || 'Main Warehouse'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Button
                        type="button"
                        variant={isSelected ? 'danger' : 'secondary'}
                        size="xs"
                        onClick={() => {
                          if (isSelected) {
                            if (onDeselect) onDeselect();
                            else onSelectPo('');
                          } else {
                            onSelectPo(po.id);
                          }
                        }}
                      >
                        {isSelected ? '✖ Deselect PO' : '📦 Create Goods Receipt'}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
