import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Package,
  Boxes,
  CheckCircle2,
  Clock,
  Warehouse,
  ArrowRight,
  Eye,
  ShieldCheck,
  ExternalLink,
  CheckSquare,
  Building2,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { salesOrdersApi } from '../../sales-orders/salesOrdersApi';
import { DashboardTableCard } from './common';
import Button from '../../../components/ui/Button';

export default function StoreKeeperDashboard() {
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const person = user?.person || {};
  const employee = person?.employee || {};
  const branch = employee?.branch || {};
  const storekeeperName = person.firstName
    ? `${person.firstName} ${person.lastName || ''}`.trim()
    : user?.username || 'Storekeeper';

  // 1. Fetch assigned preparation tasks
  const {
    data: tasksRes,
    isLoading: tasksLoading,
    isRefetching: tasksRefetching,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ['storekeeperTasks'],
    queryFn: () => salesOrdersApi.getStorekeeperTasks({ limit: 50 }),
    refetchInterval: 15000,
  });

  // 2. Fetch sales orders to monitor staged goods
  const { data: ordersRes } = useQuery({
    queryKey: ['storekeeperOrders'],
    queryFn: () => salesOrdersApi.list({ limit: 50 }),
    refetchInterval: 20000,
  });

  const tasks = Array.isArray(tasksRes?.data)
    ? tasksRes.data
    : Array.isArray(tasksRes?.data?.data)
    ? tasksRes.data.data
    : [];
  const orders = Array.isArray(ordersRes?.data)
    ? ordersRes.data
    : Array.isArray(ordersRes?.data?.data)
    ? ordersRes.data.data
    : [];

  const pendingTasks = tasks.filter(
    (t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS' || t.status === 'PENDING'
  );
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const stagedOrders = orders.filter((o) => o.status === 'READY_FOR_DELIVERY');

  // Complete Task Mutation
  const completeTaskMutation = useMutation({
    mutationFn: (taskId) => salesOrdersApi.completeTask(taskId),
    onSuccess: () => {
      toast.success('Task marked as prepared! Order is now ready for driver delivery.');
      queryClient.invalidateQueries(['storekeeperTasks']);
      queryClient.invalidateQueries(['storekeeperOrders']);
      queryClient.invalidateQueries(['salesOrders']);
      queryClient.invalidateQueries(['warehouseOrders']);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to complete preparation task');
    },
  });

  const handleCompleteTask = (taskId, e) => {
    e.stopPropagation();
    if (window.confirm('Confirm that all items for this order have been picked, verified, and staged?')) {
      completeTaskMutation.mutate(taskId);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (activeTab === 'ACTIVE') {
      if (task.status === 'COMPLETED') return false;
    }
    if (activeTab === 'COMPLETED') {
      if (task.status !== 'COMPLETED') return false;
    }

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const taskCode = (task.taskNumber || task.id || '').toLowerCase();
    const orderNumber = (task.salesOrder?.orderNumber || '').toLowerCase();
    const customer = (
      task.salesOrder?.customer?.companyName ||
      task.salesOrder?.customer?.businessName ||
      ''
    ).toLowerCase();
    return taskCode.includes(term) || orderNumber.includes(term) || customer.includes(term);
  });

  const tabs = [
    { key: 'ALL', label: 'All Tasks', count: tasks.length },
    { key: 'ACTIVE', label: 'Picking & Packing', count: pendingTasks.length },
    { key: 'COMPLETED', label: 'Completed / Staged', count: completedTasks.length },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO BANNER — THEME ADAPTIVE & MODERN (Matching Admin style) */}
      <div className="relative rounded-3xl border border-border bg-card shadow-sm p-6 sm:p-8 overflow-hidden transition-all duration-200">
        {/* Ambient subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Boxes className="w-3.5 h-3.5" />
                Warehouse Storekeeper
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Store Bay Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-muted-foreground bg-secondary border border-border">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                {branch?.name || 'Central Warehouse Bay'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                {storekeeperName}
              </span>
            </h1>

            <p className="text-sm text-muted-foreground">
              Storehouse Operations — manage picking tickets, pack items from reserved inventory, and stage orders at the dispatch dock.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={refetchTasks}
              disabled={tasksRefetching}
              className="flex items-center gap-2 border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium px-3.5 py-2 rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${tasksRefetching ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Link to="/catalog">
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-all"
              >
                <Boxes className="w-4 h-4" />
                <span>Catalog & Stock Reference</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. OPERATIONS QUICK NAVIGATION TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Picking Tickets',
            desc: `${pendingTasks.length} Active Tasks`,
            icon: Boxes,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border border-amber-500/20',
            action: () => setActiveTab('ACTIVE'),
          },
          {
            label: 'Staged at Dock',
            desc: `${stagedOrders.length} Ready for Driver`,
            icon: Package,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10 border border-cyan-500/20',
            action: () => setActiveTab('ALL'),
          },
          {
            label: 'Completed Packing',
            desc: `${completedTasks.length} Verified Tickets`,
            icon: CheckCircle2,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border border-emerald-500/20',
            action: () => setActiveTab('COMPLETED'),
          },
          {
            label: 'Wholesale Catalog',
            desc: 'SKUs & Reserved Inventory',
            icon: Warehouse,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10 border border-purple-500/20',
            action: () => (window.location.href = '/catalog'),
          },
        ].map((tile, i) => {
          const Icon = tile.icon;
          return (
            <button
              key={i}
              onClick={tile.action}
              className="group relative p-4 rounded-2xl border border-border bg-card hover:border-blue-500/40 hover:shadow-md transition-all duration-200 text-left cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tile.bg} ${tile.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">{tile.label}</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{tile.desc}</p>
            </button>
          );
        })}
      </div>

      {/* 3. MODERN KPI METRIC CARDS (Admin-style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Assigned Picking Tasks',
            value: pendingTasks.length,
            subtitle: 'Awaiting packing completion',
            icon: Boxes,
            color: 'text-amber-400',
            boxBg: 'bg-amber-500/10 border-amber-500/20',
            badge: pendingTasks.length > 0 ? 'To Pick' : 'Clear',
            badgeClass: pendingTasks.length > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-muted text-muted-foreground border-border',
            onClick: () => setActiveTab('ACTIVE'),
          },
          {
            label: 'Orders Staged at Dock',
            value: stagedOrders.length,
            subtitle: 'Ready for driver pickup',
            icon: Package,
            color: 'text-cyan-400',
            boxBg: 'bg-cyan-500/10 border-cyan-500/20',
            badge: 'Staged',
            badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
            onClick: () => setActiveTab('ALL'),
          },
          {
            label: 'Completed Packing Tasks',
            value: completedTasks.length,
            subtitle: 'Verified & staged goods',
            icon: CheckCircle2,
            color: 'text-emerald-400',
            boxBg: 'bg-emerald-500/10 border-emerald-500/20',
            badge: 'Done',
            badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            onClick: () => setActiveTab('COMPLETED'),
          },
          {
            label: 'Fulfillment Accuracy',
            value: '100%',
            subtitle: 'Zero discrepancy rate',
            icon: ShieldCheck,
            color: 'text-purple-400',
            boxBg: 'bg-purple-500/10 border-purple-500/20',
            badge: 'Optimal',
            badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            onClick: () => {},
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.onClick}
              className="p-5 border border-border bg-card shadow-sm rounded-2xl hover:border-blue-500/40 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${card.boxBg} ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${card.badgeClass}`}>
                  {card.badge}
                </span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-black text-foreground mt-1 tracking-tight">{card.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{card.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* 4. NEW TASKS ACTION CENTER: Assigned Picking & Packing Tasks (Matching Sales Rep style) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Assigned Picking & Packing Tasks
                {pendingTasks.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-blue-500 text-white">
                    {pendingTasks.length} Active
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                Orders scheduled by warehouse manager for physical picking and packing from reserved stock
              </p>
            </div>
          </div>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              All Assigned Tasks Prepared!
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              You have no active picking tickets pending. New preparation assignments scheduled by the Warehouse Manager will appear here immediately.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {pendingTasks.map((task) => {
              const order = task.salesOrder || {};
              const customerName =
                order.customer?.organization?.name ||
                (order.customer?.person
                  ? `${order.customer.person.firstName} ${order.customer.person.lastName}`
                  : order.customer?.companyName || 'Wholesale Customer');
              const itemsCount = task.items?.length || order.items?.length || 0;

              return (
                <div
                  key={task.id}
                  className="bg-card border border-blue-500/30 hover:border-blue-500/50 rounded-2xl p-5 shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                        {order.orderNumber || `Task #${task.id.slice(0, 8)}`}
                      </span>
                      <span className="text-xs font-semibold text-blue-400 bg-blue-500/15 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                        {task.status} • Scheduled for Preparation
                      </span>
                      {task.scheduledDate && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Target: {format(new Date(task.scheduledDate), 'MMM dd, HH:mm')}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Customer: <strong className="text-foreground">{customerName}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Items to Pick: <strong className="text-blue-400">{itemsCount} reserved items</strong>
                      </span>
                      {task.notes && (
                        <>
                          <span>•</span>
                          <span className="italic text-muted-foreground">"{task.notes}"</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => handleCompleteTask(task.id, e)}
                      disabled={completeTaskMutation.isPending}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 px-4 shadow-md cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{completeTaskMutation.isPending ? 'Staging...' : 'Confirm Staged & Ready'}</span>
                    </Button>
                    {order.id && (
                      <Link to={`/sales-orders/${order.id}`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Items
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Main Preparation Tasks Table */}
      <DashboardTableCard
        title="Storekeeper Task Queue"
        subtitle="Active orders assigned to your bay for item picking and packing"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabKey) => setActiveTab(tabKey)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search order #, customer, task..."
        isEmpty={filteredTasks.length === 0}
        emptyMessage={
          activeTab === 'ACTIVE'
            ? 'No active picking tasks pending. Good job!'
            : 'No tasks found.'
        }
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              <th className="py-3 px-4">Sales Order</th>
              <th className="py-3 px-4">Customer & Destination</th>
              <th className="py-3 px-4">Scheduled Date</th>
              <th className="py-3 px-4">Items to Pick</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-xs">
            {filteredTasks.map((task) => {
              const order = task.salesOrder || {};
              const isPending =
                task.status === 'ASSIGNED' ||
                task.status === 'IN_PROGRESS' ||
                task.status === 'PENDING';

              const itemsCount =
                task.preparationTaskItems?.length ||
                order.items?.length ||
                0;

              return (
                <tr
                  key={task.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  {/* Order Number */}
                  <td className="py-3.5 px-4">
                    <Link
                      to={`/sales-orders/${order.id || task.salesOrderId}`}
                      className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      <span>{order.orderNumber || 'SO-TASK'}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      Task ID: {task.id ? task.id.slice(0, 8) : '—'}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-foreground">
                      {order.customer?.companyName ||
                        order.customer?.businessName ||
                        'Customer Order'}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {order.customer?.customerCode || 'Direct Dispatch'}
                    </div>
                  </td>

                  {/* Scheduled Date */}
                  <td className="py-3.5 px-4">
                    <div className="text-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {task.scheduledDate
                          ? format(new Date(task.scheduledDate), 'MMM dd, yyyy HH:mm')
                          : 'Standard Queue'}
                      </span>
                    </div>
                    {task.notes && (
                      <div className="text-[10px] text-muted-foreground truncate max-w-xs mt-0.5">
                        Note: {task.notes}
                      </div>
                    )}
                  </td>

                  {/* Items to Pick */}
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-foreground">
                      {itemsCount} line items
                    </span>
                    <div className="text-[10px] text-emerald-400 font-medium">
                      Stock reserved in bay
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    {isPending ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-blue-500/15 text-blue-300 border-blue-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        In Picking
                      </span>
                    ) : (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Staged for Delivery
                        </span>
                        {task.salesOrder?.deliveries?.[0]?.driver && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Truck className="w-3 h-3 text-purple-400" />
                            <span>
                              Driver:{' '}
                              <strong className="text-foreground">
                                {task.salesOrder.deliveries[0].driver.person
                                  ? `${task.salesOrder.deliveries[0].driver.person.firstName} ${task.salesOrder.deliveries[0].driver.person.lastName || ''}`.trim()
                                  : task.salesOrder.deliveries[0].driver.employeeCode}
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {isPending && (
                      <Button
                        size="sm"
                        onClick={(e) => handleCompleteTask(task.id, e)}
                        disabled={completeTaskMutation.isPending}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm cursor-pointer gap-1"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Confirm Staged</span>
                      </Button>
                    )}

                    <Link to={`/sales-orders/${order.id || task.salesOrderId}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs rounded-xl border-border/80 hover:bg-muted cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DashboardTableCard>
    </div>
  );
}
