import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../../financeApi';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import Card from '../../../../components/ui/Card';
import { ArrowLeft, User, FileText } from 'lucide-react';

const STATUS_STYLE = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  EXHAUSTED: 'bg-muted text-muted-foreground border border-border',
  EXPIRED: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  CANCELLED: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB', maximumFractionDigits: 2 }).format(amount || 0).replace('ETB', '') + ' ETB';

export default function CreditDetailView({ creditId, onBack }) {
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
