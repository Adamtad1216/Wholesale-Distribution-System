import { useState, useEffect } from 'react';
import { Package, Warehouse as WarehouseIcon, ShieldAlert, RotateCcw, Info, AlertTriangle } from 'lucide-react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';

export default function StockFormModal({
  isOpen,
  onClose,
  onSubmit,
  onSave,
  initialData = null,
  stock = null,
  warehouses = [],
  products = [],
  stocks = [],
  isSubmitting = false,
  submitting = false,
}) {
  const isEditing = Boolean(initialData || stock);
  const targetStock = initialData || stock;
  const isLoading = isSubmitting || submitting;
  const handleSubmitCallback = onSubmit || onSave;

  const [formData, setFormData] = useState({
    warehouseId: '',
    productId: '',
    minimumStock: '',
    reorderLevel: '',
  });

  const [errors, setErrors] = useState({});

  // Check if this product is already registered in the selected warehouse (when creating)
  const existingStock = !isEditing && stocks.find(
    (s) =>
      (s.warehouseId === formData.warehouseId || s.warehouse?.id === formData.warehouseId) &&
      (s.productId === formData.productId || s.product?.id === formData.productId) &&
      !s.isArchived
  );

  useEffect(() => {
    if (targetStock) {
      setFormData({
        warehouseId: targetStock.warehouseId || targetStock.warehouse?.id || '',
        productId: targetStock.productId || targetStock.product?.id || '',
        minimumStock:
          targetStock.minimumStock !== undefined &&
          targetStock.minimumStock !== null &&
          Number(targetStock.minimumStock) > 0
            ? Number(targetStock.minimumStock)
            : '',
        reorderLevel:
          targetStock.reorderLevel !== undefined &&
          targetStock.reorderLevel !== null &&
          Number(targetStock.reorderLevel) > 0
            ? Number(targetStock.reorderLevel)
            : '',
      });
    } else {
      setFormData({
        warehouseId: warehouses[0]?.id || '',
        productId: products[0]?.id || '',
        minimumStock: '',
        reorderLevel: '',
      });
    }
    setErrors({});
  }, [targetStock, isOpen, warehouses, products]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!isEditing && !formData.warehouseId) {
      errs.warehouseId = 'Warehouse is required';
    }
    if (!isEditing && !formData.productId) {
      errs.productId = 'Product is required';
    }
    if (formData.minimumStock !== '' && Number(formData.minimumStock) < 0) {
      errs.minimumStock = 'Minimum stock cannot be negative';
    }
    if (formData.reorderLevel !== '' && Number(formData.reorderLevel) < 0) {
      errs.reorderLevel = 'Reorder level cannot be negative';
    }
    if (!isEditing && existingStock) {
      errs.productId = 'This product is already registered in the selected warehouse';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (handleSubmitCallback) {
      handleSubmitCallback({
        warehouseId: formData.warehouseId,
        productId: formData.productId,
        quantity: 0,
        minimumStock:
          formData.minimumStock !== '' && formData.minimumStock !== null && formData.minimumStock !== undefined
            ? Math.max(0, Number(formData.minimumStock))
            : 0,
        reorderLevel:
          formData.reorderLevel !== '' && formData.reorderLevel !== null && formData.reorderLevel !== undefined
            ? Math.max(0, Number(formData.reorderLevel))
            : 0,
      });
    }
  };

  const selectedWarehouse = warehouses.find((w) => w.id === formData.warehouseId);
  const selectedProduct = products.find((p) => p.id === formData.productId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Configure Safety Stock' : 'Add New Warehouse Stock'}
      subtitle={
        isEditing
          ? `Adjust safety buffer and reorder thresholds for ${targetStock?.product?.name || 'product'}`
          : 'Associate a product catalog item with a warehouse and set safety stock thresholds'
      }
      icon={<Package className="w-5 h-5 text-violet-400" />}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoading || (!isEditing && Boolean(existingStock))}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : isEditing ? (
              'Save Thresholds'
            ) : (
              'Register Stock'
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Notice if product is already in this warehouse */}
        {!isEditing && existingStock && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-200">Already Registered:</span> This product already has a stock record in{' '}
              <strong>{existingStock.warehouse?.name || selectedWarehouse?.name || 'this warehouse'}</strong> (Current available: {Number(existingStock.availableQuantity ?? existingStock.quantity ?? 0)} units). Use the <strong>Stock Additions</strong> tab to add incoming quantity.
            </div>
          </div>
        )}

        {/* Warehouse Selection / Display */}
        <div>
          <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1.5">
            <WarehouseIcon className="w-3.5 h-3.5 text-violet-400" />
            <span>Warehouse</span>
          </label>
          {isEditing ? (
            <div className="p-3 rounded-xl border border-border bg-muted900/50 text-sm font-medium text-foreground flex items-center justify-between">
              <span>
                {targetStock?.warehouse?.name}
                {targetStock?.warehouse?.branch?.name ? ` (${targetStock.warehouse.branch.name})` : (targetStock?.warehouse?.code ? ` (${targetStock.warehouse.code})` : '')}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-muted800 text-muted-foreground border border-border/50">
                {targetStock?.warehouse?.code || 'WH'}
              </span>
            </div>
          ) : (
            <select
              name="warehouseId"
              value={formData.warehouseId}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:border-violet-500 transition"
            >
              <option value="">Select a warehouse...</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}{w.branch?.name ? ` (${w.branch.name})` : (w.code ? ` (${w.code})` : '')}
                </option>
              ))}
            </select>
          )}
          {errors.warehouseId && (
            <p className="text-xs text-rose-400 mt-1">{errors.warehouseId}</p>
          )}
        </div>

        {/* Product Selection / Display */}
        <div>
          <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-violet-400" />
            <span>Product Catalog Item</span>
          </label>
          {isEditing ? (
            <div className="p-3 rounded-xl border border-border bg-muted900/50 text-sm font-medium text-foreground flex items-center justify-between">
              <span>{targetStock?.product?.name}</span>
              {targetStock?.product?.sku && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  {targetStock.product.sku}
                </span>
              )}
            </div>
          ) : (
            <select
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:border-violet-500 transition"
            >
              <option value="">Select a product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.sku ? `(SKU: ${p.sku})` : ''}
                </option>
              ))}
            </select>
          )}
          {errors.productId && (
            <p className="text-xs text-rose-400 mt-1">{errors.productId}</p>
          )}
        </div>

        {/* Thresholds Row (2 columns: Min Stock and Reorder Level) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Minimum Stock */}
          <div>
            <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Min Stock (Optional)</span>
            </label>
            <input
              type="number"
              name="minimumStock"
              min="0"
              value={formData.minimumStock}
              onChange={handleChange}
              placeholder="0 (Unset)"
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:border-violet-500 transition"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Critical emergency safety buffer</p>
            {errors.minimumStock && (
              <p className="text-xs text-rose-400 mt-1">{errors.minimumStock}</p>
            )}
          </div>

          {/* Reorder Level */}
          <div>
            <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reorder Level (Optional)</span>
            </label>
            <input
              type="number"
              name="reorderLevel"
              min="0"
              value={formData.reorderLevel}
              onChange={handleChange}
              placeholder="0 (Unset)"
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:border-violet-500 transition"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Triggers low-stock replenishment alert</p>
            {errors.reorderLevel && (
              <p className="text-xs text-rose-400 mt-1">{errors.reorderLevel}</p>
            )}
          </div>
        </div>

        {/* Informational helper banner */}
        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-violet-200">Inventory Tracking:</span> Stock quantities are tracked through the <strong className="text-emerald-400">Stock Additions</strong> tab, goods receipts, and approved transfers. Registering a product here sets up warehouse association and safety thresholds.
          </div>
        </div>
      </form>
    </Modal>
  );
}
