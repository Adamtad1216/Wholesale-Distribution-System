import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function DiscountRuleModal({
  isOpen,
  onClose,
  onSave,
  rule,
  products = [],
  categories = [],
  tiers = [],
  warehouses = [],
  isSaving,
}) {
  const [formData, setFormData] = useState({
    name: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minQuantity: '',
    productId: '',
    categoryId: '',
    priceTierId: '',
    warehouseId: '',
    priority: 10,
    status: 'ACTIVE',
    startsAt: '',
    endsAt: '',
  });

  const [testQty, setTestQty] = useState(10);
  const [testBasePrice, setTestBasePrice] = useState(500);

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        discountType: rule.discountType || 'PERCENTAGE',
        discountValue: rule.discountValue ?? '',
        minQuantity: rule.minQuantity ?? '',
        productId: rule.productId || '',
        categoryId: rule.categoryId || '',
        priceTierId: rule.priceTierId || '',
        warehouseId: rule.warehouseId || '',
        priority: rule.priority ?? 10,
        status: rule.status || 'ACTIVE',
        startsAt: rule.startsAt ? rule.startsAt.slice(0, 10) : '',
        endsAt: rule.endsAt ? rule.endsAt.slice(0, 10) : '',
      });
    } else {
      setFormData({
        name: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minQuantity: '',
        productId: '',
        categoryId: '',
        priceTierId: '',
        warehouseId: '',
        priority: 10,
        status: 'ACTIVE',
        startsAt: '',
        endsAt: '',
      });
    }
  }, [rule, isOpen]);

  // Simulated live calculation (wholesale per-unit calculation for FIXED_AMOUNT)
  const subtotal = testQty * testBasePrice;
  const val = Number(formData.discountValue) || 0;
  const meetsMin = !formData.minQuantity || testQty >= Number(formData.minQuantity);
  let simulatedSavings = 0;
  if (meetsMin && val > 0) {
    if (formData.discountType === 'PERCENTAGE') {
      simulatedSavings = subtotal * (val / 100);
    } else {
      simulatedSavings = Math.min(subtotal, Math.min(testBasePrice, val) * testQty);
    }
  }
  const finalTotal = subtotal - simulatedSavings;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.discountValue) return;

    onSave({
      ...formData,
      discountValue: Number(formData.discountValue),
      minQuantity: formData.minQuantity ? Number(formData.minQuantity) : null,
      productId: formData.productId || null,
      categoryId: formData.categoryId || null,
      priceTierId: formData.priceTierId || null,
      warehouseId: formData.warehouseId || null,
      priority: Number(formData.priority) || 0,
      startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
      endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={rule ? 'Edit Discount Rule' : 'Create New Discount Rule'}
      subtitle="Configure volume breaks, percentage allowances, and tier/category-specific wholesale discounts."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
            Rule Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Bulk Teff 50+ Bags Discount, VIP Wholesale 10% Allowance"
            className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
              Discount Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.discountType}
              onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            >
              <option value="PERCENTAGE">PERCENTAGE (%)</option>
              <option value="FIXED_AMOUNT">FIXED AMOUNT (ETB per Unit)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
              {formData.discountType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Value (ETB / Unit)'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              max={formData.discountType === 'PERCENTAGE' ? 100 : undefined}
              required
              value={formData.discountValue}
              onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
              placeholder={formData.discountType === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 50.00'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
              Minimum Quantity Threshold
            </label>
            <input
              type="number"
              min={0}
              step="1"
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
              placeholder="Leave blank for any quantity"
              className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition font-mono"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Trigger discount only when line quantity reaches this amount.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
              Priority Weight
            </label>
            <input
              type="number"
              min={0}
              max={1000}
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              If multiple discounts qualify, highest priority wins.
            </p>
          </div>
        </div>

        {/* Scope Restrictions (Optional) */}
        <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground/70">
            Scope & Targeting (Leave unselected for Global / All)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Target Product</label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value, categoryId: e.target.value ? '' : formData.categoryId })}
                className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Target Category</label>
              <select
                disabled={Boolean(formData.productId)}
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Target Price Tier</label>
              <select
                value={formData.priceTierId}
                onChange={(e) => setFormData({ ...formData, priceTierId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Price Tiers</option>
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Target Warehouse</label>
              <select
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
              Starts At
            </label>
            <input
              type="date"
              value={formData.startsAt}
              onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
              Ends At
            </label>
            <input
              type="date"
              value={formData.endsAt}
              onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
        </div>

        {/* Interactive Live Preview Box */}
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              ⚡ Live Rule Preview Simulator
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Test Qty:</span>
              <input
                type="number"
                min={1}
                value={testQty}
                onChange={(e) => setTestQty(Number(e.target.value) || 1)}
                className="w-16 px-2 py-0.5 rounded border border-border bg-card text-xs text-center"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-primary/10">
            <span className="text-muted-foreground">
              Subtotal: {subtotal.toLocaleString()} ETB ({testQty} × {testBasePrice} ETB)
            </span>
            <span>
              {meetsMin ? (
                <span className="text-emerald-500 font-bold">
                  -{simulatedSavings.toLocaleString()} ETB ({formData.discountType === 'PERCENTAGE' ? `${val}%` : 'Fixed'})
                </span>
              ) : (
                <span className="text-amber-500 font-medium">
                  Under minimum threshold ({formData.minQuantity} req.)
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-foreground pt-1">
            <span>Customer Payable Total:</span>
            <span className="text-sm font-mono text-primary">{finalTotal.toLocaleString()} ETB</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving || !formData.name.trim() || !formData.discountValue}
          >
            {isSaving ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
