import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { salesOrdersApi } from '../salesOrdersApi';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

const STATUS_COLORS = {
  DRAFT: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  PENDING_REVIEW: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  SALES_REP_APPROVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  REJECTED: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  ADJUSTMENT_REQUIRED: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  WAREHOUSE_PREPARATION_SCHEDULED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  PREPARING: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  READY_FOR_DELIVERY: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  DELIVERY_SCHEDULED: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  DISPATCHED: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  OUT_FOR_DELIVERY: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  DELIVERED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  COMPLETED: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/30',
  CANCELLED: 'bg-rose-600/20 text-rose-300 border-rose-600/30',
};

const FILTER_TABS = [
  { label: 'All Orders', value: 'ALL' },
  { label: 'Pending Review', value: 'PENDING_REVIEW' },
  { label: 'Approved', value: 'SALES_REP_APPROVED' },
  { label: 'In Fulfillment', value: 'PREPARING' },
  { label: 'Completed', value: 'COMPLETED' },
];

export default function MySalesOrders() {
  const { role, customer } = useSelector((state) => state.auth);
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'ADMIN' || isSuperAdmin;
  const isSalesRep = role === 'SALES_REPRESENTATIVE' || role === 'SALES_REP';
  const isWarehouseManager = role === 'WAREHOUSE_MANAGER';
  const isStorekeeper = role === 'STOREKEEPER' || role === 'STORE_KEEPER';
  const isDriver = role === 'DRIVER';
  const isStaff = isAdmin || isSalesRep || isWarehouseManager || isStorekeeper || isDriver;
  const isCustomer = role === 'CUSTOMER' || (!!customer && !isStaff);

  const canReview = isSalesRep || isAdmin;
  const canSchedulePrep = isWarehouseManager || isAdmin;
  const canPack = isStorekeeper || isAdmin;
  const canAssignDriver = isWarehouseManager || isAdmin;
  const canDeliver = isDriver || isAdmin;

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['salesOrders', page, limit, statusFilter],
    queryFn: async () => {
      try {
        const params = { page, limit };
        if (statusFilter !== 'ALL') {
          params.status = statusFilter;
        }
        const res = await salesOrdersApi.list(params);
        return res;
      } catch (err) {
        if (err?.status === 501) {
          return { data: [], meta: { page: 1, limit, total: 0, totalPages: 0 } };
        }
        throw err;
      }
    },
  });

  const orders = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.items)
    ? data.items
    : [];

  const meta = data?.meta || { page: 1, limit, total: orders.length, totalPages: 1 };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 light:text-slate-900">
            {isStaff ? 'Sales Orders' : 'My Sales Orders'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isStaff
              ? 'Review incoming orders, schedule warehouse preparation, and track fulfillment.'
              : 'Track your order requests and their status.'}
          </p>
        </div>
        {(isSalesRep || isAdmin || isCustomer) && (
          <Link to="/sales-orders/new">
            <Button>{isStaff ? '+ New Quotation' : '+ New Order'}</Button>
          </Link>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {FILTER_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && error?.status !== 501 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 space-y-3">
          <p className="font-semibold text-sm">Failed to load orders.</p>
          <p className="text-xs text-rose-400/80 max-w-md mx-auto">
            {error?.response?.data?.message || error?.message || 'Please check your connection and try again.'}
          </p>
          <Button variant="secondary" size="sm" onClick={() => refetch()} className="cursor-pointer">
            Retry Loading Orders
          </Button>
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No orders found.{' '}
              {(isSalesRep || isAdmin || isCustomer) && (
                <Link to="/sales-orders/new" className="text-violet-400 hover:underline">
                  {isStaff ? 'Create a new quotation' : 'Create your first order'}
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-slate-700 text-xs uppercase text-slate-400 bg-slate-800/40">
                    <th className="px-6 py-4">Order #</th>
                    {isStaff && <th className="px-6 py-4">Customer</th>}
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {orders.map((order) => {
                    const customerName =
                      order.customer?.organization?.name ||
                      (order.customer?.person
                        ? `${order.customer.person.firstName} ${order.customer.person.lastName}`
                        : null) ||
                      'Customer';

                    const isPendingReview =
                      order.status === 'PENDING_REVIEW' && canReview;

                    return (
                      <tr
                        key={order.id}
                        className={`transition hover:bg-slate-800/40 ${
                          isPendingReview ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-200">
                          {order.orderNumber}
                        </td>
                        {isStaff && (
                          <td className="px-6 py-4 text-slate-200">
                            <span className="font-medium text-xs truncate max-w-[180px] block">
                              {customerName}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-emerald-400">
                          {Number(order.total || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          ETB
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                              STATUS_COLORS[order.status] || 'bg-slate-500/20 text-slate-300'
                            }`}
                          >
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isPendingReview ? (
                            <Link
                              to={`/sales-orders/${order.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm transition"
                            >
                              Review Order
                            </Link>
                          ) : canSchedulePrep && order.status === 'SALES_REP_APPROVED' ? (
                            <Link
                              to={`/sales-orders/${order.id}/schedule-preparation`}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-sm transition"
                            >
                              Schedule Prep →
                            </Link>
                          ) : canPack && ['WAREHOUSE_PREPARATION_SCHEDULED', 'PREPARING'].includes(order.status) ? (
                            <Link
                              to={`/sales-orders/${order.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm transition"
                            >
                              Pack & Prepare →
                            </Link>
                          ) : canAssignDriver && order.status === 'READY_FOR_DELIVERY' ? (
                            <Link
                              to={`/sales-orders/${order.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm transition"
                            >
                              Assign Driver →
                            </Link>
                          ) : canDeliver && ['DELIVERY_SCHEDULED', 'OUT_FOR_DELIVERY'].includes(order.status) ? (
                            <Link
                              to={`/sales-orders/${order.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-500 shadow-sm transition"
                            >
                              Deliver Order →
                            </Link>
                          ) : isCustomer && ['SALES_REP_APPROVED', 'AWAITING_PAYMENT'].includes(order.status) ? (
                            <Link
                              to="/invoices"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-sm transition"
                            >
                              Pay Invoice →
                            </Link>
                          ) : (
                            <Link
                              to={`/sales-orders/${order.id}`}
                              className="text-violet-400 hover:text-violet-300 text-xs font-medium"
                            >
                              View Details
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-50 hover:bg-slate-700"
          >
            Previous
          </button>
          <span className="text-sm text-slate-400">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages}
            className="px-4 py-2 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-50 hover:bg-slate-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
