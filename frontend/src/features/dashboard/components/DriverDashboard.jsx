import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  Navigation,
  ExternalLink,
  ClipboardCheck,
  RefreshCw,
  Play,
} from 'lucide-react';
import { salesOrdersApi } from '../../sales-orders/salesOrdersApi';
import { DashboardTableCard } from './common';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';

export default function DriverDashboard() {
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Handover Modal State
  const [handoverModal, setHandoverModal] = useState({
    isOpen: false,
    delivery: null,
    recipientName: '',
    proofType: 'SIGNATURE',
    notes: '',
  });

  const person = user?.person || {};
  const driverName = person.firstName
    ? `${person.firstName} ${person.lastName || ''}`.trim()
    : user?.username || 'Driver';

  // 1. Fetch assigned deliveries
  const {
    data: deliveriesRes,
    isLoading: deliveriesLoading,
    isRefetching: deliveriesRefetching,
    refetch: refetchDeliveries,
  } = useQuery({
    queryKey: ['driverDeliveries'],
    queryFn: () => salesOrdersApi.getDriverDeliveries({ limit: 50 }),
    refetchInterval: 15000,
  });

  const deliveries = Array.isArray(deliveriesRes?.data)
    ? deliveriesRes.data
    : Array.isArray(deliveriesRes?.data?.data)
    ? deliveriesRes.data.data
    : [];

  const scheduledDeliveries = deliveries.filter((d) => d.status === 'SCHEDULED');
  const inTransitDeliveries = deliveries.filter(
    (d) => d.status === 'IN_TRANSIT' || d.status === 'DISPATCHED' || d.status === 'OUT_FOR_DELIVERY'
  );
  const completedDeliveries = deliveries.filter((d) => d.status === 'DELIVERED');

  const activeVehicle =
    inTransitDeliveries[0]?.vehicle?.plateNumber ||
    scheduledDeliveries[0]?.vehicle?.plateNumber ||
    'Fleet Assigned';

  // Mutations
  const startDeliveryMutation = useMutation({
    mutationFn: (deliveryId) => salesOrdersApi.startDelivery(deliveryId),
    onSuccess: () => {
      toast.success('Delivery run dispatched! Order is now Out for Delivery.');
      queryClient.invalidateQueries(['driverDeliveries']);
      queryClient.invalidateQueries(['deliveries']);
      queryClient.invalidateQueries(['salesOrders']);
      queryClient.invalidateQueries(['salesOrder']);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to start delivery run');
    },
  });

  const completeDeliveryMutation = useMutation({
    mutationFn: ({ deliveryId, proof }) => salesOrdersApi.completeDelivery(deliveryId, proof),
    onSuccess: (res) => {
      const isDual =
        res?.data?.status === 'COMPLETED' ||
        res?.status === 'COMPLETED' ||
        res?.data?.salesOrder?.status === 'COMPLETED';
      if (isDual) {
        toast.success('Handover dual-confirmed by both Driver and Customer! Sales order COMPLETED.');
      } else {
        toast.success('Driver handover confirmed! Waiting for Customer receipt confirmation to complete sales order.');
      }
      setHandoverModal({
        isOpen: false,
        delivery: null,
        recipientName: '',
        proofType: 'SIGNATURE',
        notes: '',
      });
      queryClient.invalidateQueries(['driverDeliveries']);
      queryClient.invalidateQueries(['deliveries']);
      queryClient.invalidateQueries(['salesOrders']);
      queryClient.invalidateQueries(['salesOrder']);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to complete delivery handover');
    },
  });

  const handleStartDelivery = (deliveryId, e) => {
    e.stopPropagation();
    if (window.confirm('Start delivery run now? Order will update to Out for Delivery.')) {
      startDeliveryMutation.mutate(deliveryId);
    }
  };

  const handleOpenHandover = (delivery, e) => {
    e.stopPropagation();
    const customer = delivery.salesOrder?.customer;
    setHandoverModal({
      isOpen: true,
      delivery,
      recipientName:
        customer?.contactPerson ||
        customer?.companyName ||
        customer?.businessName ||
        '',
      proofType: 'SIGNATURE',
      notes: '',
    });
  };

  const handleConfirmHandover = (e) => {
    e.preventDefault();
    if (!handoverModal.recipientName.trim()) {
      toast.error('Please enter recipient name');
      return;
    }

    completeDeliveryMutation.mutate({
      deliveryId: handoverModal.delivery.id,
      proof: {
        proofType: handoverModal.proofType,
        recipientName: handoverModal.recipientName.trim(),
        notes: handoverModal.notes || undefined,
        verifiedAt: new Date().toISOString(),
      },
    });
  };

  // Filter deliveries
  const filteredDeliveries = deliveries.filter((d) => {
    if (activeTab === 'SCHEDULED' && d.status !== 'SCHEDULED') return false;
    if (
      activeTab === 'IN_TRANSIT' &&
      d.status !== 'IN_TRANSIT' &&
      d.status !== 'DISPATCHED' &&
      d.status !== 'OUT_FOR_DELIVERY'
    ) {
      return false;
    }
    if (activeTab === 'DELIVERED' && d.status !== 'DELIVERED') return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const delNum = (d.deliveryNumber || d.id || '').toLowerCase();
    const orderNum = (d.salesOrder?.orderNumber || '').toLowerCase();
    const customer = (
      d.salesOrder?.customer?.companyName ||
      d.salesOrder?.customer?.businessName ||
      ''
    ).toLowerCase();
    const dest = (
      d.destination ||
      d.salesOrder?.deliveryAddress ||
      d.salesOrder?.customer?.shippingAddress ||
      ''
    ).toLowerCase();

    return (
      delNum.includes(term) ||
      orderNum.includes(term) ||
      customer.includes(term) ||
      dest.includes(term)
    );
  });

  const tabs = [
    { key: 'ALL', label: 'All Runs', count: deliveries.length },
    { key: 'SCHEDULED', label: 'Scheduled for Departure', count: scheduledDeliveries.length },
    { key: 'IN_TRANSIT', label: 'Out on Route', count: inTransitDeliveries.length },
    { key: 'DELIVERED', label: 'Completed', count: completedDeliveries.length },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO BANNER — THEME ADAPTIVE & MODERN (Matching Admin style) */}
      <div className="relative rounded-3xl border border-border bg-card shadow-sm p-6 sm:p-8 overflow-hidden transition-all duration-200">
        {/* Ambient subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Truck className="w-3.5 h-3.5" />
                Logistics Fleet Driver
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Transit Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-muted-foreground bg-secondary border border-border">
                <Truck className="w-3.5 h-3.5 text-purple-400" />
                Vehicle: {activeVehicle}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Driver {driverName}
              </span>
            </h1>

            <p className="text-sm text-muted-foreground">
              Transit & Logistics Cockpit — manage assigned delivery manifests, route tracking, digital proof of delivery, and customer handover.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={refetchDeliveries}
              disabled={deliveriesRefetching}
              className="flex items-center gap-2 border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium px-3.5 py-2 rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${deliveriesRefetching ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Link to="/deliveries">
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-all"
              >
                <Navigation className="w-4 h-4" />
                <span>Full Deliveries Manifest</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. OPERATIONS QUICK NAVIGATION TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Scheduled for Route',
            desc: `${scheduledDeliveries.length} Ready to Depart`,
            icon: Clock,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border border-amber-500/20',
            action: () => setActiveTab('SCHEDULED'),
          },
          {
            label: 'Out on Route',
            desc: `${inTransitDeliveries.length} Active in Transit`,
            icon: Navigation,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10 border border-purple-500/20',
            action: () => setActiveTab('IN_TRANSIT'),
          },
          {
            label: 'Completed Trips',
            desc: `${completedDeliveries.length} Signed & Verified`,
            icon: CheckCircle2,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border border-emerald-500/20',
            action: () => setActiveTab('DELIVERED'),
          },
          {
            label: 'Assigned Fleet Vehicle',
            desc: activeVehicle,
            icon: Truck,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border border-blue-500/20',
            action: () => setActiveTab('ALL'),
          },
        ].map((tile, i) => {
          const Icon = tile.icon;
          return (
            <button
              key={i}
              onClick={tile.action}
              className="group relative p-4 rounded-2xl border border-border bg-card hover:border-purple-500/40 hover:shadow-md transition-all duration-200 text-left cursor-pointer"
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
            label: 'Scheduled for Departure',
            value: scheduledDeliveries.length,
            subtitle: 'Staged at dock ready to depart',
            icon: Clock,
            color: 'text-amber-400',
            boxBg: 'bg-amber-500/10 border-amber-500/20',
            badge: scheduledDeliveries.length > 0 ? 'Ready' : 'Clear',
            badgeClass: scheduledDeliveries.length > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-muted text-muted-foreground border-border',
            onClick: () => setActiveTab('SCHEDULED'),
          },
          {
            label: 'Out on Route',
            value: inTransitDeliveries.length,
            subtitle: 'Active transport to customer',
            icon: Navigation,
            color: 'text-purple-400',
            boxBg: 'bg-purple-500/10 border-purple-500/20',
            badge: inTransitDeliveries.length > 0 ? 'Active Run' : 'Idle',
            badgeClass: inTransitDeliveries.length > 0 ? 'bg-purple-500/15 text-purple-400 border-purple-500/30 animate-pulse' : 'bg-muted text-muted-foreground border-border',
            onClick: () => setActiveTab('IN_TRANSIT'),
          },
          {
            label: 'Completed Deliveries',
            value: completedDeliveries.length,
            subtitle: 'Signed and handed over',
            icon: CheckCircle2,
            color: 'text-emerald-400',
            boxBg: 'bg-emerald-500/10 border-emerald-500/20',
            badge: 'Handed Over',
            badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            onClick: () => setActiveTab('DELIVERED'),
          },
          {
            label: 'Fleet Vehicle Unit',
            value: activeVehicle,
            subtitle: 'Assigned transport unit',
            icon: Truck,
            color: 'text-blue-400',
            boxBg: 'bg-blue-500/10 border-blue-500/20',
            badge: 'Assigned',
            badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            onClick: () => setActiveTab('ALL'),
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.onClick}
              className="p-5 border border-border bg-card shadow-sm rounded-2xl hover:border-purple-500/40 transition-all duration-200 cursor-pointer"
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

      {/* 4. NEW TASKS ACTION CENTER: Assigned Delivery Runs (Matching Sales Rep style) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Assigned Delivery Runs & Route Dispatch
                {scheduledDeliveries.length + inTransitDeliveries.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-purple-500 text-white">
                    {scheduledDeliveries.length + inTransitDeliveries.length} Active
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                Assigned road transport manifests ready for vehicle departure or customer handover confirmation
              </p>
            </div>
          </div>
        </div>

        {scheduledDeliveries.length === 0 && inTransitDeliveries.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              All Assigned Delivery Runs Completed!
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              You have no active or departure-ready delivery manifests. New delivery dispatches assigned by the Logistics Manager will appear here immediately.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {[...inTransitDeliveries, ...scheduledDeliveries].map((delivery) => {
              const order = delivery.salesOrder || {};
              const customerName =
                order.customer?.organization?.name ||
                (order.customer?.person
                  ? `${order.customer.person.firstName} ${order.customer.person.lastName}`
                  : order.customer?.companyName || 'Customer');
              const destination =
                delivery.destination ||
                delivery.deliveryAddress ||
                order.deliveryAddressText ||
                'Addis Ababa, Central Wholesale Route';
              const isOut = delivery.status === 'OUT_FOR_DELIVERY' || delivery.status === 'IN_TRANSIT';

              return (
                <div
                  key={delivery.id}
                  className={`bg-card rounded-2xl p-5 shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 border ${
                    isOut ? 'border-purple-500/40 shadow-purple-500/5 ring-1 ring-purple-500/20' : 'border-amber-500/30 hover:border-amber-500/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                        {delivery.deliveryNumber}
                      </span>
                      {order.orderNumber && (
                        <span className="text-xs font-semibold text-muted-foreground">
                          Order: <strong className="text-foreground">{order.orderNumber}</strong>
                        </span>
                      )}
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          isOut
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 animate-pulse'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {isOut ? '● Out for Delivery' : 'Ready for Vehicle Departure'}
                      </span>
                      {delivery.scheduledDate && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Departure: {format(new Date(delivery.scheduledDate), 'MMM dd, HH:mm')}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Recipient: <strong className="text-foreground">{customerName}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate max-w-[280px]">{destination}</span>
                      </span>
                      {delivery.vehicle?.plateNumber && (
                        <>
                          <span>•</span>
                          <span>Vehicle: <strong className="font-mono text-foreground">{delivery.vehicle.plateNumber}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {!isOut ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => handleStartDelivery(delivery.id, e)}
                        disabled={startDeliveryMutation.isPending}
                        className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 px-4 shadow-md cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>{startDeliveryMutation.isPending ? 'Starting Run...' : 'Start Delivery Run'}</span>
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => handleOpenHandover(delivery, e)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 px-4 shadow-md cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Handover & Complete</span>
                      </Button>
                    )}
                    {order.id && (
                      <Link to={`/sales-orders/${order.id}`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Order
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

      {/* 4. Deliveries Queue Table */}
      <DashboardTableCard
        title="Assigned Deliveries & Manifests"
        subtitle="Manage route departures and record proof of delivery upon handover"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabKey) => setActiveTab(tabKey)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search order #, customer, address..."
        isEmpty={filteredDeliveries.length === 0}
        emptyMessage={
          activeTab === 'SCHEDULED'
            ? 'No scheduled runs waiting for departure.'
            : 'No delivery records found.'
        }
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              <th className="py-3 px-4">Delivery & Order</th>
              <th className="py-3 px-4">Client & Destination</th>
              <th className="py-3 px-4">Scheduled Departure</th>
              <th className="py-3 px-4">Vehicle Unit</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-xs">
            {filteredDeliveries.map((delivery) => {
              const order = delivery.salesOrder || {};
              const isScheduled = delivery.status === 'SCHEDULED';
              const isInTransit =
                delivery.status === 'IN_TRANSIT' ||
                delivery.status === 'DISPATCHED' ||
                delivery.status === 'OUT_FOR_DELIVERY';
              const isDelivered = delivery.status === 'DELIVERED';

              const destination =
                delivery.destination ||
                order.deliveryAddress ||
                order.customer?.shippingAddress ||
                'Addis Ababa Commercial Area';

              return (
                <tr
                  key={delivery.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  {/* Delivery & Order Number */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-foreground">
                      {delivery.deliveryNumber || 'DEL-MANIFEST'}
                    </div>
                    <Link
                      to={`/sales-orders/${order.id || delivery.salesOrderId}`}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <span>SO: {order.orderNumber || 'Order'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>

                  {/* Customer & Destination */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-foreground">
                      {order.customer?.companyName ||
                        order.customer?.businessName ||
                        'Customer'}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="truncate max-w-xs">{destination}</span>
                    </div>
                  </td>

                  {/* Scheduled Departure */}
                  <td className="py-3.5 px-4">
                    <div className="text-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {delivery.scheduledDate
                          ? format(new Date(delivery.scheduledDate), 'MMM dd, yyyy HH:mm')
                          : 'As Scheduled'}
                      </span>
                    </div>
                  </td>

                  {/* Vehicle */}
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-foreground">
                      {delivery.vehicle?.plateNumber || activeVehicle}
                    </span>
                    <div className="text-[10px] text-muted-foreground">
                      {delivery.vehicle?.vehicleType || 'Standard Transit'}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    {isScheduled && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-indigo-500/15 text-indigo-300 border-indigo-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        Ready to Depart
                      </span>
                    )}
                    {isInTransit &&
                      (delivery.customerConfirmedAt ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-blue-500/15 text-blue-300 border-blue-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          Customer Confirmed • Confirm Handover
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-purple-500/15 text-purple-300 border-purple-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                          Out for Delivery
                        </span>
                      ))}
                    {isDelivered &&
                      (delivery.driverConfirmedAt && !delivery.customerConfirmedAt ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-amber-500/15 text-amber-300 border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Driver Confirmed • Awaiting Customer
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Dual-Confirmed / Completed
                        </span>
                      ))}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {isScheduled && (
                      <Button
                        size="sm"
                        onClick={(e) => handleStartDelivery(delivery.id, e)}
                        disabled={startDeliveryMutation.isPending}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer gap-1"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Start Run</span>
                      </Button>
                    )}

                    {isInTransit && (
                      <Button
                        size="sm"
                        onClick={(e) => handleOpenHandover(delivery, e)}
                        disabled={completeDeliveryMutation.isPending}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm cursor-pointer gap-1"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>Handover</span>
                      </Button>
                    )}

                    <Link to={`/sales-orders/${order.id || delivery.salesOrderId}`}>
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

      {/* 5. Complete Delivery / Proof of Handover Modal */}
      <Modal
        isOpen={handoverModal.isOpen}
        onClose={() => setHandoverModal({ ...handoverModal, isOpen: false })}
        title={`Confirm Handover: ${handoverModal.delivery?.deliveryNumber || ''}`}
      >
        <form onSubmit={handleConfirmHandover} className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Enter recipient details to confirm client handover and finalize delivery proof.
          </p>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Recipient Name *
            </label>
            <input
              type="text"
              value={handoverModal.recipientName}
              onChange={(e) =>
                setHandoverModal({ ...handoverModal, recipientName: e.target.value })
              }
              placeholder="e.g. Dawit Mengistu (Store Manager)"
              className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Verification / Proof Type
            </label>
            <select
              value={handoverModal.proofType}
              onChange={(e) =>
                setHandoverModal({ ...handoverModal, proofType: e.target.value })
              }
              className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="SIGNATURE">Customer Digital Signature</option>
              <option value="PHOTO">Delivery Photo Verification</option>
              <option value="STAMP">Company Receiving Stamp</option>
              <option value="OTP">SMS / OTP Verification</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Handover Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={handoverModal.notes}
              onChange={(e) =>
                setHandoverModal({ ...handoverModal, notes: e.target.value })
              }
              placeholder="e.g. All cartons inspected intact and accepted by manager..."
              className="w-full text-xs rounded-xl border border-border bg-background p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHandoverModal({ ...handoverModal, isOpen: false })}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={completeDeliveryMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-sm"
            >
              {completeDeliveryMutation.isPending ? 'Verifying...' : 'Confirm Delivery Complete'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
