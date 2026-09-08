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
  warehouses = [],
  products = [],
  salesOrders = [],
  stocks = [],
  isSubmitting = false,
}) {
  const [salesOrderId, setSalesOrderId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSalesOrderId(salesOrders[0]?.id || '');
      setWarehouseId(warehouses[0]?.id || '');
      setProductId(products[0]?.id || '');
      setQuantity(1);
      setErrors({});
    }
  }, [isOpen, salesOrders, warehouses, products]);

  // Compute available stock
  const currentStock = stocks.find(
    (s) =>
      (s.warehouseId === warehouseId || s.warehouse?.id === warehouseId) &&
      (s.productId === productId || s.product?.id === productId)
  );
  const availableStock = currentStock ? Number(currentStock.availableQuantity) : 0;

  const validate = () => {
    const errs = {};
    if (!salesOrderId) errs.salesOrderId = 'Sales Order is required';
    if (!warehouseId) errs.warehouseId = 'Warehouse is required';
    if (!productId) errs.productId = 'Product is required';
    if (!quantity || Number(quantity) <= 0) {
      errs.quantity = 'Reservation quantity must be greater than 0';
    } else if (Number(quantity) > availableStock) {
      errs.quantity = `Exceeds available stock (${availableStock} available)`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      salesOrderId,
      warehouseId,
      productId,
      quantity: Number(quantity),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Stock Reservation"
      subtitle="Lock warehouse inventory exclusively for an approved or in-process sales order"
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
            disabled={isSubmitting || availableStock <= 0}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Reserving...
              </span>
            ) : (
              'Confirm Reservation'
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sales Order Selection */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Associated Sales Order</span>
          </label>
          <select
            value={salesOrderId}
            onChange={(e) => setSalesOrderId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition"
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
          <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
            <WarehouseIcon className="w-3.5 h-3.5 text-violet-400" />
            <span>Fulfillment Warehouse</span>
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

        {/* Product Selection */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-indigo-400" />
            <span>Product</span>
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition"
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
            className={`font-black ${
              availableStock > 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {availableStock.toLocaleString()} units
          </span>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Units to Reserve
          </label>
          <input
            type="number"
            min="1"
            max={availableStock || undefined}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="1"
            className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-violet-500 transition"
          />
          {errors.quantity && (
            <p className="text-xs text-rose-400 mt-1">{errors.quantity}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
