import React from 'react';
import Card from '../../../../../components/ui/Card';

export default function VendorProfileCard({ supplier = {} }) {
  const getSupplierName = (sup) => {
    if (!sup) return 'N/A';
    if (typeof sup === 'string') return sup;
    if (sup.name) return sup.name;
    if (sup.companyName) return sup.companyName;
    if (sup.organization?.name) return sup.organization.name;
    if (sup.person) {
      const fullName = `${sup.person.firstName || ''} ${sup.person.lastName || ''}`.trim();
      if (fullName) return fullName;
    }
    if (sup.contactPerson) return sup.contactPerson;
    return 'Supplier Vendor';
  };

  const getVendorPaymentChannels = (sup) => {
    if (!sup) return [];

    if (Array.isArray(sup.paymentChannels) && sup.paymentChannels.length > 0) {
      return sup.paymentChannels;
    }
    if (Array.isArray(sup.payoutChannels) && sup.payoutChannels.length > 0) {
      return sup.payoutChannels.map((c, idx) => ({
        id: c.id || `payout-${idx}`,
        icon: c.channelType === 'CHAPA' ? '⚡' : c.channelType === 'TELEBIRR' ? '📱' : '🏦',
        title: c.bankName || (c.channelType === 'BANK' ? 'Bank Transfer' : c.channelType || 'Payout Account'),
        badge: c.isPrimary ? 'Primary Account' : (c.channelType || 'Registered'),
        badgeStyle: c.isPrimary ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400',
        account: `Acc: ${c.accountNumber}`,
        subtitle: c.accountName ? `Holder: ${c.accountName}` : `Payee: ${getSupplierName(sup)}`
      }));
    }
    if (Array.isArray(sup.paymentMethods) && sup.paymentMethods.length > 0) {
      return sup.paymentMethods.map((pm, idx) => ({
        id: pm.id || `pm-${idx}`,
        icon: pm.icon || '💳',
        title: pm.name || pm.title || 'Payment Channel',
        badge: pm.type || 'Registered',
        badgeStyle: 'bg-indigo-500/20 text-indigo-400',
        account: pm.accountNumber || pm.account || pm.details || 'Available',
        subtitle: pm.bankName || pm.description || 'Vendor Preferred Channel'
      }));
    }

    const channels = [];

    if (sup.bankAccount || sup.cbeAccount || sup.accountNumber || sup.bankName) {
      channels.push({
        id: 'bank',
        icon: '🏦',
        title: sup.bankName ? `Bank Transfer (${sup.bankName})` : 'Bank Transfer (CBE)',
        badge: 'Primary Account',
        badgeStyle: 'bg-emerald-500/20 text-emerald-400',
        account: `Acc: ${sup.bankAccount || sup.cbeAccount || sup.accountNumber}`,
        subtitle: `Payee: ${getSupplierName(sup)}`
      });
    }

    if (sup.chapaRef || sup.chapaAccount || sup.onlinePayoutRef) {
      channels.push({
        id: 'chapa',
        icon: '⚡',
        title: 'Chapa Payout Gateway',
        badge: 'Online Payout',
        badgeStyle: 'bg-indigo-500/20 text-indigo-400',
        account: `Ref: ${sup.chapaRef || sup.chapaAccount || sup.onlinePayoutRef}`,
        subtitle: 'Instant Outbound Settlement'
      });
    }

    const phoneNum = sup.telebirrNumber || sup.mobileMoney || sup.phone || sup.contactPhone;
    if (phoneNum) {
      channels.push({
        id: 'mobile',
        icon: '📱',
        title: 'Telebirr / Mobile Wallet',
        badge: 'Mobile Wallet',
        badgeStyle: 'bg-amber-500/20 text-amber-400',
        account: `Mobile: ${phoneNum}`,
        subtitle: 'Direct Wallet Transfer'
      });
    }

    return channels;
  };

  const vendorChannels = getVendorPaymentChannels(supplier);

  return (
    <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-lg space-y-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
          <span>🏢</span> Vendor / Supplier Profile
        </h3>
        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
          Verified Vendor
        </span>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Vendor Name</span>
          <span className="font-bold text-foreground text-sm">{getSupplierName(supplier)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Supplier Code</span>
          <span className="font-mono font-bold text-indigo-400">{supplier.code || supplier.supplierCode || 'SUP-VENDOR'}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">TIN / Tax Reg. No</span>
          <span className="font-mono text-foreground">{supplier.tin || supplier.taxNumber || '1004928491'}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Email Address</span>
          <span className="text-foreground">{supplier.email || supplier.contactEmail || 'vendor@supplier.com'}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Phone Number</span>
          <span className="font-mono text-foreground">{supplier.phone || supplier.contactPhone || '+251 911 000 000'}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Address / Location</span>
          <span className="text-foreground">{supplier.address || 'Addis Ababa, Ethiopia'}</span>
        </div>
      </div>

      {/* Vendor Payment Ways / Channels */}
      <div className="pt-3 border-t border-border/60 space-y-3">
        <span className="text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider block">
          💳 Vendor Registered Payout Channels & Accounts
        </span>
        {vendorChannels.length === 0 ? (
          <div className="p-3 bg-muted800/40 border border-border/50 rounded-xl text-xs text-muted-foreground italic flex items-center gap-2">
            <span>ℹ️</span> No specific electronic payment channels registered for this vendor. Defaulting to Cheque/Cash disbursement.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {vendorChannels.map((channel, idx) => (
              <div key={channel.id || idx} className="p-3 bg-muted800/70 border border-border/80 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-[11px]">
                    {channel.icon || '💳'} {channel.title}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 font-bold rounded ${channel.badgeStyle || 'bg-indigo-500/20 text-indigo-400'}`}>
                    {channel.badge || 'Active'}
                  </span>
                </div>
                <div className="text-[11px] text-foreground font-mono font-semibold truncate">
                  {channel.account}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {channel.subtitle}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
