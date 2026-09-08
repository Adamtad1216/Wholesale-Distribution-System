import { Sliders, Warehouse as WarehouseIcon, User, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';

export default function AdjustmentDetailModal({
  isOpen,
  onClose,
  adjustment,
}) {
  if (!adjustment) return null;

  const items = adjustment.items || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Adjustment Details #${adjustment.id?.slice(0, 8)}`}
      subtitle="Complete physical inventory count reconciliation audit record"
      icon={<Sliders className="w-5 h-5 text-violet-400" />}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex justify-end w-full">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Status and meta banner */}
        <div className="p-4 rounded-2xl bg-muted900/40 border border-border flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
              Audit Status
            </span>
            {getStatusBadge(adjustment.status)}
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
              Warehouse
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <WarehouseIcon className="w-3.5 h-3.5 text-violet-400" />
              <span>{adjustment.warehouse?.name}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
              Created Date
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{new Date(adjustment.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {adjustment.approver && (
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                Reviewed By
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span>
                  {adjustment.approver.person
                    ? `${adjustment.approver.person.firstName} ${adjustment.approver.person.lastName}`
                    : 'Manager'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Reason block */}
        <div className="p-3 rounded-xl border border-border/80 bg-card/60">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">
            Audit Reason
          </span>
          <p className="text-xs text-foreground font-medium">{adjustment.reason}</p>
        </div>

        {/* Line Items Table */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
            Audited Discrepancy Items ({items.length})
          </span>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted900/60 text-muted-foreground uppercase text-[10px] border-b border-border">
                <tr>
                  <th className="p-3 font-semibold">Product</th>
                  <th className="p-3 font-semibold text-right">System Qty</th>
                  <th className="p-3 font-semibold text-right">Actual Count</th>
                  <th className="p-3 font-semibold text-right">Variance</th>
                  <th className="p-3 font-semibold">Line Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.map((item) => {
                  const diff = Number(item.difference);
                  return (
                    <tr key={item.id} className="hover:bg-muted800/30">
                      <td className="p-3">
                        <span className="font-bold text-foreground block">
                          {item.product?.name}
                        </span>
                        {item.product?.sku && (
                          <span className="text-[10px] text-muted-foreground">
                            SKU: {item.product.sku}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-medium text-muted-foreground">
                        {item.systemQuantity}
                      </td>
                      <td className="p-3 text-right font-bold text-foreground">
                        {item.actualQuantity}
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${
                            diff > 0
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : diff < 0
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : 'bg-muted800 text-foreground border-border'
                          }`}
                        >
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground text-[11px]">
                        {item.reason || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
