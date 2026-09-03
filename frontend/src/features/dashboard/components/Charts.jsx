import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import Card from '../../../components/ui/Card';

const STATUS_COLORS = {
  DRAFT: '#94a3b8',
  PENDING_REVIEW: '#fbbf24',
  ADJUSTMENT_REQUIRED: '#f59e0b',
  APPROVED: '#3b82f6',
  REJECTED: '#ef4444',
  RESERVED: '#8b5cf6',
  READY_FOR_DELIVERY: '#10b981',
  PARTIALLY_FULFILLED: '#14b8a2',
  DELIVERED: '#059669',
  COMPLETED: '#047857',
  CANCELLED: '#ef4444',
  SALES_REP_APPROVED: '#60a5fa',
  WAREHOUSE_PREPARATION_SCHEDULED: '#34d3b8',
  PREPARING: '#2dd36f',
  DELIVERY_SCHEDULED: '#a78bfa',
  OUT_FOR_DELIVERY: '#f97316',
};

const getStatusLabel = (status) =>
  status
    ?.replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase()) || 'Unknown';

export function OrdersByStatusChart({ data, isLoading }) {
  const chartData = data?.data || [];
  const hasData = chartData.length > 0;

  if (isLoading) {
    return (
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Orders by Status
        </h3>
        <p className="text-sm text-slate-450">Loading...</p>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Orders by Status
        </h3>
        <p className="text-sm text-slate-450">No order data available.</p>
      </Card>
    );
  }

  const pieData = chartData
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: getStatusLabel(item.status),
      value: Number(item.count),
      status: item.status,
    }));

  const COLORS = pieData.map((item) => STATUS_COLORS[item.status] || '#64748b');

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Orders by Status
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="40%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((_, i) => (
                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 justify-center text-xs mt-2">
          {pieData.map((item, i) => (
            <span key={item.name} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-semibold text-foreground">{item.value}</span>
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function RevenueChart({ data, isLoading }) {
  const salesData = data?.data || [];
  const hasData = salesData.length > 0;

  if (isLoading) {
    return (
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Top Products by Revenue
        </h3>
        <p className="text-sm text-slate-450">Loading...</p>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Top Products by Revenue
        </h3>
        <p className="text-sm text-slate-450">No product sales data available.</p>
      </Card>
    );
  }

  const chartData = salesData.slice(0, 8).map((item) => ({
    name: item.product?.name || 'Unknown Product',
    revenue: Number(item.revenue || 0),
    quantity: Number(item.quantitySold || 0),
  }));

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Top Products by Revenue
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#cbd5e1', fontSize: 11 }}
              width={160}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
              itemStyle={{ color: '#38bdf8' }}
            />
            <Legend />
            <Bar dataKey="revenue" name="Revenue ($)" fill="#38bdf8" radius={[0, 4, 4, 0]} />
            <Bar dataKey="quantity" name="Qty Sold" fill="#64748b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
