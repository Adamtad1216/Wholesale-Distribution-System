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
import inventoryApi from '../../inventoryApi';

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
  editingTransfer = null,
  warehouses = [],
  destinationWarehouses = [],
  products = [],
  stocks = [],
  prefillSourceWarehouseId = '',
  prefillProductId = '',
  isSubmitting = false,
}) {
  const isEdit = Boolean(editingTransfer);
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [transferReason, setTransferReason] = useState('REBALANCING');
  const [remark, setRemark] = useState('');
  const [errors, setErrors] = useState({});

  const [allDestWarehouses, setAllDestWarehouses] = useState([]);
  const [loadingDestWarehouses, setLoadingDestWarehouses] = useState(false);

  useEffect(() => {
    if (isOpen) {
      let isMounted = true;
      setLoadingDestWarehouses(true);
      inventoryApi
        .getWarehouses({ limit: 100, scope: 'all' })
        .then((res) => {
          if (!isMounted) return;
          const raw = res?.data || res;
          const list = Array.isArray(raw?.warehouses)
            ? raw.warehouses
            : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw)
            ? raw
            : [];
          setAllDestWarehouses(list);
        })
        .catch((err) => {
          console.error('Failed to load destination facilities', err);
        })
        .finally(() => {
          if (isMounted) setLoadingDestWarehouses(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (editingTransfer) {
        setFromWarehouseId(editingTransfer.fromWarehouseId || editingTransfer.fromWarehouse?.id || '');
        setToWarehouseId(editingTransfer.toWarehouseId || editingTransfer.toWarehouse?.id || '');
        setProductId(editingTransfer.productId || editingTransfer.product?.id || '');
        setQuantity(editingTransfer.quantity !== undefined ? editingTransfer.quantity : 1);
        setTransferReason(editingTransfer.transferReason || 'REBALANCING');
        setRemark(editingTransfer.remark || '');
        setErrors({});
      } else {
        const srcId = prefillSourceWarehouseId || warehouses[0]?.id || '';
        const pId = prefillProductId || products[0]?.id || '';

        setFromWarehouseId(srcId);
        setToWarehouseId(''); // TO Warehouse unselected by default
        setProductId(pId);
        setQuantity(1);
        setTransferReason('REBALANCING');
        setRemark('');
        setErrors({});
      }
    }
  }, [isOpen, editingTransfer, prefillSourceWarehouseId, prefillProductId, warehouses, products]);

  const formatWarehouseOption = (w) =>
    `${w.name}${w.branch?.name ? ` (${w.branch.name})` : (w.code ? ` (${w.code})` : '')}`;

  // Compute available stock at source warehouse (adding back existing held transfer quantity if editing)
  const sourceStock = stocks.find(
    (s) =>
      (s.warehouseId === fromWarehouseId || s.warehouse?.id === fromWarehouseId) &&
      (s.productId === productId || s.product?.id === productId)
  );
  const existingTransferHold = isEdit && editingTransfer?.fromWarehouseId === fromWarehouseId && editingTransfer?.productId === productId
    ? Number(editingTransfer.quantity) || 0
    : 0;
  const availableAtSource = (sourceStock ? Number(sourceStock.availableQuantity) : 0) + existingTransferHold;

  const isPending = !editingTransfer || editingTransfer.status === 'PENDING';

  const validate = () => {
    const errs = {};
    if (isPending) {
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
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (isPending) {
      onSubmit({
        fromWarehouseId,
        toWarehouseId,
        productId,
        quantity: Number(quantity),
        transferReason,
        remark: remark.trim() || undefined,
      });
    } else {
      onSubmit({
        transferReason,
        remark: remark.trim() || undefined,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Inter-Warehouse Transfer' : 'Dispatch Inter-Warehouse Stock Transfer'}
      subtitle={
        isEdit
          ? (isPending ? 'Modify transfer quantity, reason, or remarks before authorization.' : 'Update transfer reason notes for this processed movement.')
          : 'Safely move inventory between facilities with automated stock deduction and arrival crediting'
      }
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
            disabled={isSubmitting || (isPending && availableAtSource <= 0)}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isEdit ? 'Saving Changes...' : 'Dispatching...'}
              </span>
            ) : isEdit ? (
              'Save Transfer Changes'
            ) : (
              'Dispatch Transfer'
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isPending && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
            Note: This transfer has already been {editingTransfer?.status?.toLowerCase()}. You can update the transfer reason and remarks, but route and dispatch quantity cannot be altered.
          </div>
        )}
        {/* Source and Destination Warehouses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          {/* Source */}
          <div>
            <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1.5">
              <WarehouseIcon className="w-3.5 h-3.5 text-rose-400" />
              <span>From Warehouse (Source)</span>
            </label>
            <select
              value={fromWarehouseId}
              disabled={isEdit}
              onChange={(e) => {
                const newSourceId = e.target.value;
                setFromWarehouseId(newSourceId);
                if (newSourceId === toWarehouseId) {
                  setToWarehouseId('');
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
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
            <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1.5">
              <WarehouseIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>To Warehouse (Destination)</span>
            </label>
            {(() => {
              const destFacilityPool =
                allDestWarehouses.length > 0
                  ? allDestWarehouses
                  : destinationWarehouses.length > 0
                  ? destinationWarehouses
                  : warehouses;
              const destinationOptions = destFacilityPool.filter(
                (w) => !fromWarehouseId || w.id !== fromWarehouseId
              );

              return (
                <select
                  value={toWarehouseId}
                  disabled={isEdit}
                  onChange={(e) => setToWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingDestWarehouses ? 'Loading destination facilities...' : 'Select Destination Facility...'}
                  </option>
                  {destinationOptions.map((w) => (
                    <option key={w.id} value={w.id}>
                      {formatWarehouseOption(w)}
                    </option>
                  ))}
                </select>
              );
            })()}
            {errors.toWarehouseId && (
              <p className="text-xs text-rose-400 mt-1">{errors.toWarehouseId}</p>
            )}
          </div>
        </div>

        {/* Product Selection */}
        <div>
          <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-sky-400" />
            <span>Product to Transfer</span>
          </label>
          <select
            value={productId}
            disabled={isEdit}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
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
            className={`text-sm font-normal ${availableAtSource > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
          >
            {availableAtSource.toLocaleString()} units
          </span>
        </div>

        {/* Transfer Quantity & Reason */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-normal text-foreground mb-1.5">
              Transfer Quantity
            </label>
            <input
              type="number"
              min="1"
              max={availableAtSource || undefined}
              value={quantity}
              disabled={!isPending}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {errors.quantity && (
              <p className="text-xs text-rose-400 mt-1">{errors.quantity}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-normal text-foreground mb-1.5">
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
          <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1.5">
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
