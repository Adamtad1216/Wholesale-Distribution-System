import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../financeApi';
import { customersApi } from '../../customers/customersApi';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Modal from '../../../components/ui/Modal';
import { ArrowLeft, CreditCard, ShieldCheck, User, Plus, FileText, AlertCircle } from 'lucide-react';

const STATUS_STYLE = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  EXHAUSTED: 'bg-muted text-muted-foreground border border-border',
  EXPIRED: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  CANCELLED: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB', maximumFractionDigits: 2 }).format(amount || 0).replace('ETB', '') + ' ETB';

// -------------------------------------------------------------
// CUSTOMER TAG SELECT COMPONENT
// A tag-based searchable multi-select for customers
// -------------------------------------------------------------
function CustomerTagSelect({ customers, selectedIds, onAdd, onRemove }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const getCustomerName = (cust) => {
    if (!cust) return '';
    return cust.person
      ? `${cust.person.firstName} ${cust.person.lastName}`
      : cust.organization?.name || 'Customer';
  };

  const getCustomerMeta = (cust) => {
    const email = cust.person?.email || cust.organization?.email || '';
    return [cust.customerCode, email].filter(Boolean).join(' • ');
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return customers.filter((c) => {
      if (selectedIds.has(c.id)) return false;
      const name = getCustomerName(c).toLowerCase();
      const email = (c.person?.email || c.organization?.email || '').toLowerCase();
      const code = (c.customerCode || '').toLowerCase();
      return name.includes(q) || email.includes(q) || code.includes(q);
    });
  }, [customers, query, selectedIds]);

  const selectedObjs = useMemo(
    () => customers.filter((c) => selectedIds.has(c.id)),
    [customers, selectedIds]
  );

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && query === '' && selectedIds.size > 0) {
      const lastId = Array.from(selectedIds).pop();
      onRemove(lastId);
    }
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (id) => {
    onAdd(id);
    setQuery('');
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Tag input box */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          minHeight: '46px',
          padding: '6px 10px',
          background: 'var(--color-muted, #1e293b)',
          border: `1.5px solid ${focused ? '#6366f1' : 'var(--color-border, #334155)'}`,
          borderRadius: '10px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '6px',
          cursor: 'text',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        {selectedObjs.map((cust) => (
          <span
            key={cust.id}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              backgroundColor: 'rgba(99,102,241,0.18)', color: '#a5b4fc',
              fontSize: '12px', fontWeight: 500,
              padding: '3px 8px 3px 10px', borderRadius: '6px',
              border: '1px solid rgba(99,102,241,0.35)', userSelect: 'none',
            }}
          >
            {getCustomerName(cust)}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onRemove(cust.id); }}
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '0 1px', display: 'flex', alignItems: 'center' }}
            >
              ×
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setFocused(true); if (query.trim()) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={selectedIds.size === 0 ? 'Type to search users...' : ''}
          style={{
            border: 'none', outline: 'none',
            flex: '1 1 140px', minWidth: '120px',
            fontSize: '13px', color: 'var(--color-foreground, #e2e8f0)',
            background: 'transparent', padding: '4px 0',
          }}
        />
      </div>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'var(--color-card, #1e293b)',
            border: '1.5px solid var(--color-border, #334155)',
            borderRadius: '10px', boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
            zIndex: 10000, maxHeight: '200px', overflowY: 'auto',
          }}
        >
          {query.trim() === '' ? (
            <div style={{ padding: '12px 14px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
              Start typing to search users...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
              No matching users found
            </div>
          ) : (
            filtered.map((cust) => (
              <div
                key={cust.id}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(cust.id); }}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(51,65,85,0.4)', transition: 'background-color 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.12)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground, #e2e8f0)' }}>
                  {getCustomerName(cust)}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {getCustomerMeta(cust)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

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

  // -------------------------------------------------------------
  // VIEW DETAIL PAGE COMPONENT FOR A SPECIFIC CREDIT
  // -------------------------------------------------------------
  if (selectedCreditId) {
    return <CreditDetailView creditId={selectedCreditId} onBack={() => setSelectedCreditId(null)} />;
  }

  // -------------------------------------------------------------
  // CREDIT LIST MAIN TAB VIEW
  // -------------------------------------------------------------
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
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Grant Store Credit"
        subtitle="Issue a new store credit balance to a customer."
        icon={<CreditCard className="w-5 h-5 text-indigo-400" />}
        maxWidth="max-w-lg"
      >
        {formError && (
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleGrantCredit} className="space-y-4">
          {/* Customer Tag-Select */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '6px' }}>
              Recipients <span style={{ color: '#f87171' }}>*</span>
            </label>
            <CustomerTagSelect
              customers={customersList}
              selectedIds={selectedCustomerIds}
              onAdd={(id) => setSelectedCustomerIds((prev) => { const n = new Set(prev); n.add(id); return n; })}
              onRemove={(id) => setSelectedCustomerIds((prev) => { const n = new Set(prev); n.delete(id); return n; })}
            />
          </div>

          {/* Credit Amount */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Credit Amount (ETB) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 5000"
              min="1"
              step="any"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          {/* Reason / Memo */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Reason / Grant Memo
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Goodwill promotional store credit issued by Finance Manager"
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="text-xs px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-5 py-2 rounded-xl flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Issuing...</span>
                </>
              ) : (
                <span>Grant Credit</span>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// -------------------------------------------------------------
// CREDIT DETAIL VIEW COMPONENT
// -------------------------------------------------------------
function CreditDetailView({ creditId, onBack }) {
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['credit-history', creditId],
    queryFn: () => financeApi.getCreditHistory(creditId),
    enabled: !!creditId,
  });

  const credit = response?.data;

  if (isLoading) {
    return (
      <Card className="p-12 text-center text-muted-foreground border-border/40">
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading credit details...</span>
        </div>
      </Card>
    );
  }

  if (isError || !credit) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-indigo-400 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Credit List
        </button>
        <Card className="p-8 text-center text-red-400 border-border/40">
          Failed to load credit details or credit record not found.
        </Card>
      </div>
    );
  }

  const cust = credit.customer;
  const customerName = cust?.person
    ? `${cust.person.firstName} ${cust.person.lastName}`
    : cust?.organization?.name || 'Customer';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Credit List
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Credit Reference:</span>
          <span className="font-mono text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-md border border-indigo-500/20 font-bold">
            {credit.creditNumber}
          </span>
        </div>
      </div>

      {/* Credit Summary Cards Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border border-border bg-card900">
          <p className="text-xs text-muted-foreground font-medium">Original Granted Credit</p>
          <h3 className="text-xl font-bold text-foreground mt-1">{formatCurrency(credit.amount)}</h3>
        </Card>

        <Card className="p-5 border border-border bg-card900">
          <p className="text-xs text-muted-foreground font-medium">Used / Applied Amount</p>
          <h3 className="text-xl font-bold text-amber-400 mt-1">{formatCurrency(credit.usedAmount)}</h3>
        </Card>

        <Card className="p-5 border border-border bg-card900">
          <p className="text-xs text-muted-foreground font-medium">Remaining Store Balance</p>
          <h3 className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(credit.remainingBalance)}</h3>
        </Card>

        <Card className="p-5 border border-border bg-card900">
          <p className="text-xs text-muted-foreground font-medium">Credit Status</p>
          <div className="mt-1">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_STYLE[credit.status] || STATUS_STYLE.ACTIVE}`}>
              {credit.status}
            </span>
          </div>
        </Card>
      </div>

      {/* Customer & Credit Details Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 border border-border bg-card900 lg:col-span-1 space-y-4">
          <h4 className="text-sm font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" /> Customer Information
          </h4>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-muted-foreground block">Customer Name</span>
              <span className="font-semibold text-foreground text-sm">{customerName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Customer Code</span>
              <span className="font-mono text-foreground font-medium">{cust?.customerCode || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Contact Email</span>
              <span className="text-foreground">{cust?.person?.email || cust?.organization?.email || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Phone</span>
              <span className="text-foreground">{cust?.person?.phone || cust?.organization?.phone || '—'}</span>
            </div>
            <div className="pt-2 border-t border-border">
              <span className="text-muted-foreground block">Grant Reason / Memo</span>
              <p className="text-foreground mt-0.5 italic">{credit.reason || 'No specific grant memo provided.'}</p>
            </div>
            <div>
              <span className="text-muted-foreground block">Issued By</span>
              <span className="text-foreground">{credit.createdBy?.username || 'System Administrator'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Date Created</span>
              <span className="text-foreground">{new Date(credit.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Credit Allocations Ledger Table */}
        <Card className="p-6 border border-border bg-card900 lg:col-span-2 space-y-4">
          <h4 className="text-sm font-bold text-foreground border-b border-border pb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" /> Credit Usage & Invoice Allocations
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {credit.creditAllocations?.length || 0} Allocation(s)
            </span>
          </h4>

          {!credit.creditAllocations || credit.creditAllocations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground space-y-2">
              <div className="text-3xl">📄</div>
              <p className="text-sm font-semibold text-foreground">No Invoice Allocations Yet</p>
              <p className="text-xs font-medium">This store credit has not been applied to any invoices yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted800/50 border-b border-border">
                  <TableHead className="py-2.5 text-xs font-bold text-foreground">Invoice #</TableHead>
                  <TableHead className="py-2.5 text-xs font-bold text-foreground text-right">Applied Amount</TableHead>
                  <TableHead className="py-2.5 text-xs font-bold text-foreground">Allocated At</TableHead>
                  <TableHead className="py-2.5 text-xs font-bold text-foreground">Processed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {credit.creditAllocations.map((alloc) => (
                  <TableRow key={alloc.id} className="hover:bg-muted800/30 transition">
                    <TableCell className="py-3 font-mono text-xs text-indigo-400 font-semibold">
                      {alloc.invoice?.invoiceNumber || '—'}
                    </TableCell>
                    <TableCell className="py-3 text-right font-bold text-sm text-foreground">
                      {formatCurrency(alloc.amount)}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {new Date(alloc.allocatedAt || alloc.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {alloc.createdBy?.username || 'System'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
