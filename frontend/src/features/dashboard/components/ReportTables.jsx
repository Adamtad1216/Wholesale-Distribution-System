import Card from '../../../components/ui/Card';
import { Warehouse } from 'lucide-react';

const fullStatusColors = {
  DRAFT: 'bg-muted500 text-muted-foreground border-border',
  PENDING_REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ADJUSTMENT_REQUIRED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  APPROVED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  RESERVED: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  READY_FOR_DELIVERY: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  PARTIALLY_FULFILLED: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  COMPLETED: 'bg-green-500/10 text-green-400 border-green-500/20',
  CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  SALES_REP_APPROVED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  WAREHOUSE_PREPARATION_SCHEDULED: 'bg-lime-500/10 text-lime-400 border-lime-500/20',
  PREPARING: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
  DELIVERY_SCHEDULED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  OUT_FOR_DELIVERY: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

function getBadgeClass(status) {
  return fullStatusColors[status] || 'bg-muted500 text-muted-foreground border-border';
}

function getStatusLabel(status) {
  if (!status) return 'Unknown';
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getBadgeClass(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

export function StatusBreakdownTable({ data, isLoading }) {
  const items = data?.data || [];

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Order Status Breakdown
      </h3>

      {isLoading ? (
        <p className="text-sm text-slate-450">Loading...</p>
      ) : items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-foreground">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-slate-450 uppercase tracking-wider pb-3">Status</th>
                <th className="text-right text-xs font-semibold text-slate-450 uppercase tracking-wider pb-3">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.status} className="hover:bg-muted800 transition">
                  <td className="py-3 pr-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="font-semibold">{Number(item.count || 0)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-450">
          No order status data available.
        </p>
      )}
    </Card>
  );
}

export function TopCustomersTable({ data, isLoading, error }) {
  const customers = data?.data || [];

  if (error) {
    return (
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Top Customers</h3>
        <p className="text-sm text-rose-400">Unable to load customer data.</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Top Customers</h3>

      {isLoading ? (
        <p className="text-sm text-slate-450">Loading...</p>
      ) : customers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-foreground">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-slate-450 uppercase tracking-wider pb-3">Customer</th>
                <th className="text-right text-xs font-semibold text-slate-450 uppercase tracking-wider pb-3">Orders</th>
                <th className="text-right text-xs font-semibold text-slate-450 uppercase tracking-wider pb-3">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((customer) => (
                <tr key={customer.customer?.id || customer.id} className="hover:bg-muted800 transition">
                  <td className="py-3 pr-4">
                    <span className="font-semibold">
                      {customer.customer?.name || customer.name || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span>{Number(customer.orderCount || 0)}</span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="font-semibold text-emerald-400">
                      ${Number(customer.totalPurchase || 0).toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-450">
          No customer data available yet.
        </p>
      )}
    </Card>
  );
}

export function WarehouseCard({ data, isLoading }) {
  const warehouse = data?.data || {};
  const tasks = warehouse.preparationTasks || {};
  const prepared = warehouse.preparedQuantities || {};

  const totalTasks = Number(tasks.total || 0);
  const completedTasks = Number(tasks.completed || 0);
  const pendingTasks = Number(tasks.pending || 0);
  const totalItems = Number(prepared.total || 0);
  const preparedItems = Number(prepared.prepared || 0);

  const completionRate = totalItems > 0 ? Math.round((preparedItems / totalItems) * 100) : 0;

  if (isLoading) {
    return (
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Warehouse Progress
        </h3>
        <p className="text-sm text-slate-450">Loading...</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-1.5 rounded-lg border flex items-center justify-center bg-[var(--icon-box-bg)] text-[var(--icon-box-text)] border-[var(--icon-box-border)]">
          <Warehouse className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Warehouse Progress
        </h3>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="block text-xs text-slate-450">Preparation Tasks</span>
            <span className="text-lg font-bold text-foreground">
              {totalTasks > 0 ? `${completedTasks} / ${totalTasks} complete` : 'No tasks'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-450">Items Prepared</span>
            <span className="text-lg font-bold text-foreground">
              {totalItems > 0 ? `${preparedItems} / ${totalItems}` : 'No items'}
            </span>
          </div>
        </div>

        {totalTasks > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-450">
                {pendingTasks} pending, {completedTasks} completed
              </span>
              <span className="text-foreground">{completionRate}% complete</span>
            </div>
            <div className="w-full h-2 bg-muted800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
