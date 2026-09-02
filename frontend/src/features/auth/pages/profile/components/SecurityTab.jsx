import React from 'react';
import Card from '../../../../../components/ui/Card';
import Button from '../../../../../components/ui/Button';

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function SecurityTab({ passwordData, setPasswordData, onSubmit, saving }) {
  const inputCls =
    'w-full px-4 py-2.5 rounded-lg border font-medium text-sm outline-none ' +
    'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900';

  const hasMinLength = passwordData.newPassword?.length >= 8;
  const hasUpper = /[A-Z]/.test(passwordData.newPassword || '');
  const hasLower = /[a-z]/.test(passwordData.newPassword || '');
  const hasNumber = /\d/.test(passwordData.newPassword || '');
  const hasSpecial = /[@$!%*?&]/.test(passwordData.newPassword || '');
  const allValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

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

        {passwordData.newPassword && (
          <div className="space-y-1.5 pt-2">
            <p className="text-xs font-medium text-muted">Password must include:</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className={`w-1 h-1 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                At least 8 characters
              </span>
              <span className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className={`w-1 h-1 rounded-full ${hasUpper ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                One uppercase letter
              </span>
              <span className={`flex items-center gap-1 ${hasLower ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className={`w-1 h-1 rounded-full ${hasLower ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                One lowercase letter
              </span>
              <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className={`w-1 h-1 rounded-full ${hasNumber ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                One number
              </span>
              <span className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className={`w-1 h-1 rounded-full ${hasSpecial ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                One special character (@$!%*?&)
              </span>
              <span className={`flex items-center gap-1 ${allValid ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className={`w-1 h-1 rounded-full ${allValid ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                All requirements met
              </span>
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button type="submit" variant="secondary" disabled={saving || (passwordData.newPassword && !allValid)}>
            {saving ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
