import {
  Boxes,
  AlertTriangle,
  Sliders,
  ArrowLeftRight,
  BookmarkCheck,
} from 'lucide-react';

export default function InventoryStats({
  stats = {},
  onSelectTab,
  onFilterLowStock,
}) {
  const {
    totalItems = 0,
    totalQuantity = 0,
    lowStockCount = 0,
    pendingAdjustmentsCount = 0,
    pendingTransfersCount = 0,
    activeReservationsCount = 0,
    transfersCount = 0,
  } = stats;

  const statCards = [
    {
      label: 'Total Products in Stock',
      value: totalItems.toLocaleString(),
      subValue: `${totalQuantity.toLocaleString()} Total Units On Hand`,
      icon: <Boxes className="w-5 h-5 text-indigo-400" />,
      bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
      gradient: 'from-indigo-500/10 to-transparent',
      onClick: () => onSelectTab && onSelectTab('stocks'),
    },
    {
      label: 'Low Stock Alerts',
      value: lowStockCount.toLocaleString(),
      subValue: lowStockCount > 0 ? 'Requires replenishment' : 'All levels healthy',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      gradient: 'from-amber-500/10 to-transparent',
      pulse: lowStockCount > 0,
      onClick: () => {
        if (onSelectTab) onSelectTab('stocks');
        if (onFilterLowStock) onFilterLowStock();
      },
    },
    {
      label: 'Pending Adjustments',
      value: pendingAdjustmentsCount.toLocaleString(),
      subValue: pendingAdjustmentsCount > 0 ? 'Awaiting manager approval' : 'Audit logs up to date',
      icon: <Sliders className="w-5 h-5 text-violet-400" />,
      bg: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
      gradient: 'from-violet-500/10 to-transparent',
      badge: pendingAdjustmentsCount > 0 ? 'Review Required' : null,
      onClick: () => onSelectTab && onSelectTab('adjustments'),
    },
    {
      label: 'Inter-Warehouse Transfers',
      value: transfersCount.toLocaleString(),
      subValue: pendingTransfersCount > 0 ? `${pendingTransfersCount} pending approval` : 'Recorded movements',
      icon: <ArrowLeftRight className="w-5 h-5 text-sky-400" />,
      bg: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
      gradient: 'from-sky-500/10 to-transparent',
      badge: pendingTransfersCount > 0 ? 'Review Required' : null,
      onClick: () => onSelectTab && onSelectTab('transfers'),
    },
    {
      label: 'Active Reservations',
      value: activeReservationsCount.toLocaleString(),
      subValue: 'Allocated for sales orders',
      icon: <BookmarkCheck className="w-5 h-5 text-cyan-400" />,
      bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      gradient: 'from-cyan-500/10 to-transparent',
      onClick: () => onSelectTab && onSelectTab('reservations'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((card, idx) => (
        <div
          key={idx}
          onClick={card.onClick}
          className={`relative p-4 rounded-2xl border border-border bg-card hover:border-violet-500/40 transition-all duration-200 cursor-pointer overflow-hidden group shadow-sm hover:shadow-md ${
            card.pulse ? 'ring-1 ring-amber-500/30' : ''
          }`}
          style={{ backgroundColor: 'var(--color-card)' }}
        >
          {/* Subtle gradient glow */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-40 pointer-events-none group-hover:opacity-80 transition duration-300`}
          />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-normal uppercase tracking-wider text-muted-foreground truncate block">
                {card.label}
              </span>
              <div className="text-2xl font-normal text-foreground tracking-tight flex items-center gap-2">
                {card.value}
                {card.pulse && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground/90 truncate leading-snug">
                {card.subValue}
              </p>
            </div>

            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200 ${card.bg}`}
            >
              {card.icon}
            </div>
          </div>

          {card.badge && (
            <div className="mt-2.5 relative z-10">
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {card.badge}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
