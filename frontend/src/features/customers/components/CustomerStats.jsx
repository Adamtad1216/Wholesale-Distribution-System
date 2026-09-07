import React from 'react';
import { Users, Building2, User, CreditCard } from 'lucide-react';
import Card from '../../../components/ui/Card';

export default function CustomerStats({ stats, formatCurrency }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* Total Customers */}
      <Card className="p-5 border border-border bg-card rounded-2xl relative overflow-hidden shadow-sm hover:border-border/80 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Accounts</p>
            <h3 className="text-2xl font-black text-foreground mt-1.5">{stats.total}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Active directory profiles</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-violet-500/15 text-violet-500 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </Card>

      {/* Corporate Clients */}
      <Card className="p-5 border border-border bg-card rounded-2xl relative overflow-hidden shadow-sm hover:border-border/80 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Organizations</p>
            <h3 className="text-2xl font-black text-indigo-500 dark:text-indigo-400 mt-1.5">{stats.orgCount}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Corporate & Wholesale</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </Card>

      {/* Individual Clients */}
      <Card className="p-5 border border-border bg-card rounded-2xl relative overflow-hidden shadow-sm hover:border-border/80 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Individuals</p>
            <h3 className="text-2xl font-black text-purple-500 dark:text-purple-400 mt-1.5">{stats.personCount}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Retail & Direct buyers</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
        </div>
      </Card>

      {/* Total Credit Allocated */}
      <Card className="p-5 border border-border bg-card rounded-2xl relative overflow-hidden shadow-sm hover:border-border/80 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Credit Limit</p>
            <h3 className="text-2xl font-black text-emerald-500 dark:text-emerald-400 mt-1.5">{formatCurrency(stats.totalCreditAllocated)}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Aggregate credit granted</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </Card>
    </div>
  );
}
