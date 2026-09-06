import React, { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { productsApi } from '../productsApi';
import { toast } from 'react-hot-toast';

export default function QuickUnitModal({
  isOpen,
  onClose,
  onSuccess,
}) {
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Unit name is required');
      return;
    }
    if (!abbreviation.trim()) {
      toast.error('Unit abbreviation is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        abbreviation: abbreviation.trim(),
      };

      const res = await productsApi.createUnit(payload);
      const created = res?.data || res;
      toast.success(`Unit "${created.name || name}" created successfully`);
      setName('');
      setAbbreviation('');
      if (onSuccess) {
        onSuccess(created);
      }
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to create unit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Unit of Measure"
      subtitle="Register a new packaging or stock measurement unit"
      icon="⚖️"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Unit Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kilogram, Carton, Pack, Piece"
            className="w-full px-3 py-2 bg-muted900 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Abbreviation / Symbol <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={20}
            value={abbreviation}
            onChange={(e) => setAbbreviation(e.target.value)}
            placeholder="e.g. kg, ctn, pk, pcs"
            className="w-full px-3 py-2 bg-muted900 border border-border rounded-xl text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={submitting || !name.trim() || !abbreviation.trim()}>
            {submitting ? 'Creating...' : 'Create Unit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
