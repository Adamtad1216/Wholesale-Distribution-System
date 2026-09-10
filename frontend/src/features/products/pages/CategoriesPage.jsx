import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { productsApi } from '../productsApi';
import { usePermission } from '../../../hooks/usePermission';
import CategoriesTab from '../components/CategoriesTab';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const { can: canCreateCategory } = usePermission('categories:create');
  const { can: canUpdateCategory } = usePermission('categories:update');
  const { can: canDeleteCategory } = usePermission('categories:delete');

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productsApi.getCategories({ limit: 200 });
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

  const rootCategoriesCount = categories.filter((c) => !c.parentId).length;
  const subcategoriesCount = categories.filter((c) => Boolean(c.parentId)).length;

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📁</span>
            <h1 className="text-2xl font-normal tracking-tight text-foreground">
              Product Categories
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize catalog products into hierarchical main categories and subcategories
          </p>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-normal text-muted-foreground uppercase tracking-wider block">
              Total Categories
            </span>
            <span className="text-2xl font-normal text-foreground mt-1 block">
              {loading ? '—' : categories.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 text-lg">
            📁
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-normal text-muted-foreground uppercase tracking-wider block">
              Root / Main Categories
            </span>
            <span className="text-2xl font-normal text-emerald-500 mt-1 block">
              {loading ? '—' : rootCategoriesCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-lg">
            🌳
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-normal text-muted-foreground uppercase tracking-wider block">
              Nested Subcategories
            </span>
            <span className="text-2xl font-normal text-sky-500 mt-1 block">
              {loading ? '—' : subcategoriesCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 text-lg">
            🌿
          </div>
        </div>
      </div>

      {/* Categories Table & Actions */}
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
