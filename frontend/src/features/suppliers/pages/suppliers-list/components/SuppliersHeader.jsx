import React from 'react';
import Button from '../../../../../components/ui/Button';

export default function SuppliersHeader({ onRegisterNew }) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold rounded-lg uppercase tracking-wider">
            Vendor Directory & Sourcing Management
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mt-2 flex items-center gap-2">
          <span>🏭</span> Supplier Management
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Maintain wholesale supplier vendors, tax TIN profiles, contact persons, and purchasing credit terms.
        </p>
      </div>

      <Button
        variant="primary"
        size="md"
        onClick={onRegisterNew}
        className="px-5 shadow-lg shadow-indigo-500/20 flex items-center gap-2"
      >
        <span>➕</span> Register New Supplier
      </Button>
    </div>
  );
}
