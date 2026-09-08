import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function SalesQuotaModal({
  isOpen,
  onClose,
  onSave,
  quota,
  customers = [],
  products = [],
  warehouses = [],
  tiers = [],
  isSaving,
}) {
  const [formData, setFormData] = useState({
    name: '',
    maxQuantity: '',
    period: 'MONTHLY',
    customerId: '',
    productId: '',
    warehouseId: '',
    priceTierId: '',
    status: 'ACTIVE',
    startsAt: '',
    endsAt: '',
  });

  useEffect(() => {
    if (quota) {
      setFormData({
        name: quota.name || '',
        maxQuantity: quota.maxQuantity ?? '',
        period: quota.period || 'MONTHLY',
        customerId: quota.customerId || '',
        productId: quota.productId || '',
        warehouseId: quota.warehouseId || '',
        priceTierId: quota.priceTierId || '',
        status: quota.status || 'ACTIVE',
        startsAt: quota.startsAt ? quota.startsAt.slice(0, 10) : '',
        endsAt: quota.endsAt ? quota.endsAt.slice(0, 10) : '',
      });
    } else {
      // Default to 1st of current month to end of month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

      setFormData({
        name: '',
        maxQuantity: '',
        period: 'MONTHLY',
        customerId: '',
        productId: '',
        warehouseId: '',
        priceTierId: '',
        status: 'ACTIVE',
        startsAt: firstDay,
        endsAt: lastDay,
      });
    }
  }, [quota, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.maxQuantity || !formData.startsAt || !formData.endsAt) return;

    onSave({
      ...formData,
      maxQuantity: Number(formData.maxQuantity),
      customerId: formData.customerId || null,
      productId: formData.productId || null,
      warehouseId: formData.warehouseId || null,
      priceTierId: formData.priceTierId || null,
      startsAt: new Date(formData.startsAt).toISOString(),
      endsAt: new Date(formData.endsAt).toISOString(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={quota ? 'Edit Sales Quota' : 'Define New Sales Quota Limit'}
      subtitle="Enforce maximum allocation caps per customer, product, or warehouse over a recurring period."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
            Quota Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Monthly Sugar Rationing, Teff Allocation Cap, Central Branch Weekly Max"
            className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
              Max Allocation Quantity <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.001"
              min={0.001}
              required
              value={formData.maxQuantity}
              onChange={(e) => setFormData({ ...formData, maxQuantity: e.target.value })}
              placeholder="e.g. 100 or 500.0"
              className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition font-mono"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Orders will be blocked if customer orders exceed this threshold within the period.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
              Quota Reset Period <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            >
              <option value="DAILY">DAILY</option>
              <option value="WEEKLY">WEEKLY</option>
              <option value="MONTHLY">MONTHLY</option>
              <option value="QUARTERLY">QUARTERLY</option>
              <option value="ANNUAL">ANNUAL</option>
              <option value="CUSTOM">CUSTOM DATE RANGE</option>
            </select>
          </div>
        </div>

        {/* Scope Restrictions */}
        <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground/70">
            Targeting & Enforced Scope (Leave unselected to apply to all)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Target Customer</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Customers (Global)</option>
                {customers.map((c) => {
                  const name =
                    c.customerType === 'ORGANIZATION'
                      ? c.organization?.name
                      : `${c.person?.firstName || ''} ${c.person?.lastName || ''}`.trim();
                  return (
                    <option key={c.id} value={c.id}>
                      {name || c.customerCode}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Target Product</label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
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
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
              Starts At <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.startsAt}
              onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
              Ends At <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
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

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving || !formData.name.trim() || !formData.maxQuantity || !formData.startsAt || !formData.endsAt}
          >
            {isSaving ? 'Saving...' : quota ? 'Update Quota' : 'Create Quota'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
