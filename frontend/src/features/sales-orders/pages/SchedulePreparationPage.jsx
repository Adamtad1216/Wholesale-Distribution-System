import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Boxes,
  Package,
  UserCheck,
  AlertCircle,
  Building2,
  Lock,
  Warehouse,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import { salesOrdersApi } from '../salesOrdersApi';
import OrderDeliveryLocationMap from '../../../components/sales-orders/OrderDeliveryLocationMap';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

export default function SchedulePreparationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Fetch sales order details
  const {
    data: orderRes,
    isLoading: orderLoading,
    error: orderError,
  } = useQuery({
    queryKey: ['salesOrder', id],
    queryFn: () => salesOrdersApi.getById(id),
  });

  const order = orderRes?.data || orderRes;

  // 2. Fetch active storekeepers list
  const {
    data: storekeepersRes,
    isLoading: storekeepersLoading,
  } = useQuery({
    queryKey: ['storekeepersList'],
    queryFn: salesOrdersApi.getStorekeepers,
  });

  const storekeepers = storekeepersRes?.data || [];

  // 3. Form state
  // Prepopulate scheduled preparation date to 2 hours before or the morning of the required date if available, or today + 2 hours
  const defaultPrepDate = () => {
    if (order?.requiredDate) {
      const req = new Date(order.requiredDate);
      // Set to 4 hours earlier on that date
      req.setHours(req.getHours() - 4);
      return req.toISOString().slice(0, 16);
    }
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return d.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    storeKeeperId: '',
    scheduledDate: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  // Automatically select first storekeeper when loaded if not yet set
  React.useEffect(() => {
    if (storekeepers.length > 0 && !form.storeKeeperId) {
      setForm((prev) => ({
        ...prev,
        storeKeeperId: storekeepers[0].id,
      }));
    }
  }, [storekeepers, form.storeKeeperId]);

  // Adjust default date once order required date loads
  React.useEffect(() => {
    if (order?.requiredDate) {
      const req = new Date(order.requiredDate);
      req.setHours(req.getHours() - 4);
      setForm((prev) => ({
        ...prev,
        scheduledDate: req.toISOString().slice(0, 16),
      }));
    }
  }, [order?.requiredDate]);

  // 4. Schedule Preparation Mutation
  const scheduleMutation = useMutation({
    mutationFn: (payload) => salesOrdersApi.schedulePreparation(id, payload),
    onSuccess: () => {
      toast.success('Warehouse preparation scheduled & assigned to Storekeeper!');
      queryClient.invalidateQueries({ queryKey: ['salesOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['warehouseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      navigate(`/sales-orders/${id}`);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to schedule preparation');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.storeKeeperId) {
      toast.error('Please select an assigned Storekeeper');
      return;
    }
    if (!form.scheduledDate) {
      toast.error('Please specify the scheduled date & time');
      return;
    }

    scheduleMutation.mutate({
      warehouseId: order.warehouseId || undefined,
      storeKeeperId: form.storeKeeperId,
      scheduledDate: new Date(form.scheduledDate).toISOString(),
      notes: form.notes.trim() || undefined,
    });
  };

  if (orderLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading sales order fulfillment details...</p>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Order Not Found</h2>
        <p className="text-sm text-muted-foreground">
          Unable to locate sales order #{id} or you do not have permission to view it.
        </p>
        <Link to="/dashboard">
          <Button variant="outline" size="sm" className="mt-4">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const customerName =
    order.customer?.organization?.name ||
    (order.customer?.person
      ? `${order.customer.person.firstName} ${order.customer.person.lastName || ''}`.trim()
      : order.customer?.companyName || 'Wholesale Customer');

  const requiredDateObj = order.requiredDate ? new Date(order.requiredDate) : null;
  const isPrepAlreadyScheduled =
    order.status === 'WAREHOUSE_PREPARATION_SCHEDULED' ||
    order.status === 'PREPARING' ||
    order.status === 'READY_FOR_DELIVERY' ||
    order.status === 'DELIVERY_SCHEDULED' ||
    order.status === 'OUT_FOR_DELIVERY' ||
    order.status === 'DELIVERED' ||
    order.status === 'COMPLETED';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-lg text-foreground">
                {order.orderNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Boxes className="w-3.5 h-3.5" />
                Schedule Storekeeper Preparation
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customer:{' '}
              <strong className="text-foreground">{customerName}</strong> • Warehouse:{' '}
              <strong className="text-foreground">{order.warehouse?.name || 'Central Warehouse'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to={`/sales-orders/${order.id}`}>
            <Button variant="outline" size="sm" className="text-xs">
              View Full Order
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Customer Required Delivery Date Advisory Banner (Crucial Requirement) */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  Customer Required Delivery Date & Deadline
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 uppercase tracking-wider">
                  Target Deadline
                </span>
              </div>

              {requiredDateObj ? (
                <div className="mt-1">
                  <p className="text-base font-extrabold text-amber-300">
                    {format(requiredDateObj, 'EEEE, MMMM d, yyyy • h:mm a')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      Storekeeper picking & packaging must conclude before this window so the order can be staged for driver loading and transit.
                    </span>
                  </p>
                </div>
              ) : (
                <div className="mt-1">
                  <p className="text-sm font-semibold text-slate-300">
                    Standard Processing (No strict required delivery cutoff specified)
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Schedule packaging at the earliest available storekeeper slot for prompt fulfillment.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end justify-center bg-card/60 border border-border/80 px-4 py-2.5 rounded-xl shrink-0">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Stock Allocation Status
            </span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <Lock className="w-3.5 h-3.5" />
              100% Reserved in Facility
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Scheduling Form (Left) & Delivery Map + Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Storekeeper Assignment & Preparation Form */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 border border-border bg-card shadow-sm rounded-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Assign Storekeeper & Set Timing
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Only staff with storekeeper qualifications are listed below
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border">
                {storekeepers.length} Qualified Keepers
              </span>
            </div>

            {isPrepAlreadyScheduled ? (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Preparation Already Scheduled for this Order</span>
                </div>
                <p className="text-muted-foreground">
                  Current Order Status: <strong className="text-foreground">{order.status}</strong>. Storekeepers can pick items directly from the assigned inventory.
                </p>
                <div className="pt-2">
                  <Link to={`/sales-orders/${order.id}`}>
                    <Button size="sm" variant="outline">
                      Go to Order Overview
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Storekeeper Select */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Assigned Storekeeper <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.storeKeeperId}
                    onChange={(e) => setForm({ ...form, storeKeeperId: e.target.value })}
                    className="w-full text-xs rounded-xl border border-border bg-background p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer"
                    required
                    disabled={storekeepersLoading}
                  >
                    <option value="">
                      {storekeepersLoading ? 'Loading qualified storekeepers...' : 'Select a qualified storekeeper...'}
                    </option>
                    {storekeepers.map((sk) => {
                      const name = sk.person
                        ? `${sk.person.firstName} ${sk.person.lastName || ''}`.trim()
                        : sk.employeeCode;
                      const dept = sk.department ? ` • ${sk.department}` : '';
                      return (
                        <option key={sk.id} value={sk.id}>
                          {name} ({sk.employeeCode}){dept}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Storekeeper will receive notification and task checklist in their dedicated portal.
                  </p>
                </div>

                {/* Scheduled Prep Date & Time */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Scheduled Preparation Window & Time <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={form.scheduledDate}
                      onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                      className="w-full text-xs rounded-xl border border-border bg-background p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                      required
                    />
                  </div>
                  {requiredDateObj && (
                    <p className="text-[11px] text-amber-400 mt-1">
                      💡 Tip: Complete packaging prior to {format(requiredDateObj, 'MMM d, h:mm a')} to meet customer delivery expectations.
                    </p>
                  )}
                </div>

                {/* Warehouse Location Info (Readonly) */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Fulfillment Facility
                  </label>
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground">
                    <Warehouse className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-semibold">
                      {order.warehouse?.name || 'Central Warehouse'}
                    </span>
                    {order.warehouse?.code && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        ({order.warehouse.code})
                      </span>
                    )}
                  </div>
                </div>

                {/* Picking & Packaging Notes */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Preparation Instructions & Picking Notes (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="e.g. Inspect lot expiry dates, package into durable corrugated cartons, label with customer account code..."
                    className="w-full text-xs rounded-xl border border-border bg-background p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                </div>

                {/* Submit Action Buttons */}
                <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="w-full sm:w-auto text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={scheduleMutation.isPending || storekeepers.length === 0}
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Boxes className="w-4 h-4 fill-slate-950" />
                    <span>
                      {scheduleMutation.isPending
                        ? 'Assigning Storekeeper...'
                        : 'Confirm & Assign Storekeeper Preparation'}
                    </span>
                  </Button>
                </div>
              </form>
            )}
          </Card>

          {/* Reserved Line Items Breakdown */}
          <Card className="p-0 overflow-hidden border border-border bg-card shadow-sm rounded-2xl">
            <div className="p-4 border-b border-border/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Reserved Items for Picking ({order.items?.length || 0})
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Stock Locked
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-muted-foreground">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-[10px] uppercase font-bold text-foreground">
                    <th className="py-2.5 px-4">Item & SKU</th>
                    <th className="py-2.5 px-3 text-center">Unit</th>
                    <th className="py-2.5 px-4 text-right">Pick Qty</th>
                    <th className="py-2.5 px-4 text-right">Reservation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {order.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary/20 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-foreground">
                          {item.product?.name || item.productId}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          SKU: {item.product?.sku || '—'}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-secondary border border-border text-[10px]">
                          {item.product?.unit?.name || 'Pcs'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-foreground font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <Lock className="w-2.5 h-2.5" />
                          Allocated
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Customer Delivery Location Google Map Component */}
        <div className="lg:col-span-5 space-y-6">
          {/* Interactive Delivery Location Map */}
          <OrderDeliveryLocationMap
            order={order}
            height="320px"
            className="w-full"
          />

          {/* Customer & Destination Summary Card */}
          <Card className="p-5 border border-border bg-card shadow-sm rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Recipient Contact & Delivery Info
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                {order.customer?.customerType || 'Customer'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground">Company / Client:</span>
                <span className="font-bold text-foreground text-right">{customerName}</span>
              </div>

              {(order.customer?.person?.phone || order.customer?.organization?.phone) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact Phone:</span>
                  <a
                    href={`tel:${order.customer?.person?.phone || order.customer?.organization?.phone}`}
                    className="font-medium text-primary hover:underline font-mono"
                  >
                    {order.customer?.person?.phone || order.customer?.organization?.phone}
                  </a>
                </div>
              )}

              {order.deliveryAddressText && (
                <div className="pt-2 border-t border-border/60">
                  <span className="text-muted-foreground block text-[11px] mb-0.5">
                    Delivery Destination Address:
                  </span>
                  <p className="text-foreground font-medium text-xs bg-secondary/40 p-2 rounded-lg border border-border/50">
                    {order.deliveryAddressText}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-border/60 flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Quotation Total:</span>
                <span className="font-bold font-mono text-amber-400">
                  ETB{' '}
                  {Number(order.total || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
