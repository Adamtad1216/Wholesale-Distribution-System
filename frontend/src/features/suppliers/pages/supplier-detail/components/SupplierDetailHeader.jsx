import React from 'react';
import Button from '../../../../../components/ui/Button';

export default function SupplierDetailHeader({
  supplier,
  isIndividual,
  onBack,
  onEdit,
  onCreatePo,
}) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-6">
      <div>
        <button
          onClick={onBack}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-2 transition"
        >
          ← Back to Suppliers Directory
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-bold rounded-lg uppercase">
            {supplier.supplierCode || 'SUP-000'}
          </span>
          <span className="px-2.5 py-0.5 bg-muted800 text-muted-foreground border border-border text-[11px] font-bold rounded-full uppercase">
            {isIndividual ? '👤 Individual Person' : '🏢 Company / Organization'}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
              supplier.status === 'ACTIVE'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {supplier.status || 'ACTIVE'}
          </span>
        </div>

        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mt-1.5">
          {supplier.name || supplier.companyName}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isIndividual
            ? 'Individual Vendor / Freelance Agricultural Supplier'
            : supplier.companyName || 'Corporate Wholesale Supplier'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="secondary" size="md" onClick={onEdit}>
          ✏️ Edit Supplier
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={onCreatePo}
          className="shadow-lg shadow-indigo-500/20"
        >
          🛍️ Create PO for Vendor
        </Button>
      </div>
    </div>
  );
}
