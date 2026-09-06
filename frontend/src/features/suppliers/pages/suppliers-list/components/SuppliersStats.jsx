import React from 'react';

export default function SuppliersStats({
  totalSuppliers = 0,
  activeSuppliers = 0,
  totalSpentETB = 0,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="p-4 bg-card900 border border-border rounded-2xl backdrop-blur-xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xl font-bold">
          🏢
        </div>
        <div>
          <div className="text-xs font-bold text-muted-foreground uppercase">Total Suppliers</div>
          <div className="text-2xl font-mono font-extrabold text-foreground mt-0.5">{totalSuppliers}</div>
        </div>
      </div>

      <div className="p-4 bg-card900 border border-emerald-500/30 rounded-2xl backdrop-blur-xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold">
          ✅
        </div>
        <div>
          <div className="text-xs font-bold text-emerald-400 uppercase">Active Vendors</div>
          <div className="text-2xl font-mono font-extrabold text-emerald-400 mt-0.5">{activeSuppliers}</div>
        </div>
      </div>

      <div className="p-4 bg-card900 border border-indigo-500/30 rounded-2xl backdrop-blur-xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xl font-bold">
          💰
        </div>
        <div>
          <div className="text-xs font-bold text-indigo-400 uppercase">Total Sourced Volume</div>
          <div className="text-2xl font-mono font-extrabold text-indigo-400 mt-0.5">
            {totalSpentETB.toLocaleString()} ETB
          </div>
        </div>
      </div>
    </div>
  );
}
