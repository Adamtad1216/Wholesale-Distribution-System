import React from 'react';
import Card from '../../../../../components/ui/Card';
import Button from '../../../../../components/ui/Button';

export default function ProviderModal({
  isOpen,
  editingProvider,
  form,
  onChangeForm,
  onClose,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <Card className="w-full max-w-md p-6 border border-border bg-card900 rounded-2xl shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-base font-bold text-foreground">
            {editingProvider ? 'Edit Payment Provider' : 'Add New Payment Provider'}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Provider Name
            </label>
            <input
              type="text"
              placeholder="e.g. Commercial Bank of Ethiopia"
              value={form.name}
              onChange={(e) => onChangeForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground font-semibold focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Provider Code
            </label>
            <input
              type="text"
              placeholder="e.g. cbe_wire"
              value={form.code}
              onChange={(e) => onChangeForm({ ...form, code: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground font-mono font-bold focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-muted-foreground block mt-1">
              Unique identification string (auto-generated if left empty).
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Channel Category Type
            </label>
            <select
              value={form.type}
              onChange={(e) => onChangeForm({ ...form, type: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="MANUAL">💵 Manual Payment (Cash, Check, Wire, Slip)</option>
              <option value="ONLINE">🌐 Online Gateway (Chapa, Telebirr, Card)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" className="px-5 font-bold">
              Save Provider
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
