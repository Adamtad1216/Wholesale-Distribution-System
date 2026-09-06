import React from 'react';
import Card from '../../../../../components/ui/Card';

export default function SupplierOverviewTab({
  supplier,
  isIndividual,
  vendorPaymentChannels = [],
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Contact & Identity Details Card */}
      <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-foreground border-b border-border/50 pb-3 flex items-center gap-2">
          <span>{isIndividual ? '👤' : '🏢'}</span>{' '}
          {isIndividual ? 'Personal Identity & Contact' : 'Primary Contact Information'}
        </h3>

        <div className="space-y-3 text-xs">
          {isIndividual ? (
            <>
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground font-bold">First Name:</span>
                <span className="font-bold text-foreground">
                  {supplier.firstName || supplier.person?.firstName || supplier.name?.split(' ')[0] || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground font-bold">Middle Name (Father's):</span>
                <span className="font-bold text-foreground">
                  {supplier.middleName || supplier.person?.middleName || supplier.name?.split(' ')[1] || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground font-bold">Last Name (Grandfather's):</span>
                <span className="font-bold text-foreground">
                  {supplier.lastName || supplier.person?.lastName || supplier.name?.split(' ')[2] || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground font-bold">National ID / Kebele ID:</span>
                <span className="font-mono font-bold text-indigo-400">{supplier.nationalId || 'N/A'}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground font-bold">Representative Contact:</span>
              <span className="font-bold text-foreground">{supplier.contactPerson || 'N/A'}</span>
            </div>
          )}

          <div className="flex justify-between py-2 border-b border-border/30">
            <span className="text-muted-foreground font-bold">Primary Phone:</span>
            <span className="font-mono text-foreground font-bold">{supplier.phone || 'N/A'}</span>
          </div>

          {supplier.altPhone && (
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground font-bold">Alternate Phone:</span>
              <span className="font-mono text-muted-foreground">{supplier.altPhone}</span>
            </div>
          )}

          <div className="flex justify-between py-2 border-b border-border/30">
            <span className="text-muted-foreground font-bold">Email Address:</span>
            <span className="font-mono text-indigo-400">{supplier.email || 'N/A'}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-border/30">
            <span className="text-muted-foreground font-bold">Tax Identification (TIN):</span>
            <span className="font-mono font-bold text-emerald-400">{supplier.tin || 'N/A'}</span>
          </div>
        </div>

        {/* Additional / Alternate Contacts List */}
        {supplier.additionalContacts?.length > 0 && (
          <div className="pt-4 border-t border-border/50 space-y-3">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Alternate Contact Representatives ({supplier.additionalContacts.length})
            </h4>
            <div className="space-y-2">
              {supplier.additionalContacts.map((c, i) => (
                <div key={i} className="p-3 bg-muted800/40 border border-border/60 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-foreground">{c.name || 'Unnamed Contact'}</span>
                    <span className="text-indigo-400 font-mono text-[11px]">{c.role || 'Representative'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground font-mono text-[11px]">
                    {c.phone && <span>📞 {c.phone}</span>}
                    {c.email && <span>📧 {c.email}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Bank Details & Location Card */}
      <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-foreground border-b border-border/50 pb-3 flex items-center gap-2">
          <span>🏦</span> Bank Payouts & Physical Address
        </h3>

        {/* Dynamic Payout Channels List */}
        {vendorPaymentChannels.length === 0 ? (
          <div className="p-3 bg-muted800/40 border border-border/50 rounded-xl text-xs text-muted-foreground italic flex items-center gap-2">
            <span>ℹ️</span> No specific bank account or electronic payment channel recorded for this vendor.
          </div>
        ) : (
          <div className="space-y-2 pb-2">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
              Registered Payout Channels ({vendorPaymentChannels.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vendorPaymentChannels.map((ch, idx) => (
                <div key={ch.id || idx} className="p-3 bg-muted800/70 border border-border/80 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-xs">
                      {ch.icon || '💳'} {ch.title}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 font-bold rounded ${ch.badgeStyle || 'bg-indigo-500/20 text-indigo-400'}`}>
                      {ch.badge || 'Active'}
                    </span>
                  </div>
                  <div className="text-xs text-foreground font-mono font-semibold truncate">
                    {ch.account}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {ch.subtitle}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 text-xs pt-3 border-t border-border/50">
          <div className="flex justify-between py-2 border-b border-border/30">
            <span className="text-muted-foreground font-bold">Default Credit Terms:</span>
            <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold rounded-lg">
              {supplier.paymentTerms || 'Net 30'}
            </span>
          </div>

          {(supplier.city || supplier.region) && (
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground font-bold">City & Region:</span>
              <span className="font-bold text-foreground">
                {[supplier.city, supplier.region].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          <div className="py-2 space-y-1">
            <span className="text-muted-foreground font-bold block">Physical Location Address:</span>
            <p className="text-foreground bg-muted800 p-3 rounded-xl border border-border/50 font-medium">
              {supplier.address || 'No physical address recorded on file.'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
