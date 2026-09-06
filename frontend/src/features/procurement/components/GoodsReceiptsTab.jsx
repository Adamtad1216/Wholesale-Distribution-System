import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { procurementApi } from '../procurementApi';
import { toast } from 'react-hot-toast';

export default function GoodsReceiptsTab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [goodsReceipts, setGoodsReceipts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Selected GR for Review / Approval
  const [selectedGr, setSelectedGr] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchGoodsReceipts = async () => {
    try {
      setLoading(true);
      const res = await procurementApi.getGoodsReceipts({ limit: 100 });
      const rawData = res?.data?.receipts || res?.data || res || [];
      const list = Array.isArray(rawData) ? rawData : (rawData.data || []);
      setGoodsReceipts(list);
    } catch (err) {
      console.error('Failed to load goods receipts:', err);
      toast.error('Failed to load goods receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoodsReceipts();
  }, []);

  // When an Approved PO is selected in Record GR Modal
  const handlePoSelectionChange = async (poId) => {
    setSelectedPoForGr(poId);
    if (!poId) {
      setGrFormItems([]);
      return;
    }

    try {
      const res = await procurementApi.getPurchaseOrderById(poId);
      const poData = res.data || res;
      const items = (poData.items || []).map((item) => ({
        productId: item.productId,
        productName: item.product?.name || `Product #${item.productId?.slice(0, 6)}`,
        orderedQuantity: item.quantity,
        receivedQuantity: item.quantity,
        damagedQuantity: 0,
        unitCost: item.unitPrice || 0,
      }));
      setGrFormItems(items);
    } catch (err) {
      console.error('Failed to fetch PO details:', err);
    }
  };

  // Handle evidence file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEvidenceFile(file);
      setEvidencePreview(URL.createObjectURL(file));
    }
  };

  // Create Goods Receipt (Pending)
  const handleCreateGoodsReceipt = async (e) => {
    e.preventDefault();
    if (!selectedPoForGr) {
      toast.error('Please select an Approved Purchase Order');
      return;
    }

    if (grFormItems.length === 0) {
      toast.error('No items found in selected Purchase Order');
      return;
    }

    try {
      setSubmittingGr(true);

      let evidenceUrl = null;
      if (evidenceFile) {
        try {
          const formData = new FormData();
          formData.append('file', evidenceFile);
          const uploadRes = await procurementApi.uploadEvidence(formData);
          evidenceUrl = uploadRes?.data?.fileUrl || uploadRes?.data?.url || uploadRes?.fileUrl;
        } catch (uploadErr) {
          console.warn('File upload fallback:', uploadErr);
          // Use temporary blob url if backend file service offline
          evidenceUrl = evidencePreview;
        }
      }

      const selectedPoObj = approvedPos.find((po) => po.id === selectedPoForGr);

      const payload = {
        purchaseOrderId: selectedPoForGr,
        warehouseId: selectedPoObj?.warehouseId,
        items: grFormItems.map((item) => ({
          productId: item.productId,
          orderedQuantity: Number(item.orderedQuantity),
          receivedQuantity: Number(item.receivedQuantity),
          damagedQuantity: Number(item.damagedQuantity || 0),
          unitCost: Number(item.unitCost || 0),
        })),
        evidenceUrl,
        notes: grNotes,
      };

      await procurementApi.createGoodsReceipt(payload);
      toast.success('Goods Receipt recorded successfully in PENDING status!');

      setIsRecordModalOpen(false);
      setSelectedPoForGr('');
      setGrFormItems([]);
      setEvidenceFile(null);
      setEvidencePreview('');
      setGrNotes('');
      fetchGoodsReceipts();
    } catch (err) {
      console.error('Failed to create Goods Receipt:', err);
      toast.error(err.response?.data?.message || 'Failed to record Goods Receipt');
    } finally {
      setSubmittingGr(false);
    }
  };

  // Approve Goods Receipt Action
  const handleApproveGr = async (id) => {
    try {
      setSubmittingAction(true);
      await procurementApi.approveGoodsReceipt(id);
      toast.success(`Goods Receipt approved and inventory stock updated!`);
      setSelectedGr(null);
      fetchGoodsReceipts();
    } catch (err) {
      console.error('Failed to approve Goods Receipt:', err);
      toast.error(err.response?.data?.message || 'Failed to approve Goods Receipt');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Reject Goods Receipt Action
  const handleRejectGr = async (id) => {
    try {
      setSubmittingAction(true);
      await procurementApi.rejectGoodsReceipt(id);
      toast.error(`Goods Receipt rejected.`);
      setSelectedGr(null);
      fetchGoodsReceipts();
    } catch (err) {
      console.error('Failed to reject Goods Receipt:', err);
      toast.error(err.response?.data?.message || 'Failed to reject Goods Receipt');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filtered GRs
  const filteredGrs = goodsReceipts.filter((gr) => {
    const matchesSearch =
      !search ||
      gr.receiptNumber?.toLowerCase().includes(search.toLowerCase()) ||
      gr.purchaseOrder?.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
      gr.warehouse?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || gr.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'PAID':
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <Card className="p-5 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-3 text-muted-foreground text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search GR Receipt Number, PO Number, or Warehouse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs font-semibold focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL" className="bg-[#0f172a] text-slate-100">All GR Statuses</option>
            <option value="PENDING" className="bg-[#0f172a] text-slate-100">⌛ Pending</option>
            <option value="PAID" className="bg-[#0f172a] text-slate-100">💳 Paid</option>
            <option value="APPROVED" className="bg-[#0f172a] text-slate-100">✅ Approved</option>
            <option value="REJECTED" className="bg-[#0f172a] text-slate-100">❌ Rejected</option>
          </select>

          <Button
            variant="secondary"
            size="md"
            onClick={fetchGoodsReceipts}
          >
            🔄 Refresh
          </Button>
        </div>
      </Card>

      {/* Goods Receipts Data Table */}
      <Card className="border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted800/80 border-b border-border text-muted-foreground uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4">Receipt Number</th>
                <th className="py-3.5 px-4">Linked PO</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Warehouse</th>
                <th className="py-3.5 px-4 text-center">Received Date</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p>Loading goods receipts...</p>
                  </td>
                </tr>
              ) : filteredGrs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No goods receipts found.
                  </td>
                </tr>
              ) : (
                filteredGrs.map((gr) => (
                  <tr key={gr.id} className="hover:bg-muted800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                      {gr.receiptNumber}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                      {gr.purchaseOrder?.poNumber || 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-foreground">
                      {gr.purchaseOrder?.supplier?.name || gr.purchaseOrder?.supplier?.companyName || 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-foreground">
                      {gr.warehouse?.name || 'Main Warehouse'}
                    </td>

                    <td className="py-3.5 px-4 text-center text-muted-foreground">
                      {gr.receivedAt ? new Date(gr.receivedAt).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(gr.status)}`}>
                        {gr.status || 'PENDING'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => navigate(`/procurement/receipts/${gr.id}`)}
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
