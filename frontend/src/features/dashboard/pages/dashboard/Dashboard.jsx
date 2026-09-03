import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import StatsCards from '../../components/StatsCards';
import { OrdersByStatusChart, RevenueChart } from '../../components/Charts';
import { StatusBreakdownTable, TopCustomersTable, WarehouseCard } from '../../components/ReportTables';
import { reportsApi } from '../../reportsApi';

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);

  const {
    data: dashboardRes,
  } = useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: () => reportsApi.getDashboard().catch(() => ({ data: {} })),
    staleTime: 60000,
    retry: 1,
  });

  const { data: orderStatusRes } = useQuery({
    queryKey: ['reports', 'orders-status'],
    queryFn: () => reportsApi.getOrderStatusReport().catch(() => ({ data: [] })),
    staleTime: 60000,
    retry: 1,
  });

  const { data: productSalesRes } = useQuery({
    queryKey: ['reports', 'product-sales'],
    queryFn: () => reportsApi.getProductSalesReport({ limit: 10 }).catch(() => ({ data: [] })),
    staleTime: 60000,
    retry: 1,
  });

  const { data: customerRes } = useQuery({
    queryKey: ['reports', 'customers'],
    queryFn: () => reportsApi.getCustomerReport({ limit: 10 }).catch(() => ({ data: [] })),
    staleTime: 60000,
    retry: 1,
  });

  const { data: warehouseRes } = useQuery({
    queryKey: ['reports', 'warehouse'],
    queryFn: () => reportsApi.getWarehouseReport().catch(() => ({ data: {} })),
    staleTime: 60000,
    retry: 1,
  });

  const dashboardData = dashboardRes?.data || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground ">
            Welcome back, {user?.username || 'Partner'}
          </h2>
          <p className="text-sm text-slate-450 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      <StatsCards dashboardData={dashboardData} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <OrdersByStatusChart
            data={orderStatusRes || { data: [] }}
          />
        </div>
        <div className="xl:col-span-2">
          <RevenueChart
            data={productSalesRes || { data: [] }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <StatusBreakdownTable
            data={orderStatusRes || { data: [] }}
          />
        </div>
        <div>
          <WarehouseCard
            data={warehouseRes || { data: {} }}
          />
        </div>
      </div>

      <div>
        <TopCustomersTable
          data={customerRes || { data: [] }}
        />
      </div>
    </div>
  );
}
