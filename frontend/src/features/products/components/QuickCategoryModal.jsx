import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import SearchableSelect from '../../../components/ui/SearchableSelect';
import { productsApi } from '../productsApi';
import { toast } from 'react-hot-toast';

export default function QuickCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  defaultParentId = '',
  existingCategories = [],
}) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync with defaultParentId dynamically whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setParentId(defaultParentId || '');
      setName('');
      setDescription('');
    }
  }, [isOpen, defaultParentId]);

  const parentOptions = useMemo(() => [
    { value: '', label: 'None (Top-Level Category)' },
    ...existingCategories.map((c) => ({
      value: c.id,
      label: c.name,
    })),
  ], [existingCategories]);

  const selectedParent = useMemo(() => {
    return existingCategories.find((c) => c.id === parentId);
  }, [existingCategories, parentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        parentId: parentId || undefined,
        description: description.trim() || undefined,
      };

      const res = await productsApi.createCategory(payload);
      const created = res?.data || res;
      toast.success(`Category "${created.name || name}" created successfully`);
      setName('');
      setParentId('');
      setDescription('');
      if (onSuccess) {
        onSuccess(created);
      }
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedParent ? `Add Subcategory under ${selectedParent.name}` : 'Add New Category'}
      subtitle={
        selectedParent
          ? `Registering a new subcategory nested under "${selectedParent.name}"`
          : 'Register a new catalog classification or top-level category'
      }
      icon="📁"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Category Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Beverages, Dairy, Electronics"
            className="w-full px-3 py-2 bg-muted900 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Parent Category <span className="text-muted-foreground font-normal">(Optional)</span>
          </label>
          <SearchableSelect
            options={parentOptions}
            value={parentId}
            onChange={(val) => setParentId(val)}
            placeholder="Select parent category or None"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Leave as None to create a main category, or select a parent to nest as a subcategory.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Description <span className="text-muted-foreground font-normal">(Optional)</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the product category..."
            className="w-full px-3 py-2 bg-muted900 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={submitting || !name.trim()}>
            {submitting ? 'Creating...' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
