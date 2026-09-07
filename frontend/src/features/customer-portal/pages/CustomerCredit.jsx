import React from 'react';
import { useSelector } from 'react-redux';
import { CreditCard, ShieldCheck, Clock, TrendingUp, AlertCircle, Phone, Mail, HelpCircle } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

export default function CustomerCredit() {
  const { customer, user } = useSelector((state) => state.auth);

  const creditLimit = Number(customer?.creditLimit || 50000);
  // Example calculation or real balance
  const usedCredit = 0;
  const availableCredit = Math.max(0, creditLimit - usedCredit);
  const percentUsed = creditLimit > 0 ? Math.min(100, (usedCredit / creditLimit) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wide uppercase">
            <CreditCard className="w-3.5 h-3.5" />
            Wholesale Commercial Credit
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Credit Facility & Statements
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Monitor your authorized wholesale credit line, available purchasing balance, and commercial settlement terms.
          </p>
        </div>
      </div>

      {/* Credit Utilization Card */}
      <Card className="p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Authorized Credit Line
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-foreground font-mono">
                {creditLimit.toLocaleString('en', { minimumFractionDigits: 2 })} ETB
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Facility
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              Available to Spend
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {availableCredit.toLocaleString('en', { minimumFractionDigits: 2 })} ETB
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-secondary rounded-full h-3.5 overflow-hidden p-0.5 border border-border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${Math.max(4, percentUsed)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Used: {usedCredit.toLocaleString()} ETB ({percentUsed.toFixed(1)}%)</span>
            <span>Available: {availableCredit.toLocaleString()} ETB</span>
          </div>
        </div>
      </Card>

      {/* Grid of Credit Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Settlement Terms</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Commercial payment duration</p>
          </div>
          <p className="text-lg font-extrabold text-foreground font-mono">
            {customer?.paymentTerms?.name || '30 Days Net (Monthly)'}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Invoices issued must be settled within 30 days of dispatch to maintain credit privileges.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Account Tier</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Commercial discount rating</p>
          </div>
          <p className="text-lg font-extrabold text-foreground font-mono">
            Tier 1 Commercial
          </p>
          <p className="text-[11px] text-muted-foreground">
            Qualifies for volume-based tiered discounts and prioritized warehouse scheduling.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Credit Review</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Eligibility for expansion</p>
          </div>
          <p className="text-lg font-extrabold text-emerald-400 font-mono">
            High Standing
          </p>
          <p className="text-[11px] text-muted-foreground">
            Regular order fulfillment and on-time settlements qualify your company for higher limits.
          </p>
        </Card>
      </div>

      {/* Sales Rep Contact Card for Limit Adjustment */}
      <Card className="p-6 sm:p-8 border-violet-500/30 bg-violet-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0 font-bold">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Need a Credit Line Expansion or Term Adjustment?
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
              Your assigned sales representative, <strong>Abebe Kebede</strong>, can review your seasonal volume requirements and expedite credit limit extensions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="tel:+251911223344"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition shadow-sm"
          >
            <Phone className="w-3.5 h-3.5" />
            +251 911 223344
          </a>
          <a
            href="mailto:salesrep@testwholesale.com?subject=Credit%20Line%20Expansion%20Request"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition shadow-sm"
          >
            <Mail className="w-3.5 h-3.5" />
            Request Extension
          </a>
        </div>
      </Card>
    </div>
  );
}
