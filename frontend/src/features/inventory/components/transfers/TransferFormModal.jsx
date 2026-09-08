import { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Warehouse as WarehouseIcon,
  Package,
  Layers,
  FileText,
} from 'lucide-react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';

const TRANSFER_REASONS = [
  { value: 'REBALANCING', label: 'Rebalancing Stock' },
  { value: 'RESTOCKING', label: 'Restocking Branch/Warehouse' },
  { value: 'DAMAGED_GOODS', label: 'Damaged Goods Relocation' },
  { value: 'STORE_REQUEST', label: 'Store / Retail Request' },
  { value: 'SEASONAL_ALLOCATION', label: 'Seasonal Stock Allocation' },
  { value: 'EXCESS_STOCK', label: 'Excess Stock Redistribution' },
  { value: 'OTHER', label: 'Other Purpose' },
];

export default function TransferFormModal({
  isOpen,
  onClose,
  onSubmit,
  warehouses = [],
  products = [],
  stocks = [],
  prefillSourceWarehouseId = '',
  prefillProductId = '',
  isSubmitting = false,
}) {
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [transferReason, setTransferReason] = useState('REBALANCING');
  const [remark, setRemark] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      const srcId = prefillSourceWarehouseId || warehouses[0]?.id || '';
      const pId = prefillProductId || products[0]?.id || '';

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFromWarehouseId(srcId);
      setToWarehouseId(''); // TO Warehouse unselected by default
      setProductId(pId);
      setQuantity(1);
      setTransferReason('REBALANCING');
      setRemark('');
      setErrors({});
    }
  }, [isOpen, prefillSourceWarehouseId, prefillProductId, warehouses, products]);

  const formatWarehouseOption = (w) =>
    `${w.name}${w.branch?.name ? ` (${w.branch.name})` : (w.code ? ` (${w.code})` : '')}`;

  // Compute available stock at source warehouse
  const sourceStock = stocks.find(
    (s) =>
      (s.warehouseId === fromWarehouseId || s.warehouse?.id === fromWarehouseId) &&
      (s.productId === productId || s.product?.id === productId)
  );
  const availableAtSource = sourceStock ? Number(sourceStock.availableQuantity) : 0;

  const validate = () => {
    const errs = {};
    if (!fromWarehouseId) errs.fromWarehouseId = 'Source warehouse is required';
    if (!toWarehouseId) errs.toWarehouseId = 'Destination warehouse is required';
    if (fromWarehouseId && toWarehouseId && fromWarehouseId === toWarehouseId) {
      errs.toWarehouseId = 'Destination must be different from source warehouse';
    }
    if (!productId) errs.productId = 'Product is required';
    if (!quantity || Number(quantity) <= 0) {
      errs.quantity = 'Transfer quantity must be greater than 0';
    } else if (Number(quantity) > availableAtSource) {
      errs.quantity = `Exceeds available stock (${availableAtSource} available)`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      fromWarehouseId,
      toWarehouseId,
      productId,
      quantity: Number(quantity),
      transferReason,
      remark: remark.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch Inter-Warehouse Stock Transfer"
      subtitle="Safely move inventory between facilities with automated stock deduction and arrival crediting"
      icon={<ArrowLeftRight className="w-5 h-5 text-sky-400" />}
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || availableAtSource <= 0}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Dispatching...
              </span>
            ) : (
              'Dispatch Transfer'
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source and Destination Warehouses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          {/* Source */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
              <WarehouseIcon className="w-3.5 h-3.5 text-rose-400" />
              <span>From Warehouse (Source)</span>
            </label>
            <select
              value={fromWarehouseId}
              onChange={(e) => {
                const newSourceId = e.target.value;
                setFromWarehouseId(newSourceId);
                if (newSourceId === toWarehouseId) {
                  setToWarehouseId('');
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition"
            >
              <option value="">Select Source...</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {formatWarehouseOption(w)}
                </option>
              ))}
            </select>
            {errors.fromWarehouseId && (
              <p className="text-xs text-rose-400 mt-1">{errors.fromWarehouseId}</p>
            )}
          </div>

          {/* Destination */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
              <WarehouseIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>To Warehouse (Destination)</span>
            </label>
            <select
              value={toWarehouseId}
              onChange={(e) => setToWarehouseId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition"
            >
              <option value="">Select Destination Facility...</option>
              {warehouses
                .filter((w) => !fromWarehouseId || w.id !== fromWarehouseId)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {formatWarehouseOption(w)}
                  </option>
                ))}
            </select>
            {errors.toWarehouseId && (
              <p className="text-xs text-rose-400 mt-1">{errors.toWarehouseId}</p>
            )}
          </div>
        </div>

        {/* Product Selection */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-sky-400" />
            <span>Product to Transfer</span>
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition"
          >
            <option value="">Select Product...</option>
            {products.map((p) => {
              const pStock = stocks.find(
                (s) =>
                  (s.warehouseId === fromWarehouseId || s.warehouse?.id === fromWarehouseId) &&
                  (s.productId === p.id || s.product?.id === p.id)
              );
              const avail = pStock ? Number(pStock.availableQuantity) : 0;
              return (
                <option key={p.id} value={p.id}>
                  {p.name} {p.sku ? `(SKU: ${p.sku})` : ''} {fromWarehouseId ? `• [${avail} avail]` : ''}
                </option>
              );
            })}
          </select>
          {errors.productId && (
            <p className="text-xs text-rose-400 mt-1">{errors.productId}</p>
          )}
        </div>

        {/* Live Source Stock Indicator */}
        <div className="p-3 rounded-xl bg-muted900/50 border border-border/80 flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            Available stock at selected source:
          </span>
          <span
            className={`text-sm font-black ${
              availableAtSource > 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {availableAtSource.toLocaleString()} units
          </span>
        </div>

        {/* Transfer Quantity & Reason */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Transfer Quantity
            </label>
            <input
              type="number"
              min="1"
              max={availableAtSource || undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition"
            />
            {errors.quantity && (
              <p className="text-xs text-rose-400 mt-1">{errors.quantity}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Transfer Purpose / Reason
            </label>
            <select
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition"
            >
              {TRANSFER_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Remark */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Shipping / Dispatch Note (Optional)</span>
          </label>
          <input
            type="text"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="e.g. Carrier details, pallet tags, urgent branch restocking..."
            className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition"
          />
        </div>
      </form>
    </Modal>
  );
}
