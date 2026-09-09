import React from 'react';
import Button from '../../../../../components/ui/Button';

export default function PaymentOptionsHeader({
  providerCount = 0,
  onBack,
  onAddProvider,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
      <div>
        <button
          onClick={onBack}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 mb-2"
        >
          ← Back to Finance & Billing
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Payment Providers & Options
          </h1>
          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-mono font-bold">
            {providerCount} Providers Registered
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Configure system-wide payment institutions, gateways, and specific payment method options.
        </p>
      </div>

      <Button
        variant="primary"
        size="md"
        onClick={onAddProvider}
        className="px-5 shadow-lg shadow-indigo-500/20 font-bold"
      >
        ➕ Add New Payment Provider
      </Button>
    </div>
  );
}
