import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';

export default function ReleaseReservationModal({
  isOpen,
  onClose,
  reservation,
  onRelease,
  isSubmitting = false,
}) {
  const maxQuantity = Number(reservation?.quantity) || 1;
  const [quantity, setQuantity] = useState(maxQuantity);
  const [releaseMode, setReleaseMode] = useState('full'); // 'full' | 'partial'

  if (!reservation) return null;

  const handleConfirm = () => {
    const qtyToRelease = releaseMode === 'full' ? undefined : Number(quantity);
    onRelease(reservation.id, qtyToRelease);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Release Stock Reservation"
      subtitle={`Unlock inventory for sales order #${reservation.salesOrder?.orderNumber || reservation.salesOrderId?.slice(0, 8)} and return units to available stock`}
      icon={<RotateCcw className="w-5 h-5 text-amber-400" />}
      maxWidth="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Releasing...
              </span>
            ) : (
              'Confirm Release'
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Reservation summary card */}
        <div className="p-3.5 rounded-xl bg-muted900/50 border border-border space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Product:</span>
            <span className="font-bold text-foreground">
              {reservation.product?.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Warehouse:</span>
            <span className="font-semibold text-foreground">
              {reservation.warehouse?.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Currently Reserved:</span>
            <span className="font-black text-cyan-400">
              {maxQuantity.toLocaleString()} units
            </span>
          </div>
        </div>

        {/* Release mode radio */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-foreground">
            Release Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setReleaseMode('full');
                setQuantity(maxQuantity);
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                releaseMode === 'full'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-muted800/40 border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Full Release ({maxQuantity})
            </button>
            <button
              type="button"
              onClick={() => setReleaseMode('partial')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                releaseMode === 'partial'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-muted800/40 border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Partial Release
            </button>
          </div>
        </div>

        {/* Partial Quantity Input */}
        {releaseMode === 'partial' && (
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Quantity to Release
            </label>
            <input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition"
            />
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          Released units immediately become available for other sales orders or immediate fulfillment.
        </p>
      </div>
    </Modal>
  );
}
