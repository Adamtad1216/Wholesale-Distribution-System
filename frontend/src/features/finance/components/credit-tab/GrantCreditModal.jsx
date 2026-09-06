import React from 'react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';
import { CreditCard, AlertCircle } from 'lucide-react';
import CustomerTagSelect from './CustomerTagSelect';

export default function GrantCreditModal({
  isOpen,
  onClose,
  customersList,
  selectedCustomerIds,
  setSelectedCustomerIds,
  creditAmount,
  setCreditAmount,
  creditReason,
  setCreditReason,
  handleGrantCredit,
  isSubmitting,
  formError,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Grant Store Credit"
      subtitle="Issue a new store credit balance to a customer."
      icon={<CreditCard className="w-5 h-5 text-indigo-400" />}
      maxWidth="max-w-lg"
    >
      {formError && (
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleGrantCredit} className="space-y-4">
        {/* Customer Tag-Select */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)', marginBottom: '6px' }}>
            Recipients <span style={{ color: '#f87171' }}>*</span>
          </label>
          <CustomerTagSelect
            customers={customersList}
            selectedIds={selectedCustomerIds}
            onAdd={(id) => setSelectedCustomerIds((prev) => { const n = new Set(prev); n.add(id); return n; })}
            onRemove={(id) => setSelectedCustomerIds((prev) => { const n = new Set(prev); n.delete(id); return n; })}
          />
        </div>

        {/* Credit Amount */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Credit Amount (ETB) <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            placeholder="e.g. 5000"
            min="1"
            step="any"
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
            className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
            required
          />
        </div>

        {/* Reason / Memo */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Reason / Grant Memo
          </label>
          <textarea
            rows="3"
            placeholder="e.g. Goodwill promotional store credit issued by Finance Manager"
            value={creditReason}
            onChange={(e) => setCreditReason(e.target.value)}
            className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500 transition-colors resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-5 py-2 rounded-xl flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Issuing...</span>
              </>
            ) : (
              <span>Grant Credit</span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
