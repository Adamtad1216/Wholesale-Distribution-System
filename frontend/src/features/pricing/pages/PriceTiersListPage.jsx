import React from 'react';
import PricingNavHeader from '../components/PricingNavHeader';
import PriceTiersTab from '../components/PriceTiersTab';

export default function PriceTiersListPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PricingNavHeader
        title="Price Tiers"
        description="Manage customer pricing levels, priority weights, and fallback defaults."
        activeTab="tiers"
      />
      <PriceTiersTab showHeader={false} />
    </div>
  );
}
