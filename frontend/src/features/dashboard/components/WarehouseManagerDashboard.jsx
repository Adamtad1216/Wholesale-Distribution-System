import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Package,
  Truck,
  Boxes,
  CheckCircle2,
  Clock,
  Warehouse,
  ArrowRight,
  Eye,
  User,
  AlertCircle,
  ExternalLink,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { salesOrdersApi } from '../../sales-orders/salesOrdersApi';
import { DashboardWorkflowStepper, DashboardTableCard } from './common';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';

const STATUS_CONFIG = {
  PENDING_REVIEW: {
    label: 'Pending Review',
    bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  SALES_REP_APPROVED: {
    label: 'Rep Approved',
    bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  WAREHOUSE_PREPARATION_SCHEDULED: {
    label: 'Prep Scheduled',
    bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  },
  PREPARING: {
    label: 'Preparing',
    bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  },
  READY_FOR_DELIVERY: {
    label: 'Ready for Delivery',
    bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
  DELIVERY_SCHEDULED: {
    label: 'Delivery Sched.',
    bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  DELIVERED: {
    label: 'Delivered',
    bg: 'bg-emerald-600/15 text-emerald-300 border-emerald-600/30',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-600/20 text-emerald-200 border-emerald-500/40',
  },
};

export default function WarehouseManagerDashboard() {
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);

  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals for direct warehouse manager actions
  const [prepModal, setPrepModal] = useState({
    isOpen: false,
    order: null,
    storeKeeperId: '',
    scheduledDate: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  const [deliveryModal, setDeliveryModal] = useState({
    isOpen: false,
    order: null,
    driverId: '',
    vehicleId: '',
    scheduledDate: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  const person = user?.person || {};
  const employee = person?.employee || {};
  const managedWarehouse = employee?.managedWarehouses?.[0] || null;
  const warehouseName = managedWarehouse?.name || 'Central Warehouse';
  const managerName = person.firstName
    ? `${person.firstName} ${person.lastName || ''}`.trim()
    : user?.username || 'Warehouse Manager';

  // 1. Fetch sales orders
  const {
    data: ordersRes,
    isLoading: ordersLoading,
    isRefetching: ordersRefetching,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['warehouseOrders'],
    queryFn: () => salesOrdersApi.list({ limit: 100 }),
    refetchInterval: 20000,
  });

  // 2. Fetch dropdown resources (storekeepers, drivers, vehicles)
  const { data: storekeepersRes } = useQuery({
    queryKey: ['storekeepersList'],
    queryFn: salesOrdersApi.getStorekeepers,
  });

  const { data: driversRes } = useQuery({
    queryKey: ['driversList'],
    queryFn: salesOrdersApi.getDrivers,
  });

  const { data: vehiclesRes } = useQuery({
    queryKey: ['vehiclesList'],
    queryFn: salesOrdersApi.getVehicles,
  });

  const storekeepers = storekeepersRes?.data || [];
  const drivers = driversRes?.data || [];
  const vehicles = vehiclesRes?.data || [];
  const orders = Array.isArray(ordersRes?.data)
    ? ordersRes.data
    : Array.isArray(ordersRes?.data?.data)
    ? ordersRes.data.data
    : [];

  // Stage counts for fulfillment pipeline
  const counts = {
    SALES_REP_APPROVED: orders.filter((o) => o.status === 'SALES_REP_APPROVED').length,
    PREPARING: orders.filter(
      (o) => o.status === 'WAREHOUSE_PREPARATION_SCHEDULED' || o.status === 'PREPARING'
    ).length,
    READY_FOR_DELIVERY: orders.filter((o) => o.status === 'READY_FOR_DELIVERY').length,
    OUT_FOR_DELIVERY: orders.filter(
      (o) => o.status === 'DELIVERY_SCHEDULED' || o.status === 'OUT_FOR_DELIVERY'
    ).length,
    DELIVERED: orders.filter((o) => o.status === 'DELIVERED' || o.status === 'COMPLETED').length,
  };

  const totalAwaitingPrep = counts.SALES_REP_APPROVED;
  const totalInPrep = counts.PREPARING;
  const totalReadyDelivery = counts.READY_FOR_DELIVERY;
  const totalInTransit = counts.OUT_FOR_DELIVERY;

  // Filter orders based on active filter and search
  const filteredOrders = orders.filter((order) => {
    // Stage filter
    if (activeFilter === 'SALES_REP_APPROVED' && order.status !== 'SALES_REP_APPROVED') {
      return false;
    }
    if (
      activeFilter === 'PREPARING' &&
      order.status !== 'WAREHOUSE_PREPARATION_SCHEDULED' &&
      order.status !== 'PREPARING'
    ) {
      return false;
    }
    if (activeFilter === 'READY_FOR_DELIVERY' && order.status !== 'READY_FOR_DELIVERY') {
      return false;
    }
    if (
      activeFilter === 'OUT_FOR_DELIVERY' &&
      order.status !== 'DELIVERY_SCHEDULED' &&
      order.status !== 'OUT_FOR_DELIVERY'
    ) {
      return false;
    }
    if (
      activeFilter === 'DELIVERED' &&
      order.status !== 'DELIVERED' &&
      order.status !== 'COMPLETED'
    ) {
      return false;
    }

    // Search term
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const orderNum = (order.orderNumber || '').toLowerCase();
    const customerName = (
      order.customer?.companyName ||
      order.customer?.businessName ||
      ''
    ).toLowerCase();
    return orderNum.includes(term) || customerName.includes(term);
  });

  // Schedule Prep Mutation
  const prepMutation = useMutation({
    mutationFn: ({ orderId, payload }) => salesOrdersApi.schedulePreparation(orderId, payload),
    onSuccess: () => {
      toast.success('Warehouse preparation scheduled & assigned to Storekeeper!');
      setPrepModal({ isOpen: false, order: null, storeKeeperId: '', scheduledDate: '', notes: '' });
      queryClient.invalidateQueries(['warehouseOrders']);
      queryClient.invalidateQueries(['salesOrder']);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to schedule preparation');
    },
  });

  // Schedule Delivery Mutation
  const deliveryMutation = useMutation({
    mutationFn: ({ orderId, payload }) => salesOrdersApi.scheduleDelivery(orderId, payload),
    onSuccess: () => {
      toast.success('Delivery run scheduled & assigned to Driver!');
      setDeliveryModal({
        isOpen: false,
        order: null,
        driverId: '',
        vehicleId: '',
        scheduledDate: '',
        notes: '',
      });
      queryClient.invalidateQueries(['warehouseOrders']);
      queryClient.invalidateQueries(['salesOrder']);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to schedule delivery');
    },
  });

  const handleOpenPrepModal = (order) => {
    setPrepModal({
      isOpen: true,
      order,
      storeKeeperId: storekeepers[0]?.id || '',
      scheduledDate: new Date().toISOString().slice(0, 16),
      notes: '',
    });
  };

  const handleOpenDeliveryModal = (order) => {
    setDeliveryModal({
      isOpen: true,
      order,
      driverId: drivers[0]?.id || '',
      vehicleId: vehicles[0]?.id || '',
      scheduledDate: new Date().toISOString().slice(0, 16),
      notes: '',
    });
  };

  const handleConfirmPrep = (e) => {
    e.preventDefault();
    if (!prepModal.storeKeeperId) {
      toast.error('Please select a storekeeper');
      return;
    }
    prepMutation.mutate({
      orderId: prepModal.order.id,
      payload: {
        warehouseId: managedWarehouse?.id || prepModal.order?.warehouseId || undefined,
        storeKeeperId: prepModal.storeKeeperId,
        scheduledDate: new Date(prepModal.scheduledDate).toISOString(),
        notes: prepModal.notes || undefined,
      },
    });
  };

  const handleConfirmDelivery = (e) => {
    e.preventDefault();
    if (!deliveryModal.driverId) {
      toast.error('Please select a driver');
      return;
    }
    deliveryMutation.mutate({
      orderId: deliveryModal.order.id,
      payload: {
        driverId: deliveryModal.driverId,
        vehicleId: deliveryModal.vehicleId || undefined,
        scheduledDate: new Date(deliveryModal.scheduledDate).toISOString(),
        notes: deliveryModal.notes || undefined,
      },
    });
  };

  const tabs = [
    { key: 'ALL', label: 'All Orders', count: orders.length },
    { key: 'SALES_REP_APPROVED', label: 'Needs Prep Scheduling', count: totalAwaitingPrep },
    { key: 'PREPARING', label: 'In Preparation', count: totalInPrep },
    { key: 'READY_FOR_DELIVERY', label: 'Ready for Dispatch', count: totalReadyDelivery },
    { key: 'OUT_FOR_DELIVERY', label: 'In Transit', count: totalInTransit },
    { key: 'DELIVERED', label: 'Delivered', count: counts.DELIVERED },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO BANNER — THEME ADAPTIVE & MODERN (Matching Admin style) */}
      <div className="relative rounded-3xl border border-border bg-card shadow-sm p-6 sm:p-8 overflow-hidden transition-all duration-200">
        {/* Ambient subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Warehouse className="w-3.5 h-3.5" />
                Warehouse Logistics Manager
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Facility Operational
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-muted-foreground bg-secondary border border-border">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                {warehouseName}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                {managerName}
              </span>
            </h1>

            <p className="text-sm text-muted-foreground">
              Logistics Command Center — supervise stock reservations, schedule storekeeper preparation, and coordinate dispatch runs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={refetchOrders}
              disabled={ordersRefetching}
              className="flex items-center gap-2 border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium px-3.5 py-2 rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${ordersRefetching ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Link to="/deliveries">
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-all"
              >
                <Truck className="w-4 h-4" />
                <span>Deliveries & Dispatch Board</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. OPERATIONS QUICK NAVIGATION TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Preparation Queue',
            desc: `${totalAwaitingPrep} Orders to Schedule`,
            icon: Boxes,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border border-amber-500/20',
            action: () => setActiveFilter('SALES_REP_APPROVED'),
          },
          {
            label: 'Packing & Staging',
            desc: `${totalInPrep} Active in Storehouse`,
            icon: Package,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border border-blue-500/20',
            action: () => setActiveFilter('PREPARING'),
          },
          {
            label: 'Dispatch Board',
            desc: `${totalReadyDelivery} Staged for Driver`,
            icon: Truck,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10 border border-cyan-500/20',
            action: () => setActiveFilter('READY_FOR_DELIVERY'),
          },
          {
            label: 'Active on Route',
            desc: `${totalInTransit} In Road Transit`,
            icon: CheckCircle2,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10 border border-purple-500/20',
            action: () => setActiveFilter('OUT_FOR_DELIVERY'),
          },
        ].map((tile, i) => {
          const Icon = tile.icon;
          return (
            <button
              key={i}
              onClick={tile.action}
              className="group relative p-4 rounded-2xl border border-border bg-card hover:border-cyan-500/40 hover:shadow-md transition-all duration-200 text-left cursor-pointer"
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
            label: 'Awaiting Prep Scheduling',
            value: totalAwaitingPrep,
            subtitle: 'Orders approved by sales rep',
            icon: Boxes,
            color: 'text-amber-400',
            boxBg: 'bg-amber-500/10 border-amber-500/20',
            badge: totalAwaitingPrep > 0 ? 'Action Req.' : 'Clear',
            badgeClass: totalAwaitingPrep > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-muted text-muted-foreground border-border',
            onClick: () => setActiveFilter('SALES_REP_APPROVED'),
          },
          {
            label: 'Active Picking & Packing',
            value: totalInPrep,
            subtitle: 'Assigned to storekeepers',
            icon: Package,
            color: 'text-blue-400',
            boxBg: 'bg-blue-500/10 border-blue-500/20',
            badge: 'In Progress',
            badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            onClick: () => setActiveFilter('PREPARING'),
          },
          {
            label: 'Ready for Dispatch',
            value: totalReadyDelivery,
            subtitle: 'Packed & staged at dock',
            icon: Truck,
            color: 'text-cyan-400',
            boxBg: 'bg-cyan-500/10 border-cyan-500/20',
            badge: totalReadyDelivery > 0 ? 'Assign Driver' : 'Staged',
            badgeClass: totalReadyDelivery > 0 ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-muted text-muted-foreground border-border',
            onClick: () => setActiveFilter('READY_FOR_DELIVERY'),
          },
          {
            label: 'Active on Route',
            value: totalInTransit,
            subtitle: 'Drivers delivering to clients',
            icon: CheckCircle2,
            color: 'text-purple-400',
            boxBg: 'bg-purple-500/10 border-purple-500/20',
            badge: 'In Transit',
            badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            onClick: () => setActiveFilter('OUT_FOR_DELIVERY'),
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.onClick}
              className="p-5 border border-border bg-card shadow-sm rounded-2xl hover:border-cyan-500/40 transition-all duration-200 cursor-pointer"
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

      {/* 4. NEW TASKS ACTION CENTER: Orders Awaiting Prep Scheduling (Matching Sales Rep style) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Preparation Scheduling Action Center
                {totalAwaitingPrep > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-slate-950">
                    {totalAwaitingPrep} Action Required
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                Approved customer orders waiting for storekeeper assignment and packing schedule
              </p>
            </div>
          </div>
        </div>

        {totalAwaitingPrep === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              All Orders Scheduled!
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              There are currently no orders pending preparation scheduling. New approved orders from sales reps will appear here immediately.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {orders
              .filter((o) => o.status === 'SALES_REP_APPROVED')
              .map((order) => {
                const customerName =
                  order.customer?.organization?.name ||
                  (order.customer?.person
                    ? `${order.customer.person.firstName} ${order.customer.person.lastName}`
                    : order.customer?.companyName || 'Customer');
                const itemsCount = order.items?.length || 0;
                const totalAmount = Number(order.total || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });

                return (
                  <div
                    key={order.id}
                    className="bg-card border border-amber-500/30 hover:border-amber-500/50 rounded-2xl p-5 shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          ✓ Rep Approved & Stock Reserved
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm') : '—'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Customer: <strong className="text-foreground">{customerName}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Reserved Items: <strong className="text-foreground">{itemsCount} line items</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Order Total: <strong className="text-amber-400 font-mono">ETB {totalAmount}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <Link to={`/sales-orders/${order.id}/schedule-preparation`}>
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 px-4 shadow-md cursor-pointer"
                        >
                          <Boxes className="w-4 h-4 fill-slate-950" />
                          Schedule Preparation
                        </Button>
                      </Link>
                      <Link to={`/sales-orders/${order.id}`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* 4. Visual 5-Stage Fulfillment Pipeline Stepper */}
      <DashboardWorkflowStepper
        counts={counts}
        activeFilter={activeFilter}
        onSelectFilter={(stage) => setActiveFilter(stage)}
      />

      {/* 5. Main Orders & Logistics Operations Table */}
      <DashboardTableCard
        title="Fulfillment & Dispatch Queue"
        subtitle={`Tracking all commercial shipments through ${warehouseName}`}
        tabs={tabs}
        activeTab={activeFilter}
        onTabChange={(tabKey) => setActiveFilter(tabKey)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search order #, customer, city..."
        isEmpty={filteredOrders.length === 0}
        emptyMessage={
          activeFilter === 'SALES_REP_APPROVED'
            ? 'No orders waiting for warehouse preparation scheduling. All caught up!'
            : 'No orders found matching this filter.'
        }
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              <th className="py-3 px-4">Order Details</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Fulfillment Assignee</th>
              <th className="py-3 px-4 text-right">Order Value</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-xs">
            {filteredOrders.map((order) => {
              const statusCfg = STATUS_CONFIG[order.status] || {
                label: order.status,
                bg: 'bg-muted text-muted-foreground',
              };

              const prepTask = order.preparationTask || order.preparationTasks?.[0];
              const delivery = order.delivery || order.deliveries?.[0];

              return (
                <tr
                  key={order.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  {/* Order Number & Date */}
                  <td className="py-3.5 px-4">
                    <Link
                      to={`/sales-orders/${order.id}`}
                      className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      <span>{order.orderNumber}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {order.createdAt
                        ? format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')
                        : '—'}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-foreground">
                      {order.customer?.companyName ||
                        order.customer?.businessName ||
                        'Customer'}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {order.customer?.customerCode || '—'}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusCfg.bg}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Assignee / Operational Info */}
                  <td className="py-3.5 px-4">
                    {order.status === 'SALES_REP_APPROVED' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Awaiting Storekeeper Assign
                      </span>
                    )}

                    {(order.status === 'WAREHOUSE_PREPARATION_SCHEDULED' ||
                      order.status === 'PREPARING') && (
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-medium text-foreground flex items-center gap-1">
                          <User className="w-3 h-3 text-blue-400" />
                          <span>
                            {prepTask?.storeKeeper?.person
                              ? `${prepTask.storeKeeper.person.firstName} ${prepTask.storeKeeper.person.lastName || ''}`
                              : 'Assigned Storekeeper'}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Status: {prepTask?.status || 'IN_PROGRESS'}
                        </div>
                      </div>
                    )}

                    {order.status === 'READY_FOR_DELIVERY' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400">
                        <Truck className="w-3.5 h-3.5" />
                        Packed — Ready for Driver
                      </span>
                    )}

                    {(order.status === 'DELIVERY_SCHEDULED' ||
                      order.status === 'OUT_FOR_DELIVERY') && (
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-medium text-foreground flex items-center gap-1">
                          <Truck className="w-3 h-3 text-purple-400" />
                          <span>
                            {delivery?.driver?.person
                              ? `${delivery.driver.person.firstName} ${delivery.driver.person.lastName || ''}`
                              : 'Assigned Driver'}
                          </span>
                        </div>
                        {delivery?.vehicle && (
                          <div className="text-[10px] text-muted-foreground font-mono">
                            Vehicle: {delivery.vehicle.plateNumber}
                          </div>
                        )}
                      </div>
                    )}

                    {(order.status === 'DELIVERED' || order.status === 'COMPLETED') && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Handover Confirmed
                      </span>
                    )}
                  </td>

                  {/* Total Value */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="font-mono font-bold text-foreground">
                      ETB{' '}
                      {Number(order.totalAmount || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {order.items?.length || 0} items
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {order.status === 'SALES_REP_APPROVED' && (
                      <Link to={`/sales-orders/${order.id}/schedule-preparation`}>
                        <Button
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                        >
                          Schedule Prep
                        </Button>
                      </Link>
                    )}

                    {order.status === 'READY_FOR_DELIVERY' && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenDeliveryModal(order)}
                        className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                      >
                        Assign Driver
                      </Button>
                    )}

                    <Link to={`/sales-orders/${order.id}`}>
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

      {/* 6. Schedule Preparation Modal */}
      <Modal
        isOpen={prepModal.isOpen}
        onClose={() => setPrepModal({ ...prepModal, isOpen: false })}
        title={`Schedule Warehouse Prep: ${prepModal.order?.orderNumber || ''}`}
      >
        <form onSubmit={handleConfirmPrep} className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Assign an active storekeeper to pick and pack goods for customer{' '}
            <strong className="text-foreground">
              {prepModal.order?.customer?.companyName || prepModal.order?.customer?.businessName}
            </strong>
            .
          </p>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Select Storekeeper *
            </label>
            <select
              value={prepModal.storeKeeperId}
              onChange={(e) => setPrepModal({ ...prepModal, storeKeeperId: e.target.value })}
              className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select a storekeeper...</option>
              {storekeepers.map((sk) => (
                <option key={sk.id} value={sk.id}>
                  {sk.person ? `${sk.person.firstName} ${sk.person.lastName || ''}` : sk.employeeCode} ({sk.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Scheduled Date & Time *
            </label>
            <input
              type="datetime-local"
              value={prepModal.scheduledDate}
              onChange={(e) => setPrepModal({ ...prepModal, scheduledDate: e.target.value })}
              className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Picking Notes & Instructions (Optional)
            </label>
            <textarea
              rows={3}
              value={prepModal.notes}
              onChange={(e) => setPrepModal({ ...prepModal, notes: e.target.value })}
              placeholder="e.g. Inspect lot numbers, use fragile packaging buffer..."
              className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPrepModal({ ...prepModal, isOpen: false })}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={prepMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm"
            >
              {prepMutation.isPending ? 'Scheduling...' : 'Assign & Start Prep'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. Schedule Delivery Modal */}
      <Modal
        isOpen={deliveryModal.isOpen}
        onClose={() => setDeliveryModal({ ...deliveryModal, isOpen: false })}
        title={`Assign Driver & Vehicle: ${deliveryModal.order?.orderNumber || ''}`}
      >
        <form onSubmit={handleConfirmDelivery} className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Order has been picked and packed. Assign a fleet driver and vehicle to dispatch for delivery.
          </p>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Select Driver *
            </label>
            <select
              value={deliveryModal.driverId}
              onChange={(e) => setDeliveryModal({ ...deliveryModal, driverId: e.target.value })}
              className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select a driver...</option>
              {drivers.map((drv) => (
                <option key={drv.id} value={drv.id}>
                  {drv.person ? `${drv.person.firstName} ${drv.person.lastName || ''}` : drv.employeeCode} ({drv.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Select Fleet Vehicle (Optional)
            </label>
            <select
              value={deliveryModal.vehicleId}
              onChange={(e) => setDeliveryModal({ ...deliveryModal, vehicleId: e.target.value })}
              className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select vehicle...</option>
              {vehicles.map((veh) => (
                <option key={veh.id} value={veh.id}>
                  {veh.plateNumber} ({veh.vehicleType} - Cap: {veh.capacity || 'Standard'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Departure / Scheduled Date *
            </label>
            <input
              type="datetime-local"
              value={deliveryModal.scheduledDate}
              onChange={(e) => setDeliveryModal({ ...deliveryModal, scheduledDate: e.target.value })}
              className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Dispatch Instructions (Optional)
            </label>
            <textarea
              rows={3}
              value={deliveryModal.notes}
              onChange={(e) => setDeliveryModal({ ...deliveryModal, notes: e.target.value })}
              placeholder="e.g. Call store contact upon arrival..."
              className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeliveryModal({ ...deliveryModal, isOpen: false })}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={deliveryMutation.isPending}
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold rounded-xl shadow-sm"
            >
              {deliveryMutation.isPending ? 'Assigning...' : 'Confirm Delivery Assignment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
