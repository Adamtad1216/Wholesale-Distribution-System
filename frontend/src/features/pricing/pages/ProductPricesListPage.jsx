import React from 'react';
import PricingNavHeader from '../components/PricingNavHeader';
import ProductPricesTab from '../components/ProductPricesTab';

export default function ProductPricesListPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PricingNavHeader
        title="Product Pricing"
        description="Manage product prices by price tier and warehouse/branch override."
        activeTab="product-prices"
      />
      <ProductPricesTab showHeader={false} />
    </div>
  );
}
