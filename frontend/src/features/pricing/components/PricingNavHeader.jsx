import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Layers,
  Tag,
  Users,
  Percent,
  Gauge,
  Plus,
  UserCheck,
} from 'lucide-react';
import { usePermission } from '../../../hooks/usePermission';
import Button from '../../../components/ui/Button';

export default function PricingNavHeader({ title, description, activeTab: customActiveTab, children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const { can: canViewTiers } = usePermission('PRICE_TIER_VIEW');
  const { can: canCreateTier } = usePermission('PRICE_TIER_CREATE');
  const { can: canViewPrices } = usePermission('PRODUCT_PRICE_VIEW');
  const { can: canCreatePrice } = usePermission('PRODUCT_PRICE_CREATE');
  const { can: canViewDiscounts } = usePermission('DISCOUNT_VIEW');
  const { can: canCreateDiscount } = usePermission('DISCOUNT_CREATE');
  const { can: canViewQuotas } = usePermission('QUOTA_VIEW');
  const { can: canCreateQuota } = usePermission('QUOTA_CREATE');
  const { can: canAssignCustomerTier } = usePermission('PRICE_TIER_UPDATE');

  const tabs = [
    {
      id: 'tiers',
      label: 'Price Tiers',
      href: '/pricing/tiers',
      icon: Layers,
      show: canViewTiers,
    },
    {
      id: 'product-prices',
      label: 'Product Pricing',
      href: '/pricing/product-prices',
      icon: Tag,
      show: canViewPrices,
    },
    {
      id: 'customer-pricing',
      label: 'Customer Pricing',
      href: '/pricing/customer-pricing',
      icon: Users,
      show: canViewTiers,
    },
    {
      id: 'discounts',
      label: 'Discount Rules',
      href: '/pricing/discounts',
      icon: Percent,
      show: canViewDiscounts,
    },
    {
      id: 'quotas',
      label: 'Sales Quotas',
      href: '/pricing/quotas',
      icon: Gauge,
      show: canViewQuotas,
    },
  ].filter((t) => t.show);

  // Determine which tab is currently active
  const currentTabId =
    customActiveTab ||
    (location.pathname.startsWith('/pricing/product-prices')
      ? 'product-prices'
      : location.pathname.startsWith('/pricing/customer-pricing') || location.pathname.startsWith('/pricing/customers')
      ? 'customer-pricing'
      : location.pathname.startsWith('/pricing/discounts')
      ? 'discounts'
      : location.pathname.startsWith('/pricing/quotas')
      ? 'quotas'
      : 'tiers');

  const getIsActive = (tab) => tab.id === currentTabId;

  return (
    <div className="space-y-5 pb-2">
      {/* Header & Page-Specific Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
              Commercial Engine
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {title || 'Pricing Management'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {description || 'Manage customer pricing tiers, warehouse unit rates, volume discounts, and purchase quotas.'}
          </p>
        </div>

        {/* Page-Specific Action Button Only */}
        <div className="flex items-center gap-2">
          {children ? (
            children
          ) : (
            <>
              {currentTabId === 'tiers' && canCreateTier && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => navigate('/pricing/tiers/new')}
                  className="text-xs"
                >
                  New Price Tier
                </Button>
              )}

              {currentTabId === 'product-prices' && canCreatePrice && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => navigate('/pricing/product-prices/new')}
                  className="text-xs"
                >
                  Set Product Price
                </Button>
              )}

              {currentTabId === 'customer-pricing' && canAssignCustomerTier && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<UserCheck className="w-3.5 h-3.5" />}
                  onClick={() => navigate('/pricing/customers/price-tier')}
                  className="text-xs"
                >
                  Assign Customer Tier
                </Button>
              )}

              {currentTabId === 'discounts' && canCreateDiscount && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => navigate('/pricing/discounts/new')}
                  className="text-xs"
                >
                  New Discount Rule
                </Button>
              )}

              {currentTabId === 'quotas' && canCreateQuota && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => navigate('/pricing/quotas/new')}
                  className="text-xs"
                >
                  Define Sales Quota
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border overflow-x-auto shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = getIsActive(tab);
          return (
            <Link
              key={tab.id}
              to={tab.href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
