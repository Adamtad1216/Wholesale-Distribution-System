import { useState, useEffect } from 'react';
import {
  PackagePlus,
  Warehouse as WarehouseIcon,
  Package,
  FileText,
  Layers,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';

const REFERENCE_TYPES = [
  { value: 'MANUAL_INTAKE', label: 'Manual Intake / Replenishment' },
  { value: 'PURCHASE_RECEIPT', label: 'Purchase Receipt' },
  { value: 'GOODS_RECEIPT', label: 'Goods Receipt' },
  { value: 'ADJUSTMENT', label: 'Inventory Adjustment' },
  { value: 'INITIAL_STOCK', label: 'Initial Stock Balance' },
  { value: 'TRANSFER', label: 'Inter-Warehouse Transfer' },
  { value: 'OTHER', label: 'Other Stock Addition' },
];

export default function StockAdditionFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  warehouses = [],
  products = [],
  stocks = [],
  isSubmitting = false,
}) {
  const isEditing = Boolean(initialData?.id);

  const [formData, setFormData] = useState({
    warehouseId: '',
    productId: '',
    addedQuantity: '',
    notes: '',
    referenceType: 'MANUAL_INTAKE',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        warehouseId: initialData.warehouseId || initialData.warehouse?.id || warehouses[0]?.id || '',
        productId: initialData.productId || initialData.product?.id || products[0]?.id || '',
        addedQuantity: initialData.id ? (Number(initialData.addedQuantity) || '') : (initialData.addedQuantity || ''),
        notes: initialData.notes || '',
        referenceType: initialData.referenceType || 'MANUAL_INTAKE',
      });
    } else {
      setFormData({
        warehouseId: warehouses[0]?.id || '',
        productId: products[0]?.id || '',
        addedQuantity: '',
        notes: '',
        referenceType: 'MANUAL_INTAKE',
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

  const selectedWarehouse = warehouses.find(
    (w) => w.id === formData.warehouseId
  ) || initialData?.warehouse;

  const selectedProduct = products.find(
    (p) => p.id === formData.productId
  ) || initialData?.product;

  // Find current available stock from stocks array if available
  const currentStockEntry = stocks.find(
    (s) =>
      (s.warehouseId === formData.warehouseId || s.warehouse?.id === formData.warehouseId) &&
      (s.productId === formData.productId || s.product?.id === formData.productId)
  );

  const currentAvailable = currentStockEntry
    ? Number(currentStockEntry.availableQuantity || currentStockEntry.quantity || 0)
    : (Number(initialData?.warehouseStock?.availableQuantity || initialData?.previousTotalQty || 0));

  const numericAdded = Number(formData.addedQuantity) || 0;
  const newProjectedAvailable = isEditing
    ? Number(initialData?.previousTotalQty || 0) + numericAdded
    : currentAvailable + numericAdded;

  const validate = () => {
    const newErrors = {};
    if (!formData.warehouseId) {
      newErrors.warehouseId = 'Warehouse is required';
    }
    if (!formData.productId) {
      newErrors.productId = 'Product is required';
    }
    if (formData.addedQuantity === '' || Number(formData.addedQuantity) <= 0) {
      newErrors.addedQuantity = 'Quantity must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...formData,
      addedQuantity: Number(formData.addedQuantity),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Stock Addition' : 'Add Stock Quantity'}
      subtitle={
        isEditing
          ? `Modify recorded quantity and intake reference for ${selectedProduct?.name || 'product'}`
          : 'Record incoming inventory units to increase available warehouse stock'
      }
      icon={<PackagePlus className="w-5 h-5 text-emerald-500" />}
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
            ) : (
              'Add Quantity'
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warehouse Selection */}
        <div>
          <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1.5">
            <WarehouseIcon className="w-3.5 h-3.5 text-violet-400" />
            <span>Warehouse</span>
          </label>
          {isEditing ? (
            <div className="p-2.5 rounded-xl border border-border bg-muted900/50 text-sm font-medium text-foreground">
              {selectedWarehouse?.name}
              {selectedWarehouse?.branch?.name
                ? ` (${selectedWarehouse.branch.name})`
                : selectedWarehouse?.code
                ? ` (${selectedWarehouse.code})`
                : ''}
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
                  {w.name}
                  {w.branch?.name ? ` (${w.branch.name})` : w.code ? ` (${w.code})` : ''}
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
              {selectedProduct?.name} {selectedProduct?.sku ? `• SKU: ${selectedProduct.sku}` : ''}
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

        {/* Added Quantity and Reference Type Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Added Quantity */}
          <div>
            <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isEditing ? 'Quantity' : 'Quantity to Add'}</span>
            </label>
            <input
              type="number"
              name="addedQuantity"
              min="0.001"
              step="any"
              value={formData.addedQuantity}
              onChange={handleChange}
              placeholder="e.g. 100"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500 transition"
            />
            {errors.addedQuantity && (
              <p className="text-xs text-rose-400 mt-1">{errors.addedQuantity}</p>
            )}
          </div>

          {/* Reference Type */}
          <div>
            <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span>Reason / Reference Type</span>
            </label>
            {isEditing ? (
              <div className="p-2.5 rounded-xl border border-border bg-muted900/50 text-sm font-medium text-foreground truncate">
                {REFERENCE_TYPES.find((r) => r.value === formData.referenceType)?.label || formData.referenceType}
              </div>
            ) : (
              <select
                name="referenceType"
                value={formData.referenceType}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:border-violet-500 transition"
              >
                {REFERENCE_TYPES.map((rt) => (
                  <option key={rt.value} value={rt.value}>
                    {rt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Live Calculation Preview Banner */}
        {formData.productId && formData.warehouseId && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-medium text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Live Stock Level Impact</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-500/20 text-center">
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">
                  {isEditing ? 'Prev Total' : 'Current Stock'}
                </span>
                <span className="text-sm font-semibold font-mono text-foreground">
                  {(isEditing ? Number(initialData?.previousTotalQty || 0) : currentAvailable).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">
                  {isEditing ? 'New Added' : 'Addition'}
                </span>
                <span className="text-sm font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                  +{numericAdded.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">Projected Total</span>
                <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  {newProjectedAvailable.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Notes / Intake Reference */}
        <div>
          <label className="block text-xs font-normal text-foreground mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-violet-400" />
            <span>Intake Notes / Batch Reference (Optional)</span>
          </label>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            rows={3}
            placeholder="e.g. Batch #B-402, supplier PO intake, physical stock replenishment..."
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500 transition resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
