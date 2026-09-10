import { useState, useEffect } from 'react';
import { Package, Warehouse as WarehouseIcon, Layers, ShieldAlert, RotateCcw, FileText } from 'lucide-react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';

export default function StockFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  warehouses = [],
  products = [],
  stocks = [],
  isSubmitting = false,
}) {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    warehouseId: '',
    productId: '',
    quantity: '',
    minimumStock: '',
    reorderLevel: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  const existingStock = !isEditing && stocks.find(
    (s) => (s.warehouseId === formData.warehouseId || s.warehouse?.id === formData.warehouseId) &&
           (s.productId === formData.productId || s.product?.id === formData.productId)
  );
  const isAdditional = Boolean(existingStock);

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        warehouseId: initialData.warehouseId || initialData.warehouse?.id || '',
        productId: initialData.productId || initialData.product?.id || '',
        quantity: Number(initialData.quantity) || 0,
        minimumStock:
          initialData.minimumStock !== undefined &&
          initialData.minimumStock !== null &&
          Number(initialData.minimumStock) > 0
            ? Number(initialData.minimumStock)
            : '',
        reorderLevel:
          initialData.reorderLevel !== undefined &&
          initialData.reorderLevel !== null &&
          Number(initialData.reorderLevel) > 0
            ? Number(initialData.reorderLevel)
            : '',
        notes: '',
      });
    } else {
      setFormData({
        warehouseId: warehouses[0]?.id || '',
        productId: products[0]?.id || '',
        quantity: '',
        minimumStock: '',
        reorderLevel: '',
        notes: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen, warehouses, products]);

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
    if (formData.quantity === '' || Number(formData.quantity) < 0) {
      errs.quantity = 'Quantity must be 0 or higher';
    }
    if (formData.minimumStock !== '' && Number(formData.minimumStock) < 0) {
      errs.minimumStock = 'Minimum stock cannot be negative';
    }
    if (formData.reorderLevel !== '' && Number(formData.reorderLevel) < 0) {
      errs.reorderLevel = 'Reorder level cannot be negative';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...formData,
      quantity: Number(formData.quantity) || 0,
      minimumStock:
        formData.minimumStock !== '' && formData.minimumStock !== null && formData.minimumStock !== undefined
          ? Math.max(0, Number(formData.minimumStock))
          : 0,
      reorderLevel:
        formData.reorderLevel !== '' && formData.reorderLevel !== null && formData.reorderLevel !== undefined
          ? Math.max(0, Number(formData.reorderLevel))
          : 0,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? 'Update Stock Levels'
          : isAdditional
          ? 'Add Additional Stock (Replenish)'
          : 'Add New Warehouse Stock'
      }
      subtitle={
        isEditing
          ? `Adjust quantities and safety thresholds for ${initialData?.product?.name || 'product'}`
          : isAdditional
          ? 'Add incoming stock units to existing inventory for this warehouse and log intake history'
          : 'Associate a product catalog item with a warehouse and set initial inventory'
      }
      icon={<Package className="w-5 h-5 text-violet-400" />}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : isEditing ? (
              'Save Changes'
            ) : isAdditional ? (
              'Add Additional Stock'
            ) : (
              'Create Stock'
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Existing Inventory Notice */}
        {isAdditional && (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 leading-relaxed flex items-start gap-2.5">
            <span className="text-base leading-none mt-0.5">📦</span>
            <div>
              <span className="text-blue-200">Existing Inventory Found:</span> Submitting will add this quantity to the current stock level ({Number(existingStock.quantity) || 0} units) and log the intake event in stock history.
            </div>
          </div>
        )}
        {/* Warehouse Selection */}
        <div>
          <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1.5">
            <WarehouseIcon className="w-3.5 h-3.5 text-violet-400" />
            <span>Warehouse</span>
          </label>
          {isEditing ? (
            <div className="p-2.5 rounded-xl border border-border bg-muted900/50 text-sm font-medium text-foreground">
              {initialData?.warehouse?.name}{initialData?.warehouse?.branch?.name ? ` (${initialData.warehouse.branch.name})` : (initialData?.warehouse?.code ? ` (${initialData.warehouse.code})` : '')}
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

        {/* Product Selection */}
        <div>
          <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-violet-400" />
            <span>Product Catalog Item</span>
          </label>
          {isEditing ? (
            <div className="p-2.5 rounded-xl border border-border bg-muted900/50 text-sm font-medium text-foreground">
              {initialData?.product?.name} {initialData?.product?.sku ? `• SKU: ${initialData.product.sku}` : ''}
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

        {/* Quantities Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Total Quantity */}
          <div>
            <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Total Qty</span>
            </label>
            <input
              type="number"
              name="quantity"
              min="0"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:border-violet-500 transition"
            />
            {errors.quantity && (
              <p className="text-xs text-rose-400 mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* Minimum Stock */}
          <div>
            <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1">
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
            {errors.minimumStock && (
              <p className="text-xs text-rose-400 mt-1">{errors.minimumStock}</p>
            )}
          </div>

          {/* Reorder Level */}
          <div>
            <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1">
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
            {errors.reorderLevel && (
              <p className="text-xs text-rose-400 mt-1">{errors.reorderLevel}</p>
            )}
          </div>
        </div>

        {/* Notes / Intake Reference */}
        <div>
          <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-violet-400" />
            <span>Intake Notes / Batch Reference (Optional)</span>
          </label>
          <input
            type="text"
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            placeholder="e.g. Batch #B-402, supplier PO intake, physical stock addition..."
            className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:border-violet-500 transition"
          />
        </div>

        {/* Informational helper */}
        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 leading-relaxed">
          <span>Tip:</span> Reorder Level triggers low stock alerts when available stock drops to or below this threshold. Minimum Stock represents the critical safety buffer.
        </div>
      </form>
    </Modal>
  );
}
