import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Truck,
  Package,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  Filter,
  MapPin,
  FileCheck,
  Check,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { salesOrdersApi } from '../../sales-orders/salesOrdersApi';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Modal from '../../../components/ui/Modal';

const STATUS_BADGES = {
  SCHEDULED: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  DISPATCHED: 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse',
  DELIVERED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  CANCELLED: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

export default function DeliveriesPage() {
  const queryClient = useQueryClient();
  const { role } = useSelector((state) => state.auth);

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [handoverForm, setHandoverForm] = useState({
    recipientName: '',
    proofType: 'SIGNATURE',
    notes: '',
  });

  const isDriverOrAdmin =
    role === 'DRIVER' ||
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN';

  const { data, isLoading, error } = useQuery({
    queryKey: ['driverDeliveries', filterStatus],
    queryFn: async () => {
      const params = {};
      if (filterStatus !== 'ALL') {
        params.status = filterStatus;
      }
      const res = await salesOrdersApi.getDriverDeliveries(params);
      return res?.data?.data || res?.data || res || [];
    },
  });

  const startMutation = useMutation({
    mutationFn: (deliveryId) => salesOrdersApi.startDelivery(deliveryId),
    onSuccess: () => {
      toast.success('Delivery marked as Dispatched and Out for Delivery!');
      queryClient.invalidateQueries({ queryKey: ['driverDeliveries'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrder'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to start delivery');
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ deliveryId, proof }) => salesOrdersApi.completeDelivery(deliveryId, { proof }),
    onSuccess: () => {
      toast.success('Handover confirmed! Delivery marked as Delivered.');
      setIsHandoverModalOpen(false);
      setSelectedDelivery(null);
      queryClient.invalidateQueries({ queryKey: ['driverDeliveries'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrder'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to complete delivery');
    },
  });

  const deliveriesList = Array.isArray(data) ? data : [];

  const filteredDeliveries = deliveriesList.filter((del) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const orderNum = del.salesOrder?.orderNumber?.toLowerCase() || '';
    const delNum = del.deliveryNumber?.toLowerCase() || '';
    const customer =
      del.customer?.person
        ? `${del.customer.person.firstName} ${del.customer.person.lastName}`.toLowerCase()
        : del.customer?.organization?.name?.toLowerCase() || '';
    const driver = del.driver?.person
      ? `${del.driver.person.firstName} ${del.driver.person.lastName}`.toLowerCase()
      : '';
    const plate = del.vehicle?.plateNumber?.toLowerCase() || '';

    return (
      orderNum.includes(term) ||
      delNum.includes(term) ||
      customer.includes(term) ||
      driver.includes(term) ||
      plate.includes(term)
    );
  });

  const totalCount = deliveriesList.length;
  const scheduledCount = deliveriesList.filter((d) => d.status === 'SCHEDULED').length;
  const dispatchedCount = deliveriesList.filter((d) => d.status === 'DISPATCHED').length;
  const deliveredCount = deliveriesList.filter((d) => d.status === 'DELIVERED').length;

  const handleOpenHandoverModal = (delivery) => {
    setSelectedDelivery(delivery);
    const customerPerson = delivery.customer?.person || delivery.salesOrder?.customer?.person;
    const customerOrg = delivery.customer?.organization || delivery.salesOrder?.customer?.organization;
    setHandoverForm({
      recipientName: customerPerson
        ? `${customerPerson.firstName} ${customerPerson.lastName}`
        : customerOrg?.name || '',
      proofType: 'SIGNATURE',
      notes: '',
    });
    setIsHandoverModalOpen(true);
  };

  const handleCompleteSubmit = (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    completeMutation.mutate({
      deliveryId: selectedDelivery.id,
      proof: {
        proofType: handoverForm.proofType,
        recipientName: handoverForm.recipientName || undefined,
        notes: handoverForm.notes || undefined,
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">
                Deliveries & Logistics Dispatch
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time transport coordination, driver runs, and proof-of-delivery management
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/sales-orders">
            <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              Sales Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/90 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center flex-shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Total Shipments
            </p>
            <p className="text-2xl font-black text-slate-100 mt-0.5">{totalCount}</p>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/90 border border-indigo-500/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
              Scheduled
            </p>
            <p className="text-2xl font-black text-slate-100 mt-0.5">{scheduledCount}</p>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/90 border border-purple-500/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
            <ArrowRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-purple-300 font-semibold uppercase tracking-wider">
              Out for Delivery
            </p>
            <p className="text-2xl font-black text-slate-100 mt-0.5">{dispatchedCount}</p>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/90 border border-emerald-500/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
              Delivered
            </p>
            <p className="text-2xl font-black text-slate-100 mt-0.5">{deliveredCount}</p>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {['ALL', 'SCHEDULED', 'DISPATCHED', 'DELIVERED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order, waybill, driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-700 bg-slate-800/80 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </Card>

      {/* Deliveries Table / Cards */}
      <Card className="p-0 overflow-hidden border border-slate-800">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading delivery records...</div>
        ) : error ? (
          <div className="py-20 text-center text-rose-400 text-sm">
            Failed to load deliveries. {error.message}
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <Truck className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold">No deliveries found</p>
            <p className="text-xs text-slate-500">
              Approved sales orders will appear here once warehouse preparations are completed and
              delivery runs are scheduled.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 uppercase tracking-wider text-slate-400 bg-slate-800/50">
                  <th className="px-6 py-4">Shipment / Waybill</th>
                  <th className="px-6 py-4">Sales Order</th>
                  <th className="px-6 py-4">Customer & Destination</th>
                  <th className="px-6 py-4">Assigned Driver & Fleet</th>
                  <th className="px-6 py-4">Scheduled Date</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDeliveries.map((del) => {
                  const customerPerson = del.customer?.person || del.salesOrder?.customer?.person;
                  const customerOrg = del.customer?.organization || del.salesOrder?.customer?.organization;
                  const customerName = customerPerson
                    ? `${customerPerson.firstName} ${customerPerson.lastName}`
                    : customerOrg?.name || 'Customer';

                  return (
                    <tr key={del.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-100 block">
                          {del.deliveryNumber}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {del.items?.length || 0} line items
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {del.salesOrder ? (
                          <Link
                            to={`/sales-orders/${del.salesOrderId}`}
                            className="font-semibold text-indigo-300 hover:underline flex items-center gap-1"
                          >
                            <span>{del.salesOrder.orderNumber}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="font-mono text-slate-500">-</span>
                        )}
                      </td>

                      <td className="px-6 py-4 max-w-[220px]">
                        <p className="font-medium text-slate-100 truncate">{customerName}</p>
                        <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 flex-shrink-0 text-slate-500" />
                          <span>{del.deliveryAddress || 'Standard Destination'}</span>
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-200">
                          {del.driver?.person
                            ? `${del.driver.person.firstName} ${del.driver.person.lastName}`
                            : 'Driver'}
                        </p>
                        {del.vehicle ? (
                          <p className="font-mono text-[11px] text-indigo-300 mt-0.5">
                            {del.vehicle.plateNumber} ({del.vehicle.vehicleType || 'Fleet'})
                          </p>
                        ) : (
                          <span className="text-[11px] text-slate-500">Vehicle unassigned</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-slate-200 block">
                          {new Date(del.scheduledDate).toLocaleDateString()}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(del.scheduledDate).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            STATUS_BADGES[del.status] || 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {del.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {del.status === 'SCHEDULED' && isDriverOrAdmin && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => startMutation.mutate(del.id)}
                              disabled={startMutation.isPending}
                              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 py-1 px-3 shadow-md shadow-purple-600/20"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              Dispatch Run
                            </Button>
                          )}

                          {del.status === 'DISPATCHED' && isDriverOrAdmin && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenHandoverModal(del)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 py-1 px-3 shadow-md shadow-emerald-600/20"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Handover
                            </Button>
                          )}

                          {del.status === 'DELIVERED' && (
                            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Verified
                            </span>
                          )}

                          {del.salesOrderId && (
                            <Link to={`/sales-orders/${del.salesOrderId}`}>
                              <Button variant="secondary" size="sm" className="text-xs py-1 px-2.5">
                                View
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Confirm Handover Modal */}
      <Modal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        title="Confirm Delivery Handover"
        subtitle={`Waybill: ${selectedDelivery?.deliveryNumber || ''}`}
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
      >
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Recipient Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={handoverForm.recipientName}
              onChange={(e) =>
                setHandoverForm((prev) => ({ ...prev, recipientName: e.target.value }))
              }
              placeholder="Name of recipient"
              className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Proof of Delivery Method
            </label>
            <select
              value={handoverForm.proofType}
              onChange={(e) =>
                setHandoverForm((prev) => ({ ...prev, proofType: e.target.value }))
              }
              className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="SIGNATURE">Customer Signature</option>
              <option value="OFFICIAL_STAMP">Company / Official Stamp</option>
              <option value="PHOTO">Delivery Photo Verification</option>
              <option value="PHYSICAL_WAYBILL">Signed Paper Waybill</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Handover Remarks / Notes
            </label>
            <textarea
              rows={2}
              value={handoverForm.notes}
              onChange={(e) =>
                setHandoverForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="e.g. Received in good order, seals intact..."
              className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsHandoverModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={completeMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              {completeMutation.isPending ? 'Confirming...' : 'Confirm Delivery Handover'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
