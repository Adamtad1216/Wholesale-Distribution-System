import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Printer, CheckCircle, Clock, AlertTriangle, Download, ArrowUpRight, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';

const INVOICE_STATUS_COLORS = {
  ISSUED: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  PAID: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  PARTIALLY_PAID: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  OVERDUE: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  CANCELLED: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export default function CustomerInvoices() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);


  const { data: invoicesData, isLoading, error } = useQuery({
    queryKey: ['customerInvoices', statusFilter],
    queryFn: async () => {
      try {
        const params = {};
        if (statusFilter !== 'ALL') params.status = statusFilter;
        const res = await api.get('/invoices', { params });
        const list = res.data?.data || res.data || [];
        return Array.isArray(list) ? list : [];
      } catch (err) {
        if (err?.status === 501 || err?.status === 404) return [];
        throw err;
      }
    },
  });

  const invoices = Array.isArray(invoicesData) ? invoicesData : [];

  const filteredInvoices = invoices.filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.salesOrder?.orderNumber?.toLowerCase().includes(q) ||
      inv.status?.toLowerCase().includes(q)
    );
  });

  // Calculate totals
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  const totalOutstanding = invoices
    .filter((inv) => inv.status !== 'PAID')
    .reduce((sum, inv) => sum + Number(inv.balance ?? inv.total ?? 0), 0);
  const paidCount = invoices.filter((inv) => inv.status === 'PAID').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wide uppercase">
            <FileText className="w-3.5 h-3.5" />
            Billing & Invoices
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Commercial Tax Invoices
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Review your wholesale tax invoices, track payment milestones and due dates, and generate printable invoice receipts for accounting and records.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-400 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Invoiced
            </p>
            <p className="text-xl font-extrabold text-foreground font-mono mt-0.5">
              {totalInvoiced.toLocaleString('en', { minimumFractionDigits: 2 })} ETB
            </p>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Outstanding Balance
            </p>
            <p className="text-xl font-extrabold text-amber-400 font-mono mt-0.5">
              {totalOutstanding.toLocaleString('en', { minimumFractionDigits: 2 })} ETB
            </p>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Paid Invoices
            </p>
            <p className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">
              {paidCount} <span className="text-xs text-muted-foreground font-normal">of {invoices.length}</span>
            </p>
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { label: 'All Invoices', value: 'ALL' },
            { label: 'Issued / Pending', value: 'ISSUED' },
            { label: 'Paid', value: 'PAID' },
            { label: 'Overdue', value: 'OVERDUE' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === tab.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by invoice or order #..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>
      </div>

      {/* Invoices List */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-muted-foreground">Loading commercial invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground space-y-2">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">No invoices found</p>
            <p className="text-xs text-muted-foreground">
              Commercial tax invoices are generated automatically once orders are approved and fulfillment begins.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground bg-secondary/40">
                  <th className="px-6 py-4 font-bold">Invoice #</th>
                  <th className="px-6 py-4 font-bold">Order #</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Due Date</th>
                  <th className="px-6 py-4 font-bold text-right">Amount (ETB)</th>
                  <th className="px-6 py-4 font-bold text-right">Balance Due</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-secondary/20 transition">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-foreground">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {invoice.salesOrder?.orderNumber || '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon Receipt'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs font-bold text-foreground">
                      {Number(invoice.total || 0).toLocaleString('en', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs font-bold text-amber-400">
                      {Number(invoice.balance ?? invoice.total ?? 0).toLocaleString('en', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          INVOICE_STATUS_COLORS[invoice.status] || 'bg-secondary text-foreground'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        View / Print
                      </button>
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invoice Detail / Printable Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Commercial Tax Invoice`}
          subtitle={`Invoice #${selectedInvoice.invoiceNumber}`}
          size="lg"
        >
          <div className="space-y-6 text-foreground text-xs p-2 print:p-0" id="printable-invoice">
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b border-border pb-6">
              <div>
                <h2 className="text-lg font-black text-foreground">WHOLESALE DISTRIBUTION HQ</h2>
                <p className="text-muted-foreground">Central Commercial Logistics Center</p>
                <p className="text-muted-foreground">Bole Sub-City, Addis Ababa, Ethiopia</p>
                <p className="text-muted-foreground">TIN: 0012345678 • VAT Reg: 987654321</p>
              </div>
              <div className="text-right space-y-1">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  {selectedInvoice.status}
                </span>
                <p className="font-mono font-bold text-sm text-foreground pt-1">
                  {selectedInvoice.invoiceNumber}
                </p>
                <p className="text-muted-foreground">
                  Date: {new Date(selectedInvoice.invoiceDate || selectedInvoice.createdAt).toLocaleDateString()}
                </p>
                <p className="text-muted-foreground">
                  Due Date: {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'Due upon delivery'}
                </p>
              </div>
            </div>

            {/* Bill-to Info */}
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-border pb-4">
              <div>
                <span className="text-muted-foreground font-bold uppercase tracking-wider block mb-1">
                  Bill To (Buyer):
                </span>
                <p className="font-bold text-sm text-foreground">
                  {selectedInvoice.customer?.organization?.name ||
                    (selectedInvoice.customer?.person
                      ? `${selectedInvoice.customer.person.firstName} ${selectedInvoice.customer.person.lastName}`
                      : 'Wholesale Buyer')}
                </p>
                <p className="text-muted-foreground">{selectedInvoice.customer?.person?.email || 'N/A'}</p>
                <p className="text-muted-foreground">{selectedInvoice.customer?.person?.phone || 'N/A'}</p>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground font-bold uppercase tracking-wider block mb-1">
                  Sales Order Reference:
                </span>
                <p className="font-mono font-bold text-foreground">
                  {selectedInvoice.salesOrder?.orderNumber || 'Standard Quotation'}
                </p>
              </div>
            </div>

            {/* Financials Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-2 border-t border-border pt-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span className="font-mono text-foreground font-semibold">
                    {Number(selectedInvoice.subtotal || 0).toLocaleString('en', { minimumFractionDigits: 2 })} ETB
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT (15%):</span>
                  <span className="font-mono text-foreground font-semibold">
                    {Number(selectedInvoice.tax || 0).toLocaleString('en', { minimumFractionDigits: 2 })} ETB
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
                  <span>Total Amount:</span>
                  <span className="font-mono text-emerald-400">
                    {Number(selectedInvoice.total || 0).toLocaleString('en', { minimumFractionDigits: 2 })} ETB
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold text-amber-400 pt-1">
                  <span>Balance Due:</span>
                  <span className="font-mono">
                    {Number(selectedInvoice.balance ?? selectedInvoice.total ?? 0).toLocaleString('en', { minimumFractionDigits: 2 })} ETB
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-border print:hidden">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print Invoice Receipt
              </Button>
            </div>

          </div>
        </Modal>
      )}
    </div>
  );
}
