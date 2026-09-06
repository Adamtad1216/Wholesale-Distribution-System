import React from 'react';
import Card from '../../../../../components/ui/Card';

export default function SupplierAddressSection({
  formData,
  onChangeFormData,
}) {
  return (
    <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-4 shadow-lg">
      <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-3 flex items-center gap-2 uppercase tracking-wider text-indigo-400">
        <span>📍</span> 4. Physical Location & Address
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
            City / Town
          </label>
          <input
            type="text"
            placeholder="e.g. Addis Ababa / Debre Birhan"
            value={formData.city}
            onChange={(e) => onChangeFormData({ ...formData, city: e.target.value })}
            className="w-full px-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
            Region / State
          </label>
          <input
            type="text"
            placeholder="e.g. Oromia / Amhara / Addis Ababa"
            value={formData.region}
            onChange={(e) => onChangeFormData({ ...formData, region: e.target.value })}
            className="w-full px-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
          Specific Street / Subcity / Farm / Plant Address
        </label>
        <input
          type="text"
          placeholder="e.g. Akaki Kality Subcity, Woreda 04, House No. 824"
          value={formData.address}
          onChange={(e) => onChangeFormData({ ...formData, address: e.target.value })}
          className="w-full px-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs focus:outline-none focus:border-indigo-500"
        />
      </div>
    </Card>
  );
}
