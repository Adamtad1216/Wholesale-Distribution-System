import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../../financeApi';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
import InvoiceDetail from './InvoiceDetail';

export default function Invoice() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' | 'DETAIL'
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => financeApi.getInvoices().catch(() => ({ data: [] })),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 3000,
  });

  const invoices = response?.data || [];

  // Derived state for filtering
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  // Derived state for summary metrics
  const summary = useMemo(() => {
    return filteredInvoices.reduce(
      (acc, inv) => {
        acc.totalCount += 1;
        acc.totalAmount += parseFloat(inv.total || 0);
        acc.paidAmount += parseFloat(inv.paidAmount || 0);
        acc.balance += parseFloat(inv.balance || 0);
        return acc;
      },
      { totalCount: 0, totalAmount: 0, paidAmount: 0, balance: 0 }
    );
  }, [filteredInvoices]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleViewInvoice = (inv) => {
    setSelectedInvoice(inv);
    setViewMode('DETAIL');
  };

  const handleBackToList = () => {
    setSelectedInvoice(null);
    setViewMode('LIST');
  };

  if (viewMode === 'DETAIL') {
    return <InvoiceDetail invoice={selectedInvoice} onBack={handleBackToList} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Invoices Management</h2>
          <p className="text-sm text-muted-foreground">View, filter, and track all generated invoices across the system.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-border bg-card900 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground font-medium mb-1">Total Invoices</p>
          <p className="text-2xl font-bold text-foreground">{summary.totalCount}</p>
        </Card>
        <Card className="p-5 border border-border bg-card900 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground font-medium mb-1">Total Invoiced</p>
          <p className="text-2xl font-bold text-indigo-400">{formatCurrency(summary.totalAmount)}</p>
        </Card>
        <Card className="p-5 border border-border bg-card900 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground font-medium mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(summary.paidAmount)}</p>
        </Card>
        <Card className="p-5 border border-border bg-card900 backdrop-blur-xl">
          <p className="text-sm text-muted-foreground font-medium mb-1">Outstanding Balance</p>
          <p className="text-2xl font-bold text-rose-400">{formatCurrency(summary.balance)}</p>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 border border-border bg-card900 backdrop-blur-xl">
        <div className="w-full sm:max-w-xs relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
            🔍
          </div>
          <input
            type="text"
            placeholder="Search invoice number..."
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
            className="w-full sm:w-40 bg-muted800 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ISSUED">Issued</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="VOID">Void</option>
          </select>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="p-0 overflow-hidden border border-border bg-card900 shadow-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted800/50 border-b border-border">
              <TableHead className="py-3.5 text-xs font-bold text-foreground">Invoice #</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground">Invoice Date</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground">Due Date</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground text-right">Total Amount</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground text-right">Balance</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground text-center">Status</TableHead>
              <TableHead className="py-3.5 text-xs font-bold text-foreground text-left pl-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan="7" className="text-center text-muted-foreground py-12">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading invoices...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan="7" className="text-center text-red-400 py-12">
                  Failed to load invoices.
                </TableCell>
              </TableRow>
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan="7" className="text-center py-12">
                  <div className="text-4xl mb-3">🧾</div>
                  <h3 className="text-base font-bold text-foreground">No Invoices Found</h3>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or status filters.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((inv) => {
                const isOverdue = new Date(inv.dueDate) < new Date() && inv.status !== 'PAID';
                
                return (
                  <TableRow key={inv.id} className="hover:bg-muted800/30 transition">
                    <TableCell className="py-4">
                      <div className="font-bold text-foreground text-sm">{inv.invoiceNumber}</div>
                    </TableCell>
                    <TableCell className="py-4 text-xs font-medium text-muted-foreground">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-4 text-xs font-medium text-muted-foreground">
                      <span className={isOverdue ? 'text-rose-400 font-bold' : ''}>
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="font-bold text-foreground text-sm">{formatCurrency(inv.total)}</div>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="font-bold text-rose-400 text-sm">{formatCurrency(inv.balance)}</div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                        inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                        inv.status === 'OVERDUE' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                        inv.status === 'PARTIALLY_PAID' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {inv.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-left pl-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="secondary" 
                          size="xs" 
                          className="rounded-xl text-xs font-bold"
                          onClick={() => handleViewInvoice(inv)}
                        >
                          View
                        </Button>
                        {inv.status !== 'PAID' && (
                          <Button variant="primary" size="xs" className="rounded-xl text-xs font-bold">
                            Pay
                          </Button>
                        )}
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
