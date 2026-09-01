import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../../paymentsApi';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import Button from '../../../../components/ui/Button';

export default function Payments() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => paymentsApi.getInvoices().catch(() => ({ data: [] })),
  });

  const invoices = response?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 light:text-slate-900">Finance & Billing</h2>
        <p className="text-sm text-slate-400">Review generated invoices, trigger payments, and submit bank transfer validation proofs.</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan="5" className="text-center text-slate-400 py-8">
                Loading invoices...
              </TableCell>
            </TableRow>
          ) : invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan="5" className="text-center text-slate-400 py-8">
                No invoices found. (Database empty or offline)
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-semibold text-slate-100 light:text-slate-900">{inv.invoiceNumber}</TableCell>
                <TableCell className="font-bold text-violet-500">${inv.totalAmount}</TableCell>
                <TableCell>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    inv.status === 'PAID' ? 'badge-slate' : 'badge-indigo'
                  }`}>
                    {inv.status}
                  </span>
                </TableCell>
                <TableCell className="text-slate-400">{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  {inv.status !== 'PAID' && (
                    <Button variant="primary" size="xs">
                      Pay Now
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
