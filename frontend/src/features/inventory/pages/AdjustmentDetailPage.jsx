import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Sliders,
  Warehouse as WarehouseIcon,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  RefreshCw,
  FileText,
  Package,
  CheckCircle,
} from 'lucide-react';

import { inventoryApi } from '../inventoryApi';
import { usePermission } from '../../../hooks/usePermission';
import Button from '../../../components/ui/Button';

export default function AdjustmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [adjustment, setAdjustment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { can: canApprove } = usePermission('inventory:adjustments:approve');
  const { can: canDelete } = usePermission('inventory:adjustments:delete');

  const fetchAdjustment = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await inventoryApi.getAdjustmentById(id);
      const data = res?.data || res;
      setAdjustment(data);
    } catch (err) {
      toast.error(err?.message || 'Failed to load adjustment audit record');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAdjustment();
  }, [fetchAdjustment]);

  // Actions
  const handleApprove = async () => {
    if (!adjustment) return;
    setProcessing(true);
    try {
      await inventoryApi.approveAdjustment(adjustment.id, { status: 'APPROVED' });
      toast.success('Stock adjustment approved & warehouse balances updated');
      fetchAdjustment();
    } catch (err) {
      toast.error(err?.message || 'Failed to approve adjustment');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!adjustment) return;
    setProcessing(true);
    try {
      await inventoryApi.approveAdjustment(adjustment.id, {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim() || undefined,
      });
      toast.success('Stock adjustment marked as rejected');
      setRejectModalOpen(false);
      fetchAdjustment();
    } catch (err) {
      toast.error(err?.message || 'Failed to reject adjustment');
    } finally {
      setProcessing(false);
    }
  };

  const items = useMemo(() => {
    return Array.isArray(adjustment?.items) ? adjustment.items : [];
  }, [adjustment]);

  // Discrepancy metrics
  const stats = useMemo(() => {
    let totalItems = items.length;
    let posCount = 0;
    let negCount = 0;
    let netVariance = 0;

    items.forEach((item) => {
      const sys = Number(item.systemQuantity) || 0;
      const phys = Number(item.physicalQuantity ?? item.actualQuantity) || 0;
      const v = Number(item.variance ?? item.difference ?? (phys - sys)) || 0;
      netVariance += v;
      if (v > 0) posCount++;
      if (v < 0) negCount++;
    });

    return { totalItems, posCount, negCount, netVariance };
  }, [items]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved & Reconciled</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>Audit Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>Pending Review & Approval</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground">Loading stock adjustment audit details...</p>
      </div>
    );
  }

  if (!adjustment) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 my-12">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Adjustment Record Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The requested physical stock count adjustment does not exist or has been removed.
        </p>
        <Button variant="outline" onClick={() => navigate('/inventory?tab=adjustments')}>
          Back to Stock Adjustments
        </Button>
      </div>
    );
  }

  const isPending = adjustment.status === 'PENDING';
  const approverName = adjustment.approver?.person
    ? `${adjustment.approver.person.firstName || ''} ${adjustment.approver.person.lastName || ''}`.trim()
    : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
      {/* Top Header / Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory?tab=adjustments')}
            className="p-2 rounded-xl bg-card border border-border hover:bg-muted800 text-muted-foreground hover:text-foreground transition"
            title="Back to Stock Adjustments"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted800 text-muted-foreground border border-border">
                #{adjustment.id?.slice(0, 8)}
              </span>
              {getStatusBadge(adjustment.status)}
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight mt-1 flex items-center gap-2">
              <Sliders className="w-6 h-6 text-violet-400" />
              <span>Physical Count Adjustment Audit</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Button variant="outline" size="sm" onClick={fetchAdjustment} className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          {isPending && canApprove && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(true)}
                disabled={processing}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={processing}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve & Reconcile</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hero Cards: Facility, Scope, Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Depot Facility */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] uppercase font-bold tracking-wider">Depot Warehouse</span>
            <WarehouseIcon className="w-4 h-4 text-violet-400" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-base font-bold text-foreground truncate">
              {adjustment.warehouse?.name || 'Warehouse Depot'}
            </h4>
            <span className="text-xs text-muted-foreground font-mono">
              Code: {adjustment.warehouse?.code || '—'}
            </span>
          </div>
        </div>

        {/* Audit Scope / Reason */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] uppercase font-bold tracking-wider">Audit Classification</span>
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-base font-bold text-foreground line-clamp-1">{adjustment.reason || 'General Audit'}</h4>
            <span className="text-xs text-muted-foreground">Audit & discrepancy review</span>
          </div>
        </div>

        {/* Total Items Count */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] uppercase font-bold tracking-wider">Audited Catalog Items</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-2xl font-black text-foreground">{stats.totalItems}</h4>
            <span className="text-xs text-muted-foreground">
              {stats.posCount} positive, {stats.negCount} negative
            </span>
          </div>
        </div>

        {/* Net Discrepancy Units */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] uppercase font-bold tracking-wider">Net Stock Impact</span>
            <Sliders className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-0.5">
            <h4
              className={`text-2xl font-black font-mono ${
                stats.netVariance > 0
                  ? 'text-emerald-400'
                  : stats.netVariance < 0
                  ? 'text-rose-400'
                  : 'text-foreground'
              }`}
            >
              {stats.netVariance > 0 ? `+${stats.netVariance}` : stats.netVariance} units
            </h4>
            <span className="text-xs text-muted-foreground">Combined delta discrepancy</span>
          </div>
        </div>
      </div>

      {/* Items Discrepancy Table (Wide) */}
      <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Discrepancy Audit Itemization</h3>
            <p className="text-[11px] text-muted-foreground">
              Comparison between system registered balance and physical counted stock
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              +{stats.posCount} Surplus
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              -{stats.negCount} Shortage
            </span>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs">
            No line items attached to this adjustment audit record.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted900/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Catalog Product / SKU</th>
                  <th className="py-3 px-4 font-bold text-right">System Recorded</th>
                  <th className="py-3 px-4 font-bold text-right">Physical Counted</th>
                  <th className="py-3 px-4 font-bold text-center">Audit Variance</th>
                  <th className="py-3 px-4 font-bold">Reason / Finding</th>
                  <th className="py-3 px-4 font-bold">Auditor Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.map((item, idx) => {
                  const sys = Number(item.systemQuantity) || 0;
                  const phys = Number(item.physicalQuantity ?? item.actualQuantity) || 0;
                  const variance = Number(item.variance ?? item.difference ?? (phys - sys)) || 0;

                  return (
                    <tr key={item.id || idx} className="hover:bg-muted800/30 transition">
                      {/* Product */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-foreground block">
                              {item.product?.name || 'Product'}
                            </span>
                            {item.product?.sku && (
                              <span className="font-mono text-[10px] text-muted-foreground">
                                SKU: {item.product.sku}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* System Qty */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-muted-foreground">
                        {sys.toLocaleString()}
                      </td>

                      {/* Physical Qty */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                        {phys.toLocaleString()}
                      </td>

                      {/* Variance Badge */}
                      <td className="py-3.5 px-4 text-center font-mono font-black">
                        {variance > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            +{variance}
                          </span>
                        ) : variance < 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            {variance}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-muted800 text-muted-foreground border border-border">
                            0
                          </span>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 text-foreground font-medium">
                        {item.reason ? (
                          <span className="px-2 py-0.5 rounded bg-muted800/60 border border-border/80 text-[11px]">
                            {item.reason}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-3.5 px-4 text-muted-foreground max-w-xs truncate">
                        {item.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Trail Details Card */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3 text-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-violet-400" />
          <span>Audit Reviewer Trail</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-muted800/40 border border-border/80 space-y-1">
            <span className="text-[10px] text-muted-foreground block">Auditor Initiator</span>
            <strong className="text-foreground block">
              {adjustment.createdBy?.person
                ? `${adjustment.createdBy.person.firstName || ''} ${adjustment.createdBy.person.lastName || ''}`.trim()
                : adjustment.createdBy?.username || 'System Auditor'}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-muted800/40 border border-border/80 space-y-1">
            <span className="text-[10px] text-muted-foreground block">Initiation Timestamp</span>
            <strong className="text-foreground block font-mono">
              {adjustment.createdAt ? new Date(adjustment.createdAt).toLocaleString() : '—'}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-muted800/40 border border-border/80 space-y-1">
            <span className="text-[10px] text-muted-foreground block">Reviewing Authority</span>
            <strong className="text-foreground block">{approverName || (isPending ? 'Pending Assignment' : 'Manager')}</strong>
          </div>

          <div className="p-3 rounded-xl bg-muted800/40 border border-border/80 space-y-1">
            <span className="text-[10px] text-muted-foreground block">Resolution Date</span>
            <strong className="text-foreground block font-mono">
              {adjustment.approvedAt ? new Date(adjustment.approvedAt).toLocaleString() : '—'}
            </strong>
          </div>
        </div>
      </div>

      {/* Reject Confirmation Dialog */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Reject Stock Adjustment</h3>
                <p className="text-xs text-muted-foreground">Discrepancies will NOT be applied to warehouse stock</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block text-[11px] font-semibold text-foreground">
                Rejection Reason / Auditor Finding
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify reason for rejecting this count reconciliation audit..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setRejectModalOpen(false)} disabled={processing}>
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleReject}
                disabled={processing}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
