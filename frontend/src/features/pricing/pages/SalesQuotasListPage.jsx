import React from 'react';
import PricingNavHeader from '../components/PricingNavHeader';
import SalesQuotasTab from '../components/SalesQuotasTab';

export default function SalesQuotasListPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PricingNavHeader
        title="Sales Quotas"
        description="Control how much customers are allowed to purchase over rolling periods."
        activeTab="quotas"
      />
      <SalesQuotasTab showHeader={false} />
    </div>
  );
}
