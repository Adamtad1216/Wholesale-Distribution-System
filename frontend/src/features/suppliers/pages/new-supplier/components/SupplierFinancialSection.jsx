import React from 'react';
import Card from '../../../../../components/ui/Card';

export default function SupplierFinancialSection({
  formData,
  onChangeFormData,
  onAddPayoutChannel,
  onRemovePayoutChannel,
  onUpdatePayoutChannel,
}) {
  return (
    <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-6 shadow-lg">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider text-indigo-400">
          <span>🏦</span> 3. Payment Terms & Registered Payout Accounts
        </h3>

        <button
          type="button"
          onClick={onAddPayoutChannel}
          className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
        >
          <span>➕</span> Add Payout Channel / Account
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
            Default Payment Credit Terms
          </label>
          <select
            value={formData.paymentTerms}
            onChange={(e) => onChangeFormData({ ...formData, paymentTerms: e.target.value })}
            style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}
            className="w-full px-4 py-2.5 border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
          >
            <option value="Cash on Delivery" className="bg-[#0f172a] text-slate-100">
              Cash on Delivery (COD)
            </option>
            <option value="Net 15" className="bg-[#0f172a] text-slate-100">
              Net 15 Days
            </option>
            <option value="Net 30" className="bg-[#0f172a] text-slate-100">
              Net 30 Days
            </option>
            <option value="Net 60" className="bg-[#0f172a] text-slate-100">
              Net 60 Days
            </option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
            Supplier Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => onChangeFormData({ ...formData, status: e.target.value })}
            style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}
            className="w-full px-4 py-2.5 border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
          >
            <option value="ACTIVE" className="bg-[#0f172a] text-slate-100">
              ACTIVE
            </option>
            <option value="INACTIVE" className="bg-[#0f172a] text-slate-100">
              INACTIVE
            </option>
          </select>
        </div>
      </div>

      {/* Dynamic Multiple Payout Channels List */}
      <div className="space-y-4 pt-2">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
          <span>Registered Payout Channels ({formData.payoutChannels.length})</span>
          <span className="text-[10px] text-muted-foreground font-normal">
            Add multiple banks or mobile money accounts for vendor payouts
          </span>
        </div>

        {formData.payoutChannels.map((channel, idx) => (
          <div
            key={idx}
            className="p-4 bg-muted800/40 border border-border/80 rounded-2xl space-y-3 relative group animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <span>
                    {channel.channelType === 'CHAPA'
                      ? '⚡'
                      : channel.channelType === 'TELEBIRR'
                      ? '📱'
                      : '🏦'}
                  </span>{' '}
                  Payout Channel #{idx + 1}
                </span>
                {channel.isPrimary && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md border border-emerald-500/30">
                    Primary Payout
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!channel.isPrimary && (
                  <button
                    type="button"
                    onClick={() => onUpdatePayoutChannel(idx, 'isPrimary', true)}
                    className="px-2.5 py-1 bg-slate-700/50 text-slate-300 hover:text-emerald-400 text-[10px] font-bold rounded-lg border border-border transition"
                  >
                    Set as Primary
                  </button>
                )}
                {formData.payoutChannels.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemovePayoutChannel(idx)}
                    className="px-2.5 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    🗑️ Remove
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                  Channel / Type
                </label>
                <select
                  value={channel.channelType || 'BANK'}
                  onChange={(e) => onUpdatePayoutChannel(idx, 'channelType', e.target.value)}
                  style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="BANK" className="bg-[#0f172a] text-slate-100">
                    🏦 Bank Transfer
                  </option>
                  <option value="CHAPA" className="bg-[#0f172a] text-slate-100">
                    ⚡ Chapa Gateway
                  </option>
                  <option value="TELEBIRR" className="bg-[#0f172a] text-slate-100">
                    📱 Telebirr / Mobile Money
                  </option>
                  <option value="OTHER" className="bg-[#0f172a] text-slate-100">
                    💳 Other / Wire
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                  Bank Name / Gateway Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. CBE / Awash Bank / Chapa"
                  value={channel.bankName || ''}
                  onChange={(e) => onUpdatePayoutChannel(idx, 'bankName', e.target.value)}
                  className="w-full px-3.5 py-2 bg-muted800 border border-border rounded-xl text-foreground text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                  Account / Ref Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1000284719284"
                  value={channel.accountNumber || ''}
                  onChange={(e) => onUpdatePayoutChannel(idx, 'accountNumber', e.target.value)}
                  className="w-full px-3.5 py-2 bg-muted800 border border-border rounded-xl text-foreground text-xs font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Supplier Business PLC"
                  value={channel.accountName || ''}
                  onChange={(e) => onUpdatePayoutChannel(idx, 'accountName', e.target.value)}
                  className="w-full px-3.5 py-2 bg-muted800 border border-border rounded-xl text-foreground text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
