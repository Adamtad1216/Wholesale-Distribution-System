import Card from '../../../components/ui/Card';
import { TrendingUp, ShoppingCart, Users, Package } from 'lucide-react';

export default function StatsCards({ dashboardData }) {
  const stats = [
    {
      label: 'Total Orders',
      value: dashboardData?.orders?.total ?? 0,
      icon: ShoppingCart,
      color: 'bg-violet-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Pending Approval',
      value: dashboardData?.orders?.pending ?? 0,
      icon: ShoppingCart,
      color: 'bg-amber-500',
      trend: '+5%',
      trendUp: true,
    },
    {
      label: 'Total Revenue',
      value: `${Number(dashboardData?.revenue?.totalOrderValue ?? 0).toLocaleString()} ETB`,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      trend: '+8.1%',
      trendUp: true,
    },
    {
      label: 'Total Customers',
      value: Number(dashboardData?.customers?.total ?? 0).toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      trend: '+3%',
      trendUp: true,
    },
    {
      label: 'Catalog Products',
      value: Number(dashboardData?.products?.total ?? 0).toLocaleString(),
      icon: Package,
      color: 'bg-indigo-500',
      trend: '-1%',
      trendUp: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} noPadding className="p-5 border border-border bg-card shadow-sm rounded-2xl hover:border-violet-500/40 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-[var(--icon-box-bg)] text-[var(--icon-box-text)] border-[var(--icon-box-border)]">
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stat.trendUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight mb-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
          </Card>
        );
      })}
    </div>
  );
}
