import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function RegionFormModal({
  isOpen = false,
  onClose,
  onSave,
  region = null,
  submitting = false,
}) {
  const isEdit = Boolean(region && region.id);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (region) {
      setFormData({
        name: region.name || '',
        code: region.code || '',
        description: region.description || '',
        isActive: region.isActive !== false,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [region, isOpen]);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name?.trim()) errs.name = 'Region name is required';
    if (!formData.code?.trim()) errs.code = 'Region code is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Region: ${region.name}` : 'Add Geographic Region'}
      subtitle={isEdit ? 'Update regional territory parameters' : 'Define an operational zone or administrative region'}
      icon="📍"
      maxWidth="max-w-md"
      scope="workspace"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-foreground mb-1">
            Region Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Oromia Region"
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.name && <p className="text-[10px] text-rose-400 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-foreground mb-1">
            Region Code <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
            placeholder="e.g. REG-OROMIA"
            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.code && <p className="text-[10px] text-rose-400 mt-1">{errors.code}</p>}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-foreground mb-1">Description</label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Optional territorial notes or coverage details..."
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-muted800/50 border border-border">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span className="font-semibold text-foreground text-xs">Active Operational Territory</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Region'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
