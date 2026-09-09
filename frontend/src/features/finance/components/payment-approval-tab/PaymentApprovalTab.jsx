import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { financeApi } from '../../financeApi';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
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
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-muted800/50 border-b border-border">
                <TableHead className="py-3.5 px-4 text-xs font-bold text-foreground whitespace-nowrap">Transaction Ref</TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-foreground whitespace-nowrap">Invoice #</TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-foreground whitespace-nowrap">Order #</TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-foreground whitespace-nowrap">Provider</TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-foreground text-right whitespace-nowrap">Amount</TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-foreground whitespace-nowrap">Initiated At</TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-foreground text-center whitespace-nowrap">Status</TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-foreground text-center whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading processing payments...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-red-400 py-12">
                    Failed to load processing payments.
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
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
                  const orderNo = p.salesOrder?.orderNumber;

                  return (
                    <TableRow
                      key={p.id}
                      className="hover:bg-muted800/30 transition"
                    >
                      {/* 1. Transaction Ref */}
                      <TableCell className="py-4 px-4 font-mono text-xs text-foreground whitespace-nowrap">
                        <span className="font-bold text-foreground tracking-wide">
                          {p.transactionRef}
                        </span>
                      </TableCell>

                      {/* 2. Invoice # */}
                      <TableCell className="py-4 px-4 whitespace-nowrap">
                        {invNo ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold font-mono">
                            Inv: {invNo}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </TableCell>

                      {/* 3. Order # */}
                      <TableCell className="py-4 px-4 whitespace-nowrap">
                        {orderNo ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-foreground border border-border text-xs font-medium font-mono">
                            SO: {orderNo}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </TableCell>

                      {/* 4. Provider */}
                      <TableCell className="py-4 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted800/80 border border-border text-xs font-semibold text-foreground">
                          <span className="text-sm">
                            {p.provider?.toUpperCase().includes('CHAPA')
                              ? '⚡'
                              : p.provider?.toUpperCase().includes('TELEBIRR')
                              ? '📱'
                              : p.provider?.toUpperCase().includes('CBE') || p.provider?.toUpperCase().includes('BANK')
                              ? '🏦'
                              : '💳'}
                          </span>
                          <span className="font-bold uppercase tracking-wide">
                            {p.provider || 'MANUAL'}
                          </span>
                        </div>
                      </TableCell>

                      {/* 5. Amount */}
                      <TableCell className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="font-black font-mono text-sm text-indigo-400">
                          {formatCurrency(p.amount)}
                        </div>
                        {p.currency && (
                          <div className="text-[10px] text-muted-foreground font-mono uppercase font-medium">
                            {p.currency}
                          </div>
                        )}
                      </TableCell>

                      {/* 6. Initiated At */}
                      <TableCell className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground text-xs font-medium">
                            {new Date(p.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {new Date(p.createdAt).toLocaleTimeString('en-US', {
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </TableCell>

                      {/* 7. Status */}
                      <TableCell className="py-4 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${statusBadgeClass}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          {statusLabel}
                        </span>
                      </TableCell>

                      {/* 8. Actions */}
                      <TableCell className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                            onClick={() => setSelectedId(p.id)}
                            className="text-xs font-semibold shadow-sm hover:border-indigo-500/40"
                            title="View Payment Details"
                          >
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
