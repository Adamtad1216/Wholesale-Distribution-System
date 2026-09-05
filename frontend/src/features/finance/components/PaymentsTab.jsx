import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../financeApi';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

const STATUS_STYLE = {
  SUCCESSFUL:        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  PENDING:           'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  PROCESSING:        'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  FAILED:            'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  REFUNDED:          'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  PARTIALLY_REFUNDED:'bg-amber-500/10 text-amber-400 border border-amber-500/20',
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function PaymentsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['payments-list'],
    queryFn: () => financeApi.getPayments(),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 3000,
    retry: 1,
  });

  const payments = response?.data || [];

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        p.transactionRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.salesOrder?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    return payments.reduce(
      (acc, p) => {
        acc.total += 1;
        acc.amount += parseFloat(p.amount || 0);
        if (p.status === 'SUCCESSFUL') acc.paid += parseFloat(p.amount || 0);
        if (p.status === 'PENDING') acc.pending += 1;
        return acc;
      },
      { total: 0, amount: 0, paid: 0, pending: 0 }
    );
  }, [payments]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Payments</h2>
          <p className="text-sm text-muted-foreground">View and track all payment transactions across the system.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-border bg-card900 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground font-medium mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-foreground">{summary.total}</p>
        </Card>
        <Card className="p-5 border border-border bg-card900 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground font-medium mb-1">Total Processed</p>
          <p className="text-2xl font-bold text-indigo-400">{formatCurrency(summary.amount)}</p>
        </Card>
        <Card className="p-5 border border-border bg-card900 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground font-medium mb-1">Successfully Paid</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(summary.paid)}</p>
        </Card>
        <Card className="p-5 border border-border bg-card900 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground font-medium mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">{summary.pending}</p>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 border border-border bg-card900 backdrop-blur-xl">
        <div className="w-full sm:max-w-xs relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">🔍</div>
          <input
            type="text"
            placeholder="Search tx ref or order..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-muted800 border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="w-full sm:w-auto flex items-center gap-2">
          <label className="text-sm text-muted-foreground font-medium whitespace-nowrap">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 bg-muted800 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SUCCESSFUL">Successful</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="p-0 overflow-hidden border border-border bg-card900 shadow-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted800/50 border-b border-border">
              <TableHead className="py-3.5 text-xs font-bold text-foreground">Transaction Ref</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground">Invoice #</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground">Order</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground">Provider</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground text-right">Amount</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground text-center">Status</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading payments...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-red-400 py-12">
                  Failed to load payments.
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="text-4xl mb-3">💳</div>
                  <h3 className="text-base font-bold text-foreground">No Payments Found</h3>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or status filter.</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const invNo = p.allocations?.[0]?.invoice?.invoiceNumber || p.salesOrder?.invoices?.[0]?.invoiceNumber;
                return (
                  <TableRow key={p.id} className="hover:bg-muted800/30 transition">
                    <TableCell className="py-4">
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{p.transactionRef}</span>
                    </TableCell>
                    <TableCell className="py-4 text-xs font-semibold text-indigo-400 font-mono">
                      {invNo || <span className="italic text-muted-foreground opacity-50 font-sans">—</span>}
                    </TableCell>
                    <TableCell className="py-4 text-xs font-medium text-muted-foreground">
                      {p.salesOrder?.orderNumber || <span className="italic opacity-40">—</span>}
                    </TableCell>
                    <TableCell className="py-4 text-sm font-medium text-foreground">
                      {p.provider}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="font-bold text-foreground text-sm">{formatCurrency(p.amount)}</div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${STATUS_STYLE[p.status] || STATUS_STYLE['PENDING']}`}>
                        {p.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-xs font-medium text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString()}
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
