import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { salesOrdersApi } from '../salesOrdersApi';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

const STATUS_COLORS = {
  DRAFT: 'bg-slate-500/20 text-slate-300',
  PENDING_REVIEW: 'bg-amber-500/20 text-amber-300',
  SALES_REP_APPROVED: 'bg-emerald-500/20 text-emerald-300',
  REJECTED: 'bg-rose-500/20 text-rose-300',
  ADJUSTMENT_REQUIRED: 'bg-orange-500/20 text-orange-300',
  WAREHOUSE_PREPARATION_SCHEDULED: 'bg-blue-500/20 text-blue-300',
  PREPARING: 'bg-blue-500/20 text-blue-300',
  READY_FOR_DELIVERY: 'bg-cyan-500/20 text-cyan-300',
  DELIVERY_SCHEDULED: 'bg-indigo-500/20 text-indigo-300',
  DISPATCHED: 'bg-purple-500/20 text-purple-300',
  OUT_FOR_DELIVERY: 'bg-purple-500/20 text-purple-300',
  DELIVERED: 'bg-emerald-500/20 text-emerald-300',
  COMPLETED: 'bg-emerald-600/20 text-emerald-300',
  CANCELLED: 'bg-rose-600/20 text-rose-300',
};

export default function MySalesOrders() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { data, isLoading, error } = useQuery({
    queryKey: ['salesOrders', page, limit],
    queryFn: async () => {
      try {
        const res = await salesOrdersApi.list({ page, limit });
        return res?.data || res;
      } catch (err) {
        if (err?.status === 501) {
          return { data: [], meta: { page: 1, limit, total: 0, totalPages: 0 } };
        }
        throw err;
      }
    },
  });

  const orders = data?.data || [];
  const meta = data?.meta || { page: 1, limit, total: 0, totalPages: 0 };

  if (error && error?.status !== 501) {
    return (
      <div className="text-center py-20 text-rose-400">
        Failed to load orders. Please try again.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 light:text-slate-900">
            My Sales Orders
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track your order requests and their status.
          </p>
        </div>
        <Link to="/sales-orders/new">
          <Button>+ New Order</Button>
        </Link>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No orders yet.{' '}
            <Link to="/sales-orders/new" className="text-violet-400 hover:underline">
              Create your first order
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-700 text-xs uppercase text-slate-400">
                  <th className="px-6 py-4">Order #</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-mono text-xs">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-violet-300">
                      {Number(order.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLORS[order.status] || 'bg-slate-500/20 text-slate-300'
                        }`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/sales-orders/${order.id}`}
                        className="text-violet-400 hover:text-violet-300 text-xs font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
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
