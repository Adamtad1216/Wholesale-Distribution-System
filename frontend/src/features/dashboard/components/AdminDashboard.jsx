import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ShieldCheck,
  Building2,
  Calendar,
  Users,
  ShoppingBag,
  Warehouse,
  Plus,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import StatsCards from './StatsCards';
import { OrdersByStatusChart, RevenueChart } from './Charts';
import { StatusBreakdownTable, TopCustomersTable, WarehouseCard } from './ReportTables';
import { reportsApi } from '../reportsApi';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, role } = useSelector((state) => state.auth);

  const adminName =
    (user?.person?.firstName ? `${user.person.firstName} ${user.person.lastName || ''}`.trim() : null) ||
    user?.username ||
    'Administrator';

  const roleLabel = role?.replace(/_/g, ' ') || 'SYSTEM ADMINISTRATOR';

  // Dashboard Data Queries
  const {
    data: dashboardRes,
    refetch: refetchDashboard,
    isRefetching,
  } = useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: () => reportsApi.getDashboard().catch(() => ({ data: {} })),
    staleTime: 60000,
    retry: 1,
  });

  const { data: orderStatusRes, refetch: refetchStatus } = useQuery({
    queryKey: ['reports', 'orders-status'],
    queryFn: () => reportsApi.getOrderStatusReport().catch(() => ({ data: [] })),
    staleTime: 60000,
    retry: 1,
  });

  const { data: productSalesRes, refetch: refetchSales } = useQuery({
    queryKey: ['reports', 'product-sales'],
    queryFn: () => reportsApi.getProductSalesReport({ limit: 10 }).catch(() => ({ data: [] })),
    staleTime: 60000,
    retry: 1,
  });

  const { data: customerRes, refetch: refetchCustomers } = useQuery({
    queryKey: ['reports', 'customers'],
    queryFn: () => reportsApi.getCustomerReport({ limit: 10 }).catch(() => ({ data: [] })),
    staleTime: 60000,
    retry: 1,
  });

  const { data: warehouseRes, refetch: refetchWarehouse } = useQuery({
    queryKey: ['reports', 'warehouse'],
    queryFn: () => reportsApi.getWarehouseReport().catch(() => ({ data: {} })),
    staleTime: 60000,
    retry: 1,
  });

  const handleRefreshAll = () => {
    refetchDashboard();
    refetchStatus();
    refetchSales();
    refetchCustomers();
    refetchWarehouse();
  };

  const dashboardData = dashboardRes?.data || {};

  return (
    <div className="space-y-8 pb-12">
      {/* ============================================================
          1. HERO BANNER — THEME ADAPTIVE & MODERN
          ============================================================ */}
      <div className="relative rounded-3xl border border-border bg-card shadow-sm p-6 sm:p-8 overflow-hidden transition-all duration-200">
        {/* Ambient subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                {roleLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                System Operational
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-foreground border border-border">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                Central Distribution HQ
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                {adminName}
              </span>
            </h1>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Enterprise operations overview: monitor live wholesale order dispatching, manage customer credit limits, track stock movements across regional warehouses, and oversee system performance.
            </p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <Calendar className="w-3.5 h-3.5 text-violet-400" />
              <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch lg:items-center gap-3 shrink-0">
            <button
              onClick={handleRefreshAll}
              disabled={isRefetching}
              className="px-4 py-3 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
              title="Refresh Dashboard Metrics"
            >
              <RefreshCw className={`w-4 h-4 text-violet-400 ${isRefetching ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => navigate('/customers')}
              className="px-4 py-3 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Manage Customers</span>
            </button>

            <button
              onClick={() => navigate('/sales-orders/new')}
              className="px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          2. OPERATIONS QUICK NAVIGATION TILES
          ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/sales-orders')}
          className="p-4 rounded-2xl border border-border bg-card shadow-sm hover:border-violet-500/40 transition cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center group-hover:scale-105 transition">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground group-hover:text-violet-400 transition">Sales Orders</h4>
              <p className="text-xs text-muted-foreground">Review & order pipeline</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition" />
        </div>

        <div
          onClick={() => navigate('/customers')}
          className="p-4 rounded-2xl border border-border bg-card shadow-sm hover:border-indigo-500/40 transition cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground group-hover:text-indigo-400 transition">B2B Customers</h4>
              <p className="text-xs text-muted-foreground">Accounts & credit terms</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition" />
        </div>

        <div
          onClick={() => navigate('/warehouses')}
          className="p-4 rounded-2xl border border-border bg-card shadow-sm hover:border-emerald-500/40 transition cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground group-hover:text-emerald-400 transition">Warehouses</h4>
              <p className="text-xs text-muted-foreground">Inventory & stock tasks</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition" />
        </div>

        <div
          onClick={() => navigate('/users')}
          className="p-4 rounded-2xl border border-border bg-card shadow-sm hover:border-cyan-500/40 transition cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground group-hover:text-cyan-400 transition">Access & Roles</h4>
              <p className="text-xs text-muted-foreground">Staff permissions & RBAC</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition" />
        </div>
      </div>

      {/* ============================================================
          3. EXECUTIVE STATS METRICS CARDS
          ============================================================ */}
      <StatsCards dashboardData={dashboardData} />

      {/* ============================================================
          4. CHARTS SECTION
          ============================================================ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <OrdersByStatusChart data={orderStatusRes || { data: [] }} />
        </div>
        <div className="xl:col-span-2">
          <RevenueChart data={productSalesRes || { data: [] }} />
        </div>
      </div>

      {/* ============================================================
          5. OPERATIONS DETAIL TABLES
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <StatusBreakdownTable data={orderStatusRes || { data: [] }} />
        </div>
        <div>
          <WarehouseCard data={warehouseRes || { data: {} }} />
        </div>
      </div>

      {/* ============================================================
          6. TOP CUSTOMERS TABLE
          ============================================================ */}
      <div>
        <TopCustomersTable data={customerRes || { data: [] }} />
      </div>
    </div>
  );
}
