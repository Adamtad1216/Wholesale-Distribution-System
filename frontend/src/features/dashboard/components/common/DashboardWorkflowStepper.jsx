import React from 'react';
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  ClipboardCheck,
  Boxes,
} from 'lucide-react';

const STAGES = [
  {
    key: 'SALES_REP_APPROVED',
    name: '1. Rep Approved',
    shortName: 'Approved',
    desc: 'Needs warehouse prep',
    icon: CheckCircle2,
    color: 'emerald',
  },
  {
    key: 'PREPARING',
    name: '2. Packing & Staging',
    shortName: 'Packing',
    desc: 'Storekeeper picking',
    icon: Boxes,
    color: 'blue',
  },
  {
    key: 'READY_FOR_DELIVERY',
    name: '3. Staged / Ready',
    shortName: 'Ready',
    desc: 'Awaiting driver assign',
    icon: Package,
    color: 'cyan',
  },
  {
    key: 'OUT_FOR_DELIVERY',
    name: '4. Out for Delivery',
    shortName: 'In Transit',
    desc: 'Driver on route',
    icon: Truck,
    color: 'purple',
  },
  {
    key: 'DELIVERED',
    name: '5. Delivered',
    shortName: 'Completed',
    desc: 'Signed & verified',
    icon: ClipboardCheck,
    color: 'emerald',
  },
];

export default function DashboardWorkflowStepper({
  counts = {},
  activeFilter,
  onSelectFilter,
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md p-4 md:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Fulfillment Pipeline Stages
        </h3>
        <span className="text-xs text-muted-foreground">
          Click any stage to filter active orders
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const count = counts[stage.key] || 0;
          const isSelected = activeFilter === stage.key;

          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => onSelectFilter?.(isSelected ? 'ALL' : stage.key)}
              className={`relative text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary/40'
                  : 'border-border/60 bg-background/50 hover:bg-muted/60 hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-sm font-mono font-black px-2 py-0.5 rounded-full ${
                    count > 0
                      ? isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/15 text-primary'
                      : 'text-muted-foreground bg-muted/40'
                  }`}
                >
                  {count}
                </span>
              </div>

              <div className="font-bold text-xs text-foreground truncate">
                {stage.name}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {stage.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
