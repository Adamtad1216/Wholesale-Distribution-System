import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../../financeApi';
import Button from '../../../../components/ui/Button';

export default function InvoiceDetail({ invoice, onBack }) {
  const authUser = useSelector(state => state.auth.user);
  const navigate = useNavigate();

  // Determine if the currently logged-in user is the customer for this invoice
  const isOwnInvoice =
    authUser?.personId === invoice?.customer?.person?.id ||
    authUser?.personId === invoice?.customer?.personId;

  // Fetch detailed invoice including items
  const { data: detailResponse, isLoading } = useQuery({
    queryKey: ['invoice-detail', invoice?.id],
    queryFn: () => financeApi.getInvoiceById(invoice?.id).catch(() => ({ data: null })),
    enabled: !!invoice?.id,
  });

  const detailedInvoice = detailResponse?.data || invoice;
  const items = detailedInvoice?.items || [];

  // Company details dynamically resolved with fallback system settings
  const companyInfo = {
    name: detailedInvoice?.branch?.company?.name || 'Wholesale Distribution System',
    legalName: detailedInvoice?.branch?.company?.legalName || 'Wholesale Distribution S.C.',
    tinNumber: detailedInvoice?.branch?.company?.tinNumber || '0098412034',
    vatRegistrationNumber: detailedInvoice?.branch?.company?.vatRegistrationNumber || '773910248',
    tradeLicenseNumber: detailedInvoice?.branch?.company?.tradeLicenseNumber || 'LIC-2026/8841',
    phone: detailedInvoice?.branch?.company?.phone || '1-800-555-0199',
    email: detailedInvoice?.branch?.company?.email || 'billing@wholesale.com',
    website: detailedInvoice?.branch?.company?.website || 'www.wholesale.com',
    address: detailedInvoice?.branch?.company?.address || '123 Supply Chain Blvd, Logistics City, NY 10001',
    city: detailedInvoice?.branch?.company?.city || 'Logistics City',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Action Bar - Hidden when printing */}
      <div className="flex justify-between items-center bg-card900 p-4 rounded-xl border border-border backdrop-blur-xl print:hidden">
        <Button variant="ghost" onClick={onBack}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Invoices
        </Button>
        <div className="flex gap-2 items-center">
          <Button
            variant="secondary"
            onClick={() => window.print()}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            }
          >
            Print Invoice
          </Button>
          {isOwnInvoice && detailedInvoice?.status !== 'PAID' && (
            <Button variant="primary" onClick={() => navigate(`/checkout/${invoice.id}`)}>
              Pay Now
            </Button>
          )}
          {!isOwnInvoice && (
            <Button variant="primary">
              Send to Customer
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Document - Pure Tailwind CSS */}
      <div className="max-w-[850px] mx-auto bg-white text-slate-900 rounded-xl border border-border shadow-2xl print:shadow-none print:border-none relative overflow-hidden font-sans">
          
          {/* Top Decorative Bar */}
          <div className="h-2.5 bg-emerald-600 w-full" />

          <div className="p-8 md:p-12 relative">
            {/* PAID Watermark Stamp */}
            {detailedInvoice?.status === 'PAID' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[-35deg] text-emerald-600/15 border-8 border-emerald-600/15 text-7xl font-black tracking-widest px-8 py-3 rounded-2xl pointer-events-none select-none z-10 whitespace-nowrap">
                PAID
              </div>
            )}

            {/* Header Section with Company Information */}
            <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4 border-b border-slate-200 pb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1 uppercase">{companyInfo.name}</h2>
                {companyInfo.legalName && companyInfo.legalName !== companyInfo.name && (
                  <p className="font-medium text-xs text-slate-700 mb-1">{companyInfo.legalName}</p>
                )}
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mt-0.5">{companyInfo.address}</p>
                
                {/* Tax & Business Registration Info */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-2 font-mono">
                  {companyInfo.tinNumber && <span><strong>TIN:</strong> {companyInfo.tinNumber}</span>}
                  {companyInfo.vatRegistrationNumber && <span><strong>VAT #:</strong> {companyInfo.vatRegistrationNumber}</span>}
                  {companyInfo.tradeLicenseNumber && <span><strong>Lic #:</strong> {companyInfo.tradeLicenseNumber}</span>}
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <h1 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Invoicing</h1>
                <div className="text-xs text-slate-700 space-y-1">
                  <p><strong className="font-bold">Phone #:</strong> {companyInfo.phone}</p>
                  <p><strong className="font-bold">Email:</strong> {companyInfo.email}</p>
                  <p><strong className="font-bold">Website:</strong> {companyInfo.website}</p>
                </div>
              </div>
            </div>

            {/* Information Grid Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-100 p-6 rounded-lg mb-8 text-xs">
              {/* Bill To */}
              <div>
                <h3 className="font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider">Bill to</h3>
                <p className="font-medium text-slate-800">
                  {invoice?.customer?.person
                    ? `${invoice.customer.person.firstName} ${invoice.customer.person.lastName}`
                    : invoice?.customer?.organization?.name || 'Client Name'}
                </p>
                <p className="text-slate-600">{invoice?.customer?.person?.email || 'Email address'}</p>
                <p className="text-slate-600 font-mono mt-0.5">{invoice?.customer?.customerCode || 'CUST-XXXX'}</p>
              </div>

              {/* Payment Status */}
              <div>
                <h3 className="font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider">Payment Status</h3>
                <p className={`font-bold text-sm ${
                  detailedInvoice?.status === 'PAID'
                    ? 'text-emerald-700'
                    : detailedInvoice?.status === 'PARTIALLY_PAID'
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}>
                  {detailedInvoice?.status || 'UNPAID'}
                </p>
                {detailedInvoice?.paidAmount > 0 && (
                  <p className="text-slate-600 mt-1">Paid: ${parseFloat(detailedInvoice.paidAmount).toFixed(2)}</p>
                )}
                {detailedInvoice?.balance > 0 && (
                  <p className="text-slate-600">Balance: ${parseFloat(detailedInvoice.balance).toFixed(2)}</p>
                )}
                {detailedInvoice?.salesOrder?.orderNumber && (
                  <p className="text-slate-500 text-[11px] mt-1">Order: {detailedInvoice.salesOrder.orderNumber}</p>
                )}
              </div>

              {/* Details */}
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider">Details</h3>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">Invoice #</span>
                  <span className="font-mono">{detailedInvoice?.invoiceNumber || '12345'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">Invoice Date</span>
                  <span>{detailedInvoice?.invoiceDate ? new Date(detailedInvoice.invoiceDate).toLocaleDateString() : 'mm/dd/yyyy'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">Terms</span>
                  <span>Net 30</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">Due Date</span>
                  <span>{detailedInvoice?.dueDate ? new Date(detailedInvoice.dueDate).toLocaleDateString() : 'mm/dd/yyyy'}</span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full text-xs text-left mb-8 border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-900 font-bold">
                  <th className="py-2.5 w-[20%]">Product / Service</th>
                  <th className="py-2.5 w-[38%]">Description</th>
                  <th className="py-2.5 w-[14%] text-right">Quantity</th>
                  <th className="py-2.5 w-[14%] text-right">Rate</th>
                  <th className="py-2.5 w-[14%] text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-slate-500">Loading items...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-slate-500">No line items found</td>
                  </tr>
                ) : (
                  items.map((item, i) => (
                    <tr key={i} className="text-slate-800">
                      <td className="py-3 font-medium">{item.product?.name || item.productId || 'Product'}</td>
                      <td className="py-3 text-slate-600">{item.product?.description || 'Description of product or service'}</td>
                      <td className="py-3 text-right font-mono">{item.quantity}</td>
                      <td className="py-3 text-right font-mono">${parseFloat(item.unitPrice || 0).toFixed(2)}</td>
                      <td className="py-3 text-right font-mono font-medium">${parseFloat(item.total || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Summary & Totals */}
            <div className="flex flex-col md:flex-row justify-between gap-8 mt-4">
              <div className="text-xs text-slate-600 max-w-xs space-y-1">
                <h4 className="font-bold text-slate-900 text-xs mb-1">Customer message</h4>
                <p className="leading-relaxed">
                  Thank you for your business. Please retain this invoice for your payment records.
                </p>
              </div>

              <div className="min-w-[260px] text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-mono font-medium">${parseFloat(detailedInvoice?.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Sales Tax</span>
                  <span className="font-mono font-medium">${parseFloat(detailedInvoice?.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Shipping</span>
                  <span className="font-mono font-medium">$0.00</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-bold text-slate-900">
                  <span>Total</span>
                  <span className="font-mono text-base">${parseFloat(detailedInvoice?.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="text-center pt-10 mt-10 border-t border-slate-200 text-[11px] text-slate-500">
              Official Invoice generated by {companyInfo.name}.
            </footer>
          </div>
        </div>
    </div>
  );
}
