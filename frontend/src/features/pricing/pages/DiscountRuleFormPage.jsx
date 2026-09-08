import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Percent,
  ArrowLeft,
  Save,
  Package,
  Layers,
  Warehouse,
  FolderTree,
  AlertCircle,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { discountRulesApi, priceTiersApi } from '../pricingApi';
import api from '../../../services/api';
import PricingBreadcrumbs from '../components/PricingBreadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';

export default function DiscountRuleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minQuantity: '1',
    priority: 0,
    scope: 'GLOBAL', // 'GLOBAL' | 'PRODUCT' | 'CATEGORY'
    productId: '',
    categoryId: '',
    priceTierId: '',
    warehouseId: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState({});

  // Fetch catalog metadata
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

  // Fetch existing rule if editing
  const { data: existingRule, isLoading: isLoadingRule } = useQuery({
    queryKey: ['discount-rule', id],
    queryFn: async () => {
      const res = await discountRulesApi.getById(id);
      return res.data?.data || res.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingRule) {
      setFormData({
        name: existingRule.name || '',
        description: existingRule.description || '',
        discountType: existingRule.discountType || 'PERCENTAGE',
        discountValue: existingRule.discountValue != null ? String(existingRule.discountValue) : '',
        minQuantity: existingRule.minQuantity != null ? String(existingRule.minQuantity) : '1',
        priority: existingRule.priority ?? 0,
        scope: existingRule.scope || (existingRule.productId ? 'PRODUCT' : existingRule.categoryId ? 'CATEGORY' : 'GLOBAL'),
        productId: existingRule.productId || '',
        categoryId: existingRule.categoryId || '',
        priceTierId: existingRule.priceTierId || '',
        warehouseId: existingRule.warehouseId || '',
        startDate: existingRule.startDate ? existingRule.startDate.substring(0, 10) : '',
        endDate: existingRule.endDate ? existingRule.endDate.substring(0, 10) : '',
        status: existingRule.status || 'ACTIVE',
      });
    }
  }, [existingRule]);

  // Selected entities for live summary preview
  const selectedProduct = useMemo(() => products.find((p) => p.id === formData.productId), [products, formData.productId]);
  const selectedCategory = useMemo(() => categories.find((c) => c.id === formData.categoryId), [categories, formData.categoryId]);
  const selectedTier = useMemo(() => tiers.find((t) => t.id === formData.priceTierId), [tiers, formData.priceTierId]);
  const selectedWarehouse = useMemo(() => warehouses.find((w) => w.id === formData.warehouseId), [warehouses, formData.warehouseId]);

  const createMutation = useMutation({
    mutationFn: (payload) => discountRulesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-rules'] });
      toast.success('Discount Rule created successfully');
      navigate('/pricing/discounts');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create discount rule'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => discountRulesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-rules'] });
      toast.success('Discount Rule updated successfully');
      navigate('/pricing/discounts');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update discount rule'),
  });

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Rule Name is required';
    if (!formData.discountValue || isNaN(Number(formData.discountValue)) || Number(formData.discountValue) <= 0) {
      errs.discountValue = 'Valid discount value > 0 is required';
    } else if (formData.discountType === 'PERCENTAGE' && Number(formData.discountValue) > 100) {
      errs.discountValue = 'Percentage discount cannot exceed 100%';
    }
    if (!formData.minQuantity || isNaN(Number(formData.minQuantity)) || Number(formData.minQuantity) < 1) {
      errs.minQuantity = 'Minimum quantity must be 1 or greater';
    }
    if (formData.scope === 'PRODUCT' && !formData.productId) {
      errs.productId = 'Product is required for PRODUCT scope';
    }
    if (formData.scope === 'CATEGORY' && !formData.categoryId) {
      errs.categoryId = 'Category is required for CATEGORY scope';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minQuantity: Number(formData.minQuantity),
      priority: Number(formData.priority) || 0,
      scope: formData.scope,
      productId: formData.scope === 'PRODUCT' ? formData.productId || null : null,
      categoryId: formData.scope === 'CATEGORY' ? formData.categoryId || null : null,
      priceTierId: formData.priceTierId || null,
      warehouseId: formData.warehouseId || null,
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

  // Generate dynamic human-readable rule summary preview
  const liveSummary = useMemo(() => {
    const tierText = selectedTier ? `${selectedTier.name} tier customers` : 'All customers';
    const targetText =
      formData.scope === 'PRODUCT' && selectedProduct
        ? selectedProduct.name
        : formData.scope === 'CATEGORY' && selectedCategory
        ? `products in category "${selectedCategory.name}"`
        : 'any eligible items';
    const warehouseText = selectedWarehouse ? `from ${selectedWarehouse.name}` : 'from all warehouses';
    const discountText =
      formData.discountType === 'PERCENTAGE'
        ? `${formData.discountValue || 'X'}% discount`
        : `${formData.discountValue || 'X'} ETB / unit wholesale deduction`;
    const qtyText = `${formData.minQuantity || 1}+ units`;

    return `${tierText} purchasing ${qtyText} of ${targetText} ${warehouseText} receive a ${discountText}.`;
  }, [formData, selectedProduct, selectedCategory, selectedTier, selectedWarehouse]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <PricingBreadcrumbs
        items={[
          { label: 'Discount Rules', href: '/pricing/discounts' },
          { label: isEdit ? 'Edit Discount Rule' : 'New Discount Rule' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/pricing/discounts')}
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Percent className="w-6 h-6 text-primary" />
              <span>{isEdit ? 'Edit Discount Rule' : 'Create Discount Rule'}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure wholesale volume breaks, category promotions, and tier-specific incentives.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/pricing/discounts')}
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
            {isEdit ? 'Save Changes' : 'Create Discount Rule'}
          </Button>
        </div>
      </div>

      {isLoadingRule && isEdit ? (
        <div className="p-12 text-center text-muted-foreground text-sm">
          Loading discount rule...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Information */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Define the promotional campaign or wholesale volume rule identifier.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                    Rule Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bulk Wheat 100+ Pallet Discount, Grains Category Promo"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl bg-card border text-foreground text-sm focus:outline-none focus:ring-2 transition-all ${
                      errors.name ? 'border-rose-500 focus:ring-rose-500/40' : 'border-border focus:ring-primary/40'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.name}</span>
                    </p>
                  )}
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
                    <option value="ACTIVE">Active (Live in engine)</option>
                    <option value="INACTIVE">Inactive (Disabled)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional internal justification or promotional conditions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>
          </Card>

          {/* Section 2: Discount Configuration */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Discount Configuration</CardTitle>
                <CardDescription>
                  Choose discount type, calculation values, and quantity thresholds.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Discount Type
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                >
                  <option value="PERCENTAGE">Percentage (% Off)</option>
                  <option value="FIXED_AMOUNT">Fixed Amount (ETB / Unit)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Discount Value <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={formData.discountType === 'PERCENTAGE' ? 100 : undefined}
                    required
                    placeholder={formData.discountType === 'PERCENTAGE' ? '15' : '20.00'}
                    value={formData.discountValue}
                    onChange={(e) => {
                      setFormData({ ...formData, discountValue: e.target.value });
                      if (errors.discountValue) setErrors({ ...errors, discountValue: null });
                    }}
                    className={`w-full pl-4 pr-12 py-2.5 rounded-xl bg-card border text-foreground text-sm focus:outline-none focus:ring-2 transition-all font-mono font-bold ${
                      errors.discountValue ? 'border-rose-500 focus:ring-rose-500/40' : 'border-border focus:ring-primary/40'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                    {formData.discountType === 'PERCENTAGE' ? '%' : 'ETB/unit'}
                  </span>
                </div>
                {errors.discountValue && (
                  <p className="text-xs text-rose-500 mt-1">{errors.discountValue}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Min Quantity (Bulk Break) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.minQuantity}
                  onChange={(e) => {
                    setFormData({ ...formData, minQuantity: e.target.value });
                    if (errors.minQuantity) setErrors({ ...errors, minQuantity: null });
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl bg-card border text-foreground text-sm focus:outline-none focus:ring-2 transition-all font-mono ${
                    errors.minQuantity ? 'border-rose-500 focus:ring-rose-500/40' : 'border-border focus:ring-primary/40'
                  }`}
                />
                {errors.minQuantity && (
                  <p className="text-xs text-rose-500 mt-1">{errors.minQuantity}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Rule Priority
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Tie-breaker when multiple rules qualify.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 3: Applies To */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Application Scope & Target Criteria</CardTitle>
                <CardDescription>
                  Restrict discounts by catalog scope, customer tier, or branch warehouse.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                    Catalog Scope
                  </label>
                  <select
                    value={formData.scope}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        scope: e.target.value,
                        productId: e.target.value === 'PRODUCT' ? formData.productId : '',
                        categoryId: e.target.value === 'CATEGORY' ? formData.categoryId : '',
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-semibold"
                  >
                    <option value="GLOBAL">Global (All Products in Catalog)</option>
                    <option value="PRODUCT">Specific Product Item</option>
                    <option value="CATEGORY">Specific Product Category</option>
                  </select>
                </div>

                {/* Conditional Product Field */}
                {formData.scope === 'PRODUCT' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                      Target Product <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.productId}
                      onChange={(e) => {
                        setFormData({ ...formData, productId: e.target.value });
                        if (errors.productId) setErrors({ ...errors, productId: null });
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl bg-card border text-foreground text-sm focus:outline-none focus:ring-2 transition-all ${
                        errors.productId ? 'border-rose-500 focus:ring-rose-500/40' : 'border-border focus:ring-primary/40'
                      }`}
                    >
                      <option value="">-- Choose Product Item --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku || 'SKU'})
                        </option>
                      ))}
                    </select>
                    {errors.productId && (
                      <p className="text-xs text-rose-500 mt-1">{errors.productId}</p>
                    )}
                  </div>
                )}

                {/* Conditional Category Field */}
                {formData.scope === 'CATEGORY' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                      Target Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => {
                        setFormData({ ...formData, categoryId: e.target.value });
                        if (errors.categoryId) setErrors({ ...errors, categoryId: null });
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl bg-card border text-foreground text-sm focus:outline-none focus:ring-2 transition-all ${
                        errors.categoryId ? 'border-rose-500 focus:ring-rose-500/40' : 'border-border focus:ring-primary/40'
                      }`}
                    >
                      <option value="">-- Choose Category --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <p className="text-xs text-rose-500 mt-1">{errors.categoryId}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Tier & Warehouse Restrictions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/80">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                    Customer Price Tier Restriction
                  </label>
                  <select
                    value={formData.priceTierId}
                    onChange={(e) => setFormData({ ...formData, priceTierId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  >
                    <option value="">All Customer Price Tiers (Unrestricted)</option>
                    {tiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                    Warehouse Branch Restriction
                  </label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  >
                    <option value="">All Warehouses (Global Application)</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code || 'Branch'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 4: Validity */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Validity Period</CardTitle>
                <CardDescription>
                  Optionally schedule active dates for seasonal promotions.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
          </Card>

          {/* Dynamic Rule Summary Preview */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
            <div className="font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Human-Readable Rule Summary</span>
            </div>
            <div className="text-muted-foreground font-medium text-sm leading-relaxed">
              "{liveSummary}"
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/pricing/discounts')}
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
              {isEdit ? 'Save Changes' : 'Create Discount Rule'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
