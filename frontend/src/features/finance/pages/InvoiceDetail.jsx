import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../financeApi';
import Button from '../../../components/ui/Button';
import './InvoiceDetail.css';

export default function InvoiceDetail({ invoice, onBack }) {
  const authUser = useSelector(state => state.auth.user);
  const navigate = useNavigate();
  
  // Determine if the currently logged-in user is the customer for this invoice
  const isOwnInvoice = authUser?.personId === invoice?.customer?.person?.id || 
                       authUser?.personId === invoice?.customer?.personId;

  // Fetch detailed invoice including items
  const { data: detailResponse, isLoading } = useQuery({
    queryKey: ['invoice-detail', invoice?.id],
    queryFn: () => financeApi.getInvoiceById(invoice?.id).catch(() => ({ data: null })),
    enabled: !!invoice?.id
  });

  const detailedInvoice = detailResponse?.data || invoice;
  const items = detailedInvoice?.items || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-card900 p-4 rounded-xl border border-border backdrop-blur-xl">
        <Button variant="ghost" onClick={onBack}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Invoices
        </Button>
        <div className="flex gap-2 items-center">
          <Button variant="secondary" onClick={() => window.print()} icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          }>
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

      <div className="invoice-detail-wrapper w-full overflow-auto rounded-xl border border-border shadow-xl">
        <div className="invoice-body">
          <div className="invoice">
            <div className="top-bar"></div>
            <div className="content" style={{ position: 'relative' }}>

              {/* PAID Watermark Stamp inside the invoice */}
              {detailedInvoice?.status === 'PAID' && (
                <div className="paid-stamp">
                  PAID
                </div>
              )}

              <div className="header">
                <div className="brand">
                  <div className="logo-placeholder">Wholesale</div>
                  <div className="logo-word">DISTRIBUTION</div>
                  <div className="company-name" contentEditable="true" suppressContentEditableWarning>Wholesale Distribution System</div>
                  <div className="company-line" contentEditable="true" suppressContentEditableWarning>123 Supply Chain Blvd</div>
                  <div className="company-line" contentEditable="true" suppressContentEditableWarning>Logistics City, NY 10001</div>
                </div>
                <div className="header-right">
                  <h1>Invoicing</h1>
                  <div className="contact-block">
                    <div><b>Phone #</b> <span contentEditable="true" suppressContentEditableWarning>1-800-555-0199</span></div>
                    <div><b>Email</b> <span contentEditable="true" suppressContentEditableWarning>billing@wholesale.com</span></div>
                    <div><b>Website</b> <span contentEditable="true" suppressContentEditableWarning>www.wholesale.com</span></div>
                  </div>
                </div>
              </div>

              <div className="info-panel">
                <div>
                  <h3>Bill to</h3>
                  <p contentEditable="true" suppressContentEditableWarning>
                    {invoice?.customer?.person 
                      ? `${invoice.customer.person.firstName} ${invoice.customer.person.lastName}`
                      : invoice?.customer?.organization?.name || 'Client name'}
                  </p>
                  <p contentEditable="true" suppressContentEditableWarning>
                    {invoice?.customer?.person?.email || 'Email address'}
                  </p>
                  <p contentEditable="true" suppressContentEditableWarning>
                    {invoice?.customer?.customerCode || 'CUST-XXXX'}
                  </p>
                </div>
                <div>
                  <h3>Payment Status</h3>
                  <p style={{ fontWeight: 700, color: detailedInvoice?.status === 'PAID' ? '#15803d' : detailedInvoice?.status === 'PARTIALLY_PAID' ? '#b45309' : '#b91c1c' }}>
                    {detailedInvoice?.status || 'UNPAID'}
                  </p>
                  {detailedInvoice?.paidAmount > 0 && (
                    <p>Paid: ${parseFloat(detailedInvoice.paidAmount).toFixed(2)}</p>
                  )}
                  {detailedInvoice?.balance > 0 && (
                    <p>Balance: ${parseFloat(detailedInvoice.balance).toFixed(2)}</p>
                  )}
                  {detailedInvoice?.salesOrder?.orderNumber && (
                    <p style={{ marginTop: '6px', fontSize: '12px', color: '#6b6b6b' }}>Order: {detailedInvoice.salesOrder.orderNumber}</p>
                  )}
                </div>
                <div>
                  <h3>Details</h3>
                  <div className="detail-row"><span>Invoice #</span><span contentEditable="true" suppressContentEditableWarning>{detailedInvoice?.invoiceNumber || '12345'}</span></div>
                  <div className="detail-row"><span>Invoice date</span><span contentEditable="true" suppressContentEditableWarning>{detailedInvoice?.invoiceDate ? new Date(detailedInvoice.invoiceDate).toLocaleDateString() : 'mm/dd/yyyy'}</span></div>
                  <div className="detail-row"><span>Terms</span><span contentEditable="true" suppressContentEditableWarning>Net 30</span></div>
                  <div className="detail-row"><span>Due date</span><span contentEditable="true" suppressContentEditableWarning>{detailedInvoice?.dueDate ? new Date(detailedInvoice.dueDate).toLocaleDateString() : 'mm/dd/yyyy'}</span></div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Product/ service</th>
                    <th style={{ width: '38%' }}>Description</th>
                    <th className="num" style={{ width: '14%' }}>Quantity/ hrs</th>
                    <th className="num" style={{ width: '14%' }}>Rate</th>
                    <th className="num" style={{ width: '14%' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center' }}>Loading items...</td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center' }}>No items found</td>
                    </tr>
                  ) : items.map((item, i) => (
                    <tr key={i}>
                      <td contentEditable="true" suppressContentEditableWarning>{item.product?.name || item.productId || 'Product'}</td>
                      <td contentEditable="true" suppressContentEditableWarning>{item.product?.description || 'Description of product or service'}</td>
                      <td className="num" contentEditable="true" suppressContentEditableWarning>{item.quantity}</td>
                      <td className="num" contentEditable="true" suppressContentEditableWarning>${parseFloat(item.unitPrice).toFixed(2)}</td>
                      <td className="num" contentEditable="true" suppressContentEditableWarning>${parseFloat(item.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="bottom-section">
                <div className="message">
                  <h4>Customer message</h4>
                  <p contentEditable="true" suppressContentEditableWarning>
                    Hello!<br/><br/>
                    Thank you for your purchase. Please return this invoice with payment.<br/><br/>
                    Thanks!
                  </p>
                </div>
                <div className="totals">
                  <div className="row"><span>Subtotal</span><span contentEditable="true" suppressContentEditableWarning>${parseFloat(detailedInvoice?.subtotal || 0).toFixed(2)}</span></div>
                  <div className="row"><span>Sales tax</span><span contentEditable="true" suppressContentEditableWarning>${parseFloat(detailedInvoice?.tax || 0).toFixed(2)}</span></div>
                  <div className="row"><span>Shipping</span><span contentEditable="true" suppressContentEditableWarning>$0.00</span></div>
                  <div className="total-row"><span>Total</span><span contentEditable="true" suppressContentEditableWarning>${parseFloat(detailedInvoice?.total || 0).toFixed(2)}</span></div>
                </div>
              </div>

            </div>

            <footer>
              <div className="qb"><span className="dot">qb</span> quickbooks</div>
              This invoice was generated with the help of QuickBooks Payments.<br/>
              Learn more, and create your own free account by visiting <a href="https://quickbooks.com" target="_blank" rel="noreferrer">quickbooks.com</a>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
