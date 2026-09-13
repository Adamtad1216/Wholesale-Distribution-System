import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { productsApi } from '../productsApi';
import { usePermission } from '../../../hooks/usePermission';
import CategoriesTab from '../components/CategoriesTab';
import { buildCategoryTree } from '../utils/categoryTreeUtils';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const { can: canCreateCategory } = usePermission('categories:create');
  const { can: canUpdateCategory } = usePermission('categories:update');
  const { can: canDeleteCategory } = usePermission('categories:delete');

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productsApi.getCategories({ limit: 500 });
      const raw = res?.data || res;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : raw?.categories || [];
      setCategories(list);
    } catch (err) {
      toast.error(err?.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Aggregate tree metrics
  const { roots, maxDepth, rootCount, subCount } = useMemo(
    () => buildCategoryTree(categories),
    [categories]
  );

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📁</span>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Product Categories & Hierarchy
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize catalog products into cascading categories with arbitrary nesting depths
          </p>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={fetchCategories}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-foreground text-xs font-medium transition flex items-center gap-1.5"
          title="Refresh categories"
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* Dynamic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Categories */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
              Total Categories
            </span>
            <span className="text-2xl font-bold text-foreground mt-1 block">
              {loading ? '—' : categories.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 text-lg">
            📁
          </div>
        </div>

        {/* Root Categories */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
              Root Categories
            </span>
            <span className="text-2xl font-bold text-emerald-500 mt-1 block">
              {loading ? '—' : rootCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-lg">
            🌳
          </div>
        </div>

        {/* Nested Subcategories */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
              Nested Subcategories
            </span>
            <span className="text-2xl font-bold text-sky-500 mt-1 block">
              {loading ? '—' : subCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 text-lg">
            🌿
          </div>
        </div>

        {/* Max Hierarchy Depth */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
              Max Nesting Depth
            </span>
            <span className="text-2xl font-bold text-purple-500 mt-1 block">
              {loading ? '—' : categories.length === 0 ? '0' : `${maxDepth + 1} Levels`}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 text-lg">
            🔀
          </div>
        </div>
      </div>

      {/* Dynamic Categories Interface */}
      <CategoriesTab
        categories={categories}
        loading={loading}
        onRefresh={fetchCategories}
        canCreate={canCreateCategory}
        canUpdate={canUpdateCategory}
        canDelete={canDeleteCategory}
      />
    </div>
  );
}
