import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function PriceTierModal({ isOpen, onClose, onSave, tier, isSaving }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 0,
    isDefault: false,
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (tier) {
      setFormData({
        name: tier.name || '',
        description: tier.description || '',
        priority: tier.priority ?? 0,
        isDefault: Boolean(tier.isDefault),
        status: tier.status || 'ACTIVE',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        priority: 0,
        isDefault: false,
        status: 'ACTIVE',
      });
    }
  }, [tier, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave({
      ...formData,
      priority: Number(formData.priority) || 0,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tier ? 'Edit Price Tier' : 'Create New Price Tier'}
      subtitle="Define pricing hierarchy, default customer tiers, and priority weights."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
            Tier Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Wholesale, VIP Bulk, Distributor"
            className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wider">
            Description
          </label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional notes or eligibility criteria for this tier..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              Higher value gives precedence during tier matching.
            </p>
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

        <div className="pt-2">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/30 cursor-pointer transition">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">Set as Default Price Tier</p>
              <p className="text-xs text-muted-foreground">
                Assigned automatically to customers who have no explicit tier configuration.
              </p>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving || !formData.name.trim()}>
            {isSaving ? 'Saving...' : tier ? 'Update Tier' : 'Create Tier'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
