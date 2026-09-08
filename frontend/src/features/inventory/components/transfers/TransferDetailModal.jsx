import {
  ArrowLeftRight,
  ArrowRight,
  Warehouse as WarehouseIcon,
  Package,
  User,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';

export default function TransferDetailModal({
  isOpen,
  onClose,
  transfer,
  onOpenApprovalModal,
  canApprove = false,
}) {
  if (!transfer) return null;

  const isPending = transfer.status === 'PENDING';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Transfer Dispatch #${transfer.id?.slice(0, 8)}`}
      subtitle="Complete inter-warehouse movement audit record"
      icon={<ArrowLeftRight className="w-5 h-5 text-sky-400" />}
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          {isPending && canApprove && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenApprovalModal?.(transfer);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs transition flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Review & Authorize</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Status Badge Strip */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted900/40 border border-border text-xs">
          <span className="text-muted-foreground font-semibold">Approval Status:</span>
          {transfer.status === 'PENDING' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Authorization</span>
            </span>
          ) : transfer.status === 'APPROVED' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approved & Executed</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
              <XCircle className="w-3.5 h-3.5" />
              <span>Rejected</span>
            </span>
          )}
        </div>

        {/* Source to Destination Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-violet-500/10 border border-sky-500/20 flex items-center justify-between gap-3">
          {/* Source */}
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
              Source Facility
            </span>
            <div className="flex items-center gap-1.5 font-bold text-foreground truncate">
              <WarehouseIcon className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="truncate">{transfer.fromWarehouse?.name}</span>
            </div>
            {transfer.fromWarehouse?.code && (
              <span className="text-[10px] text-muted-foreground block">
                Code: {transfer.fromWarehouse.code}
              </span>
            )}
          </div>

          {/* Direction Indicator */}
          <div className="w-9 h-9 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Destination */}
          <div className="flex-1 min-w-0 text-right">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
              Destination Facility
            </span>
            <div className="flex items-center justify-end gap-1.5 font-bold text-foreground truncate">
              <WarehouseIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{transfer.toWarehouse?.name}</span>
            </div>
            {transfer.toWarehouse?.code && (
              <span className="text-[10px] text-muted-foreground block">
                Code: {transfer.toWarehouse.code}
              </span>
            )}
          </div>
        </div>

        {/* Product & Quantity Box */}
        <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-400 shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  {transfer.product?.name}
                </h4>
                {transfer.product?.sku && (
                  <span className="text-[11px] text-muted-foreground">
                    SKU: {transfer.product.sku}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block uppercase">
                Transferred Qty
              </span>
              <span className="text-xl font-black text-sky-400">
                {Number(transfer.quantity).toLocaleString()} units
              </span>
            </div>
          </div>
        </div>

        {/* Meta details */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-muted900/40 border border-border/80 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
              Reason / Category
            </span>
            <span className="font-bold text-foreground block">
              {transfer.transferReason?.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted900/40 border border-border/80 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
              Initiated Date
            </span>
            <span className="font-bold text-foreground block">
              {new Date(transfer.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Rejection reason if present */}
        {transfer.rejectionReason && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-1">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">
              Rejection Reason
            </span>
            <p className="font-medium">{transfer.rejectionReason}</p>
          </div>
        )}

        {/* Remark */}
        {transfer.remark && (
          <div className="p-3 rounded-xl bg-card border border-border/80 text-xs">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold block mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-sky-400" />
              <span>Dispatcher Remark</span>
            </span>
            <p className="text-foreground italic">{transfer.remark}</p>
          </div>
        )}

        {/* Approver / Reviewer info */}
        {transfer.approver && (
          <div className="p-3 rounded-xl bg-muted900/40 border border-border/80 text-xs flex items-center justify-between">
            <span className="text-muted-foreground">Authorized By:</span>
            <span className="font-bold text-foreground">
              {transfer.approver.person
                ? `${transfer.approver.person.firstName} ${transfer.approver.person.lastName}`
                : transfer.approver.username}
              {transfer.approvedAt && ` on ${new Date(transfer.approvedAt).toLocaleDateString()}`}
            </span>
          </div>
        )}

        {/* Dispatcher user */}
        {transfer.createdBy && (
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-2">
            <span>Requested by:</span>
            <span className="font-medium text-foreground">
              {transfer.createdBy.person
                ? `${transfer.createdBy.person.firstName} ${transfer.createdBy.person.lastName}`
                : transfer.createdBy.username}
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
