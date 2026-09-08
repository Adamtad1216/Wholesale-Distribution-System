import React from 'react';
import PricingNavHeader from '../components/PricingNavHeader';
import DiscountRulesTab from '../components/DiscountRulesTab';

export default function DiscountRulesListPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PricingNavHeader
        title="Discount Rules"
        description="Create and manage volume-based, category, and promotional pricing discounts."
        activeTab="discounts"
      />
      <DiscountRulesTab showHeader={false} />
    </div>
  );
}
