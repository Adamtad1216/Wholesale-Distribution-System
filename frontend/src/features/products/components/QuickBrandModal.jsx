import React, { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { productsApi } from '../productsApi';
import { toast } from 'react-hot-toast';

export default function QuickBrandModal({
  isOpen,
  onClose,
  onSuccess,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Brand name is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        status: 'ACTIVE',
      };

      const res = await productsApi.createBrand(payload);
      const created = res?.data || res;
      toast.success(`Brand "${created.name || name}" created successfully`);
      setName('');
      setDescription('');
      if (onSuccess) {
        onSuccess(created);
      }
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to create brand');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Brand"
      subtitle="Register a new manufacturer or product brand"
      icon="🏷️"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Brand Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Nestlé, Unilever, Samsung"
            className="w-full px-3 py-2 bg-muted900 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Description <span className="text-muted-foreground font-normal">(Optional)</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brand details, manufacturer overview..."
            className="w-full px-3 py-2 bg-muted900 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={submitting || !name.trim()}>
            {submitting ? 'Creating...' : 'Create Brand'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
