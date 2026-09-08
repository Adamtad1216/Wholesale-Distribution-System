import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Warehouse,
  Package,
  ShieldAlert,
  Search,
  Globe,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { productPricesApi, priceTiersApi } from '../pricingApi';
import { usePermission } from '../../../hooks/usePermission';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import api from '../../../services/api';

export default function ProductPricesTab({ showHeader = true }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { can: canCreate } = usePermission('PRODUCT_PRICE_CREATE');
  const { can: canUpdate } = usePermission('PRODUCT_PRICE_UPDATE');
  const { can: canDelete } = usePermission('PRODUCT_PRICE_DELETE');

  const [filterProductId, setFilterProductId] = useState('');
  const [filterTierId, setFilterTierId] = useState('');
  const [filterWarehouseId, setFilterWarehouseId] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch product prices
  const { data: pricesData, isLoading, error } = useQuery({
    queryKey: ['product-prices', filterProductId, filterTierId, filterWarehouseId],
    queryFn: async () => {
      const params = { limit: 100 };
      if (filterProductId) params.productId = filterProductId;
      if (filterTierId) params.priceTierId = filterTierId;
      if (filterWarehouseId) params.warehouseId = filterWarehouseId;
      const res = await productPricesApi.list(params);
      return res.data?.data || res.data || [];
    },
  });

  // Fetch metadata: products, tiers, warehouses
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

  const prices = Array.isArray(pricesData) ? pricesData : [];

  const deleteMutation = useMutation({
    mutationFn: (id) => productPricesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-prices'] });
      toast.success('Price override removed');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove price override'),
  });

  // Client search filter across product names & tier names
  const filteredPrices = useMemo(() => {
    return prices.filter((item) => {
      const product = products.find((p) => p.id === item.productId) || item.product;
      const tier = tiers.find((t) => t.id === item.priceTierId) || item.priceTier;
      const q = search.toLowerCase();
      const pName = (product?.name || '').toLowerCase();
      const pSku = (product?.sku || '').toLowerCase();
      const tName = (tier?.name || '').toLowerCase();

      return !search || pName.includes(q) || pSku.includes(q) || tName.includes(q);
    });
  }, [prices, products, tiers, search]);

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="text-lg font-bold text-foreground">Product Tier Prices & Overrides</h2>
            <p className="text-xs text-muted-foreground">
              Define authoritative unit rates for specific product-tier pairs across global or branch scopes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/pricing/product-prices/new')}
                icon={<Plus className="w-4 h-4" />}
                className="text-xs"
              >
                Set Product Price
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Info Notice on Tier vs Product Price */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/80 text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-foreground mr-1">Hierarchy Rule:</span>
          The order quotation engine evaluates: <strong>Warehouse Override</strong> $\rightarrow$ <strong>Global Tier Price</strong> $\rightarrow$ <strong>Catalog Base Selling Price</strong>.
        </div>
      </div>

      {/* Filters Bar */}
      <Card noPadding className="p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product or tier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>

          <div>
            <select
              value={filterProductId}
              onChange={(e) => setFilterProductId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
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
              <option value="">All Warehouse Scopes</option>
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
          Loading product tier prices...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>
            Failed to load product prices: {error?.response?.data?.message || error?.message || 'Check your permissions or network.'}
          </span>
        </div>
      ) : filteredPrices.length === 0 ? (
        <Card className="text-center py-12">
          <Tag className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-semibold text-foreground">No Product Prices Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            {search || filterProductId || filterTierId || filterWarehouseId
              ? 'No pricing entries match your selected filters. Try clearing your search.'
              : 'Product tier prices configure discounted catalog unit rates per customer tier and warehouse.'}
          </p>
          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/pricing/product-prices/new')}
              icon={<Plus className="w-4 h-4" />}
            >
              Set First Product Price
            </Button>
          )}
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Price Tier</TableHead>
              <TableHead>Warehouse Scope</TableHead>
              <TableHead>Tier Unit Price</TableHead>
              <TableHead>Catalog Base</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPrices.map((item) => {
              const product = products.find((p) => p.id === item.productId) || item.product;
              const tier = tiers.find((t) => t.id === item.priceTierId) || item.priceTier;
              const warehouse = warehouses.find((w) => w.id === item.warehouseId) || item.warehouse;

              const basePrice = product?.sellingPrice != null ? Number(product.sellingPrice) : null;
              const tierPrice = Number(item.unitPrice);
              const diff = basePrice != null ? tierPrice - basePrice : null;

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-card border border-border text-foreground">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground">
                          {product?.name || `Product (${item.productId.substring(0, 8)})`}
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {product?.sku ? `SKU: ${product.sku}` : ''}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{tier?.name || 'Tier'}</span>
                    </span>
                  </TableCell>

                  <TableCell>
                    {warehouse ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-card border border-border text-foreground">
                        <Warehouse className="w-3 h-3 text-muted-foreground" />
                        <span>{warehouse.name}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-muted/60 border border-border text-muted-foreground">
                        <Globe className="w-3 h-3 text-muted-foreground" />
                        <span>Global (All Warehouses)</span>
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="font-mono font-bold text-foreground text-sm">
                      {tierPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      <span className="text-xs text-muted-foreground font-normal">ETB</span>
                    </div>
                    {diff != null && diff !== 0 && (
                      <div
                        className={`text-[11px] font-mono flex items-center gap-0.5 ${
                          diff < 0 ? 'text-emerald-500' : 'text-amber-500'
                        }`}
                      >
                        {diff < 0 ? (
                          <>
                            <ArrowDownRight className="w-3 h-3" />
                            <span>{Math.abs(diff).toFixed(2)} ETB discount</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3 h-3" />
                            <span>+{diff.toFixed(2)} ETB premium</span>
                          </>
                        )}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {basePrice != null
                        ? `${basePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB`
                        : '—'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {item.status || 'ACTIVE'}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {canUpdate && (
                        <Button
                          size="xs"
                          variant="outline"
                          icon={<Edit2 className="w-3 h-3" />}
                          onClick={() => navigate(`/pricing/product-prices/${item.id}/edit`)}
                        >
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          title="Delete Price Override"
                          onClick={() => setDeleteTarget(item)}
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
          title="Remove Product Price Override"
          message="Are you sure you want to remove this product price configuration? The system will automatically fall back to the global tier rate or catalog base price."
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
