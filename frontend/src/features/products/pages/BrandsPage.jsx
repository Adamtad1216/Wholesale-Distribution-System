import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { productsApi } from '../productsApi';
import { usePermission } from '../../../hooks/usePermission';
import BrandsTab from '../components/BrandsTab';

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const { can: canCreateBrand } = usePermission(['brands:create', 'products:create']);
  const { can: canUpdateBrand } = usePermission(['brands:update', 'products:update']);
  const { can: canDeleteBrand } = usePermission(['brands:delete', 'products:delete']);

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productsApi.getBrands({ limit: 200 });
      const raw = res?.data || res;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : raw?.brands || [];
      setBrands(list);
    } catch (err) {
      toast.error(err?.message || 'Failed to load brands');
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const activeBrandsCount = brands.filter((b) => b.status === 'ACTIVE').length;

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏷️</span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Brands & Manufacturers
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage product manufacturers, suppliers, and catalog brand registrations
          </p>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Total Brands
            </span>
            <span className="text-2xl font-bold text-foreground mt-1 block">
              {loading ? '—' : brands.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 text-lg">
            🏷️
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Active Brands
            </span>
            <span className="text-2xl font-bold text-emerald-500 mt-1 block">
              {loading ? '—' : activeBrandsCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-lg">
            ✓
          </div>
        </div>
      </div>

      {/* Brands Table & Actions */}
      <BrandsTab
        brands={brands}
        loading={loading}
        onRefresh={fetchBrands}
        canCreate={canCreateBrand}
        canUpdate={canUpdateBrand}
        canDelete={canDeleteBrand}
      />
    </div>
  );
}
