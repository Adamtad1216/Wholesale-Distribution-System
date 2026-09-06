import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import ErrorBoundary from '../../../components/ui/ErrorBoundary';
import { procurementApi } from '../procurementApi';
import { toast } from 'react-hot-toast';

function OnDeliveryPoContent({ refreshTrigger }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [approvedOrders, setApprovedOrders] = useState([]);
  const [search, setSearch] = useState('');

  const fetchApprovedPurchaseOrders = async () => {
    try {
      setLoading(true);
      // Backend supports filtering by status=APPROVED
      const res = await procurementApi.getPurchaseOrders({ status: 'APPROVED', limit: 100 });
      const rawData = res?.data?.purchaseOrders || res?.data || res || [];
      const list = Array.isArray(rawData) ? rawData : (rawData.data || []);
      // Ensure only APPROVED status purchase orders are listed
      const approvedOnly = list.filter((po) => po.status === 'APPROVED');
      setApprovedOrders(approvedOnly);
    } catch (err) {
      console.error('Failed to load on-delivery purchase orders:', err);
      toast.error('Failed to load on-delivery purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedPurchaseOrders();
  }, [refreshTrigger]);

  // Helper for supplier name
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

  // Filtered on-delivery POs
  const filteredOrders = approvedOrders.filter((po) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const poNum = (po.poNumber || '').toLowerCase();
    const supName = getSupplierName(po.supplier).toLowerCase();
    const whName = (po.warehouse?.name || '').toLowerCase();
    return poNum.includes(q) || supName.includes(q) || whName.includes(q);
  });

  // Summary calculations
  const totalValue = approvedOrders.reduce((sum, po) => sum + Number(po.total || 0), 0);
  const uniqueSuppliersCount = new Set(approvedOrders.map((po) => po.supplierId || po.supplier?.id)).size;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">On_Delivery Purchase Orders</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {approvedOrders.length} In Transit
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Purchase orders approved and actively on delivery from suppliers awaiting warehouse goods receipt inspection.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={fetchApprovedPurchaseOrders}>
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border border-border bg-card900 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">On-Delivery Orders</p>
          <p className="text-2xl font-extrabold text-foreground">{approvedOrders.length}</p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Approved & In Transit
          </p>
        </Card>
        <Card className="p-5 border border-border bg-card900 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Committed Delivery Value</p>
          <p className="text-2xl font-extrabold text-indigo-400">{totalValue.toLocaleString()} ETB</p>
          <p className="text-[11px] text-muted-foreground mt-1">Pending arrival at warehouse</p>
        </Card>
        <Card className="p-5 border border-border bg-card900 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Suppliers Fulfilling</p>
          <p className="text-2xl font-extrabold text-cyan-400">{uniqueSuppliersCount}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Active vendor partners</p>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 border border-border bg-card900 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3.5 top-3 text-muted-foreground text-sm">🔍</span>
          <input
            type="text"
            placeholder="Filter On-Delivery POs by PO number, Supplier, or Warehouse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
          Showing <span className="text-foreground font-bold">{filteredOrders.length}</span> of {approvedOrders.length} Orders
        </div>
      </Card>

      {/* On-Delivery Orders Table */}
      <Card className="border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted800/80 border-b border-border text-muted-foreground uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4">PO Number</th>
                <th className="py-3.5 px-4">Supplier Vendor</th>
                <th className="py-3.5 px-4">Destination Warehouse</th>
                <th className="py-3.5 px-4 text-center">Approved / Order Date</th>
                <th className="py-3.5 px-4 text-center">Fulfillment Status</th>
                <th className="py-3.5 px-4 text-right pr-6">Order Total</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p>Loading on-delivery purchase orders...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    <div className="text-4xl mb-3">🚚</div>
                    <p className="text-base font-bold text-foreground mb-1">No On-Delivery Purchase Orders</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      {search
                        ? 'No purchase orders match your search query.'
                        : 'Approved purchase orders awaiting warehouse delivery and goods receipt will appear here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-muted800/30 transition group">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => navigate(`/procurement/orders/${po.id}`)}
                        className="font-mono font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1.5 text-left group-hover:underline"
                        title="Click to view purchase order details"
                      >
                        <span>🚚</span>
                        <span>{po.poNumber}</span>
                      </button>
                      <div className="text-[10px] text-muted-foreground font-mono">{po.id.slice(0, 12)}...</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground">{getSupplierName(po.supplier)}</div>
                      <div className="text-[11px] text-muted-foreground">{po.supplier?.email || po.supplier?.phone || 'Supplier Partner'}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        <span>🏬</span> {po.warehouse?.name || 'Main Warehouse'}
                      </span>
                      {po.warehouse?.location && (
                        <div className="text-[10px] text-muted-foreground">{po.warehouse.location}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap text-muted-foreground">
                      <div className="font-semibold text-foreground">
                        {po.approvedAt ? new Date(po.approvedAt).toLocaleDateString() : (po.createdAt ? new Date(po.createdAt).toLocaleDateString() : 'N/A')}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {po.createdAt ? `Ordered ${new Date(po.createdAt).toLocaleDateString()}` : ''}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        On Delivery
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right pr-6 font-mono font-bold text-emerald-400 text-sm whitespace-nowrap">
                      {Number(po.total || 0).toLocaleString()} ETB
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => navigate(`/procurement/receipts/new?poId=${po.id}`, { state: { selectedPoId: po.id } })}
                        className="font-bold shadow-md shadow-indigo-500/20 px-3.5 py-1.5 inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                        title="Automatically open Goods Receipt recording for this purchase order"
                      >
                        <span className="flex-shrink-0 text-xs">📦</span>
                        <span className="whitespace-nowrap">Create GR</span>
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

export default function OnDeliveryPoTab(props) {
  return (
    <ErrorBoundary>
      <OnDeliveryPoContent {...props} />
    </ErrorBoundary>
  );
}
