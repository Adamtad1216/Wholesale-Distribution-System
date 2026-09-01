import React from 'react';
import Card from '../../../../../components/ui/Card';
import Button from '../../../../../components/ui/Button';

export default function SecurityTab({ passwordData, setPasswordData, onSubmit, saving }) {
  const inputCls =
    'w-full px-4 py-2.5 rounded-lg border font-medium text-sm outline-none ' +
    'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900';

  const fields = [
    { label: 'Current Password', field: 'currentPassword' },
    { label: 'New Password', field: 'newPassword' },
    { label: 'Confirm New Password', field: 'confirmPassword' },
  ];

  return (
    <Card className="space-y-6 max-w-xl border border-slate-200 dark:border-slate-800">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-lg font-semibold">Security & Password</h2>
        <p className="text-sm font-medium text-muted">Update your account credentials and security password</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        {fields.map(({ label, field }) => (
          <div key={field}>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1">{label}</label>
            <input
              type="password"
              required
              value={passwordData[field]}
              onChange={(e) => setPasswordData({ ...passwordData, [field]: e.target.value })}
              className={inputCls}
            />
          </div>
        ))}
        <div className="pt-2">
          <Button type="submit" variant="secondary" disabled={saving}>
            {saving ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
