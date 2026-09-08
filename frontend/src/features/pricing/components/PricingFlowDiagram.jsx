import React from 'react';
import { Users, Layers, Tag, Percent, Gauge, CheckCircle2, ArrowRight } from 'lucide-react';

export default function PricingFlowDiagram() {
  const steps = [
    {
      id: 'customer',
      title: '1. Customer',
      subtitle: 'Account Profile',
      desc: 'Assigned commercial tier',
      icon: Users,
      color: 'from-blue-500/20 to-blue-600/10 text-blue-500 border-blue-500/30',
    },
    {
      id: 'tier',
      title: '2. Price Tier',
      subtitle: 'Classification',
      desc: 'e.g. VIP Bulk, Wholesale',
      icon: Layers,
      color: 'from-indigo-500/20 to-indigo-600/10 text-indigo-500 border-indigo-500/30',
    },
    {
      id: 'price',
      title: '3. Product Price',
      subtitle: 'Base vs Override',
      desc: 'Warehouse or Global rate',
      icon: Tag,
      color: 'from-violet-500/20 to-violet-600/10 text-violet-500 border-violet-500/30',
    },
    {
      id: 'discount',
      title: '4. Discount Rule',
      subtitle: 'Volume Breaks',
      desc: 'Product, Category or Global',
      icon: Percent,
      color: 'from-amber-500/20 to-amber-600/10 text-amber-500 border-amber-500/30',
    },
    {
      id: 'quota',
      title: '5. Sales Quota',
      subtitle: 'Purchase Limit',
      desc: 'Period usage check',
      icon: Gauge,
      color: 'from-purple-500/20 to-purple-600/10 text-purple-500 border-purple-500/30',
    },
    {
      id: 'final',
      title: '6. Final Price',
      subtitle: 'Sales Order',
      desc: 'Authoritative locked price',
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-500 border-emerald-500/30',
    },
  ];

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-card/70 border border-border/80 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-primary uppercase">
            Commercial Logic Architecture
          </span>
          <h3 className="text-sm font-bold text-foreground">
            How Wholesale Order Pricing is Resolved
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-lg border border-border/50">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Server-Authoritative Engine</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className="relative p-3 rounded-xl bg-card border border-border hover:border-border/80 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br border ${step.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {idx < steps.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 hidden lg:block" />
                  )}
                </div>
                <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                  {step.title}
                </div>
                <div className="text-[11px] font-medium text-muted-foreground">
                  {step.subtitle}
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground/80 mt-2 pt-2 border-t border-border/50">
                {step.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
