import React from 'react';
import Button from '../../../../../components/ui/Button';

export default function SupplierFormHeader({ isEditing, onCancel }) {
  return (
    <div className="border-b border-border pb-6 flex items-center justify-between">
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-2 transition"
        >
          ← Back to Suppliers Directory
        </button>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          <span>{isEditing ? '✏️' : '🏭'}</span>{' '}
          {isEditing ? 'Edit Supplier Profile' : 'Register New Supplier'}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Register either a <strong>Corporate Organization / Company</strong> or an{' '}
          <strong>Individual Person Supplier</strong>.
        </p>
      </div>

      <Button variant="secondary" size="md" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
