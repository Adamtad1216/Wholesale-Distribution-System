import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../../../finance/financeApi';
import './Checkout.css';

export default function Checkout() {
  const { id: invoiceId } = useParams();
  const navigate = useNavigate();

  // 1. Fetch Invoice
  const { data: invoiceResponse, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoice-detail', invoiceId],
    queryFn: () => financeApi.getInvoiceById(invoiceId).catch(() => ({ data: null })),
    enabled: !!invoiceId
  });

  const invoice = invoiceResponse?.data;
  const originalTotal = invoice ? parseFloat(invoice.total || 0) : 0;
  const previousPaid = invoice
    ? (invoice.paidAmount !== undefined && invoice.paidAmount !== null
        ? parseFloat(invoice.paidAmount)
        : (invoice.balance !== undefined ? Math.max(0, originalTotal - parseFloat(invoice.balance)) : 0))
    : 0;

  const BASE_GRAND_TOTAL = invoice
    ? (invoice.balance !== undefined && invoice.balance !== null
        ? parseFloat(invoice.balance)
        : Math.max(0, originalTotal - previousPaid))
    : 0;
  
  // 2. Fetch Providers
  const { data: providersResponse, isLoading: providersLoading } = useQuery({
    queryKey: ['payment-providers'],
    queryFn: () => financeApi.getProviders()
  });

  const providers = providersResponse?.data || [];
  const onlineProviders = providers.filter(p => p.type === 'ONLINE' && p.isActive);
  const manualProviders = providers.filter(p => p.type === 'MANUAL' && p.isActive);

  const bankAccounts = {
    CBE: { account: "100029384912", branch: "Finfine Main Branch" },
    AWASH: { account: "0132049281900", branch: "Bole Medhanialem Branch" },
    DASHEN: { account: "5083920194821", branch: "Corporate Banking Hub" }
  };

  const MAX_CREDIT = 40000.00; // Simulated available credit
  
  const [appliedCredit, setAppliedCredit] = useState(0.00);
  const [selectedMethod, setSelectedMethod] = useState('online');
  const [selectedGatewayProvider, setSelectedGatewayProvider] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileObject, setFileObject] = useState(null);
  const [refNo, setRefNo] = useState('');
  const [isCreditBoxVisible, setIsCreditBoxVisible] = useState(false);
  const [creditInput, setCreditInput] = useState('');
  const [creditStatusMsg, setCreditStatusMsg] = useState('Max limit: 40,000 ETB');
  const [creditStatusColor, setCreditStatusColor] = useState('#15803d');

  useEffect(() => {
    if (onlineProviders.length > 0 && !selectedGatewayProvider) {
      setSelectedGatewayProvider(onlineProviders[0].code);
    }
    if (manualProviders.length > 0 && manualProviders[0].methods?.length > 0 && !selectedBank) {
      setSelectedBank(manualProviders[0].methods[0].code);
    }
  }, [providersResponse, selectedGatewayProvider, selectedBank]);

  const remainingTotal = BASE_GRAND_TOTAL - appliedCredit;
  const isFullyCovered = remainingTotal <= 0 && BASE_GRAND_TOTAL > 0;

  const handleGatewaySelect = (providerCode) => {
    setSelectedGatewayProvider(providerCode);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(`Selected: ${file.name}`);
      setFileObject(file);
    } else {
      setFileName('');
      setFileObject(null);
    }
  };

  const handleCreditToggle = (e) => {
    const isChecked = e.target.checked;
    setIsCreditBoxVisible(isChecked);
    if (!isChecked) {
      setCreditInput('');
      setAppliedCredit(0);
      setCreditStatusMsg('Max limit: 40,000 ETB');
      setCreditStatusColor('#15803d');
    }
  };

  const handleApplyCredit = () => {
    let val = parseFloat(creditInput);
    if (isNaN(val) || val <= 0) {
      setAppliedCredit(0);
      setCreditStatusMsg("Please enter a valid amount.");
      setCreditStatusColor("#b91c1c");
      return;
    }

    if (val > MAX_CREDIT) {
      val = MAX_CREDIT;
      setCreditInput(val.toString());
    }

    if (val > BASE_GRAND_TOTAL) {
      val = BASE_GRAND_TOTAL;
      setCreditInput(val.toString());
    }

    setAppliedCredit(val);
    setCreditStatusMsg(`Applied ${val.toLocaleString()} ETB from credit balance.`);
    setCreditStatusColor("#15803d");
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (isFullyCovered) {
      alert('Order completed using account credit!');
      return;
    }

    setIsSubmitting(true);

    if (selectedMethod === 'online') {
      try {
        const response = await financeApi.initiatePayment({
          provider: selectedGatewayProvider,
          orderId: invoice.salesOrderId,
          amount: remainingTotal,
          email: invoice.customer?.person?.email || 'customer@gmail.com',
          firstName: invoice.customer?.person?.firstName || 'Customer',
          lastName: invoice.customer?.person?.lastName || 'User'
        });

        if (response.data && response.data.checkoutUrl) {
          window.location.href = response.data.checkoutUrl;
        } else {
          alert('Failed to get checkout URL from provider');
          setIsSubmitting(false);
        }
      } catch (error) {
        console.error('Payment initialization failed:', error);
        alert('Failed to initialize payment');
        setIsSubmitting(false);
      }
    } else {
      // Manual Bank Transfer flow
      try {
        const txRef = refNo.trim() || `TX-BANK-${Date.now()}`;
        const initRes = await financeApi.initiatePayment({
          provider: 'bank_transfer',
          orderId: invoice.salesOrderId,
          amount: remainingTotal,
          txRef,
          email: invoice.customer?.person?.email || 'customer@gmail.com',
          firstName: invoice.customer?.person?.firstName || 'Customer',
          lastName: invoice.customer?.person?.lastName || 'User'
        });

        const paymentId = initRes.data?.paymentId || initRes.data?.data?.paymentId;

        if (fileObject && paymentId) {
          try {
            const formData = new FormData();
            formData.append('file', fileObject);
            await financeApi.submitPaymentProof(paymentId, formData);
          } catch (proofErr) {
            console.warn('Proof upload warning:', proofErr);
          }
        }

        navigate(`/receipt?tx_ref=${txRef}&manual=true`);
      } catch (err) {
        console.error('Manual payment submission failed:', err);
        alert(err.response?.data?.message || 'Failed to submit manual payment.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Find the selected active provider object for display info
  const activeOnline = onlineProviders.find(p => p.code === selectedGatewayProvider) || onlineProviders[0];
  const activeManual = manualProviders[0]; // Assuming one main manual provider for now
  
  const gatewayLabel = activeOnline?.code === 'telebirr' ? 'Telebirr Registered Phone Number' :
                       activeOnline?.code === 'chapa' ? 'Redirecting to Chapa Gateway on submit' :
                       'SantimPay Account Phone / Identifier';
  const gatewayPlaceholder = activeOnline?.code === 'telebirr' ? '09xxxxxxxx' :
                             activeOnline?.code === 'chapa' ? 'Account or Cardholder Phone' : '09xxxxxxxx';

  const providerName = activeOnline?.name || 'Online Gateway';
  const submitText = isFullyCovered ? 'Complete Order with Account Credit' :
                     selectedMethod === 'online' ? `Pay with ${providerName} (${remainingTotal.toLocaleString()} ETB)` :
                     `Upload Slip & Confirm Order (${remainingTotal.toLocaleString()} ETB)`;

  const submitHint = isFullyCovered ? 'Your credit balance covers the full amount. No external payment required.' :
                     selectedMethod === 'online' ? `You will be directed to authenticate via ${providerName}.` :
                     'Receipt slip will be verified manually by accounts before shipment.';

  if (invoiceLoading || providersLoading) {
    return <div className="p-8 text-center">Loading Checkout...</div>;
  }

  if (!invoice) {
    return <div className="p-8 text-center text-red-500">Invoice not found.</div>;
  }

  return (
    <div className="checkout-page-wrapper">
      <div className="checkout-container">
        
        <main>
          {previousPaid > 0 && (
            <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between text-sm shadow-sm">
              <div>
                <span className="font-bold text-amber-400 block text-xs uppercase tracking-wider">Partial Payment Notice</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You have previously paid <span className="font-bold text-foreground">{previousPaid.toLocaleString()} ETB</span> towards Invoice #{invoice.invoiceNumber}.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Remaining Due</span>
                <span className="font-mono font-bold text-foreground text-sm">{BASE_GRAND_TOTAL.toLocaleString()} ETB</span>
              </div>
            </div>
          )}

          <div className="checkout-card">
            <h2 className="checkout-card-title">1. Shipping & Contact</h2>
            <div className="checkout-grid-2">
              <div className="checkout-form-group">
                <label>Company / Full Name</label>
                <input type="text" defaultValue={invoice.customer?.person ? `${invoice.customer.person.firstName} ${invoice.customer.person.lastName}` : "Customer"} disabled />
              </div>
              <div className="checkout-form-group">
                <label>Billing Email</label>
                <input type="email" defaultValue={invoice.customer?.person?.email || "customer@example.com"} disabled />
              </div>
            </div>
            <div className="checkout-form-group">
              <label>Delivery Address</label>
              <input type="text" defaultValue="Bole Sub-City, House 204, Addis Ababa" />
            </div>
          </div>

          <div className={`checkout-card ${isFullyCovered ? 'disabled-section' : ''}`} id="payment-section">
            <h2 className="checkout-card-title">2. Payment Methods</h2>

            <div className="payment-options">
              
              {onlineProviders.length > 0 && (
                <label className={`option-label ${selectedMethod === 'online' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="payment_method" 
                    value="online" 
                    checked={selectedMethod === 'online'} 
                    onChange={() => setSelectedMethod('online')} 
                  />
                  <div className="option-info">
                    <div className="option-header">
                      <span>Online Payment</span>
                      <span className="badge-instant">Instant Clearance</span>
                    </div>
                    <div className="option-desc">Checkout directly using local mobile wallets or direct bank APIs.</div>
                    
                    <div className={`subform ${selectedMethod === 'online' ? 'active' : ''}`}>
                      <label>Select Gateway Provider</label>
                      <div className="gateway-grid">
                        {onlineProviders.map(provider => (
                          <div 
                            key={provider.id}
                            className={`gateway-card ${selectedGatewayProvider === provider.code ? 'selected-gateway' : ''}`} 
                            onClick={() => handleGatewaySelect(provider.code)}
                          >
                            <span className="gateway-title">{provider.name}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--checkout-text-muted)' }}>
                              {provider.code === 'telebirr' ? 'SuperApp / USSD' : provider.code === 'chapa' ? 'Cards & Banks' : 'Direct Mobile Banking'}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="checkout-form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                        <label>{gatewayLabel}</label>
                        <input type="tel" placeholder={gatewayPlaceholder} />
                      </div>
                    </div>
                  </div>
                </label>
              )}

              {manualProviders.length > 0 && activeManual?.methods?.length > 0 && (
                <label className={`option-label ${selectedMethod === 'bank' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="payment_method" 
                    value="bank" 
                    checked={selectedMethod === 'bank'}
                    onChange={() => setSelectedMethod('bank')} 
                  />
                  <div className="option-info">
                    <div className="option-header">
                      <span>{activeManual.name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--checkout-text-muted)' }}>Offline Verification</span>
                    </div>
                    <div className="option-desc">Manually transfer via branch or mobile banking, then upload the receipt slip.</div>
                    
                    <div className={`subform ${selectedMethod === 'bank' ? 'active' : ''}`}>
                      <div className="checkout-form-group">
                        <label>Deposit To Company Account</label>
                        <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}>
                          {activeManual.methods.map(method => (
                            <option key={method.id} value={method.code}>{method.name}</option>
                          ))}
                        </select>
                      </div>

                      {bankAccounts[selectedBank] && (
                        <div className="bank-details-box">
                          <div className="detail-row">
                            <span>Account Name:</span>
                            <strong>Enterprise Wholesale PLC</strong>
                          </div>
                          <div className="detail-row">
                            <span>Account Number:</span>
                            <strong>{bankAccounts[selectedBank].account}</strong>
                          </div>
                          <div className="detail-row">
                            <span>Branch:</span>
                            <strong>{bankAccounts[selectedBank].branch}</strong>
                          </div>
                        </div>
                      )}

                      <div className="checkout-form-group">
                        <label>Reference / Transaction Number</label>
                        <input
                          type="text"
                          placeholder="e.g. FT2309192301"
                          value={refNo}
                          onChange={(e) => setRefNo(e.target.value)}
                        />
                      </div>

                      <div className="checkout-form-group" style={{ marginBottom: 0 }}>
                        <label>Attach Deposit Slip (Image or PDF)</label>
                        <div className="file-dropzone">
                          <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} />
                          <span style={{ fontSize: '0.82rem', color: 'var(--checkout-text-muted)' }}>
                            Click or drag & drop slip here
                          </span>
                          <div className="file-name-preview">{fileName}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              )}

            </div>
          </div>
        </main>

        <aside className="order-sidebar">
          <div className="checkout-card">
            <h3 className="checkout-card-title">Order Summary</h3>
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--checkout-text-muted)' }}>Invoice #{invoice.invoiceNumber}</span>
            </div>
            
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map(item => (
                <div className="item-row" key={item.id}>
                  <div className="item-meta">
                    <span className="item-name">{item.product?.name || 'Product'}</span>
                    <span className="item-qty">Qty: {parseFloat(item.quantity)} × {parseFloat(item.unitPrice).toLocaleString()} ETB</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{parseFloat(item.total).toLocaleString()} ETB</span>
                </div>
              ))
            ) : (
              <div className="item-row">
                <span className="item-name">Invoice Items</span>
                <span style={{ fontWeight: 600 }}>{BASE_GRAND_TOTAL.toLocaleString()} ETB</span>
              </div>
            )}

            <div className="credit-accordion">
              <div className="credit-header">
                <label>
                  <input 
                    type="checkbox" 
                    checked={isCreditBoxVisible}
                    onChange={handleCreditToggle} 
                  />
                  Use Account Credit
                </label>
                <span className="credit-balance-pill">Available: 40,000 ETB</span>
              </div>

              <div className={`credit-input-row ${isCreditBoxVisible ? 'visible' : ''}`}>
                <label style={{ color: 'var(--checkout-success)', fontSize: '0.8rem' }}>Amount to Apply (ETB)</label>
                <div className="input-action-group">
                  <input 
                    type="number" 
                    placeholder="e.g. 20000" 
                    min="0" 
                    max="40000" 
                    step="any"
                    value={creditInput}
                    onChange={(e) => setCreditInput(e.target.value)}
                  />
                  <button type="button" className="btn-apply" onClick={handleApplyCredit}>Apply</button>
                </div>
                <div style={{ fontSize: '0.75rem', color: creditStatusColor, marginTop: '0.35rem' }}>
                  {creditStatusMsg}
                </div>
              </div>
            </div>

            <div className="pricing-summary">
              <div className="price-row">
                <span>Invoice Subtotal</span>
                <span>{parseFloat(invoice.subtotal).toLocaleString()} ETB</span>
              </div>
              <div className="price-row">
                <span>VAT</span>
                <span>{parseFloat(invoice.tax || 0).toLocaleString()} ETB</span>
              </div>
              <div className="price-row font-semibold">
                <span>Invoice Total</span>
                <span>{originalTotal.toLocaleString()} ETB</span>
              </div>
              
              {previousPaid > 0 && (
                <div className="price-row credit-deduction" style={{ color: '#10b981' }}>
                  <span>Previously Paid</span>
                  <span>-{previousPaid.toLocaleString()} ETB</span>
                </div>
              )}

              {appliedCredit > 0 && (
                <div className="price-row credit-deduction">
                  <span>Account Credit Applied</span>
                  <span>-{appliedCredit.toLocaleString()} ETB</span>
                </div>
              )}

              <div className="price-row total">
                <span>{previousPaid > 0 || appliedCredit > 0 ? 'Remaining Balance Due' : 'Grand Total'}</span>
                <span>{remainingTotal.toLocaleString()} ETB</span>
              </div>
            </div>

            <button
              type="button"
              className="submit-btn"
              onClick={handleCheckout}
              disabled={isSubmitting}
              style={{
                opacity: isSubmitting ? 0.75 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border animate-spin" style={{
                    width: '1.1rem',
                    height: '1.1rem',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    display: 'inline-block'
                  }} />
                  <span>Processing & Uploading Slip...</span>
                </>
              ) : (
                submitText
              )}
            </button>
            
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--checkout-text-muted)', marginTop: '0.75rem' }}>
              {submitHint}
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
}
