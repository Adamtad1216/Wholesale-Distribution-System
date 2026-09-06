import React from 'react';
import Card from '../../../../../components/ui/Card';
import Button from '../../../../../components/ui/Button';

export default function MethodModal({
  isOpen,
  editingMethod,
  parentProvider,
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
          <div>
            <h3 className="text-base font-bold text-foreground">
              {editingMethod ? 'Edit Method Option' : 'Add Sub-Method Option'}
            </h3>
            <span className="text-xs text-indigo-400 font-bold">
              Under {parentProvider?.name}
            </span>
          </div>
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
              Option Name
            </label>
            <input
              type="text"
              placeholder="e.g. Account Direct Wire"
              value={form.name}
              onChange={(e) => onChangeForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground font-semibold focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Option Code
            </label>
            <input
              type="text"
              placeholder="e.g. WIRE_DIRECT"
              value={form.code}
              onChange={(e) => onChangeForm({ ...form, code: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground font-mono font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer bg-muted800/60 p-3 rounded-xl border border-border">
            <input
              type="checkbox"
              checked={form.requiresProof}
              onChange={(e) => onChangeForm({ ...form, requiresProof: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 bg-muted800 border-border focus:ring-indigo-500"
            />
            <div>
              <span className="font-bold text-foreground block">Requires Receipt/Deposit Proof</span>
              <span className="text-[10px] text-muted-foreground block">
                Flag if user must upload teller receipt or bank slip when paying.
              </span>
            </div>
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" className="px-5 font-bold">
              Save Method Option
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
