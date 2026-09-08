import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  UserCheck,
  Search,
  ArrowRight,
  ArrowLeft,
  Layers,
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { priceTiersApi } from '../pricingApi';
import { customersApi } from '../../customers/customersApi';
import PricingBreadcrumbs from '../components/PricingBreadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';

export default function AssignCustomerTierPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const initialCustomerId = searchParams.get('customerId') || '';

  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId);
  const [selectedTierId, setSelectedTierId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');

  // Fetch customers
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers-list-pricing'],
    queryFn: async () => {
      const res = await customersApi.getCustomers({ limit: 200 });
      return res.data?.customers || res.data?.data || [];
    },
  });

  // Fetch price tiers
  const { data: tiersData, isLoading: isLoadingTiers } = useQuery({
    queryKey: ['price-tiers'],
    queryFn: async () => {
      const res = await priceTiersApi.list({ limit: 100 });
      return res.data?.data || res.data || [];
    },
  });

  const customers = Array.isArray(customersData) ? customersData : [];
  const tiers = Array.isArray(tiersData) ? tiersData : [];

  const defaultTier = useMemo(() => tiers.find((t) => t.isDefault), [tiers]);

  // Selected customer object
  const currentCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // When customer changes, initialize selectedTierId with customer's current tier
  useEffect(() => {
    if (currentCustomer) {
      setSelectedTierId(currentCustomer.priceTierId || currentCustomer.priceTier?.id || '');
    }
  }, [currentCustomer]);

  // If customerId param is passed on mount
  useEffect(() => {
    if (initialCustomerId && customers.length > 0) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId, customers]);

  // Current tier object of customer
  const currentTier = useMemo(() => {
    if (!currentCustomer) return null;
    const tierId = currentCustomer.priceTierId || currentCustomer.priceTier?.id;
    if (!tierId) return null;
    return tiers.find((t) => t.id === tierId) || currentCustomer.priceTier;
  }, [currentCustomer, tiers]);

  // Newly selected tier object
  const newTier = useMemo(() => {
    if (!selectedTierId) return null;
    return tiers.find((t) => t.id === selectedTierId);
  }, [selectedTierId, tiers]);

  // Mutation to update customer price tier
  const assignMutation = useMutation({
    mutationFn: async ({ customerId, priceTierId }) => {
      return customersApi.updateCustomer(customerId, {
        priceTierId: priceTierId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-list-pricing'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['price-tiers'] });
      toast.success(
        newTier
          ? `Assigned tier "${newTier.name}" to ${currentCustomer?.name || 'customer'}`
          : `Reset ${currentCustomer?.name || 'customer'} to default tier`
      );
      navigate('/pricing/customer-pricing');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update customer price tier');
    },
  });

  const handleAssign = (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error('Please select a customer first');
      return;
    }
    assignMutation.mutate({
      customerId: selectedCustomerId,
      priceTierId: selectedTierId || null,
    });
  };

  // Filtered customers for the table below
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = tableSearch.toLowerCase();
      const name = (c.name || '').toLowerCase();
      const code = (c.customerCode || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      return name.includes(q) || code.includes(q) || phone.includes(q);
    });
  }, [customers, tableSearch]);

  const isSaving = assignMutation.isPending;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      <PricingBreadcrumbs
        items={[
          { label: 'Customer Pricing', href: '/pricing/customer-pricing' },
          { label: 'Assign Price Tier' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/pricing/customer-pricing')}
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-primary" />
              <span>Assign Customer Price Tier</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Authorized commercial operation. Define wholesale price levels for customer accounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/pricing/customer-pricing')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            icon={<CheckCircle2 className="w-4 h-4" />}
            loading={isSaving}
            disabled={!selectedCustomerId || isSaving}
            onClick={handleAssign}
          >
            Confirm Assignment
          </Button>
        </div>
      </div>

      {/* Authorized Staff Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-foreground block mb-0.5">
            Strict Commercial Governance
          </span>
          Customer accounts cannot choose their own price tiers. Tier assignment is an authorized administrative action that immediately governs future order quotations and invoice settlement.
        </div>
      </div>

      {/* Main Assignment Form & Preview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Pricing Tier Selection</CardTitle>
                <CardDescription>
                  Select target customer account and commercial tier.
                </CardDescription>
              </div>
            </CardHeader>

            <form onSubmit={handleAssign} className="space-y-4">
              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Target Customer <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                >
                  <option value="">-- Choose Customer Account --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode || 'No Code'}) - {c.customerType || 'Customer'}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  You can also click "Select" on any customer in the table below.
                </p>
              </div>

              {/* Price Tier Selector */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Assigned Price Tier <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedTierId}
                  onChange={(e) => setSelectedTierId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                >
                  <option value="">
                    System Default Tier {defaultTier ? `(${defaultTier.name})` : '(Base Price)'}
                  </option>
                  {tiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.isDefault ? '★ [Default]' : ''} - Priority {t.priority}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Selecting "System Default" will remove custom tier overrides for this account.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/80">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/pricing/customer-pricing')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  loading={isSaving}
                  disabled={!selectedCustomerId || isSaving}
                >
                  Assign Price Tier
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Live Comparison Preview */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col justify-between">
            <div>
              <CardHeader>
                <div>
                  <CardTitle>Assignment Impact Preview</CardTitle>
                  <CardDescription>
                    Real-time verification before applying changes.
                  </CardDescription>
                </div>
              </CardHeader>

              {currentCustomer ? (
                <div className="space-y-4">
                  {/* Customer Badge */}
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                      Customer Profile
                    </div>
                    <div className="text-base font-bold text-foreground">
                      {currentCustomer.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span className="font-mono">{currentCustomer.customerCode}</span>
                      <span>•</span>
                      <span>{currentCustomer.phone || 'No phone'}</span>
                    </div>
                  </div>

                  {/* Tier Comparison */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-card border border-border">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                        Current Tier
                      </div>
                      {currentTier ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-muted text-foreground border border-border">
                          {currentTier.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted/50 text-muted-foreground border border-border/50">
                          {defaultTier ? `${defaultTier.name} (Default)` : 'Base Selling Price'}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-primary tracking-wider mb-1">
                        New Assigned Tier
                      </div>
                      {newTier ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-primary/10 text-primary border border-primary/30">
                          {newTier.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted text-muted-foreground border border-border">
                          {defaultTier ? `${defaultTier.name} (Default)` : 'Base Selling Price'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tier Description & Details */}
                  {newTier && (
                    <div className="p-3 rounded-xl bg-card border border-border text-xs space-y-1.5">
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        <span>Tier Configuration</span>
                      </div>
                      <div className="text-muted-foreground">
                        {newTier.description || 'No description provided for this tier.'}
                      </div>
                      <div className="text-[11px] text-muted-foreground/80 pt-1">
                        Priority Level: <span className="font-bold text-foreground">{newTier.priority}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                  <UserCheck className="w-10 h-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-medium">No Customer Selected</p>
                  <p className="text-xs text-muted-foreground max-w-xs mt-1">
                    Select a customer account on the left or click "Select" from the table below to preview tier impact.
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-muted/20 border border-border/60 text-[11px] text-muted-foreground mt-4">
              <span className="font-bold text-foreground block mb-0.5">Automated Calculation:</span>
              Once saved, future quotations and orders for this customer will instantly resolve product prices configured for this tier.
            </div>
          </Card>
        </div>
      </div>

      {/* Searchable Customer Table for Quick Selection */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
            <div>
              <CardTitle>Customer Directory</CardTitle>
              <CardDescription>
                Select a customer to quickly populate the assignment form above.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customer name, code..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>
          </div>
        </CardHeader>

        {isLoadingCustomers ? (
          <div className="p-8 text-center text-muted-foreground text-xs">
            Loading customer directory...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs">
            No customer accounts found matching "{tableSearch}".
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Current Tier</TableHead>
                <TableHead>Credit Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.slice(0, 10).map((cust) => {
                const isSelected = cust.id === selectedCustomerId;
                const custTierId = cust.priceTierId || cust.priceTier?.id;
                const custTier = tiers.find((t) => t.id === custTierId) || cust.priceTier;
                return (
                  <TableRow
                    key={cust.id}
                    className={isSelected ? 'bg-primary/5 font-semibold' : ''}
                  >
                    <TableCell>
                      <div className="font-bold text-foreground">{cust.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {cust.customerCode}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {cust.customerType || 'Customer'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {custTier ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                          {custTier.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground">
                          {defaultTier ? `${defaultTier.name} (Default)` : 'Base Price'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">
                        {cust.creditLimit ? `${Number(cust.creditLimit).toLocaleString()} ETB` : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          cust.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {cust.status || 'ACTIVE'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="xs"
                        variant={isSelected ? 'primary' : 'outline'}
                        onClick={() => setSelectedCustomerId(cust.id)}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
