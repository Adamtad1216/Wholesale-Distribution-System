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
      value: `$${dashboardData?.revenue?.totalOrderValue ?? 0}`,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      trend: '+8.1%',
      trendUp: true,
    },
    {
      label: 'Customers',
      value: dashboardData?.customers?.total ?? 0,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+3%',
      trendUp: true,
    },
    {
      label: 'Products',
      value: dashboardData?.products?.total ?? 0,
      icon: Package,
      color: 'bg-indigo-500',
      trend: '-1%',
      trendUp: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card hoverEffect className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg border flex items-center justify-center bg-[var(--icon-box-bg)] text-[var(--icon-box-text)] border-[var(--icon-box-border)]"
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-semibold ${stat.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground  mb-0.5">{stat.value}</p>
            <p className="text-xs text-slate-450">{stat.label}</p>
          </Card>
        );
      })}
    </div>
  );
}
