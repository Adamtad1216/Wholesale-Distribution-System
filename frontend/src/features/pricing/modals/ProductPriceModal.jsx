import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function ProductPriceModal({
  isOpen,
  onClose,
  onSave,
  priceEntry,
  products = [],
  tiers = [],
  warehouses = [],
  isSaving,
}) {
  const [formData, setFormData] = useState({
    productId: '',
    priceTierId: '',
    warehouseId: '',
    unitPrice: '',
    status: 'ACTIVE',
    startsAt: '',
    endsAt: '',
  });

  useEffect(() => {
    if (priceEntry) {
      setFormData({
        productId: priceEntry.productId || '',
        priceTierId: priceEntry.priceTierId || '',
        warehouseId: priceEntry.warehouseId || '',
        unitPrice: priceEntry.unitPrice ?? '',
        status: priceEntry.status || 'ACTIVE',
        startsAt: priceEntry.startsAt ? priceEntry.startsAt.slice(0, 10) : '',
        endsAt: priceEntry.endsAt ? priceEntry.endsAt.slice(0, 10) : '',
      });
    } else {
      setFormData({
        productId: products[0]?.id || '',
        priceTierId: tiers[0]?.id || '',
        warehouseId: warehouses[0]?.id || '',
        unitPrice: '',
        status: 'ACTIVE',
        startsAt: '',
        endsAt: '',
      });
    }
  }, [priceEntry, isOpen, products, tiers, warehouses]);

  const selectedProduct = products.find((p) => p.id === formData.productId);
  const basePrice = selectedProduct?.sellingPrice ? Number(selectedProduct.sellingPrice) : null;
  const inputPrice = Number(formData.unitPrice);
  const priceDiff = basePrice && inputPrice ? inputPrice - basePrice : null;
  const priceDiffPercent = basePrice && inputPrice ? ((inputPrice - basePrice) / basePrice) * 100 : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.priceTierId || !formData.unitPrice) return;
    onSave({
      ...formData,
      warehouseId: formData.warehouseId || null,
      unitPrice: Number(formData.unitPrice),
      startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
      endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={priceEntry ? 'Edit Product Tier Price' : 'Set Product Tier Price Override'}
      subtitle="Define specific selling prices per product, price tier, and distribution warehouse (or global)."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
            Product <span className="text-rose-500">*</span>
          </label>
          <select
            required
            disabled={Boolean(priceEntry)}
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition disabled:opacity-60"
          >
            <option value="">Select a product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku || 'No SKU'}) - Base: {Number(p.sellingPrice || 0).toLocaleString()} ETB
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
              Price Tier <span className="text-rose-500">*</span>
            </label>
            <select
              required
              disabled={Boolean(priceEntry)}
              value={formData.priceTierId}
              onChange={(e) => setFormData({ ...formData, priceTierId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition disabled:opacity-60"
            >
              <option value="">Select tier...</option>
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
              Warehouse Scope
            </label>
            <select
              disabled={Boolean(priceEntry)}
              value={formData.warehouseId}
              onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition disabled:opacity-60"
            >
              <option value="">All Warehouses (Global Tier Price)</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
            Tier Unit Price (ETB) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min={0}
              required
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              placeholder="0.00"
              className="w-full pl-3.5 pr-14 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition font-mono"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
              ETB
            </span>
          </div>

          {basePrice && inputPrice > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Base Price: {basePrice.toLocaleString()} ETB</span>
              <span className="text-muted-foreground">→</span>
              <span
                className={`font-semibold ${
                  priceDiff < 0 ? 'text-emerald-500' : priceDiff > 0 ? 'text-amber-500' : 'text-foreground'
                }`}
              >
                {priceDiff < 0
                  ? `${priceDiffPercent.toFixed(1)}% discount`
                  : priceDiff > 0
                  ? `+${priceDiffPercent.toFixed(1)}% premium`
                  : 'Same as base'}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
              Effective Starts At
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
              Effective Ends At
            </label>
            <input
              type="date"
              value={formData.endsAt}
              onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>
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

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving || !formData.productId || !formData.priceTierId || !formData.warehouseId || !formData.unitPrice}
          >
            {isSaving ? 'Saving...' : priceEntry ? 'Update Price' : 'Set Price'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
