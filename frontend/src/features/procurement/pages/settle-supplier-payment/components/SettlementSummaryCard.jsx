import React from 'react';
import Card from '../../../../../components/ui/Card';
import Button from '../../../../../components/ui/Button';

export default function SettlementSummaryCard({
  includeVat = true,
  onChangeIncludeVat,
  includeWithholding = false,
  onChangeIncludeWithholding,
  shippingFee = 0,
  onChangeShippingFee,
  goodsSubtotal = 0,
  vatAmount = 0,
  withholdingAmount = 0,
  totalShipping = 0,
  grandTotal = 0,
  providers = [],
  paymentMethod = '',
  paymentCategory = 'ONLINE',
  submitting = false,
  onSettlePayment,
}) {
  const selectedProv = providers.find(
    (p) => p.code === paymentMethod || p.id === paymentMethod
  );

  const provName = selectedProv?.name || (paymentMethod ? paymentMethod.replace(/_/g, ' ') : '');
  let buttonLabel = '💳 Process & Complete Settlement';

  if (provName) {
    if (paymentCategory === 'ONLINE') {
      buttonLabel = `⚡ Pay with ${provName}`;
    } else {
      buttonLabel = `💵 Settle via ${provName}`;
    }
  }

  return (
    <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-xl space-y-5 sticky top-6">
      <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-border pb-3">
        <span>💰</span> Settlement Financial Summary
      </h3>

      {/* Tax / Fee Toggles */}
      <div className="space-y-2.5 text-xs bg-muted800/60 p-3.5 rounded-xl border border-border">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-muted-foreground font-semibold">Include VAT (15%)</span>
          <input
            type="checkbox"
            checked={includeVat}
            onChange={(e) => onChangeIncludeVat(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 bg-muted800 border-border focus:ring-indigo-500"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-muted-foreground font-semibold">Withholding Tax (-2%)</span>
          <input
            type="checkbox"
            checked={includeWithholding}
            onChange={(e) => onChangeIncludeWithholding(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 bg-muted800 border-border focus:ring-indigo-500"
          />
        </label>
        <div className="pt-2 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Freight / Shipping Fee ($)</span>
          <input
            type="number"
            min="0"
            value={shippingFee || ''}
            onChange={(e) => onChangeShippingFee(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="0.00"
            className="w-full px-3 py-1.5 bg-muted800 border border-border rounded-lg text-foreground text-xs font-mono font-bold focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Breakdown List */}
      <div className="space-y-3 text-xs border-t border-border pt-3">
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Goods Net Subtotal:</span>
          <span className="font-mono font-bold text-foreground">
            ${goodsSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {includeVat && (
          <div className="flex justify-between items-center text-muted-foreground">
            <span>VAT (15%):</span>
            <span className="font-mono font-bold text-indigo-400">
              +${vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {includeWithholding && (
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Withholding Tax (-2%):</span>
            <span className="font-mono font-bold text-rose-400">
              -${withholdingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {totalShipping > 0 && (
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Shipping & Freight:</span>
            <span className="font-mono font-bold text-indigo-400">
              +${totalShipping.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Grand Total Box */}
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 mt-4">
          <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-extrabold block">
            Grand Total Settlement Amount
          </span>
          <span className="text-2xl font-black text-emerald-400 font-mono block">
            ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Settlement Action Button */}
      <Button
        variant="primary"
        size="md"
        disabled={submitting}
        onClick={onSettlePayment}
        className={`w-full py-3 shadow-xl text-sm font-extrabold transition-all ${
          paymentCategory === 'ONLINE'
            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
            : 'shadow-indigo-500/20'
        }`}
      >
        {submitting ? 'Processing Payment...' : buttonLabel}
      </Button>
    </Card>
  );
}
