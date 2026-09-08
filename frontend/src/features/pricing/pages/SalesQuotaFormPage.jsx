import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Gauge,
  ArrowLeft,
  Save,
  Package,
  Layers,
  Warehouse,
  User,
  AlertCircle,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { salesQuotasApi, priceTiersApi } from '../pricingApi';
import { customersApi } from '../../customers/customersApi';
import api from '../../../services/api';
import PricingBreadcrumbs from '../components/PricingBreadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';

export default function SalesQuotaFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    customerId: '',
    productId: '',
    priceTierId: '',
    warehouseId: '',
    maxQuantity: '',
    period: 'MONTHLY',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState({});

  // Fetch customers
  const { data: customersData = [] } = useQuery({
    queryKey: ['customers-list-pricing'],
    queryFn: async () => {
      const res = await customersApi.getCustomers({ limit: 200 });
      return res.data?.customers || res.data?.data || [];
    },
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['catalog-products-all'],
    queryFn: async () => {
      const res = await api.get('/catalog/products', { params: { limit: 200, status: 'ACTIVE' } });
      return res.data?.data || res.data || [];
    },
  });

  // Fetch price tiers
  const { data: tiers = [] } = useQuery({
    queryKey: ['price-tiers'],
    queryFn: async () => {
      const res = await priceTiersApi.list({ limit: 100 });
      return res.data?.data || res.data || [];
    },
  });

  // Fetch warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses-all'],
    queryFn: async () => {
      const res = await api.get('/warehouses', { params: { limit: 100, status: 'ACTIVE' } });
      return res.data?.data || res.data || [];
    },
  });

  // Fetch existing quota if editing
  const { data: existingQuota, isLoading: isLoadingQuota } = useQuery({
    queryKey: ['sales-quota', id],
    queryFn: async () => {
      const res = await salesQuotasApi.getById(id);
      return res.data?.data || res.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingQuota) {
      setFormData({
        customerId: existingQuota.customerId || '',
        productId: existingQuota.productId || '',
        priceTierId: existingQuota.priceTierId || '',
        warehouseId: existingQuota.warehouseId || '',
        maxQuantity: existingQuota.maxQuantity != null ? String(existingQuota.maxQuantity) : '',
        period: existingQuota.period || 'MONTHLY',
        startDate: existingQuota.startDate ? existingQuota.startDate.substring(0, 10) : '',
        endDate: existingQuota.endDate ? existingQuota.endDate.substring(0, 10) : '',
        status: existingQuota.status || 'ACTIVE',
      });
    }
  }, [existingQuota]);

  const customers = Array.isArray(customersData) ? customersData : [];

  // Selected entities for live preview
  const selectedCustomer = useMemo(() => customers.find((c) => c.id === formData.customerId), [customers, formData.customerId]);
  const selectedProduct = useMemo(() => products.find((p) => p.id === formData.productId), [products, formData.productId]);
  const selectedTier = useMemo(() => tiers.find((t) => t.id === formData.priceTierId), [tiers, formData.priceTierId]);
  const selectedWarehouse = useMemo(() => warehouses.find((w) => w.id === formData.warehouseId), [warehouses, formData.warehouseId]);

  const createMutation = useMutation({
    mutationFn: (payload) => salesQuotasApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-quotas'] });
      toast.success('Sales Quota created successfully');
      navigate('/pricing/quotas');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create sales quota'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => salesQuotasApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-quotas'] });
      toast.success('Sales Quota updated successfully');
      navigate('/pricing/quotas');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update sales quota'),
  });

  const validate = () => {
    const errs = {};
    if (!formData.maxQuantity || isNaN(Number(formData.maxQuantity)) || Number(formData.maxQuantity) <= 0) {
      errs.maxQuantity = 'Maximum quantity must be greater than 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      customerId: formData.customerId || null,
      productId: formData.productId || null,
      priceTierId: formData.priceTierId || null,
      warehouseId: formData.warehouseId || null,
      maxQuantity: Number(formData.maxQuantity),
      period: formData.period,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      status: formData.status,
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <PricingBreadcrumbs
        items={[
          { label: 'Sales Quotas', href: '/pricing/quotas' },
          { label: isEdit ? 'Edit Sales Quota' : 'Define Sales Quota' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/pricing/quotas')}
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Gauge className="w-6 h-6 text-primary" />
              <span>{isEdit ? 'Edit Sales Quota' : 'Define Sales Quota'}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set purchasing allocation limits per customer account, product, and calendar cycle.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/pricing/quotas')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            loading={isSaving}
            onClick={handleSubmit}
          >
            {isEdit ? 'Save Changes' : 'Create Sales Quota'}
          </Button>
        </div>
      </div>

      {isLoadingQuota && isEdit ? (
        <div className="p-12 text-center text-muted-foreground text-sm">
          Loading quota details...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Quota Scope */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Quota Scope & Criteria</CardTitle>
                <CardDescription>
                  Define who and what this purchase limit applies to. Leave unselected for global application.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Customer Scope */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Target Customer Account
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                >
                  <option value="">All Customers (Pooled Quota)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode || 'No Code'})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Restrict limit to a specific wholesale account.
                </p>
              </div>

              {/* Product Scope */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Target Product Item
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                >
                  <option value="">All Products (Catalog-Wide Quota)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku || 'SKU'})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Cap purchases of a high-demand or rationed item.
                </p>
              </div>

              {/* Price Tier Scope */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Customer Price Tier
                </label>
                <select
                  value={formData.priceTierId}
                  onChange={(e) => setFormData({ ...formData, priceTierId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                >
                  <option value="">All Price Tiers</option>
                  {tiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warehouse Scope */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Warehouse / Branch Location
                </label>
                <select
                  value={formData.warehouseId}
                  onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                >
                  <option value="">All Warehouses (Global Quota)</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code || 'Branch'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Section 2: Quota Limit & Period */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Quota Limit & Recurring Period</CardTitle>
                <CardDescription>
                  Specify the maximum units permitted per calendar consumption window.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Maximum Quantity Limit <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="e.g. 500"
                    value={formData.maxQuantity}
                    onChange={(e) => {
                      setFormData({ ...formData, maxQuantity: e.target.value });
                      if (errors.maxQuantity) setErrors({ ...errors, maxQuantity: null });
                    }}
                    className={`w-full pl-4 pr-14 py-2.5 rounded-xl bg-card border text-foreground text-sm focus:outline-none focus:ring-2 transition-all font-mono font-bold ${
                      errors.maxQuantity ? 'border-rose-500 focus:ring-rose-500/40' : 'border-border focus:ring-primary/40'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                    Units
                  </span>
                </div>
                {errors.maxQuantity && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.maxQuantity}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Recurring Reset Period <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-semibold"
                >
                  <option value="DAILY">Daily (Resets every 24 hours)</option>
                  <option value="WEEKLY">Weekly (Resets Monday 00:00)</option>
                  <option value="MONTHLY">Monthly (Resets 1st of every month)</option>
                  <option value="QUARTERLY">Quarterly (Resets every 3 months)</option>
                  <option value="ANNUAL">Annual (Resets January 1st)</option>
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Orders placed within this period window count against this ceiling.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 3: Validity & Status */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Validity & Status</CardTitle>
                <CardDescription>
                  Optional date ranges and activation state.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                >
                  <option value="ACTIVE">Active (Enforced)</option>
                  <option value="INACTIVE">Inactive (Disabled)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Live Quota Simulation Preview */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
            <div className="font-bold text-foreground flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Quota Scope Preview</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Customer</span>
                <span className="font-semibold text-foreground">
                  {selectedCustomer ? selectedCustomer.name : 'All Customers (Pooled)'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Product</span>
                <span className="font-semibold text-foreground">
                  {selectedProduct ? selectedProduct.name : 'All Products'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Limit & Cycle</span>
                <span className="font-mono font-bold text-primary">
                  {formData.maxQuantity ? `${Number(formData.maxQuantity).toLocaleString()} units` : '—'} / {formData.period.toLowerCase()}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Location</span>
                <span className="font-semibold text-foreground">
                  {selectedWarehouse ? selectedWarehouse.name : 'All Warehouses'}
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/pricing/quotas')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              loading={isSaving}
            >
              {isEdit ? 'Save Changes' : 'Create Sales Quota'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
