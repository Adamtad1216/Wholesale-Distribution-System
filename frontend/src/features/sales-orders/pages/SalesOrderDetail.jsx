import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
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

export default function SalesOrderDetail() {
  const { id } = useParams();
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

  if (isLoading) {
    return <div className="text-center py-20 text-slate-400">Loading order...</div>;
  }

  if (error || !data) {
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

  const order = data;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 light:text-slate-900">
              {order.orderNumber}
            </h1>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                STATUS_COLORS[order.status] || 'bg-slate-500/20 text-slate-300'
              }`}
            >
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Created on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <Link to="/sales-orders">
          <Button variant="secondary">Back to Orders</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Customer
          </h3>
          <p className="text-slate-200">
            {order.customer?.person
              ? `${order.customer.person.firstName} ${order.customer.person.lastName}`
              : order.customer?.organization?.name || '-'}
          </p>
          {order.customer?.organization?.phone && (
            <p className="text-sm text-slate-400 mt-1">
              {order.customer.organization.phone}
            </p>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Warehouse
          </h3>
          <p className="text-slate-200">{order.warehouse?.name || '-'}</p>
          <p className="text-sm text-slate-400 mt-1">{order.warehouse?.code || ''}</p>
        </Card>

        {order.salesRep && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Sales Representative
            </h3>
            <p className="text-slate-200">
              {order.salesRep?.person
                ? `${order.salesRep.person.firstName} ${order.salesRep.person.lastName}`
                : '-'}
            </p>
          </Card>
        )}

        {order.requiredDate && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Required Date
            </h3>
            <p className="text-slate-200">
              {new Date(order.requiredDate).toLocaleDateString()}
            </p>
          </Card>
        )}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Order Items
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3 text-right">Qty</th>
                <th className="px-6 py-3 text-right">Unit Price</th>
                <th className="px-6 py-3 text-right">Discount</th>
                <th className="px-6 py-3 text-right">Tax</th>
                <th className="px-6 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-3">
                    {item.product?.name || item.productId}
                  </td>
                  <td className="px-6 py-3 text-slate-400">
                    {item.product?.sku || '-'}
                  </td>
                  <td className="px-6 py-3 text-right">{item.quantity}</td>
                  <td className="px-6 py-3 text-right">
                    {Number(item.unitPrice).toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-right text-rose-400">
                    {Number(item.discount).toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {Number(item.tax).toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-violet-300">
                    {Number(item.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col items-end gap-1 text-sm">
          <div className="flex justify-between w-full max-w-xs text-slate-400">
            <span>Subtotal</span>
            <span className="text-slate-200">{Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between w-full max-w-xs text-slate-400">
            <span>Discount</span>
            <span className="text-rose-400">-{Number(order.discount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between w-full max-w-xs text-slate-400">
            <span>Tax</span>
            <span className="text-slate-200">{Number(order.tax).toFixed(2)}</span>
          </div>
          <div className="flex justify-between w-full max-w-xs text-base font-bold text-violet-300 pt-2 border-t border-slate-700">
            <span>Total</span>
            <span>{Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
