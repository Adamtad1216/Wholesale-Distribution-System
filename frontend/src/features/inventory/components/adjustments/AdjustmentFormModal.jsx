import { useState, useEffect } from 'react';
import {
  Sliders,
  Warehouse as WarehouseIcon,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';

export default function AdjustmentFormModal({
  isOpen,
  onClose,
  onSubmit,
  warehouses = [],
  products = [],
  stocks = [],
  prefillWarehouseId = '',
  prefillProductId = '',
  isSubmitting = false,
}) {
  const [warehouseId, setWarehouseId] = useState('');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState([
    { productId: '', actualQuantity: '', reason: '' },
  ]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      const initWId = prefillWarehouseId || warehouses[0]?.id || '';
      const initPId = prefillProductId || products[0]?.id || '';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWarehouseId(initWId);
      setReason('');
      setItems([{ productId: initPId, actualQuantity: '', reason: '' }]);
      setErrors({});
    }
  }, [isOpen, prefillWarehouseId, prefillProductId, warehouses, products]);

  // Lookup system stock for a product in the selected warehouse
  const getSystemStock = (pId) => {
    if (!warehouseId || !pId) return 0;
    const match = stocks.find(
      (s) =>
        (s.warehouseId === warehouseId || s.warehouse?.id === warehouseId) &&
        (s.productId === pId || s.product?.id === pId)
    );
    return match ? Number(match.quantity) : 0;
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { productId: products[0]?.id || '', actualQuantity: '', reason: '' },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const validate = () => {
    const errs = {};
    if (!warehouseId) errs.warehouseId = 'Warehouse is required';
    if (!reason.trim()) errs.reason = 'General adjustment reason is required';

    const itemErrs = [];
    items.forEach((item, idx) => {
      if (!item.productId) itemErrs.push(`Item #${idx + 1}: Product is required`);
      if (item.actualQuantity === '' || Number(item.actualQuantity) < 0) {
        itemErrs.push(`Item #${idx + 1}: Actual quantity must be 0 or greater`);
      }
    });
    if (itemErrs.length > 0) errs.items = itemErrs;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      warehouseId,
      reason: reason.trim(),
      items: items.map((item) => ({
        productId: item.productId,
        actualQuantity: Number(item.actualQuantity),
        reason: item.reason?.trim() || undefined,
      })),
    };

    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Stock Adjustment / Count Audit"
      subtitle="Reconcile physical inventory counts against system stocks. Upon manager approval, stock levels are synchronized."
      icon={<Sliders className="w-5 h-5 text-violet-400" />}
      maxWidth="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={handleAddItem}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-500/30 hover:bg-violet-500/10 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Another Product</span>
          </button>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting Audit...
                </span>
              ) : (
                'Submit for Review'
              )}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warehouse selection & General reason */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
              <WarehouseIcon className="w-3.5 h-3.5 text-violet-400" />
              <span>Audited Warehouse</span>
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition"
            >
              <option value="">Select Warehouse...</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}{w.branch?.name ? ` (${w.branch.name})` : (w.code ? ` (${w.code})` : '')}
                </option>
              ))}
            </select>
            {errors.warehouseId && (
              <p className="text-xs text-rose-400 mt-1">{errors.warehouseId}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-violet-400" />
              <span>Adjustment Reason / Audit Note</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. End of Month Physical Audit, Damaged stock..."
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition"
            />
            {errors.reason && (
              <p className="text-xs text-rose-400 mt-1">{errors.reason}</p>
            )}
          </div>
        </div>

        {/* Multi-Item Line Builder */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Discrepancy Line Items ({items.length})
            </span>
          </div>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {items.map((item, idx) => {
              const systemQty = getSystemStock(item.productId);
              const actualQty = item.actualQuantity === '' ? null : Number(item.actualQuantity);
              const difference = actualQty !== null ? actualQty - systemQty : null;

              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-border/80 bg-muted900/40 space-y-2.5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                    {/* Product */}
                    <div className="sm:col-span-5">
                      <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                        Product #{idx + 1}
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition"
                      >
                        <option value="">Select Product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.sku ? `(SKU: ${p.sku})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* System Stock */}
                    <div className="sm:col-span-2 text-center">
                      <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                        System Qty
                      </label>
                      <div className="py-1.5 px-2 rounded-lg bg-muted800 text-xs font-bold text-foreground border border-border/50">
                        {systemQty.toLocaleString()}
                      </div>
                    </div>

                    {/* Actual Physical Qty */}
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                        Actual Count
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.actualQuantity}
                        onChange={(e) => handleItemChange(idx, 'actualQuantity', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground text-center focus:outline-none focus:border-violet-500 transition"
                      />
                    </div>

                    {/* Computed Variance */}
                    <div className="sm:col-span-2 text-center">
                      <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                        Discrepancy
                      </label>
                      <div
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${
                          difference === null
                            ? 'bg-muted800 text-muted-foreground border-transparent'
                            : difference > 0
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : difference < 0
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : 'bg-muted800 text-foreground border-border'
                        }`}
                      >
                        {difference === null
                          ? '—'
                          : difference > 0
                          ? `+${difference}`
                          : difference}
                      </div>
                    </div>

                    {/* Remove Action */}
                    <div className="sm:col-span-1 pt-6 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-30"
                        title="Remove product row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Line reason */}
                  <input
                    type="text"
                    value={item.reason}
                    onChange={(e) => handleItemChange(idx, 'reason', e.target.value)}
                    placeholder="Optional note for this item discrepancy (e.g. expired units, counting error)..."
                    className="w-full px-2.5 py-1 rounded-lg border border-border/60 bg-card/60 text-[11px] text-muted-foreground focus:text-foreground focus:outline-none focus:border-violet-500 transition"
                  />
                </div>
              );
            })}
          </div>

          {errors.items && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-0.5">
              {errors.items.map((err, i) => (
                <p key={i}>• {err}</p>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
