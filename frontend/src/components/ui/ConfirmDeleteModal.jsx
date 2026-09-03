import React from 'react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDeleteModal({
  isOpen = true,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  submitting = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon="⚠️"
      title={title}
      maxWidth="max-w-md"
      scope="workspace"
    >
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={onConfirm}
            disabled={submitting}
            className="shadow-lg shadow-rose-500/20"
          >
            {submitting ? 'Deleting...' : 'Yes, Delete Item'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
