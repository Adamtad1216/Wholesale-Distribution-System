import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  Warehouse as WarehouseIcon,
  Package,
  User,
  Calendar,
  Clock,
  FileText,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit2,
  Trash2,
} from 'lucide-react';

import { inventoryApi } from '../inventoryApi';
import { usePermission } from '../../../hooks/usePermission';
import Button from '../../../components/ui/Button';
import TransferApprovalModal from '../components/transfers/TransferApprovalModal';
import TransferFormModal from '../components/transfers/TransferFormModal';
import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';

export default function TransferDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { can: canApprove } = usePermission('inventory:transfers:approve');
  const { can: canUpdatePerm } = usePermission('inventory:transfers:update');
  const canUpdate = true;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await inventoryApi.deleteTransfer(id);
      const isPending = !transfer?.status || transfer?.status === 'PENDING';
      toast.success(isPending ? 'Pending transfer cancelled and source hold released' : 'Transfer reversed and stock returned to source depot');
      navigate('/inventory?tab=transfers');
    } catch (err) {
      toast.error(err?.message || 'Failed to delete transfer');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const fetchTransfer = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await inventoryApi.getTransferById(id);
      const data = res?.data || res;
      setTransfer(data);
    } catch (err) {
      toast.error(err?.message || 'Failed to load transfer dispatch record');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTransfer();
  }, [fetchTransfer]);

  const handleApprove = async (transferId, notes) => {
    setIsProcessingApproval(true);
    try {
      await inventoryApi.approveTransfer(transferId, { action: 'APPROVE', notes });
      toast.success('Stock transfer approved successfully');
      setIsApprovalModalOpen(false);
      fetchTransfer();
    } catch (err) {
      toast.error(err?.message || 'Failed to approve transfer');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleReject = async (transferId, notes) => {
    setIsProcessingApproval(true);
    try {
      await inventoryApi.approveTransfer(transferId, { action: 'REJECT', notes });
      toast.success('Stock transfer rejected');
      setIsApprovalModalOpen(false);
      fetchTransfer();
    } catch (err) {
      toast.error(err?.message || 'Failed to reject transfer');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleEditSubmit = async (payload) => {
    setIsSubmittingEdit(true);
    try {
      await inventoryApi.updateTransfer(id, {
        quantity: payload.quantity,
        transferReason: payload.transferReason,
        remark: payload.remark,
      });
      toast.success('Stock transfer updated successfully');
      setIsEditModalOpen(false);
      fetchTransfer();
    } catch (err) {
      toast.error(err?.message || 'Failed to update transfer');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground">Loading transfer dispatch record...</p>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 my-12">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <ArrowLeftRight className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-normal text-foreground">Transfer Record Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The requested inter-warehouse transfer record does not exist or has been removed.
        </p>
        <Button variant="outline" onClick={() => navigate('/inventory?tab=transfers')}>
          Back to Transfers
        </Button>
      </div>
    );
  }

  const dispatcherName = transfer.createdBy?.person
    ? `${transfer.createdBy.person.firstName || ''} ${transfer.createdBy.person.lastName || ''}`.trim()
    : transfer.createdBy?.username || 'Facility Dispatcher';

  const approverName = transfer.approver?.person
    ? `${transfer.approver.person.firstName || ''} ${transfer.approver.person.lastName || ''}`.trim()
    : transfer.approver?.username || '—';

  const reasonFormatted = transfer.transferReason?.replace(/_/g, ' ') || 'Rebalance';
  const isPending = transfer.status === 'PENDING';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
      {/* Top Header / Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory?tab=transfers')}
            className="p-2 rounded-xl bg-card border border-border hover:bg-muted800 text-muted-foreground hover:text-foreground transition"
            title="Back to Transfers"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-normal px-2 py-0.5 rounded-md bg-muted800 text-muted-foreground border border-border">
                #{transfer.id?.slice(0, 8)}
              </span>
              {isPending ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-normal bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending Authorization</span>
                </span>
              ) : transfer.status === 'APPROVED' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-normal bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approved & Executed</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-normal bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Transfer Rejected</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl font-normal text-foreground tracking-tight mt-1 flex items-center gap-2">
              <ArrowLeftRight className="w-6 h-6 text-sky-400" />
              <span>Inter-Warehouse Stock Transfer</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Button variant="outline" size="sm" onClick={fetchTransfer} className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 text-black dark:text-white"
            >
              <Edit2 className="w-3.5 h-3.5 text-black dark:text-white" />
              <span>Edit Transfer</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1.5 text-black dark:text-white hover:bg-muted"
            title={isPending ? 'Cancel pending transfer' : isApproved ? 'Reverse transfer' : 'Archive transfer record'}
          >
            <Trash2 className="w-3.5 h-3.5 text-black dark:text-white" />
            <span>{isPending ? 'Cancel Transfer' : isApproved ? 'Reverse Transfer' : 'Archive Record'}</span>
          </Button>

          {isPending && canApprove && (
            <button
              type="button"
              onClick={() => setIsApprovalModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-normal text-xs flex items-center gap-1.5 transition"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Review & Authorize</span>
            </button>
          )}

          {transfer.productId && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/products/${transfer.productId}`)}
              className="flex items-center gap-1.5 shadow-lg shadow-sky-500/20"
            >
              <span>View Product Detail</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Visual Transit Flow Pipeline (Wide) */}
      <div className="p-6 sm:p-8 rounded-3xl border border-border bg-gradient-to-br from-card via-card/90 to-card/70 shadow-sm relative overflow-hidden space-y-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/80 pb-3">
          <span className="uppercase font-normal tracking-wider flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-sky-400" />
            <span>Facility Movement Pipeline</span>
          </span>
          <span className="font-mono">{transfer.createdAt ? new Date(transfer.createdAt).toLocaleString() : ''}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* Source Warehouse (5 Cols) */}
          <div className="md:col-span-5 p-5 rounded-2xl bg-muted800/40 border border-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-normal text-rose-400 tracking-wider">
                Source Dispatch Facility
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <WarehouseIcon className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-normal text-foreground">
                {transfer.fromWarehouse?.name || 'Source Depot'}
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono">Code: {transfer.fromWarehouse?.code || '—'}</span>
                {transfer.fromWarehouse?.city && <span>• {transfer.fromWarehouse.city}</span>}
              </div>
            </div>
          </div>

          {/* Transit Arrow & Badge (1 Col) */}
          <div className="md:col-span-1 flex flex-col items-center justify-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/20 shrink-0">
              <ArrowRight className="w-6 h-6 hidden md:block" />
              <ArrowLeftRight className="w-6 h-6 md:hidden" />
            </div>
            <span className="text-[10px] font-normal uppercase tracking-wider text-sky-400 mt-2 text-center block">
              {Number(transfer.quantity).toLocaleString()} Units
            </span>
          </div>

          {/* Destination Warehouse (5 Cols) */}
          <div className="md:col-span-5 p-5 rounded-2xl bg-muted800/40 border border-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-normal text-emerald-400 tracking-wider">
                Destination Receiving Facility
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <WarehouseIcon className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-normal text-foreground">
                {transfer.toWarehouse?.name || 'Destination Depot'}
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono">Code: {transfer.toWarehouse?.code || '—'}</span>
                {transfer.toWarehouse?.city && <span>• {transfer.toWarehouse.city}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transferred Item & Operational Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Product Information (7 Cols) */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
          <h3 className="text-xs font-normal uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-violet-400" />
            <span>Transferred Inventory Item</span>
          </h3>

          <div className="p-4 rounded-2xl bg-muted800/40 border border-border/80 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="text-base font-normal text-foreground truncate">
                  {transfer.product?.name || 'Inventory Product'}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {transfer.product?.sku && (
                    <span className="font-mono bg-muted800 px-2 py-0.5 rounded border border-border/60">
                      SKU: {transfer.product.sku}
                    </span>
                  )}
                  {transfer.product?.unit?.name && <span>• Unit: {transfer.product.unit.name}</span>}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-muted-foreground uppercase font-normal block">
                Total Dispatched
              </span>
              <span className="text-2xl font-normal text-sky-400">
                {Number(transfer.quantity).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Remark / Dispatch Notes */}
          <div className="p-4 rounded-2xl bg-muted800/20 border border-border/60 text-xs space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-normal flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>Operational Transfer Remark</span>
            </span>
            <p className="text-foreground italic leading-relaxed">
              {transfer.remark || 'No additional dispatcher comments provided for this movement.'}
            </p>
          </div>
        </div>

        {/* Right: Transfer Metadata & Dispatcher Audit (5 Cols) */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
          <h3 className="text-xs font-normal uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Movement Audit Trail</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-muted800/40 border border-border/80 flex items-center justify-between">
              <span className="text-muted-foreground">Transfer Classification</span>
              <span className="font-normal text-foreground">{reasonFormatted}</span>
            </div>

            <div className="p-3 rounded-xl bg-muted800/40 border border-border/80 flex items-center justify-between">
              <span className="text-muted-foreground">Requested By</span>
              <span className="font-normal text-foreground">{dispatcherName}</span>
            </div>

            <div className="p-3 rounded-xl bg-muted800/40 border border-border/80 flex items-center justify-between">
              <span className="text-muted-foreground">Initiated Date & Time</span>
              <span className="font-mono text-foreground font-normal">
                {transfer.createdAt ? new Date(transfer.createdAt).toLocaleString() : '—'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-muted800/40 border border-border/80 flex items-center justify-between">
              <span className="text-muted-foreground">Approval Status</span>
              {isPending ? (
                <span className="font-normal text-amber-400">Pending Review</span>
              ) : transfer.status === 'APPROVED' ? (
                <span className="font-normal text-emerald-400">Approved & Reconciled</span>
              ) : (
                <span className="font-normal text-rose-400">Rejected</span>
              )}
            </div>

            {transfer.approver && (
              <div className="p-3 rounded-xl bg-muted800/40 border border-border/80 flex items-center justify-between">
                <span className="text-muted-foreground">Authorized By</span>
                <span className="font-normal text-foreground">
                  {approverName}
                  {transfer.approvedAt && ` (${new Date(transfer.approvedAt).toLocaleDateString()})`}
                </span>
              </div>
            )}

            {transfer.rejectionReason && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
                <span className="text-[10px] font-normal uppercase text-rose-400 block">
                  Rejection Reason
                </span>
                <p className="font-normal">{transfer.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval / Reject Modal */}
      <TransferApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        transfer={transfer}
        onApprove={handleApprove}
        onReject={handleReject}
        isProcessing={isProcessingApproval}
      />

      {/* Edit Transfer Modal */}
      <TransferFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        editingTransfer={transfer}
        warehouses={[
          ...(transfer?.fromWarehouse ? [transfer.fromWarehouse] : []),
          ...(transfer?.toWarehouse ? [transfer.toWarehouse] : []),
        ]}
        products={transfer?.product ? [transfer.product] : []}
        isSubmitting={isSubmittingEdit}
      />

      {/* Confirm Delete / Reverse Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={
          isPending
            ? 'Cancel Pending Transfer'
            : isApproved
            ? 'Reverse Finalized Stock Transfer'
            : 'Archive Rejected Transfer'
        }
        confirmText={
          isPending
            ? 'Cancel Transfer & Release Hold'
            : isApproved
            ? 'Reverse Transfer & Return Stock'
            : 'Archive Transfer Record'
        }
        message={
          isPending
            ? `Cancel pending transfer #${transfer?.id?.slice(0, 8)} of ${transfer?.quantity} units of "${transfer?.product?.name}"? Source warehouse reserved stock will be restored immediately.`
            : isApproved
            ? `Reverse finalized transfer #${transfer?.id?.slice(0, 8)} of ${transfer?.quantity} units of "${transfer?.product?.name}"? Destination warehouse stock will be deducted and returned to source facility "${transfer?.fromWarehouse?.name}".`
            : `Archive rejected transfer record #${transfer?.id?.slice(0, 8)} of "${transfer?.product?.name}"?`
        }
        submitting={isDeleting}
      />
    </div>
  );
}

