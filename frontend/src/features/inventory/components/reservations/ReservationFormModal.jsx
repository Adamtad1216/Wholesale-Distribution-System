import { useState, useEffect } from 'react';
import {
  BookmarkCheck,
  Warehouse as WarehouseIcon,
  Package,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';

export default function ReservationFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingReservation = null,
  warehouses = [],
  products = [],
  salesOrders = [],
  stocks = [],
  isSubmitting = false,
}) {
  const isEdit = Boolean(editingReservation);
  const [salesOrderId, setSalesOrderId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (editingReservation) {
        setSalesOrderId(editingReservation.salesOrderId || editingReservation.salesOrder?.id || '');
        setWarehouseId(editingReservation.warehouseId || editingReservation.warehouse?.id || '');
        setProductId(editingReservation.productId || editingReservation.product?.id || '');
        setQuantity(editingReservation.quantity !== undefined ? editingReservation.quantity : 1);
        setErrors({});
      } else {
        setSalesOrderId(salesOrders[0]?.id || '');
        setWarehouseId(warehouses[0]?.id || '');
        setProductId(products[0]?.id || '');
        setQuantity(1);
        setErrors({});
      }
    }
  }, [isOpen, editingReservation, salesOrders, warehouses, products]);

  // Compute available stock (adding back current held quantity if editing same stock item)
  const currentStock = stocks.find(
    (s) =>
      (s.warehouseId === warehouseId || s.warehouse?.id === warehouseId) &&
      (s.productId === productId || s.product?.id === productId)
  );
  const existingReservationHold = isEdit && editingReservation?.warehouseId === warehouseId && editingReservation?.productId === productId
    ? Number(editingReservation.quantity) || 0
    : 0;
  const availableStock = (currentStock ? Number(currentStock.availableQuantity) : 0) + existingReservationHold;

  const isReserved = !editingReservation || editingReservation.status === 'RESERVED';

  const validate = () => {
    const errs = {};
    if (!salesOrderId) errs.salesOrderId = 'Sales Order is required';
    if (isReserved) {
      if (!warehouseId) errs.warehouseId = 'Warehouse is required';
      if (!productId) errs.productId = 'Product is required';
      if (!quantity || Number(quantity) <= 0) {
        errs.quantity = 'Reservation quantity must be greater than 0';
      } else if (Number(quantity) > availableStock) {
        errs.quantity = `Exceeds available stock (${availableStock} available)`;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (isReserved) {
      onSubmit({
        salesOrderId,
        warehouseId,
        productId,
        quantity: Number(quantity),
      });
    } else {
      onSubmit({
        salesOrderId,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Stock Reservation' : 'Create Stock Reservation'}
      subtitle={
        isEdit
          ? (isReserved ? 'Update reserved inventory allocation for sales order fulfillment' : 'Update associated sales order for this reservation')
          : 'Lock warehouse inventory exclusively for an approved or in-process sales order'
      }
      icon={<BookmarkCheck className="w-5 h-5 text-cyan-400" />}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || (isReserved && availableStock <= 0)}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isEdit ? 'Saving Changes...' : 'Reserving...'}
              </span>
            ) : isEdit ? (
              'Save Reservation Changes'
            ) : (
              'Confirm Reservation'
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isReserved && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
            Note: This reservation has already been {editingReservation?.status?.toLowerCase()}. Warehouse and reserved quantity allocations cannot be modified.
          </div>
        )}
        {/* Sales Order Selection */}
        <div>
          <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Associated Sales Order</span>
          </label>
          <select
            value={salesOrderId}
            disabled={isEdit}
            onChange={(e) => setSalesOrderId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">Select Sales Order...</option>
            {salesOrders.map((so) => (
              <option key={so.id} value={so.id}>
                Order #{so.orderNumber || so.id?.slice(0, 8)} • Status: {so.status}
              </option>
            ))}
          </select>
          {errors.salesOrderId && (
            <p className="text-xs text-rose-400 mt-1">{errors.salesOrderId}</p>
          )}
        </div>

        {/* Warehouse Selection */}
        <div>
          <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1.5">
            <WarehouseIcon className="w-3.5 h-3.5 text-violet-400" />
            <span>Fulfillment Warehouse</span>
          </label>
          <select
            value={warehouseId}
            disabled={isEdit}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
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

        {/* Product Selection */}
        <div>
          <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-indigo-400" />
            <span>Product</span>
          </label>
          <select
            value={productId}
            disabled={isEdit}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">Select Product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.sku ? `(SKU: ${p.sku})` : ''}
              </option>
            ))}
          </select>
          {errors.productId && (
            <p className="text-xs text-rose-400 mt-1">{errors.productId}</p>
          )}
        </div>

        {/* Available Stock Display */}
        <div className="p-3 rounded-xl bg-muted900/50 border border-border/80 flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Available stock at warehouse:
          </span>
          <span
            className={`font-normal ${
              availableStock > 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {availableStock.toLocaleString()} units
          </span>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs font-normal text-foreground mb-1.5">
            Units to Reserve
          </label>
          <input
            type="number"
            min="1"
            max={availableStock || undefined}
            value={quantity}
            disabled={!isReserved}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="1"
            className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
          />
          {errors.quantity && (
            <p className="text-xs text-rose-400 mt-1">{errors.quantity}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
