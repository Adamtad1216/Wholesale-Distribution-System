import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../../financeApi';
import { customersApi } from '../../../customers/customersApi';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
import { CreditCard, ShieldCheck, User, Plus } from 'lucide-react';
import GrantCreditModal from './GrantCreditModal';
import CreditDetailView from './CreditDetailView';

const STATUS_STYLE = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  EXHAUSTED: 'bg-muted text-muted-foreground border border-border',
  EXPIRED: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  CANCELLED: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB', maximumFractionDigits: 2 }).format(amount || 0).replace('ETB', '') + ' ETB';

export default function CreditTab() {
  const queryClient = useQueryClient();
  const [selectedCreditId, setSelectedCreditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState(new Set());
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch all store credits
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['credits-list'],
    queryFn: () => financeApi.getAllCredits(),
    staleTime: 5000,
    refetchOnMount: 'always',
  });

  // Fetch Customers for Grant Credit modal
  const { data: customersResponse } = useQuery({
    queryKey: ['customers-list-for-credit'],
    queryFn: () => customersApi.getCustomers(),
    enabled: isModalOpen,
  });

  // Derive flat customers array from API response (handles various response shapes)
  const customersList = useMemo(() => {
    const raw = customersResponse?.data;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.data?.customers)) return raw.data.customers;
    if (Array.isArray(raw.data?.items)) return raw.data.items;
    if (Array.isArray(raw.customers)) return raw.customers;
    if (Array.isArray(raw.items)) return raw.items;
    return [];
  }, [customersResponse]);

  const credits = response?.data || [];

  // Filter credits
  const filteredCredits = useMemo(() => {
    return credits.filter((c) => {
      const cust = c.customer;
      const personName = cust?.person ? `${cust.person.firstName} ${cust.person.lastName}` : '';
      const orgName = cust?.organization?.name || '';
      const custCode = cust?.customerCode || '';
      const creditNo = c.creditNumber || '';

      const query = searchTerm.toLowerCase();
      const matchesSearch =
        personName.toLowerCase().includes(query) ||
        orgName.toLowerCase().includes(query) ||
        custCode.toLowerCase().includes(query) ||
        creditNo.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [credits, searchTerm, statusFilter]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalGranted = credits.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const activeBalance = credits
      .filter((c) => c.status === 'ACTIVE')
      .reduce((sum, c) => sum + Number(c.remainingBalance || 0), 0);
    const uniqueCustomers = new Set(credits.map((c) => c.customerId)).size;

    return { totalGranted, activeBalance, uniqueCustomers };
  }, [credits]);

  // Handle Grant Credit Submission (multi-customer)
  const handleGrantCredit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (selectedCustomerIds.size === 0) {
      setFormError('Please select at least one customer.');
      return;
    }
    const numAmount = parseFloat(creditAmount);
    if (!numAmount || numAmount <= 0) {
      setFormError('Please enter a valid credit amount greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      await Promise.all(
        Array.from(selectedCustomerIds).map((customerId) =>
          financeApi.createManualCredit({
            customerId,
            amount: numAmount,
            reason: creditReason || 'Manual store credit issued by Finance Manager',
          })
        )
      );

      queryClient.invalidateQueries(['credits-list']);

      setIsModalOpen(false);
      setSelectedCustomerIds(new Set());
      setCreditAmount('');
      setCreditReason('');
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to issue store credit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render detail view if a credit record is selected
  if (selectedCreditId) {
    return <CreditDetailView creditId={selectedCreditId} onBack={() => setSelectedCreditId(null)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border border-border bg-card900">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Credit Granted</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{formatCurrency(stats.totalGranted)}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-border bg-card900">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Active Store Balance</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{formatCurrency(stats.activeBalance)}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-border bg-card900">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Customers with Credit</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{stats.uniqueCustomers} Customers</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter & Search Toolbar + Grant Credit Action Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search customer, code, or credit #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card900 border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Status Dropdown Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-card900 border border-border rounded-lg px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXHAUSTED">Exhausted</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsModalOpen(true)}
            className="py-2 px-4 whitespace-nowrap shrink-0 rounded-lg"
          >
            Grant Store Credit
          </Button>
        </div>
      </div>

      {/* Table List */}
      <Card className="p-0 overflow-hidden border border-border bg-card900 shadow-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted800/50 border-b border-border">
              <TableHead className="py-3.5 text-xs font-bold text-foreground">Customer / User</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground">Customer Code</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground">Credit #</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground text-right">Granted Amount</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground text-right">Remaining Balance</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground text-center">Status</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground">Issued Date</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading customer credit records...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-red-400 py-12">
                  Failed to load credit records.
                </TableCell>
              </TableRow>
            ) : filteredCredits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center text-center w-full space-y-2">
                    <div className="text-4xl mb-1">💳</div>
                    <h3 className="text-base font-bold text-foreground">No Credit Records Found</h3>
                    <p className="text-sm text-muted-foreground">No customer credits match your filter criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCredits.map((c) => {
                const cust = c.customer;
                const customerName = cust?.person
                  ? `${cust.person.firstName} ${cust.person.lastName}`
                  : cust?.organization?.name || 'Unknown Customer';
                const email = cust?.person?.email || cust?.organization?.email || '';

                return (
                  <TableRow key={c.id} className="hover:bg-muted800/30 transition">
                    <TableCell className="py-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{customerName}</p>
                        {email && <p className="text-xs text-muted-foreground">{email}</p>}
                      </div>
                    </TableCell>

                    <TableCell className="py-4 text-xs font-mono font-medium text-muted-foreground">
                      {cust?.customerCode || '—'}
                    </TableCell>

                    <TableCell className="py-4">
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded font-semibold text-foreground">
                        {c.creditNumber}
                      </span>
                    </TableCell>

                    <TableCell className="py-4 text-right font-medium text-foreground text-sm">
                      {formatCurrency(c.amount)}
                    </TableCell>

                    <TableCell className="py-4 text-right">
                      <span className={`font-bold text-sm ${Number(c.remainingBalance) > 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                        {formatCurrency(c.remainingBalance)}
                      </span>
                    </TableCell>

                    <TableCell className="py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${STATUS_STYLE[c.status] || STATUS_STYLE.ACTIVE}`}>
                        {c.status}
                      </span>
                    </TableCell>

                    <TableCell className="py-4 text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell className="py-4 text-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedCreditId(c.id)}
                        className="text-xs px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-colors"
                      >
                        View Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Reusable Grant Store Credit Modal */}
      <GrantCreditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customersList={customersList}
        selectedCustomerIds={selectedCustomerIds}
        setSelectedCustomerIds={setSelectedCustomerIds}
        creditAmount={creditAmount}
        setCreditAmount={setCreditAmount}
        creditReason={creditReason}
        setCreditReason={setCreditReason}
        handleGrantCredit={handleGrantCredit}
        isSubmitting={isSubmitting}
        formError={formError}
      />
    </div>
  );
}
