import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../../financeApi';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
import { usePermission } from '../../../../hooks/usePermission';

const STATUS_STYLE = {
  SUCCESSFUL:        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  COMPLETED:         'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  PENDING:           'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  PROCESSING:        'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  FAILED:            'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  REFUNDED:          'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  PARTIALLY_REFUNDED:'bg-amber-500/10 text-amber-400 border border-amber-500/20',
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function PaymentsTab() {
  const navigate = useNavigate();
  const { can: canManagePaymentOptions } = usePermission([
    'payment-options:manage',
    'payment-option:manage',
    'payment-options:read',
    'payment-option:read',
    'payments:update',
    'payments:read_all',
    'payment:read_all',
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['payments-list'],
    queryFn: () => financeApi.getPayments(),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 3000,
    retry: 1,
  });

  // Ensure Array extraction regardless of API wrapping structure
  const payments = useMemo(() => {
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response)) return response;
    return [];
  }, [response]);

  const getPartyName = (p) => {
    if (p.supplier) {
      const sup = p.supplier;
      if (sup.organization?.name) return sup.organization.name;
      if (sup.organization?.tradingName) return sup.organization.tradingName;
      if (sup.person?.firstName) return `${sup.person.firstName} ${sup.person.lastName || ''}`.trim();
      if (sup.supplierCode) return `Supplier (${sup.supplierCode})`;
      return 'Supplier Vendor';
    }
    const cust = p.customer || p.salesOrder?.customer;
    if (cust) {
      if (cust.organization?.name) return cust.organization.name;
      if (cust.organization?.tradingName) return cust.organization.tradingName;
      if (cust.person?.firstName) return `${cust.person.firstName} ${cust.person.lastName || ''}`.trim();
      if (cust.customerCode) return `Customer (${cust.customerCode})`;
      return 'Customer Client';
    }
    if (p.allocations?.[0]?.invoice?.customer) {
      const invCust = p.allocations[0].invoice.customer;
      if (invCust.organization?.name) return invCust.organization.name;
      if (invCust.person?.firstName) return `${invCust.person.firstName} ${invCust.person.lastName || ''}`.trim();
    }
    if (p.salesOrder?.orderNumber) return `Customer Order (${p.salesOrder.orderNumber})`;
    return 'General Payee';
  };

  const getCategoryInfo = (p) => {
    if (p.supplierId || p.supplier) {
      return {
        label: 'Vendor Settlement',
        icon: '📤',
        badgeStyle: 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
      };
    }
    if (p.orderId || p.customerId || p.customer || p.salesOrder) {
      return {
        label: 'Customer Payment',
        icon: '📥',
        badgeStyle: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
      };
    }
    return {
      label: 'General Payment',
      icon: '💳',
      badgeStyle: 'bg-slate-500/15 text-slate-300 border border-slate-500/30'
    };
  };

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const party = getPartyName(p).toLowerCase();
      const matchesSearch =
        p.transactionRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.paymentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.salesOrder?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        party.includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesCategory =
        categoryFilter === 'ALL' ||
        (categoryFilter === 'VENDOR' && (p.supplierId || p.supplier)) ||
        (categoryFilter === 'CUSTOMER' && (p.orderId || p.customerId || p.customer || p.salesOrder));

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [payments, searchTerm, statusFilter, categoryFilter]);

  const summary = useMemo(() => {
    return payments.reduce(
      (acc, p) => {
        acc.total += 1;
        const val = parseFloat(p.amount || 0);
        acc.amount += val;

        const isOk = p.status === 'SUCCESSFUL' || p.status === 'COMPLETED';
        if (isOk) {
          if (p.supplierId || p.supplier) {
            acc.payouts += val;
          } else {
            acc.inbound += val;
          }
        }
        if (p.status === 'PENDING' || p.status === 'PROCESSING') acc.pending += 1;
        return acc;
      },
      { total: 0, amount: 0, inbound: 0, payouts: 0, pending: 0 }
    );
  }, [payments]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">All System Payments & Disbursements</h2>
          <p className="text-sm text-muted-foreground">Unified audit ledger tracking customer revenue and vendor settlement disbursements.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
          {canManagePaymentOptions && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/finance/payment-options')}
              className="font-bold shadow-md shadow-indigo-500/20"
            >
              💳 Payment Options
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-border bg-card900 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground font-medium mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-foreground">{summary.total}</p>
        </Card>
        <Card className="p-5 border border-border bg-card900 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground font-medium mb-1">Customer Revenue (Inbound)</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(summary.inbound)}</p>
        </Card>
        <Card className="p-5 border border-border bg-card900 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground font-medium mb-1">Vendor Payouts (Outbound)</p>
          <p className="text-2xl font-bold text-amber-400">{formatCurrency(summary.payouts)}</p>
        </Card>
        <Card className="p-5 border border-border bg-card900 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground font-medium mb-1">Pending Processing</p>
          <p className="text-2xl font-bold text-yellow-400">{summary.pending}</p>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 border border-border bg-card900 backdrop-blur-xl">
        <div className="w-full sm:max-w-xs relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">🔍</div>
          <input
            type="text"
            placeholder="Search ref, payee, order, provider..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-muted800 border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="w-full sm:w-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-semibold">Category:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-muted800 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Categories</option>
              <option value="CUSTOMER">📥 Customer Inbound</option>
              <option value="VENDOR">📤 Vendor Outbound</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-semibold">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-muted800 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed / Successful</option>
              <option value="SUCCESSFUL">Successful</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Universal Data Table */}
      <Card className="p-0 overflow-hidden border border-border bg-card900 shadow-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted800/60 border-b border-border">
              <TableHead className="py-3.5 px-4 text-xs font-bold text-foreground whitespace-nowrap">Transaction Ref</TableHead>
              <TableHead className="py-3.5 px-4 text-xs font-bold text-foreground whitespace-nowrap">Category</TableHead>
              <TableHead className="py-3.5 px-4 text-xs font-bold text-foreground whitespace-nowrap">Payee</TableHead>
              <TableHead className="py-3.5 px-4 text-xs font-bold text-foreground whitespace-nowrap">Reference</TableHead>
              <TableHead className="py-3.5 px-4 text-xs font-bold text-foreground whitespace-nowrap">Provider</TableHead>
              <TableHead className="py-3.5 px-4 text-xs font-bold text-foreground text-right whitespace-nowrap">Amount</TableHead>
              <TableHead className="py-3.5 px-4 text-xs font-bold text-foreground text-center whitespace-nowrap">Status</TableHead>
              <TableHead className="py-3.5 px-4 text-xs font-bold text-foreground whitespace-nowrap">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading system payment ledger...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-red-400 py-12">
                  Failed to load payments from server.
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="text-4xl mb-3">💳</div>
                  <h3 className="text-base font-bold text-foreground">No Payment Records Found</h3>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or category/status filters.</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const invNo = p.allocations?.[0]?.invoice?.invoiceNumber || p.salesOrder?.invoices?.[0]?.invoiceNumber;
                const orderNo = p.salesOrder?.orderNumber;
                const refNo = p.referenceNumber || p.paymentNumber || p.transactionRef;
                const category = getCategoryInfo(p);
                const partyName = getPartyName(p);
                const isOutbound = p.supplierId || p.supplier;

                return (
                  <TableRow key={p.id} className="hover:bg-muted800/30 transition">
                    {/* 1. Transaction Ref */}
                    <TableCell className="py-4 px-4 font-mono text-xs text-foreground whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-foreground tracking-wide">
                          {p.paymentNumber || p.transactionRef || `PAY-${p.id.slice(0, 8)}`}
                        </span>
                        {p.paymentNumber && p.transactionRef && p.paymentNumber !== p.transactionRef && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Ref: {p.transactionRef}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* 2. Category Badge */}
                    <TableCell className="py-4 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${category.badgeStyle}`}>
                        <span>{category.icon}</span>
                        <span>{category.label}</span>
                      </span>
                    </TableCell>

                    {/* 3. Payee */}
                    <TableCell className="py-4 px-4 text-xs font-semibold text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-muted800 border border-border flex items-center justify-center text-xs shrink-0 font-bold text-muted-foreground">
                          {partyName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-foreground font-bold">{partyName}</span>
                      </div>
                    </TableCell>

                    {/* 4. Reference */}
                    <TableCell className="py-4 px-4 text-xs font-mono font-medium whitespace-nowrap">
                      {invNo ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold w-fit">
                            Inv: {invNo}
                          </span>
                          {orderNo && (
                            <span className="text-[10px] text-muted-foreground pl-0.5">
                              SO: {orderNo}
                            </span>
                          )}
                        </div>
                      ) : orderNo ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                          SO: {orderNo}
                        </span>
                      ) : refNo ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted800 text-foreground border border-border font-mono text-[11px]">
                          {refNo}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-sans italic text-xs">Direct Settlement</span>
                      )}
                    </TableCell>

                    {/* 5. Provider */}
                    <TableCell className="py-4 px-4 text-xs font-semibold text-foreground whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted800/80 border border-border">
                        <span className="text-sm">
                          {p.provider?.toUpperCase().includes('CHAPA')
                            ? '⚡'
                            : p.provider?.toUpperCase().includes('TELEBIRR')
                            ? '📱'
                            : p.provider?.toUpperCase().includes('CBE') || p.provider?.toUpperCase().includes('BANK')
                            ? '🏦'
                            : '💳'}
                        </span>
                        <span className="font-bold text-foreground uppercase tracking-wide">
                          {p.provider || p.paymentMethod || 'MANUAL'}
                        </span>
                      </div>
                    </TableCell>

                    {/* 6. Amount */}
                    <TableCell className="py-4 px-4 text-right whitespace-nowrap">
                      <div className={`font-black font-mono text-sm ${isOutbound ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {isOutbound ? '-' : '+'}{formatCurrency(p.amount)}
                      </div>
                      {p.currency && p.currency !== 'ETB' && (
                        <div className="text-[10px] text-muted-foreground font-mono uppercase">{p.currency}</div>
                      )}
                    </TableCell>

                    {/* 7. Status */}
                    <TableCell className="py-4 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${STATUS_STYLE[p.status] || STATUS_STYLE['PENDING']}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {p.status}
                      </span>
                    </TableCell>

                    {/* 8. Date */}
                    <TableCell className="py-4 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                      <div className="text-foreground font-semibold">
                        {new Date(p.paidAt || p.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(p.paidAt || p.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
