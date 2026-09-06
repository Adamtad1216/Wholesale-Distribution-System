import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { procurementApi } from '../procurementApi';
import { toast } from 'react-hot-toast';

export default function PurchaseOrdersTab({ refreshTrigger }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const res = await procurementApi.getPurchaseOrders({ limit: 100 });
      const rawData = res?.data?.purchaseOrders || res?.data || res || [];
      const list = Array.isArray(rawData) ? rawData : (rawData.data || []);
      setPurchaseOrders(list);
    } catch (err) {
      console.error('Failed to load purchase orders:', err);
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, [refreshTrigger]);

  // Filtered POs
  const filteredPos = purchaseOrders.filter((po) => {
    const matchesSearch =
      !search ||
      po.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
      po.supplier?.name?.toLowerCase().includes(search.toLowerCase()) ||
      po.warehouse?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Approve PO Action
  const handleApprovePo = async (id) => {
    try {
      setSubmittingAction(true);
      await procurementApi.approvePurchaseOrder(id);
      toast.success(`Purchase Order ${selectedPo?.poNumber || ''} approved successfully!`);
      setSelectedPo(null);
      fetchPurchaseOrders();
    } catch (err) {
      console.error('Failed to approve purchase order:', err);
      toast.error(err.response?.data?.message || 'Failed to approve Purchase Order');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Reject PO Action
  const handleRejectPo = async (id) => {
    try {
      setSubmittingAction(true);
      await procurementApi.rejectPurchaseOrder(id);
      toast.error(`Purchase Order ${selectedPo?.poNumber || ''} rejected.`);
      setSelectedPo(null);
      fetchPurchaseOrders();
    } catch (err) {
      console.error('Failed to reject purchase order:', err);
      toast.error(err.response?.data?.message || 'Failed to reject Purchase Order');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Helper for Status Badge
  const getSupplierName = (supplier) => {
    if (!supplier) return 'N/A';
    if (typeof supplier === 'string') return supplier;
    if (supplier.name) return supplier.name;
    if (supplier.companyName) return supplier.companyName;
    if (supplier.organization?.name) return supplier.organization.name;
    if (supplier.person) {
      const fullName = `${supplier.person.firstName || ''} ${supplier.person.lastName || ''}`.trim();
      if (fullName) return fullName;
    }
    if (supplier.contactPerson) return supplier.contactPerson;
    if (supplier.supplierCode) return supplier.supplierCode;
    return 'Supplier Vendor';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'RECEIVED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'COMPLETED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter & Toolbar */}
      <Card className="p-5 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-3 text-muted-foreground text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search PO Number, Supplier, or Warehouse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs font-semibold focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL" className="bg-[#0f172a] text-slate-100">All PO Statuses</option>
            <option value="PENDING" className="bg-[#0f172a] text-slate-100">⌛ Pending Approval</option>
            <option value="APPROVED" className="bg-[#0f172a] text-slate-100">✅ Approved</option>
            <option value="RECEIVED" className="bg-[#0f172a] text-slate-100">📦 Received</option>
            <option value="COMPLETED" className="bg-[#0f172a] text-slate-100">🎉 Completed</option>
            <option value="REJECTED" className="bg-[#0f172a] text-slate-100">❌ Rejected</option>
          </select>

          <Button variant="secondary" size="md" onClick={fetchPurchaseOrders}>
            🔄 Refresh
          </Button>
        </div>
      </Card>

      {/* PO Data Table */}
      <Card className="border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted800/80 border-b border-border text-muted-foreground uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4">PO Number</th>
                <th className="py-3.5 px-4">Supplier Vendor</th>
                <th className="py-3.5 px-4">Destination Warehouse</th>
                <th className="py-3.5 px-4 text-center">Order Date</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right pr-6">Total Value</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p>Loading purchase orders...</p>
                  </td>
                </tr>
              ) : filteredPos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                filteredPos.map((po) => (
                  <tr key={po.id} className="hover:bg-muted800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                      {po.poNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground">{getSupplierName(po.supplier)}</div>
                      <div className="text-[11px] text-muted-foreground">{po.supplier?.email || po.supplier?.phone || ''}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-foreground">{po.warehouse?.name || 'Main Warehouse'}</span>
                    </td>

                    <td className="py-3.5 px-4 text-center text-muted-foreground">
                      {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(po.status)}`}>
                        {po.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right pr-6 font-mono font-bold text-emerald-400">
                      {Number(po.total || 0).toLocaleString()} ETB
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => navigate(`/procurement/orders/${po.id}`)}
                      >
                        👁️ View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
