import React from 'react';
import Card from '../../../../../components/ui/Card';

export default function PaymentMethodSelectorCard({
  paymentCategory = 'ONLINE',
  onSelectCategory,
  paymentMethod = '',
  onSelectMethod,
  providers = [],
  selectedMethodOption = '',
  onChangeMethodOption,
  evidenceFile = null,
  evidencePreview = null,
  onEvidenceChange,
  onRemoveEvidence,
  referenceNumber = '',
  onChangeReferenceNumber,
  paymentNotes = '',
  onChangePaymentNotes,
}) {
  const activeCategoryProviders = providers.filter(
    (p) => p.type?.toUpperCase() === paymentCategory.toUpperCase() && p.isActive !== false
  );

  const currentProv = activeCategoryProviders.find(
    (p) => p.code === paymentMethod || p.id === paymentMethod
  ) || activeCategoryProviders[0];

  const subMethods = (currentProv?.methods || []).filter((m) => m.isActive !== false);
  const selectedMethod = subMethods.find((m) => (m.id || m.code) === selectedMethodOption);
  const requiresProof = selectedMethod?.requiresProof;

  return (
    <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-lg space-y-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
          <span>🏦</span> Company Payment Method
        </h3>
        <span className="text-xs text-muted-foreground">Select disbursement channel</span>
      </div>

      {/* Payment Category Selector Tabs */}
      <div className="flex bg-muted800 p-1 rounded-xl border border-border max-w-xs">
        <button
          type="button"
          onClick={() => onSelectCategory('ONLINE')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            paymentCategory === 'ONLINE'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🌐 Online Payment
        </button>
        <button
          type="button"
          onClick={() => onSelectCategory('MANUAL')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            paymentCategory === 'MANUAL'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          💵 Manual Payment
        </button>
      </div>

      {/* Options based on category & DB Providers */}
      {activeCategoryProviders.length > 0 ? (
        <div className="space-y-4">
          {/* Level 1: Payment Provider Cards */}
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              Step 1: Select Database Payment Provider / Institution
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeCategoryProviders.map((prov) => {
                const isSelected = paymentMethod === prov.code || paymentMethod === prov.id;
                return (
                  <div
                    key={prov.id || prov.code}
                    onClick={() => onSelectMethod(prov.code || prov.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col items-center justify-center text-center space-y-1.5 ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 font-bold shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-muted800/40 border-border text-muted-foreground hover:border-slate-600'
                    }`}
                  >
                    <span className="text-xl">
                      {prov.type?.toUpperCase() === 'ONLINE' ? '💳' : '🏦'}
                    </span>
                    <span className="text-xs font-bold text-foreground">{prov.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Code: {prov.code}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Level 2: Select Bank / Transfer Type — dropdown */}
          <div className="pt-3 border-t border-border/60 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1.5">
                Step 2: Select Bank / Transfer Type
              </label>
              {subMethods.length > 0 ? (
                <select
                  value={selectedMethodOption}
                  onChange={(e) => onChangeMethodOption(e.target.value)}
                  className="w-full sm:w-80 px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-sm text-foreground font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">— Choose transfer type —</option>
                  {subMethods.map((m) => (
                    <option key={m.id || m.code} value={m.id || m.code}>
                      {m.name}{m.requiresProof ? ' (Proof Required)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No sub-types configured for {currentProv?.name}.
                </p>
              )}
            </div>

            {/* Evidence / Proof Upload — Manual payments only */}
            {paymentCategory === 'MANUAL' && (
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Payment Evidence / Proof
                  {requiresProof && (
                    <span className="ml-2 text-rose-400 font-bold">(Required for this method)</span>
                  )}
                </label>
                <label
                  htmlFor="evidence-upload"
                  className={`flex flex-col items-center justify-center gap-2 w-full h-28 rounded-xl border-2 border-dashed cursor-pointer transition ${
                    evidenceFile
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : 'border-border hover:border-indigo-500 bg-muted800/30 hover:bg-indigo-500/5'
                  }`}
                >
                  {evidencePreview ? (
                    <div className="flex items-center gap-3 px-4">
                      <img
                        src={evidencePreview}
                        alt="Evidence preview"
                        className="w-14 h-14 object-cover rounded-lg border border-border"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="text-left">
                        <p className="text-xs font-bold text-emerald-400">✅ File Selected</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{evidenceFile?.name}</p>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); onRemoveEvidence(); }}
                          className="text-[10px] text-rose-400 hover:text-rose-300 mt-1 font-bold"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-2xl">📎</span>
                      <p className="text-xs font-bold text-muted-foreground">Click to upload receipt, bank slip, or screenshot</p>
                      <p className="text-[10px] text-muted-foreground/60">PNG, JPG, PDF up to 5 MB</p>
                    </>
                  )}
                  <input
                    id="evidence-upload"
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={onEvidenceChange}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-xl border border-dashed border-border/60 bg-muted800/20 text-center">
          <span className="text-3xl">🚫</span>
          <div>
            <p className="text-sm font-bold text-foreground">
              No Active {paymentCategory === 'ONLINE' ? 'Online' : 'Manual'} Payment Providers
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              No active {paymentCategory === 'ONLINE' ? 'online' : 'manual'} payment providers are configured in the system.
              Go to <span className="text-indigo-400 font-bold">Finance &rarr; Payment Options</span> to add providers.
            </p>
          </div>
        </div>
      )}

      {/* Reference input & Notes — Manual payments only */}
      {paymentCategory === 'MANUAL' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Payment Reference / Check Number
            </label>
            <input
              type="text"
              placeholder="e.g. TXN-89302194 / CHQ-0021"
              value={referenceNumber}
              onChange={(e) => onChangeReferenceNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs font-mono font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              Payment Settlement Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Vendor invoice settlement for goods receipt"
              value={paymentNotes}
              onChange={(e) => onChangePaymentNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}
    </Card>
  );
}
