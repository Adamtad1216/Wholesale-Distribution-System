import React from 'react';
import Card from '../../../../../components/ui/Card';

export default function SupplierEntityTypeSection({
  formData,
  onChangeFormData,
  onIndividualNameChange,
}) {
  return (
    <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-5 shadow-lg">
      <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-3 flex items-center gap-2 uppercase tracking-wider text-indigo-400">
        <span>🏢</span> 1. Supplier Entity Type & Identity
      </h3>

      {/* Type Switcher Buttons */}
      <div>
        <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">
          Supplier Entity Type *
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button
            type="button"
            onClick={() => onChangeFormData({ ...formData, supplierType: 'ORGANIZATION' })}
            className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
              formData.supplierType === 'ORGANIZATION'
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400 shadow-md shadow-indigo-500/10'
                : 'bg-muted800/50 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="text-base">🏢</span> Organization / Company
          </button>

          <button
            type="button"
            onClick={() => onChangeFormData({ ...formData, supplierType: 'INDIVIDUAL' })}
            className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
              formData.supplierType === 'INDIVIDUAL'
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400 shadow-md shadow-indigo-500/10'
                : 'bg-muted800/50 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="text-base">👤</span> Individual Person
          </button>
        </div>
      </div>

      {/* Conditional Name Fields */}
      {formData.supplierType === 'INDIVIDUAL' ? (
        /* 👤 Individual Person detailed name fields */
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                First Name (Given Name) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Abebe"
                value={formData.firstName}
                onChange={(e) => onIndividualNameChange('firstName', e.target.value)}
                className="w-full px-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                Middle Name (Father's Name) *
              </label>
              <input
                type="text"
                placeholder="e.g. Bikila"
                value={formData.middleName}
                onChange={(e) => onIndividualNameChange('middleName', e.target.value)}
                className="w-full px-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                Last Name (Grandfather's Name)
              </label>
              <input
                type="text"
                placeholder="e.g. Kebede"
                value={formData.lastName}
                onChange={(e) => onIndividualNameChange('lastName', e.target.value)}
                className="w-full px-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                National ID / Kebele ID Number
              </label>
              <input
                type="text"
                placeholder="e.g. NID-84920194"
                value={formData.nationalId}
                onChange={(e) => onChangeFormData({ ...formData, nationalId: e.target.value })}
                className="w-full px-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                Personal Tax TIN (if applicable)
              </label>
              <input
                type="text"
                placeholder="e.g. 0049281726"
                value={formData.tin}
                onChange={(e) => onChangeFormData({ ...formData, tin: e.target.value })}
                className="w-full px-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs font-mono font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      ) : (
        /* 🏢 Organization / Company Fields */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
              Company / Brand Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Habesha Breweries S.C."
              value={formData.name}
              onChange={(e) =>
                onChangeFormData({
                  ...formData,
                  name: e.target.value,
                  companyName: formData.companyName || e.target.value,
                })
              }
              className="w-full px-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
              Legal Registered Company Name
            </label>
            <input
              type="text"
              placeholder="e.g. Habesha Breweries Share Company"
              value={formData.companyName}
              onChange={(e) => onChangeFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
              Tax Identification Number (TIN)
            </label>
            <input
              type="text"
              placeholder="e.g. 0049281726"
              value={formData.tin}
              onChange={(e) => onChangeFormData({ ...formData, tin: e.target.value })}
              className="w-full px-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs font-mono font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}
    </Card>
  );
}
