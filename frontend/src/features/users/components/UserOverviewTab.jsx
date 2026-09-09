import React from 'react';
import Card from '../../../components/ui/Card';

export default function UserOverviewTab({ user, person, currentStatus, fullName }) {
  const customer = person?.customers?.[0] || user?.customer || person?.customer;
  const paymentTerm = customer?.paymentTerms || person?.paymentTerms;
  const paymentTermDisplay = paymentTerm?.name
    ? `${paymentTerm.name} (${paymentTerm.days} Days)`
    : 'COD (0 Days)';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Account Credentials */}
      <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
          <span>🔑</span> Authentication & Access
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Username Handle</span>
            <span className="font-mono font-bold text-foreground">@{user.username}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Account Status</span>
            <span className="font-bold text-foreground">{currentStatus}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Account Created At</span>
            <span className="font-medium text-foreground">
              {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Last Profile Update</span>
            <span className="font-medium text-foreground">
              {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>
      </Card>

      {/* Personnel Information */}
      <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
          <span>📋</span> Personnel Details
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Full Name</span>
            <span className="font-bold text-foreground">{fullName}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Email Address</span>
            <span className="font-medium text-indigo-400">{person.email || user.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Phone Number</span>
            <span className="font-medium text-foreground">{person.phone || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Address</span>
            <span className="font-medium text-foreground">{person.address || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Payment Terms</span>
            <span className="font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 inline-flex items-center gap-1">
              💳 {paymentTermDisplay}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
