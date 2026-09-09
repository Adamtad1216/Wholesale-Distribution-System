import React from 'react';
import Card from '../../../../../components/ui/Card';

export default function SupplierContactsSection({
  formData,
  onChangeFormData,
  onAddContact,
  onRemoveContact,
  onUpdateContact,
}) {
  return (
    <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-6 shadow-lg">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider text-indigo-400">
          <span>📞</span> 2. Contact Persons & Communication Details
        </h3>

        <button
          type="button"
          onClick={onAddContact}
          className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
        >
          <span>➕</span> Add Alternate Contact Person
        </button>
      </div>

      {/* Primary Contact Person Box */}
      <div className="space-y-4 bg-muted800/40 p-4 rounded-2xl border border-border/60">
        <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>⭐</span> Primary Contact Details
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {formData.supplierType === 'ORGANIZATION' && (
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                Primary Contact Representative *
              </label>
              <input
                type="text"
                placeholder="e.g. Solomon Teklu"
                value={formData.contactPerson}
                onChange={(e) => onChangeFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
              Primary Phone Number *
            </label>
            <input
              type="text"
              required
              placeholder="+251 911 234 567"
              value={formData.phone}
              onChange={(e) => onChangeFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs font-mono font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
              Alternate / Secondary Phone
            </label>
            <input
              type="text"
              placeholder="+251 911 000 111"
              value={formData.altPhone}
              onChange={(e) => onChangeFormData({ ...formData, altPhone: e.target.value })}
              className="w-full px-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="supplier@domain.et"
              value={formData.email}
              onChange={(e) => onChangeFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Dynamically Added Alternate Contact Persons */}
      {formData.additionalContacts.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Alternate Contact Representatives ({formData.additionalContacts.length})
          </div>

          {formData.additionalContacts.map((contact, idx) => (
            <div
              key={idx}
              className="p-4 bg-muted800/30 border border-border/80 rounded-2xl space-y-3 relative group animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <span>👤</span> Alternate Contact #{idx + 1}
                </span>

                <button
                  type="button"
                  onClick={() => onRemoveContact(idx)}
                  className="px-2.5 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  🗑️ Remove
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tigist Alemu"
                    value={contact.name}
                    onChange={(e) => onUpdateContact(idx, 'name', e.target.value)}
                    className="w-full px-3.5 py-2 bg-muted800 border border-border rounded-xl text-foreground text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    Role / Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Finance / Logistics Manager"
                    value={contact.role}
                    onChange={(e) => onUpdateContact(idx, 'role', e.target.value)}
                    className="w-full px-3.5 py-2 bg-muted800 border border-border rounded-xl text-foreground text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    Direct Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+251 911 333 444"
                    value={contact.phone}
                    onChange={(e) => onUpdateContact(idx, 'phone', e.target.value)}
                    className="w-full px-3.5 py-2 bg-muted800 border border-border rounded-xl text-foreground text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                    Direct Email
                  </label>
                  <input
                    type="email"
                    placeholder="finance@supplier.et"
                    value={contact.email}
                    onChange={(e) => onUpdateContact(idx, 'email', e.target.value)}
                    className="w-full px-3.5 py-2 bg-muted800 border border-border rounded-xl text-foreground text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
