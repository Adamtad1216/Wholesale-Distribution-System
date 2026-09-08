import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Check,
  RotateCcw,
  XCircle,
  AlertCircle,
  Package,
  Truck,
  Calendar,
  User,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  FileText,
  Boxes,
  Navigation,
  Zap,
  DollarSign,
  Lock,
  Warehouse,
  UserCheck,
  Phone,
  Mail,
} from 'lucide-react';
import { salesOrdersApi } from '../salesOrdersApi';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Modal from '../../../components/ui/Modal';
import OrderDeliveryLocationMap from '../../../components/sales-orders/OrderDeliveryLocationMap';
import ErrorBoundary from '../../../components/common/ErrorBoundary';

const STATUS_COLORS = {
  DRAFT: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  PENDING_REVIEW: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  SALES_REP_APPROVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  REJECTED: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  ADJUSTMENT_REQUIRED: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  WAREHOUSE_PREPARATION_SCHEDULED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  PREPARING: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  READY_FOR_DELIVERY: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  READY_FOR_PICKUP: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  DELIVERY_SCHEDULED: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  DISPATCHED: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  OUT_FOR_DELIVERY: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  DELIVERED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  COMPLETED: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/30',
  CANCELLED: 'bg-rose-600/20 text-rose-300 border-rose-600/30',
};

