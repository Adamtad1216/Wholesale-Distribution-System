import React from 'react';
import Button from '../../../../../components/ui/Button';

export default function SupplierFormActions({
  isEditing,
  submitting,
  onCancel,
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-4">
      <Button type="button" variant="secondary" size="md" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={submitting}
        className="px-8 shadow-lg shadow-indigo-500/20"
      >
        {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Register Supplier'}
      </Button>
    </div>
  );
}
