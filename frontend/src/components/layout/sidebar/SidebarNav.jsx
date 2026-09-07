import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MapPin, Zap, ArrowRight, Building2, Boxes, Truck, CheckCircle2, CreditCard, FileText, X } from 'lucide-react';
import SidebarNavItem from './SidebarNavItem';
import {
  navigationSections,
  customerNavigationSections,
  salesRepNavigationSections,
  warehouseManagerNavigationSections,
  storeKeeperNavigationSections,
  driverNavigationSections,
} from './navigationData';
import { salesOrdersApi } from '../../../features/sales-orders/salesOrdersApi';
import api from '../../../services/api';

export default function SidebarNav({ onClose }) {
  const { user, permissions = [], role, customer } = useSelector((state) => state.auth);

  const isCustomer = role === 'CUSTOMER';
  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const isSalesRep = role === 'SALES_REPRESENTATIVE' || role === 'SALES_REP';
  const isWhManager = role === 'WAREHOUSE_MANAGER' || role === 'WH_MANAGER';
  const isStoreKeeper = role === 'STORE_KEEPER' || role === 'STOREKEEPER';
  const isDriver = role === 'DRIVER';

  const hasWildcard =
    isSuperAdmin ||
    permissions.includes('*') ||
    permissions.includes('all') ||
    permissions.includes('system:all');

  // Sales rep pending orders
  const { data: pendingOrdersRes } = useQuery({
    queryKey: ['salesOrders', 'pendingCount'],
    queryFn: async () => {
      try {
        const res = await salesOrdersApi.list({ status: 'PENDING_REVIEW', limit: 20 });
        return res;
      } catch {
        return null;
      }
    },
    enabled: isSalesRep || isSuperAdmin,
    refetchInterval: 15000,
  });

  // Warehouse manager approved orders waiting for prep scheduling
  const { data: approvedOrdersRes } = useQuery({
    queryKey: ['salesOrders', 'approvedWarehouseCount'],
    queryFn: async () => {
      try {
        const res = await salesOrdersApi.getApprovedWarehouseOrders({ limit: 50 });
        return res;
      } catch {
        return null;
      }
    },
    enabled: isWhManager || isSuperAdmin,
    refetchInterval: 15000,
  });

  // Storekeeper tasks
  const { data: storekeeperTasksRes } = useQuery({
    queryKey: ['storekeeperTasks', 'count'],
    queryFn: async () => {
      try {
        const res = await salesOrdersApi.getStorekeeperTasks({ limit: 50 });
        return res;
      } catch {
        return null;
      }
    },
    enabled: isStoreKeeper || isSuperAdmin,
    refetchInterval: 15000,
  });

  // Driver deliveries
  const { data: driverDeliveriesRes } = useQuery({
    queryKey: ['driverDeliveries', 'count'],
    queryFn: async () => {
      try {
        const res = await salesOrdersApi.getDriverDeliveries({ limit: 50 });
        return res;
      } catch {
        return null;
      }
    },
    enabled: isDriver || isSuperAdmin,
    refetchInterval: 15000,
  });

  // Customer unpaid/issued invoices (waiting for customer payment)
  const { data: customerInvoicesRes } = useQuery({
    queryKey: ['customer', 'sidebarInvoices'],
    queryFn: async () => {
      try {
        const res = await api.get('/invoices', { params: { status: 'ISSUED' } });
        const list = res?.data?.data || res?.data || [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
    enabled: isCustomer,
    refetchInterval: 15000,
  });

  // Customer sales orders to detect status changes (approved by sales rep / awaiting payment)
  const { data: customerOrdersRes } = useQuery({
    queryKey: ['customer', 'sidebarOrders'],
    queryFn: async () => {
      try {
        const res = await salesOrdersApi.list({ limit: 50 });
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];
        return list;
      } catch {
        return [];
      }
    },
    enabled: isCustomer,
    refetchInterval: 15000,
  });

  const pendingList = Array.isArray(pendingOrdersRes?.data)
    ? pendingOrdersRes.data
    : Array.isArray(pendingOrdersRes?.data?.data)
    ? pendingOrdersRes.data.data
    : [];
  const pendingCount =
    pendingOrdersRes?.meta?.total ??
    pendingOrdersRes?.data?.meta?.total ??
    pendingList.length;

  const approvedList = Array.isArray(approvedOrdersRes?.data)
    ? approvedOrdersRes.data
    : Array.isArray(approvedOrdersRes?.data?.data)
    ? approvedOrdersRes.data.data
    : [];
  const approvedCount =
    approvedOrdersRes?.meta?.total ??
    approvedOrdersRes?.data?.meta?.total ??
    approvedList.length;

  const skTasks = Array.isArray(storekeeperTasksRes?.data)
    ? storekeeperTasksRes.data
    : Array.isArray(storekeeperTasksRes?.data?.data)
    ? storekeeperTasksRes.data.data
    : [];
  const pendingSkTasks = skTasks.filter(
    (t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS' || t.status === 'PENDING'
  );
  const pendingSkTasksCount = pendingSkTasks.length || (storekeeperTasksRes?.meta?.total ?? storekeeperTasksRes?.data?.meta?.total ?? skTasks.length);

  const drvDeliveries = Array.isArray(driverDeliveriesRes?.data)
    ? driverDeliveriesRes.data
    : Array.isArray(driverDeliveriesRes?.data?.data)
    ? driverDeliveriesRes.data.data
    : [];
  const pendingDrvDeliveries = drvDeliveries.filter(
    (d) => d.status === 'SCHEDULED' || d.status === 'IN_TRANSIT' || d.status === 'OUT_FOR_DELIVERY'
  );
  const pendingDrvDeliveriesCount = pendingDrvDeliveries.length || (driverDeliveriesRes?.meta?.total ?? driverDeliveriesRes?.data?.meta?.total ?? drvDeliveries.length);

  // Customer pending payment count
  const customerInvoices = Array.isArray(customerInvoicesRes) ? customerInvoicesRes : [];
  const customerOrders = Array.isArray(customerOrdersRes) ? customerOrdersRes : [];
  const customerApprovedOrders = customerOrders.filter((o) =>
    ['SALES_REP_APPROVED', 'AWAITING_PAYMENT'].includes(o.status)
  );
  const customerIssuedInvoices = customerInvoices.filter(
    (i) => i.status === 'ISSUED' || (i.status !== 'PAID' && i.status !== 'CANCELLED' && Number(i.balance) > 0)
  );
  const customerPaymentDueCount = Math.max(
    customerIssuedInvoices.length,
    customerApprovedOrders.length
  );

  // Task signatures based on current task item IDs:
  // When a NEW task arrives, its signature changes and automatically triggers the notification.
  // When the user clicks the notification, it marks this specific signature as dismissed.
  const pendingSignature = pendingCount > 0
    ? (pendingList.map((o) => o.id || o.orderNumber).filter(Boolean).sort().join(',') || `count_${pendingCount}`)
    : '';

  const approvedSignature = approvedCount > 0
    ? (approvedList.map((o) => o.id || o.orderNumber).filter(Boolean).sort().join(',') || `count_${approvedCount}`)
    : '';

  const skSignature = pendingSkTasksCount > 0
    ? (pendingSkTasks.map((t) => t.id).filter(Boolean).sort().join(',') || `count_${pendingSkTasksCount}`)
    : '';

  const drvSignature = pendingDrvDeliveriesCount > 0
    ? (pendingDrvDeliveries.map((d) => d.id).filter(Boolean).sort().join(',') || `count_${pendingDrvDeliveriesCount}`)
    : '';

  const customerSignature = customerPaymentDueCount > 0
    ? [
        ...customerApprovedOrders.map((o) => o.id),
        ...customerIssuedInvoices.map((i) => i.id),
      ].filter(Boolean).sort().join(',') || `count_${customerPaymentDueCount}`
    : '';

  // Dismissed notifications state (persisted per session; keyed by task signature so new tasks always notify, and clicking them dismisses them)
  const [dismissedMap, setDismissedMap] = useState(() => {
    try {
      const stored = sessionStorage.getItem('dismissed_sidebar_notifications');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const dismissNotification = (key, signature) => {
    if (!key) return;
    setDismissedMap((prev) => {
      const updated = { ...prev, [key]: signature || true };
      try {
        sessionStorage.setItem('dismissed_sidebar_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const isDismissed = (key, signature) => {
    if (!dismissedMap || !key || !signature) return false;
    const stored = dismissedMap[key];
    if (!stored) return false;
    return stored === signature;
  };

  const handleItemClick = (item) => {
    if (item.href === '/sales-orders' || item.href?.startsWith('/sales-orders')) {
      if (isSalesRep) dismissNotification('sales_rep', pendingSignature);
      if (isWhManager) dismissNotification('warehouse_manager', approvedSignature);
      if (isCustomer) dismissNotification('customer', customerSignature);
    } else if (item.href === '/dashboard') {
      if (isSalesRep) dismissNotification('sales_rep', pendingSignature);
      if (isWhManager) dismissNotification('warehouse_manager', approvedSignature);
      if (isStoreKeeper) dismissNotification('storekeeper', skSignature);
      if (isDriver) dismissNotification('driver', drvSignature);
      if (isCustomer) dismissNotification('customer', customerSignature);
    } else if (item.href === '/invoices') {
      if (isCustomer) dismissNotification('customer', customerSignature);
    } else if (item.href === '/deliveries') {
      if (isDriver) dismissNotification('driver', drvSignature);
    }
    if (onClose) onClose();
  };

  const sectionsToRender = isCustomer
    ? customerNavigationSections
    : isSalesRep
    ? salesRepNavigationSections
    : isWhManager
    ? warehouseManagerNavigationSections
    : isStoreKeeper
    ? storeKeeperNavigationSections
    : isDriver
    ? driverNavigationSections
    : navigationSections;

  const employee = user?.person?.employee || {};
  const territory = employee?.salesTerritory;
  const warehouse = employee?.managedWarehouses?.[0];
  const warehouseName = warehouse?.name || (isWhManager ? 'Central Warehouse' : null);
  const branchName = employee?.branch?.name;

  const customerDisplayName =
    customer?.organization?.name ||
    customer?.name ||
    (user?.person?.firstName ? `${user.person.firstName} ${user.person.lastName || ''}`.trim() : null) ||
    'Wholesale Buyer';
  const customerDisplayCode = customer?.customerCode || 'CUST-PORTAL';

  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin space-y-5">
      {/* 0. Customer Wholesale Account Pill */}
      {isCustomer && (
        <div className="mx-1 mb-3 p-3 rounded-2xl sidebar-widget-card shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              B2B Client Active
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
              {customerDisplayCode}
            </span>
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-[11px] font-bold text-foreground truncate leading-tight">
                {customerDisplayName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                Direct Commercial Account
              </p>
            </div>
          </div>
        </div>
      )}
      {/* 1. Sales Rep Operational Territory Pill */}
      {isSalesRep && (territory || warehouseName) && (
        <div className="mx-1 mb-3 p-3 rounded-2xl sidebar-widget-card shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Field Active
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
              REP-PORTAL
            </span>
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="overflow-hidden min-w-0">
              {territory && (
                <p className="text-[11px] font-bold text-foreground truncate leading-tight">
                  {territory}
                </p>
              )}
              {warehouseName && (
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {warehouseName.replace(' Warehouse', '')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Warehouse Manager Operational Hub Pill */}
      {isWhManager && warehouseName && (
        <div className="mx-1 mb-3 p-3 rounded-2xl sidebar-widget-card shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
              Fulfillment Bay
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/30">
              WHM-PORTAL
            </span>
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-[11px] font-bold text-foreground truncate leading-tight">
                {warehouseName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                Central Logistics Hub
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Storekeeper Operational Station Pill */}
      {isStoreKeeper && (
        <div className="mx-1 mb-3 p-3 rounded-2xl sidebar-widget-card shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Dock Active
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30">
              STORE-BAY
            </span>
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Boxes className="w-3.5 h-3.5" />
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-[11px] font-bold text-foreground truncate leading-tight">
                Picking & Staging Dock
              </p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                Central Warehouse
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Driver Fleet Transit Pill */}
      {isDriver && (
        <div className="mx-1 mb-3 p-3 rounded-2xl sidebar-widget-card shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              Fleet Transit
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 font-bold border border-purple-500/30">
              DRIVER-PORTAL
            </span>
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
              <Truck className="w-3.5 h-3.5" />
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-[11px] font-bold text-foreground truncate leading-tight">
                Active Logistics Fleet
              </p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                Route Dispatch Unit
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Urgent Pending Action Notification Card for Sales Rep */}
      {(isSalesRep || (isSuperAdmin && pendingCount > 0)) && pendingCount > 0 && !isDismissed('sales_rep', pendingSignature) && (
        <div className="mx-1 mb-3 p-3 rounded-2xl sidebar-alert-card shadow-sm border border-amber-500/30 bg-amber-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-amber-500/20 text-amber-400" />
              Action Required
            </span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] border border-amber-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                {pendingCount} Pending
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification('sales_rep', pendingSignature);
                }}
                className="p-1 rounded-md text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
                title="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
            Customer orders waiting for stock confirmation.
          </p>
          <Link
            to="/sales-orders"
            onClick={() => {
              dismissNotification('sales_rep', pendingSignature);
              if (onClose) onClose();
            }}
            className="mt-2.5 inline-flex items-center justify-center w-full py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] transition shadow-sm gap-1 cursor-pointer"
          >
            Review Orders
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Urgent Action Notification Card for Warehouse Manager */}
      {(isWhManager || (isSuperAdmin && approvedCount > 0 && pendingCount === 0)) && approvedCount > 0 && !isDismissed('warehouse_manager', approvedSignature) && (
        <div className="mx-1 mb-3 p-3 rounded-2xl sidebar-alert-card shadow-sm border border-cyan-500/30 bg-cyan-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-cyan-500/20 text-cyan-400" />
              Action Required
            </span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px] border border-cyan-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                {approvedCount} Pending
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification('warehouse_manager', approvedSignature);
                }}
                className="p-1 rounded-md text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer"
                title="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
            Approved sales orders waiting for storekeeper scheduling.
          </p>
          <Link
            to="/sales-orders"
            onClick={() => {
              dismissNotification('warehouse_manager', approvedSignature);
              if (onClose) onClose();
            }}
            className="mt-2.5 inline-flex items-center justify-center w-full py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-[11px] transition shadow-sm gap-1 cursor-pointer"
          >
            Schedule Preparation
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Urgent Action Notification Card for Storekeeper */}
      {isStoreKeeper && pendingSkTasksCount > 0 && !isDismissed('storekeeper', skSignature) && (
        <div className="mx-1 mb-3 p-3 rounded-2xl sidebar-alert-card shadow-sm border border-amber-500/30 bg-amber-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 fill-amber-500/20 text-amber-400" />
              Action Required
            </span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] border border-amber-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                {pendingSkTasksCount} Pending
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification('storekeeper', skSignature);
                }}
                className="p-1 rounded-md text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
                title="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
            Assigned picking tickets waiting for packing & staging.
          </p>
          <Link
            to="/dashboard"
            onClick={() => {
              dismissNotification('storekeeper', skSignature);
              if (onClose) onClose();
            }}
            className="mt-2.5 inline-flex items-center justify-center w-full py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] transition shadow-sm gap-1 cursor-pointer"
          >
            Open Picking Tasks
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Urgent Action Notification Card for Driver */}
      {isDriver && pendingDrvDeliveriesCount > 0 && !isDismissed('driver', drvSignature) && (
        <div className="mx-1 mb-3 p-3 rounded-2xl sidebar-alert-card shadow-sm border border-purple-500/30 bg-purple-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-400 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-purple-400" />
              Action Required
            </span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px] border border-purple-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                {pendingDrvDeliveriesCount} Pending
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification('driver', drvSignature);
                }}
                className="p-1 rounded-md text-purple-400/70 hover:text-purple-300 hover:bg-purple-500/20 transition cursor-pointer"
                title="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
            Scheduled dispatch runs ready for transit and client handover.
          </p>
          <Link
            to="/dashboard"
            onClick={() => {
              dismissNotification('driver', drvSignature);
              if (onClose) onClose();
            }}
            className="mt-2.5 inline-flex items-center justify-center w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] transition shadow-sm gap-1 cursor-pointer"
          >
            View Deliveries Board
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Urgent Action Notification Card for Customer when Sales Rep Approves & Invoice is Issued */}
      {isCustomer && customerPaymentDueCount > 0 && !isDismissed('customer', customerSignature) && (
        <div className="mx-1 mb-3 p-3 rounded-2xl sidebar-alert-card shadow-sm border border-emerald-500/30 bg-emerald-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Order Approved • Pay
            </span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {customerPaymentDueCount} {customerPaymentDueCount === 1 ? 'Invoice Ready' : 'Invoices Ready'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification('customer', customerSignature);
                }}
                className="p-1 rounded-md text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
                title="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
            Sales rep approved your order! Commercial invoice is generated — please review and pay to start warehouse fulfillment.
          </p>
          <Link
            to="/invoices"
            onClick={() => {
              dismissNotification('customer', customerSignature);
              if (onClose) onClose();
            }}
            className="mt-2.5 inline-flex items-center justify-center w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-[11px] transition shadow-sm gap-1 cursor-pointer"
          >
            Review Invoice & Pay
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Navigation Sections */}
      {sectionsToRender.map((section) => {
        let visibleItems = section.items.filter((item) => {
          if (isCustomer && item.href === '/customers') return false;
          if (!item.permission) return true;
          if (hasWildcard) return true;
          const required = Array.isArray(item.permission) ? item.permission : [item.permission];
          return required.some((p) => permissions.includes(p));
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={section.title} className="space-y-0.5">
            <h3 className="px-3 mb-2 text-[11px] font-bold tracking-widest sidebar-section-label uppercase">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {visibleItems.map((item) => {
                let displayName = item.name;
                let badge = undefined;

                if (item.href === '/sales-orders') {
                  if (isSalesRep) {
                    displayName = 'Sales Orders';
                    if (pendingCount > 0 && !isDismissed('sales_rep', pendingSignature)) badge = pendingCount;
                  } else if (isWhManager) {
                    displayName = 'Preparation Queue';
                    if (approvedCount > 0 && !isDismissed('warehouse_manager', approvedSignature)) badge = approvedCount;
                  } else if (isStoreKeeper) {
                    displayName = 'Preparation Tasks';
                    if (pendingSkTasksCount > 0 && !isDismissed('storekeeper', skSignature)) badge = pendingSkTasksCount;
                  } else if (isCustomer) {
                    if (customerPaymentDueCount > 0 && !isDismissed('customer', customerSignature)) badge = customerPaymentDueCount;
                  } else if (isSuperAdmin) {
                    displayName = 'Sales Orders';
                    const adminTotal = (pendingCount || 0) + (approvedCount || 0);
                    if (adminTotal > 0) badge = adminTotal;
                  }
                } else if (item.href === '/invoices') {
                  if (isCustomer && customerPaymentDueCount > 0 && !isDismissed('customer', customerSignature)) {
                    badge = customerPaymentDueCount;
                  }
                } else if (item.href === '/deliveries') {
                  if (isDriver) {
                    displayName = 'My Deliveries';
                    if (pendingDrvDeliveriesCount > 0 && !isDismissed('driver', drvSignature)) badge = pendingDrvDeliveriesCount;
                  }
                } else if (item.href === '/dashboard') {
                  if (isSalesRep && pendingCount > 0 && !isDismissed('sales_rep', pendingSignature)) badge = pendingCount;
                  else if (isWhManager && approvedCount > 0 && !isDismissed('warehouse_manager', approvedSignature)) badge = approvedCount;
                  else if (isStoreKeeper && pendingSkTasksCount > 0 && !isDismissed('storekeeper', skSignature)) badge = pendingSkTasksCount;
                  else if (isDriver && pendingDrvDeliveriesCount > 0 && !isDismissed('driver', drvSignature)) badge = pendingDrvDeliveriesCount;
                  else if (isCustomer && customerPaymentDueCount > 0 && !isDismissed('customer', customerSignature)) badge = customerPaymentDueCount;
                  else if (isSuperAdmin) {
                    const adminTotal = (pendingCount || 0) + (approvedCount || 0);
                    if (adminTotal > 0) badge = adminTotal;
                  }
                }

                return (
                  <SidebarNavItem
                    key={item.name}
                    item={{ ...item, name: displayName, badge }}
                    onClick={() => handleItemClick(item)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

