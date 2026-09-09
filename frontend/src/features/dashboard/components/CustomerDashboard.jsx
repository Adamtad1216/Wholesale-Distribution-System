import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  CreditCard,
  Plus,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Truck,
  ShieldCheck,
  FileText,
  AlertCircle,
  PackageCheck,
  RefreshCw,
  X,
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { salesOrdersApi } from '../../sales-orders/salesOrdersApi';

function getStatusBadge(status, order) {
  const delivery = order?.deliveries?.[0];

  if (status === 'COMPLETED') {
    return {
      label: 'Completed (Dual-Confirmed)',
      className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
      dot: 'bg-emerald-400',
    };
  }

  if (status === 'DELIVERED' || status === 'OUT_FOR_DELIVERY') {
    if (delivery?.driverConfirmedAt && !delivery?.customerConfirmedAt) {
      return {
        label: 'Driver Confirmed — Needs Your Approval',
        className: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
        dot: 'bg-amber-400 animate-pulse',
      };
    }
    if (delivery?.customerConfirmedAt && !delivery?.driverConfirmedAt) {
      return {
        label: 'Receipt Confirmed — Awaiting Driver',
        className: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
        dot: 'bg-blue-400',
      };
    }
    return {
      label: 'Out for Delivery / In Handover',
      className: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
      dot: 'bg-indigo-400',
    };
  }

  switch (status) {
    case 'APPROVED':
    case 'SALES_REP_APPROVED':
      return {
        label: 'Approved • Invoice Ready',
        className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        dot: 'bg-emerald-400 animate-pulse',
      };
    case 'AWAITING_PAYMENT':
      return {
        label: 'Approved • Payment Due',
        className: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
        dot: 'bg-amber-400 animate-pulse',
      };
    case 'PENDING_REVIEW':
    case 'UNDER_REVIEW':
    case 'SUBMITTED':
      return {
        label: 'Pending Review',
        className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        dot: 'bg-amber-400 animate-pulse',
      };
    case 'ADJUSTMENT_REQUIRED':
    case 'ADJUSTMENT_REQUESTED':
      return {
        label: 'Adjustment Needed',
        className: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
        dot: 'bg-purple-400',
      };
    case 'REJECTED':
      return {
        label: 'Rejected',
        className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
        dot: 'bg-rose-400',
      };
    case 'WAREHOUSE_PREPARATION_SCHEDULED':
    case 'PREPARING':
      return {
        label: 'In Preparation',
        className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
        dot: 'bg-blue-400',
      };
    case 'READY_FOR_DELIVERY':
    case 'DELIVERY_SCHEDULED':
      return {
        label: 'Delivery Scheduled',
        className: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
        dot: 'bg-indigo-400',
      };
    default:
      return {
        label: status?.replace(/_/g, ' ') || 'Draft',
        className: 'bg-secondary text-muted-foreground border border-border',
        dot: 'bg-muted-foreground',
      };
  }
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user, customer } = useSelector((state) => state.auth);

  // Determine Customer Display Name
  const customerName =
    customer?.organization?.name ||
    (user?.person?.firstName ? `${user.person.firstName} ${user.person.lastName || ''}`.trim() : null) ||
    customer?.name ||
    user?.username ||
    'Valued Customer';

  const customerCode = customer?.customerCode || 'CUST-PORTAL';
  const creditLimit = Number(customer?.creditLimit || 0);
  const paymentTermsName = customer?.paymentTerms?.name || 'Cash on Delivery (COD)';

  // Dismissed dashboard banners state (persisted per session so clicked banners are removed)
  const [dismissedBanners, setDismissedBanners] = useState(() => {
    try {
      const saved = sessionStorage.getItem('dismissed_customer_dashboard_banners');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const dismissBanner = (key) => {
    setDismissedBanners((prev) => {
      const next = { ...prev, [key]: true };
      try {
        sessionStorage.setItem('dismissed_customer_dashboard_banners', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Query Customer Orders
  const {
    data: ordersRes,
    isLoading: ordersLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['customer', 'orders'],
    queryFn: () => salesOrdersApi.list({ limit: 10 }),
    staleTime: 10000,
  });

  const orders = Array.isArray(ordersRes)
    ? ordersRes
    : Array.isArray(ordersRes?.data)
    ? ordersRes.data
    : Array.isArray(ordersRes?.data?.data)
    ? ordersRes.data.data
    : Array.isArray(ordersRes?.items)
    ? ordersRes.items
    : [];

  // Compute summary stats
  const activeOrdersCount = orders.filter((o) =>
    [
      'PENDING_REVIEW',
      'UNDER_REVIEW',
      'SUBMITTED',
      'SALES_REP_APPROVED',
      'APPROVED',
      'WAREHOUSE_PREPARATION_SCHEDULED',
      'PREPARING',
      'READY_FOR_DELIVERY',
      'DELIVERY_SCHEDULED',
      'OUT_FOR_DELIVERY',
      'ADJUSTMENT_REQUIRED',
    ].includes(o.status)
  ).length;

  const completedOrdersCount = orders.filter((o) =>
    ['COMPLETED', 'DELIVERED'].includes(o.status)
  ).length;

  const totalSpent = orders
    .filter((o) => !['REJECTED', 'CANCELLED'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total || o.grandTotal || o.totalAmount || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* ============================================================
          1. HERO BANNER — THEME ADAPTIVE & HIGH CONTRAST
          ============================================================ */}
      <div className="relative rounded-3xl border border-border bg-card shadow-sm p-6 sm:p-8 overflow-hidden transition-all duration-200">
        {/* Ambient subtle glow gradients */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                B2B Customer Portal
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-secondary text-foreground border border-border">
                {customerCode}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Account
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                {customerName}
              </span>
            </h1>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Track your commercial wholesale orders, view approved delivery dispatches, check your credit limit, and place instant purchase orders with guaranteed priority fulfillment.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-violet-400" />
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                Terms: <span className="text-foreground font-semibold">{paymentTermsName}</span>
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch lg:items-center gap-3 shrink-0">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="px-3.5 py-3 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-violet-400 ${isRefetching ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => navigate('/sales-orders/new')}
              className="px-4 py-3 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
            >
              <ShoppingBag className="w-4 h-4 text-violet-400" />
              <span>Browse Catalog</span>
            </button>

            <button
              onClick={() => navigate('/sales-orders/new')}
              className="px-5 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Sales Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          2. FINANCIAL & OPERATIONAL STATS CARDS
          ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Credit Limit */}
        <Card noPadding className="p-5 border border-border bg-card shadow-sm rounded-2xl relative overflow-hidden group hover:border-violet-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Authorized Credit Limit</span>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {creditLimit > 0 ? `${creditLimit.toLocaleString()} ETB` : 'Prepaid / COD'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {creditLimit > 0 ? 'Verified commercial line of credit' : 'Standard immediate settlement'}
            </p>
          </div>
        </Card>

        {/* Card 2: In-Flight Orders */}
        <Card noPadding className="p-5 border border-border bg-card shadow-sm rounded-2xl relative overflow-hidden group hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active In-Flight Orders</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {activeOrdersCount}
            </div>
            <p className="text-xs text-indigo-400 mt-1 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Under sales rep review or dispatch
            </p>
          </div>
        </Card>

        {/* Card 3: Delivered Orders */}
        <Card noPadding className="p-5 border border-border bg-card shadow-sm rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fulfilled Deliveries</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {completedOrdersCount}
            </div>
            <p className="text-xs text-emerald-400 mt-1 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Successfully received & settled
            </p>
          </div>
        </Card>

        {/* Card 4: Total Purchases */}
        <Card noPadding className="p-5 border border-border bg-card shadow-sm rounded-2xl relative overflow-hidden group hover:border-cyan-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Volume (ETB)</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Confirmed order settlements
            </p>
          </div>
        </Card>
      </div>

      {/* ============================================================
          3. HOW THE B2B ORDER LIFECYCLE WORKS (STEPPER)
          ============================================================ */}
      <Card noPadding className="p-6 border border-border bg-card shadow-sm rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4 mb-5">
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-violet-400" />
              Wholesale Order & Delivery Lifecycle
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Transparent, automated progression from order submission to warehouse delivery
            </p>
          </div>
          <Link
            to="/sales-orders/new"
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 inline-flex items-center gap-1 transition"
          >
            <span>Create New Order</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-background border border-border relative">
            <span className="text-[10px] font-mono font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
              STEP 01
            </span>
            <h4 className="font-semibold text-foreground text-sm mt-2">Place Order</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Browse products, select delivery address and submit your commercial quotation request.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border relative">
            <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              STEP 02
            </span>
            <h4 className="font-semibold text-foreground text-sm mt-2">Sales Rep Review</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Your assigned sales representative reviews stock availability, prices, and approves your order.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border relative">
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              STEP 03
            </span>
            <h4 className="font-semibold text-foreground text-sm mt-2">Warehouse Prep</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Central warehouse picks, packs, and allocates stock for dispatch with shipping manifest.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border relative">
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              STEP 04
            </span>
            <h4 className="font-semibold text-foreground text-sm mt-2">Delivery & Invoice</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Goods delivered to your address with official invoice generated under your credit terms.
            </p>
          </div>
        </div>
      </Card>

      {/* ============================================================
          4. RECENT ORDERS TABLE
          ============================================================ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-400" />
              My Commercial Orders
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time review and tracking of your recent purchase requests
            </p>
          </div>

          <button
            onClick={() => navigate('/sales-orders/new')}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded-xl text-foreground font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-violet-400" />
            <span>New Order</span>
          </button>
        </div>

        {/* Action Alert Banner for Approved Orders & Unpaid Invoices */}
        {!dismissedBanners.invoiceReady && orders.some((o) => ['SALES_REP_APPROVED', 'AWAITING_PAYMENT'].includes(o.status)) && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm relative group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Sales Order Approved • Invoice Ready for Payment
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Action Required
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your sales representative approved your order request! The commercial invoice has been issued. Please review invoice details and settle payment to initiate warehouse preparation and dispatch.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/invoices"
                onClick={() => dismissBanner('invoiceReady')}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer inline-flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Review Invoice & Pay</span>
              </Link>
              <button
                type="button"
                onClick={() => dismissBanner('invoiceReady')}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-emerald-500/20 transition cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Action Alert Banner for Handover Confirmation */}
        {!dismissedBanners.handover && orders.some(
          (o) =>
            ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status) &&
            !o.deliveries?.[0]?.customerConfirmedAt
        ) && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm relative group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Delivery Handover Awaiting Your Confirmation
                </h4>
                <p className="text-xs text-muted-foreground">
                  Your delivery has arrived or is en route. Please confirm receipt of your order items to finalize and complete the sales order.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  dismissBanner('handover');
                  const target = orders.find(
                    (o) =>
                      ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status) &&
                      !o.deliveries?.[0]?.customerConfirmedAt
                  );
                  if (target) navigate(`/sales-orders/${target.id}`);
                }}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Order Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => dismissBanner('handover')}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-amber-500/20 transition cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {ordersLoading ? (
          <Card className="p-12 text-center text-muted-foreground text-sm rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Fetching your orders...</span>
            </div>
          </Card>
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground text-sm rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">No purchase orders found</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                You haven't submitted any wholesale purchase orders yet. Start by browsing our inventory catalog and placing your first order.
              </p>
            </div>
            <button
              onClick={() => navigate('/sales-orders/new')}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-xs rounded-xl shadow-md inline-flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Order</span>
            </button>
          </Card>
        ) : (
          <Table containerClassName="rounded-2xl border border-border bg-card shadow-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const badge = getStatusBadge(order.status, order);
                const orderTotal = Number(order.total || order.grandTotal || order.totalAmount || 0);
                const itemCount = order.items?.length || order.orderItems?.length || '-';
                const dateVal = order.orderDate || order.createdAt;
                const orderDate = dateVal ? format(new Date(dateVal), 'MMM dd, yyyy') : '-';

                const needsCustomerConfirmation =
                  ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) &&
                  !order.deliveries?.[0]?.customerConfirmedAt;

                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-mono font-bold text-foreground text-xs flex items-center gap-2">
                        <span>{order.orderNumber || order.orderCode || `SO-${order.id.slice(0, 8).toUpperCase()}`}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-muted-foreground">{orderDate}</span>
                    </TableCell>

                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${badge.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-medium text-foreground">
                        {itemCount} {typeof itemCount === 'number' ? (itemCount === 1 ? 'item' : 'items') : ''}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm font-bold text-foreground">
                        {orderTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      {needsCustomerConfirmation ? (
                        <button
                          onClick={() => navigate(`/sales-orders/${order.id}`)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs inline-flex items-center gap-1.5 rounded-xl shadow-md transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Handover</span>
                        </button>
                      ) : ['SALES_REP_APPROVED', 'AWAITING_PAYMENT'].includes(order.status) ? (
                        <button
                          onClick={() => navigate('/invoices')}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs inline-flex items-center gap-1.5 rounded-xl shadow-md transition cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay Invoice</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/sales-orders/${order.id}`)}
                          className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border rounded-xl text-foreground font-semibold text-xs inline-flex items-center gap-1 transition shadow-sm cursor-pointer"
                        >
                          <span>View Details</span>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
