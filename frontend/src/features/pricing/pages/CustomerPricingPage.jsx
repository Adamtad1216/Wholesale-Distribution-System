import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  Layers,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building,
} from 'lucide-react';
import { priceTiersApi } from '../pricingApi';
import { customersApi } from '../../customers/customersApi';
import PricingNavHeader from '../components/PricingNavHeader';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';

export default function CustomerPricingPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterTierId, setFilterTierId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch customers
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers-list-pricing'],
    queryFn: async () => {
      const res = await customersApi.getCustomers({ limit: 300 });
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

  // Statistics
  const assignedCount = useMemo(() => {
    return customers.filter((c) => Boolean(c.priceTierId || c.priceTier?.id)).length;
  }, [customers]);

  const defaultCount = customers.length - assignedCount;

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const q = search.toLowerCase();
      const name = (cust.name || '').toLowerCase();
      const code = (cust.customerCode || '').toLowerCase();
      const phone = (cust.phone || '').toLowerCase();
      const matchesSearch = !search || name.includes(q) || code.includes(q) || phone.includes(q);

      const custTierId = cust.priceTierId || cust.priceTier?.id || '';
      const matchesTier = !filterTierId || (filterTierId === 'DEFAULT' ? !custTierId : custTierId === filterTierId);

      const matchesStatus = !filterStatus || cust.status === filterStatus;

      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [customers, search, filterTierId, filterStatus]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PricingNavHeader
        title="Customer Pricing Directory"
        description="Review customer tier assignments, payment terms, and assign customized wholesale rates."
        activeTab="customer-pricing"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Customers
            </span>
            <div className="text-2xl font-black text-foreground font-mono mt-0.5">
              {customers.length}
            </div>
            <span className="text-[11px] text-muted-foreground">Active directory records</span>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Custom Tier Assigned
            </span>
            <div className="text-2xl font-black text-emerald-500 font-mono mt-0.5">
              {assignedCount}
            </div>
            <span className="text-[11px] text-muted-foreground">Accounts with custom pricing</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Default Fallback Tier
            </span>
            <div className="text-2xl font-black text-foreground font-mono mt-0.5">
              {defaultCount}
            </div>
            <span className="text-[11px] text-muted-foreground">
              Inherit {defaultTier ? `"${defaultTier.name}"` : 'base catalog price'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-muted text-muted-foreground border border-border">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <Card noPadding className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, code, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={filterTierId}
              onChange={(e) => setFilterTierId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            >
              <option value="">All Price Tiers</option>
              <option value="DEFAULT">Default Fallback Tier Only</option>
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {(search || filterTierId || filterStatus) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSearch('');
                  setFilterTierId('');
                  setFilterStatus('');
                }}
                className="text-xs shrink-0"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Customers Table */}
      {isLoadingCustomers || isLoadingTiers ? (
        <div className="p-12 text-center text-muted-foreground text-sm">
          Loading customer commercial directory...
        </div>
      ) : filteredCustomers.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
          <p className="font-bold text-foreground">No customers found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search query or tier filters.
          </p>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Assigned Price Tier</TableHead>
              <TableHead>Credit Limit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((cust) => {
              const custTierId = cust.priceTierId || cust.priceTier?.id;
              const custTier = tiers.find((t) => t.id === custTierId) || cust.priceTier;
              const isDefaultTier = !custTier;

              return (
                <TableRow key={cust.id}>
                  <TableCell>
                    <div className="font-bold text-foreground">{cust.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{cust.customerCode || '—'}</span>
                      {cust.phone && (
                        <>
                          <span>•</span>
                          <span>{cust.phone}</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground font-medium">
                      {cust.customerType || 'ORGANIZATION'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {custTier ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{custTier.name}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-muted text-muted-foreground border border-border">
                        <span>{defaultTier ? `${defaultTier.name} (Default)` : 'Base Selling Price'}</span>
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs font-semibold text-foreground">
                      {cust.creditLimit ? `${Number(cust.creditLimit).toLocaleString()} ETB` : 'No Limit'}
                    </div>
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
                      variant="outline"
                      icon={<UserCheck className="w-3 h-3" />}
                      onClick={() => navigate(`/pricing/customers/price-tier?customerId=${cust.id}`)}
                    >
                      Change Tier
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