export default function SalesOrderDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user, role } = useSelector((state) => state.auth);

  // Sales Rep Review Modal
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: null,
    reason: '',
  });

  // Fulfillment Modals
  const [isPrepModalOpen, setIsPrepModalOpen] = useState(false);
  const [prepForm, setPrepForm] = useState({
    storeKeeperId: '',
    scheduledDate: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    driverId: '',
    vehicleId: '',
    scheduledDate: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  const [isCompleteDeliveryModalOpen, setIsCompleteDeliveryModalOpen] = useState(false);
  const [completeDeliveryForm, setCompleteDeliveryForm] = useState({
    recipientName: '',
    proofType: 'SIGNATURE',
    notes: '',
  });

  // Role permissions
  const isSalesRepOrAdmin =
    role === 'SALES_REPRESENTATIVE' ||
    role === 'SALES_REP' ||
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN' ||
    Boolean(user?.person?.employee?.isAvailableForSales);

  const isWarehouseManagerOrAdmin =
    role === 'WAREHOUSE_MANAGER' ||
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN';

  const isStorekeeperOrAdmin =
    role === 'STORE_KEEPER' ||
    role === 'STOREKEEPER' ||
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN';

  const isDriverOrAdmin =
    role === 'DRIVER' ||
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN';

  const [isCustomerHandoverModalOpen, setIsCustomerHandoverModalOpen] = useState(false);
  const [customerHandoverForm, setCustomerHandoverForm] = useState({
    recipientName: '',
    confirmedReceived: true,
    notes: '',
  });

  const [isConfirmPickupModalOpen, setIsConfirmPickupModalOpen] = useState(false);
  const [confirmPickupForm, setConfirmPickupForm] = useState({
    recipientName: '',
    recipientPhone: '',
    vehiclePlateNumber: '',
    notes: '',
  });

  const [isCustomerPickupModalOpen, setIsCustomerPickupModalOpen] = useState(false);
  const [customerPickupForm, setCustomerPickupForm] = useState({
    recipientName: '',
    notes: '',
    confirmedReceived: true,
  });

  const isCustomer =
    role === 'CUSTOMER' ||
    Boolean(user?.customer) ||
    Boolean(user?.person?.customer);

  const isCustomerOrAdmin =
    isCustomer ||
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN';

  // Main order query
  const { data, isLoading, error } = useQuery({
    queryKey: ['salesOrder', id],
    queryFn: async () => {
      try {
        const res = await salesOrdersApi.getById(id);
        return res?.data || res;
      } catch (err) {
        if (err?.status === 501) {
          return null;
        }
        throw err;
      }
    },
  });

  // Lookup queries
  const { data: storekeepersRaw = [] } = useQuery({
    queryKey: ['storekeepers'],
    queryFn: async () => {
      try {
        const res = await salesOrdersApi.getStorekeepers();
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    enabled: Boolean(isWarehouseManagerOrAdmin),
  });

  const { data: driversRaw = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      try {
        const res = await salesOrdersApi.getDrivers();
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    enabled: Boolean(isWarehouseManagerOrAdmin),
  });

  const { data: vehiclesRaw = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      try {
        const res = await salesOrdersApi.getVehicles();
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    enabled: Boolean(isWarehouseManagerOrAdmin),
  });

  const storekeepers = Array.isArray(storekeepersRaw) ? storekeepersRaw : [];
  const drivers = Array.isArray(driversRaw) ? driversRaw : [];
  const vehicles = Array.isArray(vehiclesRaw) ? vehiclesRaw : [];

  // Mutations
  const approveMutation = useMutation({
    mutationFn: () => salesOrdersApi.approve(id),
    onSuccess: () => {
      toast.success('Sales order approved successfully!');
      queryClient.invalidateQueries({ queryKey: ['salesOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to approve order');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason) => salesOrdersApi.reject(id, reason),
    onSuccess: () => {
      toast.success('Sales order rejected');
      setActionModal({ isOpen: false, type: null, reason: '' });
      queryClient.invalidateQueries({ queryKey: ['salesOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reject order');
    },
  });

  const adjustmentMutation = useMutation({
    mutationFn: (reason) => salesOrdersApi.requestAdjustment(id, reason),
    onSuccess: () => {
      toast.success('Adjustment requested from customer');
      setActionModal({ isOpen: false, type: null, reason: '' });
      queryClient.invalidateQueries({ queryKey: ['salesOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to request adjustment');
    },
  });

  const schedulePrepMutation = useMutation({
    mutationFn: (payload) => salesOrdersApi.schedulePreparation(id, payload),
    onSuccess: () => {
      toast.success('Warehouse preparation task scheduled successfully!');
      setIsPrepModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['salesOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to schedule preparation');
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId) => salesOrdersApi.completeTask(taskId),
    onSuccess: () => {
      toast.success('Warehouse preparation completed & order staged for delivery!');
      queryClient.invalidateQueries({ queryKey: ['salesOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to complete preparation');
    },
  });

  const scheduleDeliveryMutation = useMutation({
    mutationFn: (payload) => salesOrdersApi.scheduleDelivery(id, payload),
    onSuccess: () => {
      toast.success('Delivery scheduled and driver assigned!');
      setIsDeliveryModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['salesOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to schedule delivery');
    },
  });

  const startDeliveryMutation = useMutation({
    mutationFn: (deliveryId) => salesOrdersApi.startDelivery(deliveryId),
    onSuccess: () => {
      toast.success('Delivery dispatched! Order is now Out for Delivery.');
      queryClient.invalidateQueries({ queryKey: ['salesOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to start delivery');
    },
  });

  const completeDeliveryMutation = useMutation({
    mutationFn: ({ deliveryId, proof }) => salesOrdersApi.completeDelivery(deliveryId, proof),
    onSuccess: (res) => {
      const isDual = res?.data?.status === 'COMPLETED' || res?.status === 'COMPLETED';
      if (isDual) {
        toast.success('Handover dual-confirmed by both Driver and Customer! Sales order COMPLETED.');
      } else {
        toast.success('Driver handover confirmed! Waiting for Customer receipt confirmation to complete sales order.');
      }
      setIsCompleteDeliveryModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['salesOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['driverDeliveries'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to complete delivery handover');
    },
  });

  const customerConfirmMutation = useMutation({
    mutationFn: ({ orderId, payload }) => salesOrdersApi.customerConfirmHandover(orderId, payload),
    onSuccess: (res) => {
      const isDual = res?.data?.isDualConfirmed || res?.isDualConfirmed || res?.data?.status === 'COMPLETED';
      if (isDual) {
        toast.success('Handover dual-confirmed by both Customer and Driver! Sales order COMPLETED.');
      } else {
        toast.success('Customer receipt confirmed! Waiting for Driver handover confirmation to complete sales order.');
      }
      setIsCustomerHandoverModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['salesOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to confirm receipt');
    },
  });

  const confirmPickupMutation = useMutation({
    mutationFn: (payload) => salesOrdersApi.confirmPickup(id, payload),
    onSuccess: (res) => {
      const isDual = res?.data?.status === 'COMPLETED' || res?.status === 'COMPLETED';
      if (isDual) {
        toast.success('Self-pickup dual-confirmed by both Storekeeper and Customer! Sales order COMPLETED.');
      } else {
        toast.success('Storekeeper handover confirmed! Waiting for Customer sign-off to complete sales order.');
      }
      setIsConfirmPickupModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['salesOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to confirm pickup');
    },
  });

  const customerConfirmPickupMutation = useMutation({
    mutationFn: (payload) => salesOrdersApi.confirmCustomerPickupReceipt(id, payload),
    onSuccess: (res) => {
      const isDual = res?.data?.status === 'COMPLETED' || res?.status === 'COMPLETED';
      if (isDual) {
        toast.success('Self-pickup dual-confirmed by both Customer and Storekeeper! Sales order COMPLETED.');
      } else {
        toast.success('Customer collection confirmed! Waiting for Storekeeper sign-off to complete sales order.');
      }
      setIsCustomerPickupModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['salesOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to confirm pickup collection');
    },
  });

  const handleConfirmAction = () => {
    if (!actionModal.reason.trim()) {
      toast.error('Please enter a note or reason');
      return;
    }
    if (actionModal.type === 'REJECT') {
      rejectMutation.mutate(actionModal.reason);
    } else if (actionModal.type === 'ADJUSTMENT') {
      adjustmentMutation.mutate(actionModal.reason);
    }
  };

  const handleSchedulePrepSubmit = (e) => {
    e.preventDefault();
    if (!prepForm.storeKeeperId) {
      toast.error('Please select an assigned storekeeper');
      return;
    }
    schedulePrepMutation.mutate({
      warehouseId: data.warehouseId,
      storeKeeperId: prepForm.storeKeeperId,
      scheduledDate: new Date(prepForm.scheduledDate).toISOString(),
      notes: prepForm.notes,
    });
  };

  const handleScheduleDeliverySubmit = (e) => {
    e.preventDefault();
    if (!deliveryForm.driverId) {
      toast.error('Please select an assigned driver');
      return;
    }
    scheduleDeliveryMutation.mutate({
      driverId: deliveryForm.driverId,
      vehicleId: deliveryForm.vehicleId || undefined,
      scheduledDate: new Date(deliveryForm.scheduledDate).toISOString(),
      notes: deliveryForm.notes,
    });
  };

  const handleCompleteDeliverySubmit = (e) => {
    e.preventDefault();
    const latestDelivery = data?.deliveries?.[0];
    if (!latestDelivery) {
      toast.error('No delivery record found');
      return;
    }
    completeDeliveryMutation.mutate({
      deliveryId: latestDelivery.id,
      proof: {
        proofType: completeDeliveryForm.proofType,
        recipientName: completeDeliveryForm.recipientName || undefined,
        notes: completeDeliveryForm.notes || undefined,
      },
    });
  };

  const handleCustomerHandoverSubmit = (e) => {
    e.preventDefault();
    if (!customerHandoverForm.confirmedReceived) {
      toast.error('Please confirm that items have been received in good order');
      return;
    }
    customerConfirmMutation.mutate({
      orderId: order.id,
      payload: {
        recipientName: customerHandoverForm.recipientName.trim() || undefined,
        notes: customerHandoverForm.notes.trim() || undefined,
        proofType: 'CUSTOMER_ACCEPTANCE',
      },
    });
  };

  if (isLoading) {
    return <div className="text-center py-20 text-slate-400">Loading order details...</div>;
  }

  const order = (data?.data && typeof data.data === 'object' && data.data.id) ? data.data : data;

  if (error || !data || !order || !order.id) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-rose-400">
          {error?.message || 'Order details are not available yet.'}
        </p>
        <Link to="/sales-orders">
          <Button variant="secondary">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const latestPrepTask = order.preparationTasks?.[0];
  const latestDelivery = order.deliveries?.[0];
  const latestInvoice = order.invoices?.[0];
  const reservations = order.reservations || order.stockReservations || [];

  // Stepper calculations
  const statusRank = {
    DRAFT: 0,
    PENDING_REVIEW: 1,
    ADJUSTMENT_REQUIRED: 1,
    REJECTED: 1,
    SALES_REP_APPROVED: 2,
    WAREHOUSE_PREPARATION_SCHEDULED: 3,
    PREPARING: 3,
    READY_FOR_DELIVERY: 4,
    READY_FOR_PICKUP: 4,
    DELIVERY_SCHEDULED: 4,
    DISPATCHED: 5,
    OUT_FOR_DELIVERY: 5,
    DELIVERED: 6,
    COMPLETED: 6,
  };

  const currentRank = statusRank[order.status] ?? 0;
  const isPickupOrder = order.fulfillmentType === 'SELF_PICKUP';

  const steps = isPickupOrder
    ? [
        {
          label: 'Order Placed',
          description: new Date(order.createdAt).toLocaleDateString(),
          icon: FileText,
          isDone: currentRank >= 1,
          isCurrent: currentRank === 1 && order.status === 'PENDING_REVIEW',
        },
        {
          label: 'Rep Approved',
          description: order.salesRep
            ? `${order.salesRep.person?.firstName || 'Rep'} verified`
            : 'Quotation review',
          icon: ShieldCheck,
          isDone: currentRank >= 2,
          isCurrent: currentRank === 2,
        },
        {
          label: 'Warehouse Packed',
          description:
            order.status === 'READY_FOR_PICKUP' || currentRank > 3
              ? 'Goods Staged'
              : latestPrepTask
              ? 'Picking Active'
              : 'Scheduling Prep',
          icon: Package,
          isDone: currentRank >= 4,
          isCurrent: currentRank === 3,
        },
        {
          label: 'Ready for Pickup',
          description:
            order.status === 'READY_FOR_PICKUP'
              ? 'At Warehouse Dock'
              : currentRank > 4
              ? 'Staging Complete'
              : 'Pending Packing',
          icon: Warehouse,
          isDone: currentRank >= 4,
          isCurrent: order.status === 'READY_FOR_PICKUP',
        },
        {
          label: 'Customer Picked Up',
          description:
            order.status === 'COMPLETED'
              ? 'Goods Collected'
              : 'Awaiting Collection',
          icon: CheckCircle2,
          isDone: order.status === 'COMPLETED',
          isCurrent: order.status === 'COMPLETED',
        },
      ]
    : [
        {
          label: 'Order Placed',
          description: new Date(order.createdAt).toLocaleDateString(),
          icon: FileText,
          isDone: currentRank >= 1,
          isCurrent: currentRank === 1 && order.status === 'PENDING_REVIEW',
        },
        {
          label: 'Rep Approved',
          description: order.salesRep
            ? `${order.salesRep.person?.firstName || 'Rep'} verified`
            : 'Quotation review',
          icon: ShieldCheck,
          isDone: currentRank >= 2,
          isCurrent: currentRank === 2,
        },
        {
          label: 'Warehouse Packed',
          description:
            order.status === 'READY_FOR_DELIVERY' || currentRank > 3
              ? 'Goods Staged'
              : latestPrepTask
              ? 'Preparing'
              : 'Scheduling Prep',
          icon: Package,
          isDone: currentRank >= 4,
          isCurrent: currentRank === 3,
        },
        {
          label: 'Out for Delivery',
          description:
            currentRank >= 5
              ? latestDelivery?.vehicle?.plateNumber || 'In Transit'
              : 'Pending Dispatch',
          icon: Truck,
          isDone: currentRank >= 6,
          isCurrent: currentRank === 5,
        },
        {
          label: 'Handover & Delivered',
          description:
            currentRank >= 6
              ? 'Delivered to Customer'
              : 'Awaiting Handover',
          icon: CheckCircle2,
          isDone: currentRank >= 6,
          isCurrent: currentRank >= 6,
        },
      ];

  return (
    <ErrorBoundary>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">
              {order.orderNumber}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                STATUS_COLORS[order.status] || 'bg-slate-500/20 text-slate-300 border-slate-700'
              }`}
            >
              {order.status.replace(/_/g, ' ')}
            </span>
            {order.fulfillmentType === 'SELF_PICKUP' ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border bg-cyan-500/15 text-cyan-300 border-cyan-500/30 flex items-center gap-1.5">
                <Warehouse className="w-3.5 h-3.5" />
                <span>Self-Pickup at Warehouse</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border bg-indigo-500/15 text-indigo-300 border-indigo-500/30 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                <span>Standard Delivery</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>Created on {new Date(order.createdAt).toLocaleString()}</span>
            <span>•</span>
            <span>Order ID: <span className="font-mono text-slate-300">{order.id.slice(0, 8)}</span></span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/sales-orders">
            <Button variant="secondary" size="sm">
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* Visual 5-Stage Stepper */}
      <Card className="p-6 bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
        <div className="relative">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="flex flex-col items-center text-center group">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                      step.isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-emerald-500/10'
                        : step.isCurrent
                        ? 'bg-violet-600 text-white border-2 border-violet-400 ring-4 ring-violet-500/20 animate-pulse'
                        : 'bg-slate-800/80 text-slate-500 border border-slate-700/60'
                    }`}
                  >
                    {step.isDone ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <h4
                    className={`mt-3 text-xs font-bold uppercase tracking-wider ${
                      step.isDone
                        ? 'text-slate-200'
                        : step.isCurrent
                        ? 'text-violet-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-[120px] truncate">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Commercial Invoice & Payment Settlement Banner */}
      {latestInvoice && latestInvoice.status !== 'PAID' && (
        <div className="bg-gradient-to-r from-amber-500/15 via-blue-500/10 to-transparent border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Commercial Invoice: {latestInvoice.invoiceNumber}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {latestInvoice.status} • Payment Due
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Total Amount: <strong className="text-amber-300 font-mono">ETB {Number(latestInvoice.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> • Payment Terms: {order.customer?.paymentTerms?.name || 'Immediate (0 Days)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-300/80 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 font-medium">
              Awaiting Payment Confirmation
            </span>
          </div>
        </div>
      )}

      {/* Invoice Paid Notification Card */}
      {latestInvoice && latestInvoice.status === 'PAID' && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-300 font-mono">
                  Invoice #{latestInvoice.invoiceNumber} Paid
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Settled • ETB {Number(latestInvoice.total || 0).toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Stock is reserved in Central Warehouse. Warehouse Manager can now schedule Storekeeper preparation.
              </p>
            </div>
          </div>
          {reservations.length > 0 && (
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/20 hidden sm:inline-block">
              {reservations.length} Items Locked & Reserved
            </span>
          )}
        </div>
      )}

      {/* Stock Reservation Assurance Card (Guaranteed No Double-Selling) */}
      {reservations.length > 0 && (
        <Card className="p-4 bg-slate-900/60 border border-emerald-500/30 rounded-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Warehouse Stock Allocation (Reserved — No Double-Selling)
              </h4>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
              {reservations.length} Line Items Locked
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-3">
            {reservations.map((res) => (
              <div key={res.id} className="p-2.5 rounded-xl bg-background/50 border border-border/50 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground truncate max-w-[180px]">
                    {res.product?.name || 'Product'}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    SKU: {res.product?.sku || 'SKU'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-400">
                    {Number(res.quantity)} units
                  </span>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">
                    Reserved
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Dynamic Action Banners for Current Stage */}

      {/* STAGE 1: PENDING_REVIEW -> Sales Rep Approval */}
      {order.status === 'PENDING_REVIEW' && isSalesRepOrAdmin && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Action Required: Review Quotation & Sales Order
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify customer credit, prices, and stock allocation to approve this order for warehouse preparation.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 px-4 shadow-lg shadow-emerald-600/20"
            >
              <Check className="w-4 h-4" />
              Approve Order
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActionModal({ isOpen: true, type: 'ADJUSTMENT', reason: '' })}
              className="text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-xs font-semibold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Request Adjustment
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActionModal({ isOpen: true, type: 'REJECT', reason: '' })}
              className="text-rose-400 bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-xs font-semibold flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject Order
            </Button>
          </div>
        </div>
      )}

      {/* STAGE 2: SALES_REP_APPROVED -> Warehouse Preparation Scheduling */}
      {order.status === 'SALES_REP_APPROVED' && isWarehouseManagerOrAdmin && (
        <div className="bg-gradient-to-r from-blue-500/15 via-blue-500/10 to-transparent border border-blue-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-blue-500/5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Order Approved: Schedule Warehouse Preparation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Assign a storekeeper and schedule packaging at {order.warehouse?.name || 'the warehouse'}.
              </p>
            </div>
          </div>
          <div>
            <Link
              to={`/sales-orders/${order.id}/schedule-preparation`}
              className="inline-flex items-center justify-center rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 hover:bg-blue-500 text-white text-xs gap-2 px-4 py-2 shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              Schedule Warehouse Preparation
            </Link>
          </div>
        </div>
      )}

      {/* STAGE 3: WAREHOUSE_PREPARATION_SCHEDULED / PREPARING -> Storekeeper Packing */}
      {(order.status === 'WAREHOUSE_PREPARATION_SCHEDULED' || order.status === 'PREPARING') && (
        isStorekeeperOrAdmin ? (
          <div className="bg-gradient-to-r from-cyan-500/15 via-cyan-500/10 to-transparent border border-cyan-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-cyan-500/5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 border border-cyan-500/30">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Fulfillment In Progress: Storekeeper Preparation
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assigned Storekeeper:{' '}
                  <span className="font-semibold text-slate-200">
                    {latestPrepTask?.storeKeeper?.person
                      ? `${latestPrepTask.storeKeeper.person.firstName} ${latestPrepTask.storeKeeper.person.lastName}`
                      : 'Assigned Storekeeper'}
                  </span>
                  . Pack all line items to stage the order for dispatch.
                </p>
              </div>
            </div>
            <div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (latestPrepTask) {
                    completeTaskMutation.mutate(latestPrepTask.id);
                  }
                }}
                disabled={completeTaskMutation.isPending || !latestPrepTask}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 px-4 shadow-lg shadow-cyan-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete Preparation & Stage for Delivery
              </Button>
            </div>
          </div>
        ) : isWarehouseManagerOrAdmin ? (
          <div className="bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center flex-shrink-0 border border-cyan-500/20">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>Storekeeper Preparation In Progress</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Packing Active
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assigned Storekeeper:{' '}
                  <span className="font-semibold text-slate-200">
                    {latestPrepTask?.storeKeeper?.person
                      ? `${latestPrepTask.storeKeeper.person.firstName} ${latestPrepTask.storeKeeper.person.lastName}`
                      : 'Assigned Storekeeper'}
                  </span>
                  . Storekeeper is currently picking and packaging items to stage for delivery.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Awaiting Storekeeper Staging
            </div>
          </div>
        ) : null
      )}

      {/* STAGE 4 (SELF_PICKUP DUAL-CONFIRMATION): Warehouse Customer Collection */}
      {order.fulfillmentType === 'SELF_PICKUP' && ['READY_FOR_PICKUP', 'COMPLETED'].includes(order.status) && (() => {
        const isStorekeeperConfirmed = Boolean(order.pickedUpAt);
        const isCustomerConfirmed = Boolean(order.customerPickupConfirmedAt);
        const isBothConfirmed = (isStorekeeperConfirmed && isCustomerConfirmed) || order.status === 'COMPLETED';

        const isOrderCustomer =
          Boolean(order?.customerId && (user?.customer?.id === order.customerId || user?.personId === order.customer?.personId || user?.id === order.createdById)) ||
          role === 'CUSTOMER';
        const canCustomerConfirm = (isOrderCustomer || role === 'ADMIN' || role === 'SUPER_ADMIN') && !isCustomerConfirmed && !isBothConfirmed;
        const canStorekeeperConfirm = (isStorekeeperOrAdmin || isWarehouseManagerOrAdmin) && !isStorekeeperConfirmed && !isBothConfirmed;

        return (
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-sm space-y-6 relative overflow-hidden">
            {/* Ambient subtle glow background */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header: Title & Overall Dual-Confirmation Badge */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    <Warehouse className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg font-black tracking-tight text-foreground">
                    Warehouse Pickup Dual-Confirmation
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Both the <strong>Warehouse Storekeeper</strong> and the <strong>Wholesale Customer</strong> must approve collection for this order to be marked <strong>COMPLETED</strong>.
                </p>
              </div>

              <div>
                {isBothConfirmed ? (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Dual-Confirmed (2 of 2) • Order Completed</span>
                  </span>
                ) : isStorekeeperConfirmed && !isCustomerConfirmed ? (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>Storekeeper Confirmed • Awaiting Customer Approval (1 of 2)</span>
                  </span>
                ) : isCustomerConfirmed && !isStorekeeperConfirmed ? (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>Customer Confirmed • Awaiting Storekeeper Approval (1 of 2)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    <Warehouse className="w-4 h-4 text-cyan-400" />
                    <span>Ready at Warehouse Dock • Awaiting Dual Sign-Off (0 of 2)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Side-by-Side Dual-Approval Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
              {/* CARD 1: STOREKEEPER HANDOVER APPROVAL */}
              <div
                className={`rounded-2xl p-5 border transition-all ${
                  isStorekeeperConfirmed
                    ? 'bg-emerald-500/5 border-emerald-500/30 shadow-sm'
                    : 'bg-secondary/40 border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isStorekeeperConfirmed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-cyan-500/15 text-cyan-400'
                      }`}
                    >
                      <Warehouse className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        1. Storekeeper Handover Sign-off
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Warehouse dock verification & physical release
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      isStorekeeperConfirmed
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {isStorekeeperConfirmed ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Confirmed</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                        <span>Pending</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-2 text-xs py-2 border-t border-border/40">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Warehouse:</span>
                    <span className="font-semibold text-foreground">
                      {order.warehouse?.name || 'Central Warehouse'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Authorized Collector:</span>
                    <span className="font-semibold text-foreground">
                      {order.pickupPersonName || 'Customer / Designated Representative'}
                    </span>
                  </div>
                  {order.pickupPhone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Collector Phone:</span>
                      <span className="font-mono text-foreground">{order.pickupPhone}</span>
                    </div>
                  )}
                  {order.pickupVehiclePlate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle Plate:</span>
                      <span className="font-mono text-foreground">{order.pickupVehiclePlate}</span>
                    </div>
                  )}

                  {isStorekeeperConfirmed ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confirmed Date:</span>
                        <span className="text-foreground">
                          {new Date(order.pickedUpAt).toLocaleString()}
                        </span>
                      </div>
                      {order.pickupNotes && (
                        <div className="pt-1.5 text-[11px] text-muted-foreground italic bg-background/50 p-2 rounded-lg border border-border">
                          "{order.pickupNotes}"
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="pt-2">
                      {canStorekeeperConfirm ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setConfirmPickupForm({
                              recipientName: order.pickupPersonName || order.customer?.organization?.name || (order.customer?.person ? `${order.customer.person.firstName} ${order.customer.person.lastName || ''}`.trim() : ''),
                              recipientPhone: order.pickupPhone || '',
                              vehiclePlateNumber: order.pickupVehiclePlate || '',
                              notes: order.pickupNotes || '',
                            });
                            setIsConfirmPickupModalOpen(true);
                          }}
                          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 py-2 rounded-xl shadow-md cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm Handover as Storekeeper</span>
                        </Button>
                      ) : (
                        <p className="text-[11px] text-muted-foreground bg-secondary/50 p-2 rounded-lg text-center">
                          Awaiting storekeeper verification and goods handover at warehouse dock.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 2: CUSTOMER COLLECTION APPROVAL */}
              <div
                className={`rounded-2xl p-5 border transition-all ${
                  isCustomerConfirmed
                    ? 'bg-emerald-500/5 border-emerald-500/30 shadow-sm'
                    : 'bg-secondary/40 border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isCustomerConfirmed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-violet-500/15 text-violet-400'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        2. Customer Receipt Sign-off
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Wholesale client physical collection & goods acceptance
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      isCustomerConfirmed
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {isCustomerConfirmed ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Confirmed</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                        <span>Pending</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-2 text-xs py-2 border-t border-border/40">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Client:</span>
                    <span className="font-semibold text-foreground">
                      {order.customer?.companyName ||
                        order.customer?.organization?.name ||
                        (order.customer?.person
                          ? `${order.customer.person.firstName} ${order.customer.person.lastName || ''}`.trim()
                          : 'Wholesale Customer')}
                    </span>
                  </div>

                  {isCustomerConfirmed ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confirmed By:</span>
                        <span className="text-foreground font-medium">
                          {order.customerPickupRecipientName || 'Customer Authorized Agent'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Receipt Date:</span>
                        <span className="text-foreground">
                          {new Date(order.customerPickupConfirmedAt).toLocaleString()}
                        </span>
                      </div>
                      {order.customerPickupNotes && (
                        <div className="pt-1.5 text-[11px] text-muted-foreground italic bg-background/50 p-2 rounded-lg border border-border">
                          "{order.customerPickupNotes}"
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="pt-2">
                      {canCustomerConfirm ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setCustomerPickupForm({
                              recipientName:
                                order.customer?.person
                                  ? `${order.customer.person.firstName} ${order.customer.person.lastName || ''}`.trim()
                                  : (order.customer?.organization?.name || ''),
                              notes: '',
                              confirmedReceived: true,
                            });
                            setIsCustomerPickupModalOpen(true);
                          }}
                          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 py-2 rounded-xl shadow-md cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm Collection as Customer</span>
                        </Button>
                      ) : (
                        <p className="text-[11px] text-muted-foreground bg-secondary/50 p-2 rounded-lg text-center">
                          Awaiting wholesale client collection & acceptance confirmation.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom explanatory message */}
            <div className="rounded-2xl p-3 bg-muted/40 border border-border text-center text-xs text-muted-foreground">
              Notice: The self-pickup order will automatically finalize to <strong className="text-foreground">COMPLETED</strong> once both the storekeeper and customer submit their confirmations.
            </div>
          </div>
        );
      })()}

      {/* STAGE 4: READY_FOR_DELIVERY -> Schedule Delivery Run */}
      {order.status === 'READY_FOR_DELIVERY' && isWarehouseManagerOrAdmin && (
        <div className="bg-gradient-to-r from-indigo-500/15 via-indigo-500/10 to-transparent border border-indigo-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-indigo-500/5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Items Staged: Assign Driver & Schedule Delivery Run
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                All order items are packed and verified. Assign a delivery driver and vehicle fleet.
              </p>
            </div>
          </div>
          <div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (drivers.length > 0 && !deliveryForm.driverId) {
                  setDeliveryForm((prev) => ({
                    ...prev,
                    driverId: drivers[0].id,
                    vehicleId: vehicles[0]?.id || '',
                  }));
                }
                setIsDeliveryModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 px-4 shadow-lg shadow-indigo-600/20"
            >
              <Navigation className="w-4 h-4" />
              Schedule Delivery & Assign Driver
            </Button>
          </div>
        </div>
      )}

      {/* STAGE 5: DELIVERY_SCHEDULED -> Dispatch / Start Run */}
      {order.status === 'DELIVERY_SCHEDULED' && isDriverOrAdmin && (
        <div className="bg-gradient-to-r from-purple-500/15 via-purple-500/10 to-transparent border border-purple-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-purple-500/5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Delivery Run Scheduled: Ready for Dispatch
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Driver:{' '}
                <span className="font-semibold text-slate-200">
                  {latestDelivery?.driver?.person
                    ? `${latestDelivery.driver.person.firstName} ${latestDelivery.driver.person.lastName}`
                    : 'Assigned Driver'}
                </span>{' '}
                • Vehicle:{' '}
                <span className="font-mono text-purple-300">
                  {latestDelivery?.vehicle?.plateNumber || 'Fleet Vehicle'}
                </span>
              </p>
            </div>
          </div>
          <div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (latestDelivery) {
                  startDeliveryMutation.mutate(latestDelivery.id);
                }
              }}
              disabled={startDeliveryMutation.isPending || !latestDelivery}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 px-4 shadow-lg shadow-purple-600/20"
            >
              <ArrowRight className="w-4 h-4" />
              Start Delivery Run (Dispatch)
            </Button>
          </div>
        </div>
      )}

      {/* STAGE 6 & 7: TWO-PARTY DELIVERY HANDOVER DUAL-CONFIRMATION SECTION */}
      {latestDelivery && ['OUT_FOR_DELIVERY', 'DISPATCHED', 'DELIVERED', 'COMPLETED'].includes(order.status) && (() => {
        const isDriverConfirmed = Boolean(latestDelivery.driverConfirmedAt);
        const isCustomerConfirmed = Boolean(latestDelivery.customerConfirmedAt);
        const isBothConfirmed = (isDriverConfirmed && isCustomerConfirmed) || order.status === 'COMPLETED';

        const isOrderCustomer =
          Boolean(order?.customerId && (user?.customer?.id === order.customerId || user?.personId === order.customer?.personId || user?.id === order.createdById)) ||
          role === 'CUSTOMER';
        const canCustomerConfirm = (isOrderCustomer || role === 'ADMIN' || role === 'SUPER_ADMIN') && !isCustomerConfirmed && !isBothConfirmed;
        const canDriverConfirm = isDriverOrAdmin && !isDriverConfirmed && !isBothConfirmed;

        const driverProof = latestDelivery.proofs?.find((p) => p.proofType !== 'CUSTOMER_ACCEPTANCE') || latestDelivery.proofs?.[0];
        const customerProof = latestDelivery.proofs?.find((p) => p.proofType === 'CUSTOMER_ACCEPTANCE');

        return (
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-sm space-y-6 relative overflow-hidden">
            {/* Ambient subtle glow background */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header: Title & Overall Dual-Confirmation Badge */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg font-black tracking-tight text-foreground">
                    Delivery Handover Dual-Confirmation
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Both the <strong>Assigned Fleet Driver</strong> and the <strong>Wholesale Customer</strong> must approve handover for this order to be marked <strong>COMPLETED</strong>.
                </p>
              </div>

              <div>
                {isBothConfirmed ? (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Dual-Confirmed (2 of 2) • Order Completed</span>
                  </span>
                ) : isDriverConfirmed && !isCustomerConfirmed ? (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>Driver Confirmed • Awaiting Customer Approval (1 of 2)</span>
                  </span>
                ) : isCustomerConfirmed && !isDriverConfirmed ? (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>Customer Confirmed • Awaiting Driver Approval (1 of 2)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    <Truck className="w-4 h-4 text-indigo-400" />
                    <span>In Transit • Awaiting Dual Handover (0 of 2)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Side-by-Side Dual-Approval Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
              {/* CARD 1: DRIVER HANDOVER APPROVAL */}
              <div
                className={`rounded-2xl p-5 border transition-all ${
                  isDriverConfirmed
                    ? 'bg-emerald-500/5 border-emerald-500/30 shadow-sm'
                    : 'bg-secondary/40 border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isDriverConfirmed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-cyan-500/15 text-cyan-400'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        1. Driver Handover Sign-off
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Fleet delivery dispatch & physical offload
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      isDriverConfirmed
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {isDriverConfirmed ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Confirmed</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                        <span>Pending</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-2 text-xs py-2 border-t border-border/40">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Driver:</span>
                    <span className="font-semibold text-foreground">
                      {latestDelivery.driver?.person
                        ? `${latestDelivery.driver.person.firstName} ${latestDelivery.driver.person.lastName || ''}`.trim()
                        : 'Assigned Driver'}
                    </span>
                  </div>
                  {latestDelivery.vehicle?.plateNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fleet Vehicle:</span>
                      <span className="font-mono text-foreground">{latestDelivery.vehicle.plateNumber}</span>
                    </div>
                  )}

                  {isDriverConfirmed ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confirmed Date:</span>
                        <span className="text-foreground">
                          {new Date(latestDelivery.driverConfirmedAt).toLocaleString()}
                        </span>
                      </div>
                      {driverProof?.recipientName && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Offloaded To:</span>
                          <span className="text-foreground font-medium">{driverProof.recipientName}</span>
                        </div>
                      )}
                      {latestDelivery.driverNotes && (
                        <div className="pt-1.5 text-[11px] text-muted-foreground italic bg-background/50 p-2 rounded-lg border border-border">
                          "{latestDelivery.driverNotes}"
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="pt-2">
                      {canDriverConfirm ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setCompleteDeliveryForm((prev) => ({
                              ...prev,
                              recipientName:
                                order.customer?.person
                                  ? `${order.customer.person.firstName} ${order.customer.person.lastName || ''}`.trim()
                                  : (order.customer?.organization?.name || ''),
                            }));
                            setIsCompleteDeliveryModalOpen(true);
                          }}
                          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 py-2 rounded-xl shadow-md cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm Handover as Driver</span>
                        </Button>
                      ) : (
                        <p className="text-[11px] text-muted-foreground bg-secondary/50 p-2 rounded-lg text-center">
                          Awaiting driver arrival at customer premises to confirm handover.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 2: CUSTOMER RECEIPT APPROVAL */}
              <div
                className={`rounded-2xl p-5 border transition-all ${
                  isCustomerConfirmed
                    ? 'bg-emerald-500/5 border-emerald-500/30 shadow-sm'
                    : 'bg-secondary/40 border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isCustomerConfirmed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-violet-500/15 text-violet-400'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        2. Customer Receipt Sign-off
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Wholesale client verification & goods acceptance
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      isCustomerConfirmed
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {isCustomerConfirmed ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Confirmed</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                        <span>Pending</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-2 text-xs py-2 border-t border-border/40">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Client:</span>
                    <span className="font-semibold text-foreground">
                      {order.customer?.companyName ||
                        order.customer?.organization?.name ||
                        (order.customer?.person
                          ? `${order.customer.person.firstName} ${order.customer.person.lastName || ''}`.trim()
                          : 'Wholesale Customer')}
                    </span>
                  </div>

                  {isCustomerConfirmed ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confirmed Date:</span>
                        <span className="text-foreground">
                          {new Date(latestDelivery.customerConfirmedAt).toLocaleString()}
                        </span>
                      </div>
                      {latestDelivery.customerRecipientName && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Accepted By:</span>
                          <span className="text-foreground font-medium">
                            {latestDelivery.customerRecipientName}
                          </span>
                        </div>
                      )}
                      {latestDelivery.customerNotes && (
                        <div className="pt-1.5 text-[11px] text-muted-foreground italic bg-background/50 p-2 rounded-lg border border-border">
                          "{latestDelivery.customerNotes}"
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="pt-2">
                      {canCustomerConfirm ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setCustomerHandoverForm((prev) => ({
                              ...prev,
                              recipientName:
                                user?.person
                                  ? `${user.person.firstName} ${user.person.lastName || ''}`.trim()
                                  : (user?.username || ''),
                              confirmedReceived: true,
                              notes: '',
                            }));
                            setIsCustomerHandoverModalOpen(true);
                          }}
                          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 py-2 rounded-xl shadow-md cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm Handover as Customer</span>
                        </Button>
                      ) : (
                        <p className="text-[11px] text-muted-foreground bg-secondary/50 p-2 rounded-lg text-center">
                          Awaiting customer inspection and acceptance of delivered packages.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Final Status Banner */}
            {isBothConfirmed ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 text-center flex items-center justify-center gap-2 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Mutual Handover Dual-Confirmed — Sales order has been successfully completed!</span>
              </div>
            ) : (
              <div className="bg-muted/40 border border-border rounded-2xl p-3 text-center text-xs text-muted-foreground">
                Notice: The sales order will automatically finalize to <strong>COMPLETED</strong> once both the driver and customer submit their confirmations.
              </div>
            )}
          </div>
        );
      })()}

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Customer Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Customer Profile
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {order.customer?.customerType || 'Customer'}
              </span>
            </div>
            <p className="text-base font-bold text-slate-100">
              {order.customer?.organization?.name ||
                (order.customer?.person
                  ? `${order.customer.person.firstName} ${order.customer.person.lastName}`
                  : 'Customer')}
            </p>
            {order.customer?.organization && order.customer?.person && (
              <p className="text-xs text-slate-400 mt-0.5">
                Contact: {order.customer.person.firstName} {order.customer.person.lastName}
              </p>
            )}
            <div className="mt-3 space-y-1 text-xs text-slate-400">
              {(order.customer?.person?.phone || order.customer?.organization?.phone) && (
                <p className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Phone:</span>
                  <span className="text-slate-200">
                    {order.customer.person?.phone || order.customer.organization?.phone}
                  </span>
                </p>
              )}
              {(order.customer?.person?.email || order.customer?.organization?.email) && (
                <p className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Email:</span>
                  <span className="text-slate-200">
                    {order.customer.person?.email || order.customer.organization?.email}
                  </span>
                </p>
              )}
              {order.customer?.customerCode && (
                <p className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Account Code:</span>
                  <span className="font-mono text-slate-300">{order.customer.customerCode}</span>
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Assigned Sales Representative Card */}
        <Card className="flex flex-col justify-between border-violet-500/30 bg-violet-500/5 relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                Assigned Sales Rep
              </h3>
              {order.salesRep && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {order.salesRep.employeeCode || 'Active Rep'}
                </span>
              )}
            </div>

            {order.salesRep ? (
              <div className="space-y-3">
                <div>
                  <p className="text-base font-bold text-slate-100">
                    {order.salesRep.person
                      ? `${order.salesRep.person.firstName} ${order.salesRep.person.lastName}`
                      : 'Assigned Sales Representative'}
                  </p>
                  <p className="text-xs text-violet-300 font-medium mt-0.5">
                    {order.salesRep.department || 'Commercial Sales'}
                    {order.salesRep.salesTerritory ? ` • ${order.salesRep.salesTerritory}` : ''}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 pt-1 border-t border-violet-500/20">
                  {(order.salesRep.person?.phone || order.salesRep.workPhone) && (
                    <p className="flex items-center justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <a
                        href={`tel:${order.salesRep.person?.phone || order.salesRep.workPhone}`}
                        className="font-semibold text-violet-300 hover:underline"
                      >
                        {order.salesRep.person?.phone || order.salesRep.workPhone}
                      </a>
                    </p>
                  )}
                  {(order.salesRep.person?.email || order.salesRep.workEmail) && (
                    <p className="flex items-center justify-between">
                      <span className="text-slate-400">Email:</span>
                      <a
                        href={`mailto:${order.salesRep.person?.email || order.salesRep.workEmail}`}
                        className="font-medium text-violet-300 hover:underline truncate max-w-[180px]"
                      >
                        {order.salesRep.person?.email || order.salesRep.workEmail}
                      </a>
                    </p>
                  )}
                  {order.salesRep.branch?.name && (
                    <p className="flex items-center justify-between">
                      <span className="text-slate-400">Branch:</span>
                      <span className="text-slate-200 font-medium">{order.salesRep.branch.name}</span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-3">
                <p>Pending sales representative assignment.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Orders placed are routed directly to the warehouse manager for quotation review.
                </p>
              </div>
            )}
          </div>
          <div className="mt-3 pt-2 text-[11px] text-slate-500 border-t border-violet-500/10">
            Assigned for order review, price adjustments, and delivery coordination.
          </div>
        </Card>

        {/* Warehouse & Delivery Destination Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Fulfillment & Warehouse
              </h3>
              {order.warehouse?.code && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {order.warehouse.code}
                </span>
              )}
            </div>
            <p className="text-base font-bold text-slate-100">
              {order.warehouse?.name || 'Warehouse Fulfillment'}
            </p>
            <div className="mt-3 space-y-1.5 text-xs text-slate-400">
              <p className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Required Date:</span>
                <span className="text-slate-200 font-medium">
                  {order.requiredDate
                    ? new Date(order.requiredDate).toLocaleDateString()
                    : 'Standard Processing'}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Channel:</span>
                <span className="text-slate-200 font-medium">
                  {order.source ? order.source.replace(/_/g, ' ') : 'Customer Portal'}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Fulfillment Type:</span>
                <span className="text-slate-200 font-medium flex items-center gap-1.5">
                  {order.fulfillmentType === 'SELF_PICKUP' ? (
                    <>
                      <Warehouse className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-cyan-300 font-semibold">Self-Pickup</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-indigo-300 font-semibold">Standard Delivery</span>
                    </>
                  )}
                </span>
              </p>
              {order.fulfillmentType === 'SELF_PICKUP' ? (
                order.pickupPersonName && (
                  <div className="pt-1">
                    <span className="text-slate-500 font-medium block">Authorized Collector:</span>
                    <span className="text-slate-200">{order.pickupPersonName} {order.pickupPhone ? `(${order.pickupPhone})` : ''}</span>
                  </div>
                )
              ) : (
                order.deliveryAddressText && (
                  <div className="pt-1">
                    <span className="text-slate-500 font-medium block">Delivery Destination:</span>
                    <span className="text-slate-200">{order.deliveryAddressText}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </Card>

        {/* Assigned Operations & Fulfillment Crew (Visible to Storekeeper, Warehouse Manager, Sales Rep & Admin) */}
        {(isSalesRepOrAdmin || isWarehouseManagerOrAdmin || isStorekeeperOrAdmin) && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-violet-400" />
                Assigned Operations & Fulfillment Crew
              </h3>
              <span className="text-[11px] text-muted-foreground hidden sm:inline-block">
                Direct facility, preparation, and transit leads for this order
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Warehouse Logistics Manager */}
              <Card className="p-4 bg-cyan-500/5 border-cyan-500/30 rounded-2xl flex flex-col justify-between hover:border-cyan-500/50 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                      <Warehouse className="w-3 h-3" />
                      Warehouse Manager
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Facility Lead
                    </span>
                  </div>

                  <p className="text-base font-bold text-foreground">
                    {order.warehouse?.manager?.person
                      ? `${order.warehouse.manager.person.firstName} ${order.warehouse.manager.person.lastName}`
                      : 'Tadesse Alemu'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Facility: <strong className="text-foreground">{order.warehouse?.name || 'Central Warehouse'}</strong>
                  </p>

                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-cyan-500/20">
                    <p className="flex items-center justify-between">
                      <span>Role / Portal:</span>
                      <span className="text-cyan-300 font-medium">Logistics Manager</span>
                    </p>
                    {(order.warehouse?.manager?.person?.phone || order.warehouse?.phone) && (
                      <p className="flex items-center justify-between">
                        <span>Phone:</span>
                        <a
                          href={`tel:${order.warehouse?.manager?.person?.phone || order.warehouse?.phone}`}
                          className="text-foreground font-medium hover:underline"
                        >
                          {order.warehouse?.manager?.person?.phone || order.warehouse?.phone}
                        </a>
                      </p>
                    )}
                    {order.warehouse?.manager?.employeeCode && (
                      <p className="flex items-center justify-between">
                        <span>Employee ID:</span>
                        <span className="font-mono text-foreground">{order.warehouse.manager.employeeCode}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 text-[11px] text-muted-foreground/80 border-t border-cyan-500/10 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Supervises stock allocation & scheduling</span>
                </div>
              </Card>

              {/* 2. Assigned Storekeeper */}
              <Card className="p-4 bg-blue-500/5 border-blue-500/30 rounded-2xl flex flex-col justify-between hover:border-blue-500/50 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                      <Boxes className="w-3 h-3" />
                      Assigned Storekeeper
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        latestPrepTask?.status === 'COMPLETED'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : latestPrepTask
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {latestPrepTask
                        ? latestPrepTask.status === 'COMPLETED'
                          ? 'Staged at Dock'
                          : 'Packing Active'
                        : 'Pending Schedule'}
                    </span>
                  </div>

                  <p className="text-base font-bold text-foreground">
                    {latestPrepTask?.storeKeeper?.person
                      ? `${latestPrepTask.storeKeeper.person.firstName} ${latestPrepTask.storeKeeper.person.lastName}`
                      : order.status === 'PENDING_REVIEW' || order.status === 'DRAFT'
                      ? 'Pending Order Approval'
                      : 'Awaiting Storekeeper Schedule'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {latestPrepTask
                      ? 'Storehouse Preparation Lead'
                      : 'Assigned by Warehouse Manager upon approval'}
                  </p>

                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-blue-500/20">
                    <p className="flex items-center justify-between">
                      <span>Task Status:</span>
                      <span className="text-foreground font-medium">{latestPrepTask?.status || 'Awaiting Prep Window'}</span>
                    </p>
                    {latestPrepTask?.scheduledDate && (
                      <p className="flex items-center justify-between">
                        <span>Scheduled:</span>
                        <span className="text-foreground font-medium">
                          {new Date(latestPrepTask.scheduledDate).toLocaleString()}
                        </span>
                      </p>
                    )}
                    {latestPrepTask?.storeKeeper?.employeeCode && (
                      <p className="flex items-center justify-between">
                        <span>Employee ID:</span>
                        <span className="font-mono text-foreground">{latestPrepTask.storeKeeper.employeeCode}</span>
                      </p>
                    )}
                    {latestPrepTask?.completedAt && (
                      <p className="flex items-center justify-between">
                        <span>Completed:</span>
                        <span className="text-emerald-400 font-medium">
                          {new Date(latestPrepTask.completedAt).toLocaleTimeString()}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 text-[11px] text-muted-foreground/80 border-t border-blue-500/10 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Picks & verifies stock from reserved inventory</span>
                </div>
              </Card>

              {/* 3. Assigned Logistics Driver */}
              <Card className="p-4 bg-purple-500/5 border-purple-500/30 rounded-2xl flex flex-col justify-between hover:border-purple-500/50 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      Assigned Fleet Driver
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        latestDelivery?.status === 'DELIVERED'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : latestDelivery?.status === 'OUT_FOR_DELIVERY' ||
                            latestDelivery?.status === 'IN_TRANSIT'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse'
                          : latestDelivery
                          ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {latestDelivery ? latestDelivery.status.replace(/_/g, ' ') : 'Pending Dispatch'}
                    </span>
                  </div>

                  <p className="text-base font-bold text-foreground">
                    {latestDelivery?.driver?.person
                      ? `${latestDelivery.driver.person.firstName} ${latestDelivery.driver.person.lastName}`
                      : currentRank >= 4
                      ? 'Awaiting Dispatch Assignment'
                      : 'Assigned upon Packaging'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {latestDelivery?.vehicle?.plateNumber
                      ? `Unit: ${latestDelivery.vehicle.plateNumber} (${latestDelivery.vehicle.vehicleType || 'Truck'})`
                      : 'Fleet Vehicle to be assigned'}
                  </p>

                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-purple-500/20">
                    {latestDelivery?.deliveryNumber && (
                      <p className="flex items-center justify-between">
                        <span>Waybill #:</span>
                        <span className="font-mono text-foreground font-semibold">
                          {latestDelivery.deliveryNumber}
                        </span>
                      </p>
                    )}
                    {latestDelivery?.scheduledDate && (
                      <p className="flex items-center justify-between">
                        <span>Departure:</span>
                        <span className="text-foreground font-medium">
                          {new Date(latestDelivery.scheduledDate).toLocaleString()}
                        </span>
                      </p>
                    )}
                    {latestDelivery?.driver?.employeeCode && (
                      <p className="flex items-center justify-between">
                        <span>Driver ID:</span>
                        <span className="font-mono text-foreground">{latestDelivery.driver.employeeCode}</span>
                      </p>
                    )}
                    {(latestDelivery?.driver?.person?.phone || latestDelivery?.driver?.workPhone) && (
                      <p className="flex items-center justify-between">
                        <span>Phone:</span>
                        <a
                          href={`tel:${latestDelivery.driver.person?.phone || latestDelivery.driver.workPhone}`}
                          className="font-semibold text-purple-300 hover:underline font-mono"
                        >
                          {latestDelivery.driver.person?.phone || latestDelivery.driver.workPhone}
                        </a>
                      </p>
                    )}
                    {latestDelivery?.proofs?.[0] && (
                      <p className="flex items-center justify-between text-emerald-400">
                        <span>Handover Proof:</span>
                        <span className="font-semibold">
                          {latestDelivery.proofs[0].proofType} ({latestDelivery.proofs[0].recipientName})
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 text-[11px] text-muted-foreground/80 border-t border-purple-500/10 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Road transit, customer handover & proof verification</span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Dynamic Storekeeper Task Card (if scheduled) */}
        {latestPrepTask && (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                Warehouse Preparation Task
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {latestPrepTask.status}
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Assigned Storekeeper:</span>
                <p className="text-slate-100 font-bold text-sm">
                  {latestPrepTask.storeKeeper?.person
                    ? `${latestPrepTask.storeKeeper.person.firstName} ${latestPrepTask.storeKeeper.person.lastName}`
                    : 'Storekeeper'}
                </p>
              </div>
              <div className="flex justify-between pt-1 border-t border-blue-500/20">
                <span className="text-slate-400">Scheduled For:</span>
                <span className="text-slate-200 font-medium">
                  {new Date(latestPrepTask.scheduledDate).toLocaleString()}
                </span>
              </div>
              {latestPrepTask.completedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Completed At:</span>
                  <span className="text-emerald-400 font-medium">
                    {new Date(latestPrepTask.completedAt).toLocaleString()}
                  </span>
                </div>
              )}
              {latestPrepTask.notes && (
                <p className="text-slate-400 italic pt-1 text-[11px]">
                  Notes: "{latestPrepTask.notes}"
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Dynamic Delivery Run Card (if scheduled) */}
        {latestDelivery && (
          <Card className="border-indigo-500/30 bg-indigo-500/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                Dispatch & Delivery Run
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {latestDelivery.status}
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-slate-500 block text-[11px]">Assigned Driver:</span>
                  <p className="text-slate-100 font-bold text-sm">
                    {latestDelivery.driver?.person
                      ? `${latestDelivery.driver.person.firstName} ${latestDelivery.driver.person.lastName}`
                      : 'Driver'}
                  </p>
                </div>
                {latestDelivery.vehicle && (
                  <div className="text-right">
                    <span className="text-slate-500 block text-[11px]">Vehicle:</span>
                    <span className="font-mono text-indigo-300 font-bold">
                      {latestDelivery.vehicle.plateNumber}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-between pt-1 border-t border-indigo-500/20">
                <span className="text-slate-400">Waybill #:</span>
                <span className="font-mono text-slate-200">{latestDelivery.deliveryNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled Date:</span>
                <span className="text-slate-200">
                  {new Date(latestDelivery.scheduledDate).toLocaleString()}
                </span>
              </div>
              {latestDelivery.proofs?.[0] && (
                <div className="pt-1.5 border-t border-indigo-500/20 text-[11px] text-emerald-400">
                  <span>
                    Proof: {latestDelivery.proofs[0].proofType} • Recipient: {latestDelivery.proofs[0].recipientName || 'Verified'}
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Customer Delivery Destination Google Map OR Self-Pickup Card */}
      {order.fulfillmentType === 'SELF_PICKUP' ? (
        <Card className="my-6 p-5 border-cyan-500/30 bg-cyan-500/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Self-Pickup at Warehouse Collection Dock</span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {order.status === 'READY_FOR_PICKUP' ? 'Ready for Pickup' : order.status === 'COMPLETED' ? 'Collected' : 'In Preparation'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Collection Warehouse: <strong className="text-slate-200">{order.warehouse?.name}</strong> ({order.warehouse?.code})
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-cyan-500/20 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Authorized Collector:</span>
              <span className="font-semibold text-slate-200">{order.pickupPersonName || 'Customer / Representative'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Collector Phone:</span>
              <span className="font-mono text-slate-200">{order.pickupPhone || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Vehicle Plate:</span>
              <span className="font-mono text-slate-200">{order.pickupVehiclePlate || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Collection Status:</span>
              <span className="font-semibold text-emerald-400">
                {order.pickedUpAt ? `Collected on ${new Date(order.pickedUpAt).toLocaleDateString()}` : order.status === 'READY_FOR_PICKUP' ? 'Ready at Warehouse' : 'Staging In Progress'}
              </span>
            </div>
          </div>
          {order.pickupNotes && (
            <div className="mt-3 pt-2 border-t border-cyan-500/10 text-xs text-slate-400">
              <span className="font-medium text-slate-300">Notes / Instructions:</span> {order.pickupNotes}
            </div>
          )}
        </Card>
      ) : (
        <OrderDeliveryLocationMap order={order} className="my-6" height="320px" />
      )}

      {/* Order Items Table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Order Items & Pricing Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Items included in quotation request #{order.orderNumber}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {order.items?.length || 0} items
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase text-slate-400 bg-slate-800/40">
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">SKU</th>
                <th className="px-6 py-3.5 text-center">Unit</th>
                <th className="px-6 py-3.5 text-right">Qty</th>
                <th className="px-6 py-3.5 text-right">Unit Price</th>
                <th className="px-6 py-3.5 text-right">Discount</th>
                <th className="px-6 py-3.5 text-right">Tax (15%)</th>
                <th className="px-6 py-3.5 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {order.items?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-3.5 font-medium text-slate-100">
                    {item.product?.name || item.productId}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs text-slate-400">
                    {item.product?.sku || '-'}
                  </td>
                  <td className="px-6 py-3.5 text-center text-xs text-slate-400">
                    {item.product?.unit?.name || 'Pcs'}
                  </td>
                  <td className="px-6 py-3.5 text-right font-bold text-slate-200">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-3.5 text-right font-mono text-xs text-slate-300">
                    {Number(item.unitPrice || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    ETB
                  </td>
                  <td className="px-6 py-3.5 text-right font-mono text-xs text-rose-400">
                    {Number(item.discount || 0) > 0
                      ? `-${Number(item.discount).toFixed(2)} ETB`
                      : '0.00 ETB'}
                  </td>
                  <td className="px-6 py-3.5 text-right font-mono text-xs text-slate-400">
                    {Number(item.tax || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    ETB
                  </td>
                  <td className="px-6 py-3.5 text-right font-semibold text-emerald-400">
                    {Number(item.total || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    ETB
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Financial Summary */}
      <div className="flex justify-end">
        <Card className="w-full sm:max-w-md p-6 bg-slate-900/90 border border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b border-slate-800">
            Quotation Financial Summary
          </h4>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Subtotal</span>
              <span className="font-mono">
                {Number(order.subtotal || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                ETB
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Discounts Applied</span>
              <span className="font-mono text-rose-400">
                -
                {Number(order.discount || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                ETB
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">VAT (15%)</span>
              <span className="font-mono">
                {Number(order.tax || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                ETB
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-slate-700 text-lg font-bold text-slate-100">
              <span>Grand Total</span>
              <span className="text-xl text-emerald-400 font-mono">
                {Number(order.total || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                ETB
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Status History & Audit Log */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <Card>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Order Status Audit & Lifecycle
          </h3>
          <div className="space-y-4">
            {order.statusHistory.map((history, idx) => (
              <div key={history.id || idx} className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-slate-200">
                      Status changed to{' '}
                      <span className="text-violet-300 font-bold">
                        {history.toStatus.replace(/_/g, ' ')}
                      </span>
                    </span>
                    <span className="text-slate-500">
                      {new Date(history.changedAt).toLocaleString()}
                    </span>
                  </div>
                  {history.reason && (
                    <p className="text-slate-400 mt-1 italic">Note: "{history.reason}"</p>
                  )}
                  {history.changedBy && (
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      By:{' '}
                      {history.changedBy.person
                        ? `${history.changedBy.person.firstName} ${history.changedBy.person.lastName}`
                        : history.changedBy.username}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* MODAL 1: Sales Rep Adjustment / Reject */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, type: null, reason: '' })}
        title={actionModal.type === 'REJECT' ? 'Reject Sales Order' : 'Request Order Adjustment'}
        subtitle={`Order: ${order.orderNumber}`}
        icon={
          actionModal.type === 'REJECT' ? (
            <XCircle className="w-5 h-5 text-rose-500" />
          ) : (
            <RotateCcw className="w-5 h-5 text-amber-500" />
          )
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {actionModal.type === 'REJECT'
              ? 'Please provide a reason for rejecting this sales order. The customer will be informed.'
              : 'Please describe the adjustments required (e.g., quantity revision, warehouse stock shortage, delivery address clarification).'}
          </p>

          <textarea
            rows={3}
            value={actionModal.reason}
            onChange={(e) => setActionModal((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Type your notes or reasons here..."
            className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-muted-foreground"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActionModal({ isOpen: false, type: null, reason: '' })}
            >
              Cancel
            </Button>
            <Button
              variant={actionModal.type === 'REJECT' ? 'danger' : 'primary'}
              size="sm"
              onClick={handleConfirmAction}
              disabled={rejectMutation.isPending || adjustmentMutation.isPending}
            >
              {actionModal.type === 'REJECT' ? 'Confirm Rejection' : 'Send Adjustment Request'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Schedule Warehouse Preparation */}
      <Modal
        isOpen={isPrepModalOpen}
        onClose={() => setIsPrepModalOpen(false)}
        title="Schedule Warehouse Preparation"
        subtitle={`Order: ${order.orderNumber} • ${order.warehouse?.name || 'Warehouse'}`}
        icon={<Package className="w-5 h-5 text-blue-500" />}
      >
        <form onSubmit={handleSchedulePrepSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Assigned Storekeeper <span className="text-rose-500">*</span>
            </label>
            <select
              value={prepForm.storeKeeperId}
              onChange={(e) => setPrepForm((prev) => ({ ...prev, storeKeeperId: e.target.value }))}
              required
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a Storekeeper...</option>
              {storekeepers.map((sk) => (
                <option key={sk.id} value={sk.id}>
                  {sk.person ? `${sk.person.firstName} ${sk.person.lastName}` : sk.employeeCode} (
                  {sk.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Scheduled Preparation Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={prepForm.scheduledDate}
              onChange={(e) => setPrepForm((prev) => ({ ...prev, scheduledDate: e.target.value }))}
              required
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Preparation Instructions / Notes
            </label>
            <textarea
              rows={2}
              value={prepForm.notes}
              onChange={(e) => setPrepForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. Fragile items, special packing material required..."
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsPrepModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={schedulePrepMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
            >
              {schedulePrepMutation.isPending ? 'Scheduling...' : 'Assign & Schedule Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Schedule Delivery & Assign Driver */}
      <Modal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        title="Schedule Delivery & Assign Driver"
        subtitle={`Order: ${order.orderNumber}`}
        icon={<Truck className="w-5 h-5 text-indigo-500" />}
      >
        <form onSubmit={handleScheduleDeliverySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Assigned Delivery Driver <span className="text-rose-500">*</span>
            </label>
            <select
              value={deliveryForm.driverId}
              onChange={(e) => setDeliveryForm((prev) => ({ ...prev, driverId: e.target.value }))}
              required
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a Driver...</option>
              {drivers.map((drv) => (
                <option key={drv.id} value={drv.id}>
                  {drv.person ? `${drv.person.firstName} ${drv.person.lastName}` : drv.employeeCode}{' '}
                  ({drv.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Fleet Vehicle
            </label>
            <select
              value={deliveryForm.vehicleId}
              onChange={(e) => setDeliveryForm((prev) => ({ ...prev, vehicleId: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a Vehicle (Optional)...</option>
              {vehicles.map((vh) => (
                <option key={vh.id} value={vh.id}>
                  {vh.plateNumber} — {vh.model || vh.make || 'Fleet Vehicle'} ({vh.vehicleType || 'VAN'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Scheduled Dispatch Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={deliveryForm.scheduledDate}
              onChange={(e) => setDeliveryForm((prev) => ({ ...prev, scheduledDate: e.target.value }))}
              required
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Delivery Notes / Destination Details
            </label>
            <textarea
              rows={2}
              value={deliveryForm.notes}
              onChange={(e) => setDeliveryForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. Call before arrival, gate access code..."
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsDeliveryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={scheduleDeliveryMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
            >
              {scheduleDeliveryMutation.isPending ? 'Scheduling...' : 'Schedule & Assign Driver'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: Confirm Handover & Complete Delivery */}
      <Modal
        isOpen={isCompleteDeliveryModalOpen}
        onClose={() => setIsCompleteDeliveryModalOpen(false)}
        title="Confirm Delivery Handover"
        subtitle={`Order: ${order.orderNumber}`}
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
      >
        <form onSubmit={handleCompleteDeliverySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Recipient Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={completeDeliveryForm.recipientName}
              onChange={(e) =>
                setCompleteDeliveryForm((prev) => ({ ...prev, recipientName: e.target.value }))
              }
              placeholder="Name of person receiving goods"
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Proof Type
            </label>
            <select
              value={completeDeliveryForm.proofType}
              onChange={(e) =>
                setCompleteDeliveryForm((prev) => ({ ...prev, proofType: e.target.value }))
              }
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="SIGNATURE">Customer Signature</option>
              <option value="OFFICIAL_STAMP">Company / Official Stamp</option>
              <option value="PHOTO">Delivery Photo Verification</option>
              <option value="PHYSICAL_WAYBILL">Signed Paper Waybill</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Handover Remarks
            </label>
            <textarea
              rows={3}
              value={completeDeliveryForm.notes}
              onChange={(e) =>
                setCompleteDeliveryForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="e.g. Package verified in good shape, zero damages reported"
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCompleteDeliveryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={completeDeliveryMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              {completeDeliveryMutation.isPending ? 'Confirming...' : 'Confirm Delivery Handover'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: Customer Confirm Handover & Acceptance */}
      <Modal
        isOpen={isCustomerHandoverModalOpen}
        onClose={() => setIsCustomerHandoverModalOpen(false)}
        title="Confirm Delivery Receipt & Acceptance"
        subtitle={`Order: ${order.orderNumber}`}
        icon={<UserCheck className="w-5 h-5 text-violet-500" />}
      >
        <form onSubmit={handleCustomerHandoverSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Receiving Authorized Person <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={customerHandoverForm.recipientName}
              onChange={(e) =>
                setCustomerHandoverForm((prev) => ({ ...prev, recipientName: e.target.value }))
              }
              placeholder="Your full name"
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <input
              type="checkbox"
              id="confirmedReceived"
              checked={customerHandoverForm.confirmedReceived}
              onChange={(e) =>
                setCustomerHandoverForm((prev) => ({
                  ...prev,
                  confirmedReceived: e.target.checked,
                }))
              }
              className="mt-0.5 rounded border-border text-violet-600 focus:ring-violet-500 cursor-pointer"
            />
            <label htmlFor="confirmedReceived" className="text-xs text-foreground cursor-pointer select-none leading-snug">
              <strong className="text-violet-500">Goods Verification:</strong> I confirm that all delivered goods have been received, inspected, and accepted in satisfactory condition according to this order.
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Customer Feedback / Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={customerHandoverForm.notes}
              onChange={(e) =>
                setCustomerHandoverForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="e.g. All cartons verified and stored in warehouse safely"
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCustomerHandoverModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={customerConfirmMutation.isPending}
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold"
            >
              {customerConfirmMutation.isPending ? 'Confirming...' : 'Confirm Delivery Handover'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 6: Confirm Customer Warehouse Pickup */}
      <Modal
        isOpen={isConfirmPickupModalOpen}
        onClose={() => setIsConfirmPickupModalOpen(false)}
        title="Confirm Customer Warehouse Pickup"
        subtitle={`Order: ${order.orderNumber} • ${order.warehouse?.name || 'Warehouse'}`}
        icon={<Warehouse className="w-5 h-5 text-emerald-500" />}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            confirmPickupMutation.mutate(confirmPickupForm);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Authorized Collector Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={confirmPickupForm.recipientName}
              onChange={(e) =>
                setConfirmPickupForm((prev) => ({ ...prev, recipientName: e.target.value }))
              }
              placeholder="e.g. Dawit Haile"
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-muted-foreground"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Collector Phone Number
              </label>
              <input
                type="tel"
                value={confirmPickupForm.recipientPhone}
                onChange={(e) =>
                  setConfirmPickupForm((prev) => ({ ...prev, recipientPhone: e.target.value }))
                }
                placeholder="e.g. +251 911 234567"
                className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Vehicle Plate Number
              </label>
              <input
                type="text"
                value={confirmPickupForm.vehiclePlateNumber}
                onChange={(e) =>
                  setConfirmPickupForm((prev) => ({ ...prev, vehiclePlateNumber: e.target.value }))
                }
                placeholder="e.g. 3-B12345 AA"
                className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Pickup Notes / Verification Remarks
            </label>
            <textarea
              rows={2}
              value={confirmPickupForm.notes}
              onChange={(e) =>
                setConfirmPickupForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="e.g. ID verified, goods inspected and loaded onto vehicle"
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsConfirmPickupModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={confirmPickupMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              {confirmPickupMutation.isPending ? 'Confirming...' : 'Confirm Handover & Complete'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 7: Customer Confirm Warehouse Pickup & Acceptance */}
      <Modal
        isOpen={isCustomerPickupModalOpen}
        onClose={() => setIsCustomerPickupModalOpen(false)}
        title="Confirm Warehouse Collection & Acceptance"
        subtitle={`Order: ${order.orderNumber} • ${order.warehouse?.name || 'Warehouse'}`}
        icon={<UserCheck className="w-5 h-5 text-violet-500" />}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            customerConfirmPickupMutation.mutate(customerPickupForm);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Receiving Authorized Person <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={customerPickupForm.recipientName}
              onChange={(e) =>
                setCustomerPickupForm((prev) => ({ ...prev, recipientName: e.target.value }))
              }
              placeholder="Your full name"
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <input
              type="checkbox"
              id="confirmedPickupReceived"
              checked={customerPickupForm.confirmedReceived}
              onChange={(e) =>
                setCustomerPickupForm((prev) => ({
                  ...prev,
                  confirmedReceived: e.target.checked,
                }))
              }
              className="mt-0.5 rounded border-border text-violet-600 focus:ring-violet-500 cursor-pointer"
            />
            <label htmlFor="confirmedPickupReceived" className="text-xs text-foreground cursor-pointer select-none leading-snug">
              <strong className="text-violet-500">Goods Verification:</strong> I confirm that all items for this order have been inspected and collected from the warehouse in good condition.
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Customer Feedback / Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={customerPickupForm.notes}
              onChange={(e) =>
                setCustomerPickupForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="e.g. Items verified and loaded onto our vehicle safely"
              className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCustomerPickupModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={customerConfirmPickupMutation.isPending}
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold"
            >
              {customerConfirmPickupMutation.isPending ? 'Confirming...' : 'Confirm Collection & Receipt'}
            </Button>
          </div>
        </form>
      </Modal>
      </div>
    </ErrorBoundary>
  );
}
