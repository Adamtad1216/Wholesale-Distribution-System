import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Percent,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Layers,
  Warehouse,
  Package,
  ShieldAlert,
  Search,
  FolderTree,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';
import { discountRulesApi, priceTiersApi } from '../pricingApi';
import { usePermission } from '../../../hooks/usePermission';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import api from '../../../services/api';

export default function DiscountRulesTab({ showHeader = true }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { can: canCreate } = usePermission('DISCOUNT_CREATE');
  const { can: canUpdate } = usePermission('DISCOUNT_UPDATE');
  const { can: canDelete } = usePermission('DISCOUNT_DELETE');

  const [filterTierId, setFilterTierId] = useState('');
  const [filterWarehouseId, setFilterWarehouseId] = useState('');
  const [filterScope, setFilterScope] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch discount rules
  const { data: rulesData, isLoading, error } = useQuery({
    queryKey: ['discount-rules', filterTierId, filterWarehouseId],
    queryFn: async () => {
      const params = { limit: 100 };
      if (filterTierId) params.priceTierId = filterTierId;
      if (filterWarehouseId) params.warehouseId = filterWarehouseId;
      const res = await discountRulesApi.list(params);
      return res.data?.data || res.data || [];
    },
  });

  // Metadata
  const { data: products = [] } = useQuery({
    queryKey: ['catalog-products-all'],
    queryFn: async () => {
      const res = await api.get('/catalog/products', { params: { limit: 200, status: 'ACTIVE' } });
      return res.data?.data || res.data || [];
    },
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['price-tiers'],
    queryFn: async () => {
      const res = await priceTiersApi.list({ limit: 100 });
      return res.data?.data || res.data || [];
    },
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses-all'],
    queryFn: async () => {
      const res = await api.get('/warehouses', { params: { limit: 100, status: 'ACTIVE' } });
      return res.data?.data || res.data || [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['catalog-categories-all'],
    queryFn: async () => {
      const res = await api.get('/catalog/categories', { params: { limit: 100 } });
      return res.data?.data || res.data || [];
    },
  });

  const rules = Array.isArray(rulesData) ? rulesData : [];

  const deleteMutation = useMutation({
    mutationFn: (id) => discountRulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-rules'] });
      toast.success('Discount Rule deleted');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete discount rule'),
  });

  // Filtered rules
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const q = search.toLowerCase();
      const name = (rule.name || '').toLowerCase();
      const desc = (rule.description || '').toLowerCase();
      const matchesSearch = !search || name.includes(q) || desc.includes(q);
      const matchesScope = !filterScope || rule.scope === filterScope;
      return matchesSearch && matchesScope;
    });
  }, [rules, search, filterScope]);

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="text-lg font-bold text-foreground">Promotional & Volume Discount Rules</h2>
            <p className="text-xs text-muted-foreground">
              Configure wholesale volume tiers, promotional percentages, and category-level discounts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/pricing/discounts/new')}
                icon={<Plus className="w-4 h-4" />}
                className="text-xs"
              >
                New Discount Rule
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Non-stacking Governance Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/80 text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-foreground mr-1">Precedence Engine:</span>
          Discounts do not silently stack. The engine ranks qualified rules by specificity (<strong>Product</strong> &gt; <strong>Category</strong> &gt; <strong>Global</strong>) and applies the single best matching rule per line item.
        </div>
      </div>

      {/* Filters Bar */}
      <Card noPadding className="p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search rules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>

          <div>
            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            >
              <option value="">All Catalog Scopes</option>
              <option value="PRODUCT">Product-Specific Rules</option>
              <option value="CATEGORY">Category-Specific Rules</option>
              <option value="GLOBAL">Global Catalog Rules</option>
            </select>
          </div>

          <div>
            <select
              value={filterTierId}
              onChange={(e) => setFilterTierId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            >
              <option value="">All Price Tiers</option>
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterWarehouseId}
              onChange={(e) => setFilterWarehouseId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      {isLoading ? (
        <div className="py-12 flex justify-center items-center text-muted-foreground text-sm">
          Loading discount rules...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>
            Failed to load discount rules: {error?.response?.data?.message || error?.message || 'Check your permissions or network.'}
          </span>
        </div>
      ) : filteredRules.length === 0 ? (
        <Card className="text-center py-12">
          <Percent className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-semibold text-foreground">No Discount Rules Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            {search || filterScope || filterTierId || filterWarehouseId
              ? 'No discount rules match your selected filters.'
              : 'Discount rules incentivize high-volume wholesale purchasing and special customer tier promotions.'}
          </p>
          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/pricing/discounts/new')}
              icon={<Plus className="w-4 h-4" />}
            >
              Create First Discount Rule
            </Button>
          )}
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule Name</TableHead>
              <TableHead>Discount Value</TableHead>
              <TableHead>Target Scope</TableHead>
              <TableHead>Price Tier</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Min Qty</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRules.map((rule) => {
              const product = products.find((p) => p.id === rule.productId) || rule.product;
              const category = categories.find((c) => c.id === rule.categoryId) || rule.category;
              const tier = tiers.find((t) => t.id === rule.priceTierId) || rule.priceTier;
              const warehouse = warehouses.find((w) => w.id === rule.warehouseId) || rule.warehouse;

              return (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Percent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{rule.name}</div>
                        {rule.description && (
                          <div className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">
                            {rule.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono font-black text-amber-500 text-xs px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                      {rule.discountType === 'PERCENTAGE'
                        ? `${Number(rule.discountValue)}% OFF`
                        : `${Number(rule.discountValue).toFixed(2)} ETB/unit`}
                    </span>
                  </TableCell>

                  <TableCell>
                    {rule.scope === 'PRODUCT' && product ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                        <Package className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="truncate max-w-[140px]">{product.name}</span>
                      </span>
                    ) : rule.scope === 'CATEGORY' && category ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                        <FolderTree className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="truncate max-w-[140px]">{category.name}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
                        Global (Catalog)
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {tier ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        <Layers className="w-3 h-3" />
                        <span>{tier.name}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">All Tiers</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {warehouse ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                        <Warehouse className="w-3 h-3 text-muted-foreground" />
                        <span>{warehouse.name}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">All Branches</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs font-bold text-foreground">
                      {Number(rule.minQuantity).toLocaleString()} units
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {rule.priority ?? 0}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rule.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {rule.status || 'ACTIVE'}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {canUpdate && (
                        <Button
                          size="xs"
                          variant="outline"
                          icon={<Edit2 className="w-3 h-3" />}
                          onClick={() => navigate(`/pricing/discounts/${rule.id}/edit`)}
                        >
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          title="Delete Discount Rule"
                          onClick={() => setDeleteTarget(rule)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDeleteModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          title="Delete Discount Rule"
          message={`Are you sure you want to delete discount rule "${deleteTarget.name}"? This promotion will immediately cease to apply on active quotes.`}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
