import React from 'react';

export default function SupplierDetailKPIs({
  supplier,
  isIndividual,
  totalPoCount = 0,
  totalPoValue = 0,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div className="p-4 bg-card900 border border-border rounded-2xl backdrop-blur-xl">
        <div className="text-[10px] font-bold uppercase text-muted-foreground">
          {isIndividual ? 'National / Kebele ID' : 'Tax TIN Number'}
        </div>
        <div className="text-lg font-mono font-bold text-indigo-400 mt-1">
          {isIndividual ? supplier.nationalId || supplier.tin || 'N/A' : supplier.tin || 'N/A'}
        </div>
      </div>

      <div className="p-4 bg-card900 border border-border rounded-2xl backdrop-blur-xl">
        <div className="text-[10px] font-bold uppercase text-muted-foreground">Credit Payment Terms</div>
        <div className="text-lg font-bold text-foreground mt-1">{supplier.paymentTerms || 'Net 30'}</div>
      </div>

      <div className="p-4 bg-card900 border border-border rounded-2xl backdrop-blur-xl">
        <div className="text-[10px] font-bold uppercase text-muted-foreground">Total Purchase Orders</div>
        <div className="text-lg font-mono font-extrabold text-foreground mt-1">
          {totalPoCount > 0 ? totalPoCount : supplier.totalOrders || 0} Orders
        </div>
      </div>

      <div className="p-4 bg-card900 border border-emerald-500/30 rounded-2xl backdrop-blur-xl">
        <div className="text-[10px] font-bold uppercase text-emerald-400">Total Sourced Volume</div>
        <div className="text-lg font-mono font-extrabold text-emerald-400 mt-1">
          {(totalPoValue > 0 ? totalPoValue : supplier.totalSpent || 0).toLocaleString()} ETB
        </div>
      </div>
    </div>
  );
}
