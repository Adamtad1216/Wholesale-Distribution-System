import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Gauge,
  Plus,
  Edit2,
  Trash2,
  Filter,
  AlertTriangle,
  User,
  Package,
  Warehouse,
  ShieldAlert,
  Search,
  Layers,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { salesQuotasApi, priceTiersApi } from '../pricingApi';
import { customersApi } from '../../customers/customersApi';
import { usePermission } from '../../../hooks/usePermission';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import api from '../../../services/api';

export default function SalesQuotasTab({ showHeader = true }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { can: canCreate } = usePermission('QUOTA_CREATE');
  const { can: canUpdate } = usePermission('QUOTA_UPDATE');
  const { can: canDelete } = usePermission('QUOTA_DELETE');

  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterProductId, setFilterProductId] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch sales quotas
  const { data: quotasData, isLoading, error } = useQuery({
    queryKey: ['sales-quotas', filterCustomerId, filterProductId],
    queryFn: async () => {
      const params = { limit: 100 };
      if (filterCustomerId) params.customerId = filterCustomerId;
      if (filterProductId) params.productId = filterProductId;
      const res = await salesQuotasApi.list(params);
      return res.data?.data || res.data || [];
    },
  });

  // Metadata
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-list-pricing'],
    queryFn: async () => {
      const res = await customersApi.getCustomers({ limit: 200 });
      return res.data?.customers || res.data?.data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['catalog-products-all'],
    queryFn: async () => {
      const res = await api.get('/catalog/products', { params: { limit: 200, status: 'ACTIVE' } });
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

  const { data: tiers = [] } = useQuery({
    queryKey: ['price-tiers'],
    queryFn: async () => {
      const res = await priceTiersApi.list({ limit: 100 });
      return res.data?.data || res.data || [];
    },
  });

  const quotas = Array.isArray(quotasData) ? quotasData : [];

  const deleteMutation = useMutation({
    mutationFn: (id) => salesQuotasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-quotas'] });
      toast.success('Sales Quota deleted');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete sales quota'),
  });

  // Client search filter across customer, product, and tier names
  const filteredQuotas = useMemo(() => {
    return quotas.filter((quota) => {
      const customer = customers.find((c) => c.id === quota.customerId) || quota.customer;
      const product = products.find((p) => p.id === quota.productId) || quota.product;
      const tier = tiers.find((t) => t.id === quota.priceTierId) || quota.priceTier;
      const warehouse = warehouses.find((w) => w.id === quota.warehouseId) || quota.warehouse;

      const q = search.toLowerCase();
      const cName = (customer?.name || '').toLowerCase();
      const pName = (product?.name || '').toLowerCase();
      const tName = (tier?.name || '').toLowerCase();
      const wName = (warehouse?.name || '').toLowerCase();

      return !search || cName.includes(q) || pName.includes(q) || tName.includes(q) || wName.includes(q);
    });
  }, [quotas, customers, products, tiers, warehouses, search]);

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="text-lg font-bold text-foreground">Sales Quotas & Purchasing Limits</h2>
            <p className="text-xs text-muted-foreground">
              Prevent hoarding, manage inventory allocations, and cap periodic purchase volumes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/pricing/quotas/new')}
                icon={<Plus className="w-4 h-4" />}
                className="text-xs"
              >
                Define Sales Quota
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <Card noPadding className="p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search quota by customer, product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>

          <div>
            <select
              value={filterCustomerId}
              onChange={(e) => setFilterCustomerId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
        </div>
      </Card>

      {/* Main Table */}
      {isLoading ? (
        <div className="py-12 flex justify-center items-center text-muted-foreground text-sm">
          Loading sales quotas...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>
            Failed to load sales quotas: {error?.response?.data?.message || error?.message || 'Check your permissions or network.'}
          </span>
        </div>
      ) : filteredQuotas.length === 0 ? (
        <Card className="text-center py-12">
          <Gauge className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-semibold text-foreground">No Sales Quotas Defined</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            {search || filterCustomerId || filterProductId
              ? 'No sales quotas match your selected filters.'
              : 'Sales quotas control and ration customer purchase volumes over rolling calendar periods.'}
          </p>
          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/pricing/quotas/new')}
              icon={<Plus className="w-4 h-4" />}
            >
              Define First Quota
            </Button>
          )}
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Target Scope</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Max Limit</TableHead>
              <TableHead>Period Window</TableHead>
              <TableHead>Consumption / Utilization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotas.map((quota) => {
              const customer = customers.find((c) => c.id === quota.customerId) || quota.customer;
              const product = products.find((p) => p.id === quota.productId) || quota.product;
              const tier = tiers.find((t) => t.id === quota.priceTierId) || quota.priceTier;
              const warehouse = warehouses.find((w) => w.id === quota.warehouseId) || quota.warehouse;

              const maxQty = Number(quota.maxQuantity);
              const usedQty = quota.currentConsumption != null ? Number(quota.currentConsumption) : 0;
              const remaining = Math.max(0, maxQty - usedQty);
              const percentage = maxQty > 0 ? Math.min(100, Math.round((usedQty / maxQty) * 100)) : 0;
              const isExceeded = usedQty >= maxQty;

              return (
                <TableRow key={quota.id}>
                  <TableCell>
                    <div className="space-y-1">
                      {customer ? (
                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                          <User className="w-3.5 h-3.5 text-primary" />
                          <span>{customer.name}</span>
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-muted-foreground">
                          All Customers (Pooled)
                        </div>
                      )}

                      {product ? (
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                          <Package className="w-3 h-3 text-muted-foreground" />
                          <span>{product.name}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground">All Catalog Items</div>
                      )}

                      {tier && (
                        <div className="flex items-center gap-1 text-[10px] text-primary">
                          <Layers className="w-3 h-3" />
                          <span>Tier: {tier.name}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {warehouse ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                        <Warehouse className="w-3 h-3 text-muted-foreground" />
                        <span>{warehouse.name}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">All Warehouses</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="font-mono font-bold text-foreground text-sm">
                      {maxQty.toLocaleString()} units
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-foreground border border-border">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>{quota.period}</span>
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="w-48 space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className={isExceeded ? 'text-rose-500 font-bold' : 'text-foreground font-semibold'}>
                          {usedQty.toLocaleString()} used
                        </span>
                        <span className="text-muted-foreground">
                          {remaining.toLocaleString()} left
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden border border-border/50">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isExceeded
                              ? 'bg-rose-500'
                              : percentage > 75
                              ? 'bg-amber-500'
                              : 'bg-primary'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      {isExceeded && (
                        <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Limit Reached
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        quota.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {quota.status || 'ACTIVE'}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {canUpdate && (
                        <Button
                          size="xs"
                          variant="outline"
                          icon={<Edit2 className="w-3 h-3" />}
                          onClick={() => navigate(`/pricing/quotas/${quota.id}/edit`)}
                        >
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          title="Delete Quota"
                          onClick={() => setDeleteTarget(quota)}
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
          title="Delete Sales Quota"
          message="Are you sure you want to remove this quota rule? Purchasing limits will no longer be restricted for qualifying orders."
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
