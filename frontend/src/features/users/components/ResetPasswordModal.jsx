import React, { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function ResetPasswordModal({ user, onClose, onReset }) {
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }
    setSubmitting(true);
    await onReset(user.id, newPassword);
    setSubmitting(false);
  };

  return (
    <Modal
      isOpen={Boolean(user)}
      onClose={onClose}
      icon="🔑"
      title="Reset User Password"
      subtitle={
        <>
          Setting new security password for <strong className="text-foreground">@{user?.username}</strong>.
        </>
      }
      maxWidth="max-w-md"
      scope="workspace"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
            New Password *
          </label>
          <input
            type="password"
            required
            autoFocus
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500 font-mono"
            style={{ backgroundColor: 'var(--color-input)' }}
          />
          <p className="text-[11px] text-muted-foreground mt-1">Must be at least 8 characters long.</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={submitting}
          >
            {submitting ? 'Resetting...' : 'Save New Password'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
