import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Layers,
  Tag,
  Percent,
  Gauge,
  Users,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  Plus,
  Star,
  Globe,
  Warehouse,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { priceTiersApi, productPricesApi, discountRulesApi, salesQuotasApi } from '../pricingApi';
import { customersApi } from '../../customers/customersApi';
import { usePermission } from '../../../hooks/usePermission';
import PricingNavHeader from '../components/PricingNavHeader';
import PricingFlowDiagram from '../components/PricingFlowDiagram';
import Button from '../../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import api from '../../../services/api';

export default function PricingHubPage() {
  const navigate = useNavigate();

  const { can: canViewTiers } = usePermission('PRICE_TIER_VIEW');
  const { can: canViewPrices } = usePermission('PRODUCT_PRICE_VIEW');
  const { can: canViewDiscounts } = usePermission('DISCOUNT_VIEW');
  const { can: canViewQuotas } = usePermission('QUOTA_VIEW');

  // KPI Queries
  const { data: tiersData = [] } = useQuery({
    queryKey: ['price-tiers-overview'],
    queryFn: async () => {
      const res = await priceTiersApi.list({ limit: 10 });
      return res.data?.data || res.data || [];
    },
    enabled: canViewTiers,
  });

  const { data: customersData = [] } = useQuery({
    queryKey: ['customers-list-overview'],
    queryFn: async () => {
      const res = await customersApi.getCustomers({ limit: 200 });
      return res.data?.customers || res.data?.data || [];
    },
    enabled: canViewTiers,
  });

  const { data: pricesData = [] } = useQuery({
    queryKey: ['product-prices-overview'],
    queryFn: async () => {
      const res = await productPricesApi.list({ limit: 6 });
      return res.data?.data || res.data || [];
    },
    enabled: canViewPrices,
  });

  const { data: discountsData = [] } = useQuery({
    queryKey: ['discounts-overview'],
    queryFn: async () => {
      const res = await discountRulesApi.list({ limit: 6 });
      return res.data?.data || res.data || [];
    },
    enabled: canViewDiscounts,
  });

  const { data: quotasData = [] } = useQuery({
    queryKey: ['quotas-overview'],
    queryFn: async () => {
      const res = await salesQuotasApi.list({ limit: 6 });
      return res.data?.data || res.data || [];
    },
    enabled: canViewQuotas,
  });

  const tiers = Array.isArray(tiersData) ? tiersData : [];
  const customers = Array.isArray(customersData) ? customersData : [];
  const prices = Array.isArray(pricesData) ? pricesData : [];
  const discounts = Array.isArray(discountsData) ? discountsData : [];
  const quotas = Array.isArray(quotasData) ? quotasData : [];

  const defaultTier = useMemo(() => tiers.find((t) => t.isDefault), [tiers]);

  const assignedCustomersCount = useMemo(() => {
    return customers.filter((c) => Boolean(c.priceTierId || c.priceTier?.id)).length;
  }, [customers]);

  const activeDiscountsCount = useMemo(() => {
    return discounts.filter((d) => d.status === 'ACTIVE').length;
  }, [discounts]);

  const activeQuotasCount = useMemo(() => {
    return quotas.filter((q) => q.status === 'ACTIVE').length;
  }, [quotas]);

  if (!canViewTiers && !canViewPrices && !canViewDiscounts && !canViewQuotas) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          You do not have permission to view commercial pricing, discount configurations, or quota rules.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Navigation Header with Title, Description, Quick Actions, and Sub-tabs */}
      <PricingNavHeader
        title="Pricing Management"
        description="Manage customer pricing levels, warehouse unit rates, volume discounts, and purchase quotas."
        activeTab="overview"
      />

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Price Tiers */}
        <Link
          to="/pricing/tiers"
          className="p-5 rounded-2xl bg-card border border-border/80 hover:border-primary/50 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Price Tiers
            </span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-foreground font-mono tracking-tight">
              {tiers.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <span>Default:</span>
              <strong className="text-foreground">{defaultTier?.name || 'Base Catalog'}</strong>
            </p>
          </div>
        </Link>

        {/* KPI 2: Active Discounts */}
        <Link
          to="/pricing/discounts"
          className="p-5 rounded-2xl bg-card border border-border/80 hover:border-amber-500/50 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Active Discounts
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-foreground font-mono tracking-tight">
              {activeDiscountsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enforced wholesale volume & promo rules
            </p>
          </div>
        </Link>

        {/* KPI 3: Customers with Assigned Tiers */}
        <Link
          to="/pricing/customer-pricing"
          className="p-5 rounded-2xl bg-card border border-border/80 hover:border-emerald-500/50 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Customers with Tiers
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-foreground font-mono tracking-tight">
              {assignedCustomersCount}{' '}
              <span className="text-sm font-normal text-muted-foreground font-sans">
                / {customers.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Accounts on specialized commercial brackets
            </p>
          </div>
        </Link>

        {/* KPI 4: Active Quotas */}
        <Link
          to="/pricing/quotas"
          className="p-5 rounded-2xl bg-card border border-border/80 hover:border-purple-500/50 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Active Quotas
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 group-hover:scale-105 transition-transform">
              <Gauge className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-foreground font-mono tracking-tight">
              {activeQuotasCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Periodic purchase limits currently enforced
            </p>
          </div>
        </Link>
      </div>

      {/* Commercial Pricing Architecture Visual Flow */}
      <PricingFlowDiagram />

      {/* Pricing Management Sections Overview */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Pricing Configuration Modules</h2>
            <p className="text-xs text-muted-foreground">
              Direct access to commercial rule engines, price lists, and allocation directories.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Price Tiers */}
          {canViewTiers && (
            <Card hoverEffect className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    {tiers.length} Tiers
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground">Price Tiers</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Manage the customer pricing levels available across the system, default fallback levels, and priority weights.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <Link
                  to="/pricing/tiers/new"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Tier</span>
                </Link>
                <Link
                  to="/pricing/tiers"
                  className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <span>Manage Tiers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          )}

          {/* Card 2: Product Pricing */}
          {canViewPrices && (
            <Card hoverEffect className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
                    <Tag className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    {prices.length} Overrides
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground">Product Pricing</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Manage product prices by price tier and warehouse/branch override. Global tier rates automatically apply to all warehouses.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <Link
                  to="/pricing/product-prices/new"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Set Price</span>
                </Link>
                <Link
                  to="/pricing/product-prices"
                  className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <span>Manage Rates</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          )}

          {/* Card 3: Customer Pricing */}
          {canViewTiers && (
            <Card hoverEffect className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    {customers.length} Accounts
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground">Customer Pricing</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  See and manage which price tier is assigned to each customer account. Customers cannot self-select commercial brackets.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <Link
                  to="/pricing/customers/price-tier"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Assign Tier</span>
                </Link>
                <Link
                  to="/pricing/customer-pricing"
                  className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <span>View Directory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          )}

          {/* Card 4: Discount Rules */}
          {canViewDiscounts && (
            <Card hoverEffect className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Percent className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    {discounts.length} Rules
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground">Discount Rules</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Manage volume breaks, promotional percentages, and category incentives. Ranked strictly by specificity with no silent stacking.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <Link
                  to="/pricing/discounts/new"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Rule</span>
                </Link>
                <Link
                  to="/pricing/discounts"
                  className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <span>Manage Rules</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          )}

          {/* Card 5: Sales Quotas */}
          {canViewQuotas && (
            <Card hoverEffect className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    <Gauge className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    {quotas.length} Limits
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground">Sales Quotas</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Manage customer and product purchasing limits over daily, weekly, monthly, quarterly, and annual rolling cycles.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <Link
                  to="/pricing/quotas/new"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Define Quota</span>
                </Link>
                <Link
                  to="/pricing/quotas"
                  className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <span>Manage Limits</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Data Preview Table: Top Price Tiers */}
      {canViewTiers && tiers.length > 0 && (
        <Card noPadding>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Current Active Price Tiers</h3>
              <p className="text-xs text-muted-foreground">Commercial hierarchy configured across wholesale operations.</p>
            </div>
            <Link
              to="/pricing/tiers"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All Price Tiers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier Name</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Default Fallback</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.slice(0, 5).map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell>
                    <div className="font-bold text-foreground flex items-center gap-1.5">
                      <span>{tier.name}</span>
                      {tier.isDefault && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    </div>
                    {tier.description && (
                      <div className="text-[11px] text-muted-foreground line-clamp-1">{tier.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground">
                      {tier.priority ?? 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    {tier.isDefault ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/30">
                        <Star className="w-3 h-3 fill-amber-500" />
                        <span>DEFAULT</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tier.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {tier.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => navigate(`/pricing/tiers/${tier.id}/edit`)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
