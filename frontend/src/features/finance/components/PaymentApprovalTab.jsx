import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../financeApi';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import PaymentDetail from './PaymentDetail';

const STATUS_STYLE = {
  PROCESSING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PENDING:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function PaymentApprovalTab() {
  const [selectedId, setSelectedId] = useState(null);
  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['payments-pending'],
    queryFn: () => financeApi.getPendingPayments(),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 3000,
    retry: 1,
  });

  const payments = response?.data || [];

  const summary = useMemo(() => {
    return payments.reduce(
      (acc, p) => {
        acc.count += 1;
        acc.amount += parseFloat(p.amount || 0);
        return acc;
      },
      { count: 0, amount: 0 }
    );
  }, [payments]);

  if (selectedId) {
    return <PaymentDetail paymentId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Payment Approval</h2>
          <p className="text-sm text-muted-foreground">
            Payments in processing status awaiting administrative verification and approval. Auto-refreshes every 30 seconds.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 border border-border bg-card900 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground font-medium mb-1">Processing Payments</p>
          <p className="text-2xl font-bold text-blue-400">{summary.count}</p>
        </Card>
        <Card className="p-5 border border-border bg-card900 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground font-medium mb-1">Total Amount Processing</p>
          <p className="text-2xl font-bold text-indigo-400">{formatCurrency(summary.amount)}</p>
        </Card>
      </div>

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
              <TableHead className="py-3.5 text-xs font-bold text-foreground">Initiated At</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading processing payments...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-red-400 py-12">
                  Failed to load processing payments.
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center text-center w-full space-y-2">
                    <div className="text-4xl mb-1">✅</div>
                    <h3 className="text-base font-bold text-foreground">All Clear!</h3>
                    <p className="text-sm text-muted-foreground">No payments are currently awaiting processing approval.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => {
                const statusBadgeClass = STATUS_STYLE.PROCESSING;
                const statusLabel = 'Processing';
                const invNo = p.allocations?.[0]?.invoice?.invoiceNumber || p.salesOrder?.invoices?.[0]?.invoiceNumber;
                return (
                  <TableRow
                    key={p.id}
                    className="hover:bg-muted800/30 transition cursor-pointer"
                    onClick={() => setSelectedId(p.id)}
                  >
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
                    <TableCell className="py-4 text-xs font-medium text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border ${statusBadgeClass}`}>
                        {statusLabel}
                      </span>
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
