import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  TrendingUp,
  Package,
  ShoppingCart,
  Warehouse,
  MapPin,
  RefreshCw,
  Eye,
  Check,
  RotateCcw,
  Search,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { salesOrdersApi } from '../../sales-orders/salesOrdersApi';
import api from '../../../services/api';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';

const STATUS_CONFIG = {
  PENDING_REVIEW: {
    label: 'Pending Review',
    bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  SALES_REP_APPROVED: {
    label: 'Rep Approved',
    bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  ADJUSTMENT_REQUIRED: {
    label: 'Adjustment Req.',
    bg: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    dot: 'bg-orange-400',
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dot: 'bg-rose-400',
  },
  WAREHOUSE_PREPARATION_SCHEDULED: {
    label: 'Prep Scheduled',
    bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dot: 'bg-blue-400',
  },
  PREPARING: {
    label: 'Preparing',
    bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dot: 'bg-blue-400',
  },
  READY_FOR_DELIVERY: {
    label: 'Ready for Delivery',
    bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    dot: 'bg-cyan-400',
  },
  DELIVERY_SCHEDULED: {
    label: 'Delivery Sched.',
    bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    dot: 'bg-indigo-400',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    dot: 'bg-purple-400',
  },
  DELIVERED: {
    label: 'Delivered',
    bg: 'bg-emerald-600/15 text-emerald-300 border-emerald-600/30',
    dot: 'bg-emerald-400',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-600/20 text-emerald-200 border-emerald-500/40',
    dot: 'bg-emerald-300',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-rose-600/15 text-rose-300 border-rose-600/30',
    dot: 'bg-rose-500',
  },
};

export default function SalesRepDashboard() {
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);

  // Filter tab state
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Reason Modal state (for reject or adjustment request)
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: null, // 'REJECT' | 'ADJUSTMENT'
    orderId: null,
    orderNumber: '',
    reason: '',
  });

  const person = user?.person || {};
  const employee = person?.employee || {};
  const branch = employee?.branch || {};
  const managedWarehouse = employee?.managedWarehouses?.[0] || null;

  const salesRepName = person.firstName
    ? `${person.firstName} ${person.lastName || ''}`.trim()
    : user?.username || 'Sales Representative';

  // 1. Fetch assigned sales orders
  const {
    data: ordersRes,
    refetch: refetchOrders,
    isRefetching,
  } = useQuery({
    queryKey: ['salesOrders', 'rep-dashboard'],
    queryFn: async () => {
      try {
        const res = await salesOrdersApi.list({ limit: 100 });
        return res;
      } catch (err) {
        console.error('Error fetching sales orders:', err);
        return { data: [], meta: { total: 0 } };
      }
    },
    staleTime: 10000,
  });

  // 2. Fetch products / warehouse stock overview
  const { data: productsRes } = useQuery({
    queryKey: ['catalog', 'products', 'dashboard'],
    queryFn: async () => {
      try {
        const res = await api.get('/catalog/products', { params: { limit: 6, status: 'ACTIVE' } });
        return res?.data?.data || res?.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 60000,
  });

  const orders = Array.isArray(ordersRes)
    ? ordersRes
    : Array.isArray(ordersRes?.data)
    ? ordersRes.data
    : Array.isArray(ordersRes?.data?.data)
    ? ordersRes.data.data
    : [];
  const products = Array.isArray(productsRes) ? productsRes : [];

  // Mutations for order review
  const approveMutation = useMutation({
    mutationFn: (id) => salesOrdersApi.approve(id),
    onSuccess: () => {
      toast.success('Sales order approved successfully!');
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to approve order');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => salesOrdersApi.reject(id, reason),
    onSuccess: () => {
      toast.success('Sales order rejected');
      setActionModal({ isOpen: false, type: null, orderId: null, orderNumber: '', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reject order');
    },
  });

  const adjustmentMutation = useMutation({
    mutationFn: ({ id, reason }) => salesOrdersApi.requestAdjustment(id, reason),
    onSuccess: () => {
      toast.success('Adjustment requested from customer');
      setActionModal({ isOpen: false, type: null, orderId: null, orderNumber: '', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to request adjustment');
    },
  });

  // KPI Calculations
  const pendingOrders = orders.filter((o) => o.status === 'PENDING_REVIEW');
  const approvedOrders = orders.filter((o) =>
    ['SALES_REP_APPROVED', 'APPROVED', 'WAREHOUSE_PREPARATION_SCHEDULED', 'PREPARING', 'READY_FOR_DELIVERY', 'DELIVERY_SCHEDULED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(o.status)
  );
  const deliveredOrders = orders.filter((o) => ['DELIVERED', 'COMPLETED'].includes(o.status));
  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED' && o.status !== 'REJECTED')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // Tab Filtering
  const filteredOrders = orders.filter((order) => {
    // Tab condition
    if (activeTab === 'PENDING' && order.status !== 'PENDING_REVIEW') return false;
    if (activeTab === 'APPROVED' && !['SALES_REP_APPROVED', 'APPROVED'].includes(order.status)) return false;
    if (activeTab === 'DELIVERY' && !['DELIVERY_SCHEDULED', 'OUT_FOR_DELIVERY', 'READY_FOR_DELIVERY', 'PREPARING'].includes(order.status)) return false;
    if (activeTab === 'COMPLETED' && !['DELIVERED', 'COMPLETED'].includes(order.status)) return false;

    // Search condition
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const orderNum = (order.orderNumber || '').toLowerCase();
      const customerName = (
        order.customer?.person
          ? `${order.customer.person.firstName} ${order.customer.person.lastName}`
          : order.customer?.organization?.name || ''
      ).toLowerCase();
      return orderNum.includes(term) || customerName.includes(term);
    }
    return true;
  });

  const handleOpenRejectModal = (order) => {
    setActionModal({
      isOpen: true,
      type: 'REJECT',
      orderId: order.id,
      orderNumber: order.orderNumber,
      reason: '',
    });
  };

  const handleOpenAdjustmentModal = (order) => {
    setActionModal({
      isOpen: true,
      type: 'ADJUSTMENT',
      orderId: order.id,
      orderNumber: order.orderNumber,
      reason: '',
    });
  };

  const handleConfirmActionModal = () => {
    if (!actionModal.reason.trim()) {
      toast.error('Please enter a note or reason');
      return;
    }
    if (actionModal.type === 'REJECT') {
      rejectMutation.mutate({ id: actionModal.orderId, reason: actionModal.reason });
    } else if (actionModal.type === 'ADJUSTMENT') {
      adjustmentMutation.mutate({ id: actionModal.orderId, reason: actionModal.reason });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── 1. Hero Welcome & Facility Banner ──────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-xl p-6 sm:p-8">
        {/* Subtle luminous ambient accents */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gradient-to-bl from-indigo-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-gradient-to-tr from-violet-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Sales Representative
              </span>
              {employee.employeeCode && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
                  ID: {employee.employeeCode}
                </span>
              )}
              {employee.commissionRate && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  <TrendingUp className="w-3 h-3 text-indigo-500" />
                  {Number(employee.commissionRate)}% Commission
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Welcome back, <span className="bg-gradient-to-r from-indigo-500 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">{salesRepName}</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Manage orders, customer relationships, and warehouse dispatch for your sales territory.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm pt-1">
              {managedWarehouse && (
                <div className="flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-xl bg-muted/50 border border-border text-foreground">
                  <Warehouse className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>
                    Warehouse:{' '}
                    <strong className="font-bold text-foreground">
                      {managedWarehouse.name}
                    </strong>
                    {managedWarehouse.code && (
                      <span className="text-muted-foreground font-mono text-xs ml-1">({managedWarehouse.code})</span>
                    )}
                  </span>
                </div>
              )}

              {branch?.name && (
                <div className="flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-xl bg-muted/50 border border-border text-foreground">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    Branch:{' '}
                    <strong className="font-bold text-foreground">
                      {branch.name}
                    </strong>
                  </span>
                </div>
              )}

              {employee?.salesTerritory && (
                <div className="flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-xl bg-muted/50 border border-border text-foreground">
                  <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>
                    Territory:{' '}
                    <strong className="font-bold text-foreground">
                      {employee.salesTerritory}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetchOrders()}
              className="flex items-center gap-2 text-xs font-semibold shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
            <Link to="/sales-orders/new">
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-2 text-xs font-bold shadow-lg shadow-indigo-500/20 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
              >
                <ShoppingCart className="w-4 h-4" />
                + Create Order
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. KPI Metrics Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Pending Review Card (High Priority) */}
        <div
          className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 ${
            pendingOrders.length > 0
              ? 'bg-gradient-to-br from-amber-500/10 via-card to-card border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
              : 'bg-card border-border shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Needs Review
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                pendingOrders.length > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-muted text-muted-foreground'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">
              {pendingOrders.length}
            </span>
            {pendingOrders.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                Action Required
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Orders waiting for your approval
          </p>
        </div>

        {/* Approved Orders Card */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Approved Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">
              {approvedOrders.length}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">Active</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Processed & ready for fulfillment
          </p>
        </div>

        {/* Total Assigned Orders */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Assigned Pipeline
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-foreground">
              {orders.length}
            </span>
            <span className="text-xs text-muted-foreground">Total Orders</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            All orders in your territory
          </p>
        </div>

        {/* Total Assigned Revenue */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Sales Volume
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xs font-bold text-muted-foreground">ETB</span>
            <span className="text-2xl sm:text-3xl font-black text-foreground truncate">
              {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Gross pipeline amount
          </p>
        </div>
      </div>

      {/* ── 3. Action Center: Orders Awaiting Review Queue ───────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Approval Action Center
                {pendingOrders.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-slate-950">
                    {pendingOrders.length}
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                Review and approve orders placed for your warehouse territory
              </p>
            </div>
          </div>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              All Caught Up!
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              There are currently no sales orders pending your review. New orders submitted by customers will appear here immediately.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingOrders.map((order) => {
              const customerName = order.customer?.person
                ? `${order.customer.person.firstName} ${order.customer.person.lastName}`
                : order.customer?.organization?.name || 'Customer';
              const customerContact = order.customer?.person?.email || order.customer?.organization?.phone || '';
              const itemsCount = order.items?.length || 0;
              const totalAmount = Number(order.total || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });

              return (
                <div
                  key={order.id}
                  className="bg-card border border-amber-500/30 rounded-2xl p-5 shadow-md hover:border-amber-500/50 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                        {order.orderNumber}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        Pending Review
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {order.createdAt ? format(new Date(order.createdAt), 'MMM d, yyyy h:mm a') : ''}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs font-medium">Customer: </span>
                        <strong className="text-foreground font-semibold">{customerName}</strong>
                        {customerContact && (
                          <span className="text-xs text-muted-foreground ml-1">({customerContact})</span>
                        )}
                      </div>
                      <span className="text-muted-foreground/40 hidden sm:inline">•</span>
                      <div>
                        <span className="text-muted-foreground text-xs font-medium">Items: </span>
                        <span className="font-semibold text-foreground">{itemsCount} item{itemsCount !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="text-muted-foreground/40 hidden sm:inline">•</span>
                      <div>
                        <span className="text-muted-foreground text-xs font-medium">Total: </span>
                        <strong className="text-base font-extrabold text-indigo-400">
                          ETB {totalAmount}
                        </strong>
                      </div>
                    </div>

                    {order.deliveryAddressText && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground/70" />
                        Delivery: {order.deliveryAddressText}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-border">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => approveMutation.mutate(order.id)}
                      disabled={approveMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve Order
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenAdjustmentModal(order)}
                      className="text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 font-semibold text-xs flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Request Adjustment
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenRejectModal(order)}
                      className="text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 font-semibold text-xs flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                    <Link to={`/sales-orders/${order.id}`}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs font-semibold flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. All Assigned Orders Tracker with Filter Tabs ─────────── */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Assigned Orders Directory
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track lifecycle and status of all orders under your account
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search order # or customer..."
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-56 sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3 text-xs">
          {[
            { id: 'ALL', label: 'All Orders', count: orders.length },
            { id: 'PENDING', label: 'Pending Review', count: pendingOrders.length },
            { id: 'APPROVED', label: 'Approved', count: approvedOrders.length },
            { id: 'DELIVERY', label: 'In Fulfillment', count: orders.filter((o) => ['DELIVERY_SCHEDULED', 'OUT_FOR_DELIVERY', 'READY_FOR_DELIVERY', 'PREPARING'].includes(o.status)).length },
            { id: 'COMPLETED', label: 'Completed', count: deliveredOrders.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === tab.id ? 'bg-black/20 text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No orders found for the selected filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border uppercase tracking-wider text-[11px] text-muted-foreground bg-muted/20">
                <tr>
                  <th className="px-4 py-3 font-bold">Order #</th>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Date</th>
                  <th className="px-4 py-3 font-bold text-right">Items</th>
                  <th className="px-4 py-3 font-bold text-right">Amount</th>
                  <th className="px-4 py-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order) => {
                  const statusInfo = STATUS_CONFIG[order.status] || {
                    label: order.status,
                    bg: 'bg-muted text-muted-foreground border-border',
                    dot: 'bg-muted-foreground',
                  };
                  const customerName = order.customer?.person
                    ? `${order.customer.person.firstName} ${order.customer.person.lastName}`
                    : order.customer?.organization?.name || 'Customer';

                  return (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-foreground">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        {customerName}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {order.createdAt ? format(new Date(order.createdAt), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-foreground">
                        {order.items?.length || 0}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-foreground">
                        ETB {Number(order.total || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link to={`/sales-orders/${order.id}`}>
                          <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── 5. Warehouse Inventory Glance ───────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Territory Warehouse Stock Snapshot
              </h2>
              <p className="text-xs text-muted-foreground">
                {managedWarehouse?.name ? `Quick stock availability at ${managedWarehouse.name}` : 'Quick stock availability across warehouses'}
              </p>
            </div>
          </div>
          <Link to="/sales-orders/new">
            <Button variant="secondary" size="sm" className="text-xs font-semibold">
              Browse Full Catalog
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.slice(0, 6).map((prod) => (
            <div
              key={prod.id}
              className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between gap-3"
            >
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-foreground truncate">{prod.name}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{prod.sku}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-xs font-extrabold text-emerald-400">
                  ETB {Number(prod.sellingPrice || 0).toFixed(2)}
                </span>
                <p className="text-[10px] text-muted-foreground">In Stock</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. Reject / Adjustment Reason Modal ──────────────────────── */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, type: null, orderId: null, orderNumber: '', reason: '' })}
        title={actionModal.type === 'REJECT' ? 'Reject Sales Order' : 'Request Order Adjustment'}
        subtitle={`Order: ${actionModal.orderNumber}`}
        icon={
          actionModal.type === 'REJECT' ? (
            <XCircle className="w-5 h-5 text-rose-400" />
          ) : (
            <RotateCcw className="w-5 h-5 text-amber-400" />
          )
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {actionModal.type === 'REJECT'
              ? 'Please provide a reason for rejecting this sales order. The customer will be informed.'
              : 'Please describe the adjustments required (e.g., quantity revision, warehouse stock shortage, delivery address clarification).'}
          </p>

          <textarea
            rows={3}
            value={actionModal.reason}
            onChange={(e) => setActionModal((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Type your notes or reasons here..."
            className="w-full p-3 rounded-xl border border-border bg-muted/40 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActionModal({ isOpen: false, type: null, orderId: null, orderNumber: '', reason: '' })}
            >
              Cancel
            </Button>
            <Button
              variant={actionModal.type === 'REJECT' ? 'danger' : 'primary'}
              size="sm"
              onClick={handleConfirmActionModal}
              disabled={rejectMutation.isPending || adjustmentMutation.isPending}
            >
              {actionModal.type === 'REJECT' ? 'Confirm Rejection' : 'Send Adjustment Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
