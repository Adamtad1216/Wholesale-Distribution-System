import React, { useState, useEffect } from 'react';
import Invoice from './Invoice';
import PaymentTermsTab from '../components/PaymentTermsTab';
import PaymentsTab from '../components/PaymentsTab';
import PaymentApprovalTab from '../components/PaymentApprovalTab';
import CreditTab from '../components/CreditTab';
import { usePermission } from '../../../hooks/usePermission';

export default function FinanceDashboard() {
  const { can: canReadInvoices } = usePermission('invoices:read');
  const { can: canReadPayments } = usePermission('payments:read');
  const { can: canReadCredits } = usePermission('credits:read');
  const { can: canReadPaymentTerms } = usePermission('payment-terms:read');

  const availableTabs = [];
  if (canReadInvoices) availableTabs.push({ id: 'invoices', label: 'Invoices' });
  if (canReadPayments) availableTabs.push({ id: 'payments', label: 'Payments' });
  if (canReadPayments) availableTabs.push({ id: 'payment-approval', label: 'Payment Approval' });
  if (canReadCredits) availableTabs.push({ id: 'credit', label: 'Credit' });
  if (canReadPaymentTerms) availableTabs.push({ id: 'payment-terms', label: 'Payment Terms' });

  const [activeTab, setActiveTab] = useState(availableTabs[0]?.id || '');

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(t => t.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  if (availableTabs.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 mt-12">
        <div className="card p-12 text-center text-muted-foreground border-border/40">
          You do not have permission to view any finance modules.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Finance & Billing</h1>
        <p className="text-muted-foreground">Manage invoices, payments, credit limits, and payment terms.</p>
      </div>

      <div className="border-b border-border/40">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'invoices' && <Invoice />}
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'payment-approval' && <PaymentApprovalTab />}
        {activeTab === 'credit' && <CreditTab />}
        {activeTab === 'payment-terms' && <PaymentTermsTab />}
      </div>
    </div>
  );
}
