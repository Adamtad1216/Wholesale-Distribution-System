import React from 'react';

export default function SupplierDetailTabs({
  activeTab,
  onTabChange,
  totalPoCount = 0,
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-1">
      <button
        onClick={() => onTabChange('OVERVIEW')}
        className={`px-4 py-2.5 rounded-xl font-bold text-xs transition border ${
          activeTab === 'OVERVIEW'
            ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
            : 'bg-muted800/40 text-muted-foreground border-transparent hover:bg-muted800 hover:text-foreground'
        }`}
      >
        📄 Vendor Profile & Contact
      </button>

      <button
        onClick={() => onTabChange('ORDERS')}
        className={`px-4 py-2.5 rounded-xl font-bold text-xs transition border ${
          activeTab === 'ORDERS'
            ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
            : 'bg-muted800/40 text-muted-foreground border-transparent hover:bg-muted800 hover:text-foreground'
        }`}
      >
        📋 Purchase Orders ({totalPoCount})
      </button>
    </div>
  );
}
