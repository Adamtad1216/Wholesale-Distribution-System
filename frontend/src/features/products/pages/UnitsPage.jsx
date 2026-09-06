import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { productsApi } from '../productsApi';
import { usePermission } from '../../../hooks/usePermission';
import UnitsTab from '../components/UnitsTab';

export default function UnitsPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  const { can: canCreateUnit } = usePermission(['units:create', 'products:create']);
  const { can: canUpdateUnit } = usePermission(['units:update', 'products:update']);
  const { can: canDeleteUnit } = usePermission(['units:delete', 'products:delete']);

  const fetchUnits = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productsApi.getUnits({ limit: 200 });
      const raw = res?.data || res;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : raw?.units || [];
      setUnits(list);
    } catch (err) {
      toast.error(err?.message || 'Failed to load units');
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Units of Measure
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure packaging, volume, weight, and inventory measurement units
          </p>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Configured Measurement Units
            </span>
            <span className="text-2xl font-bold text-foreground mt-1 block">
              {loading ? '—' : units.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 text-lg">
            ⚖️
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Common Standards
            </span>
            <span className="text-xs text-muted-foreground mt-1 block">
              Piece (pcs), Box (bx), Kilogram (kg), Carton (ctn), Pack (pk)
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 text-lg">
            📦
          </div>
        </div>
      </div>

      {/* Units Table & Actions */}
      <UnitsTab
        units={units}
        loading={loading}
        onRefresh={fetchUnits}
        canCreate={canCreateUnit}
        canUpdate={canUpdateUnit}
        canDelete={canDeleteUnit}
      />
    </div>
  );
}
