import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Layers, ArrowLeft, Save, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { priceTiersApi } from '../pricingApi';
import PricingBreadcrumbs from '../components/PricingBreadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';

export default function PriceTierFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 0,
    isDefault: false,
    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState({});

  // Fetch existing tier data if in edit mode
  const { data: existingTier, isLoading: isLoadingTier } = useQuery({
    queryKey: ['price-tier', id],
    queryFn: async () => {
      const res = await priceTiersApi.getById(id);
      return res.data?.data || res.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingTier) {
      setFormData({
        name: existingTier.name || '',
        description: existingTier.description || '',
        priority: existingTier.priority ?? 0,
        isDefault: Boolean(existingTier.isDefault),
        status: existingTier.status || 'ACTIVE',
      });
    }
  }, [existingTier]);

  const createMutation = useMutation({
    mutationFn: (payload) => priceTiersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-tiers'] });
      toast.success('Price tier created successfully');
      navigate('/pricing/tiers');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create price tier');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => priceTiersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-tiers'] });
      toast.success('Price tier updated successfully');
      navigate('/pricing/tiers');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update price tier');
    },
  });

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Tier Name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Tier Name must be at least 2 characters';
    }
    if (formData.priority < 0) {
      errs.priority = 'Priority must be 0 or greater';
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
      priority: Number(formData.priority) || 0,
      isDefault: Boolean(formData.isDefault),
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
          { label: 'Price Tiers', href: '/pricing/tiers' },
          { label: isEdit ? 'Edit Price Tier' : 'New Price Tier' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/pricing/tiers')}
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary" />
              <span>{isEdit ? 'Edit Price Tier' : 'Create Price Tier'}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Define customer pricing classifications, fallback levels, and priority weights.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/pricing/tiers')}
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
            {isEdit ? 'Save Changes' : 'Create Price Tier'}
          </Button>
        </div>
      </div>

      {isLoadingTier && isEdit ? (
        <div className="p-12 text-center text-muted-foreground">
          Loading price tier details...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Information */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Identify and describe this pricing tier for commercial reporting.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Tier Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wholesale, VIP Bulk, Key Accounts, Distributor"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl bg-card border text-foreground text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.name
                      ? 'border-rose-500 focus:ring-rose-500/40'
                      : 'border-border focus:ring-primary/40'
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
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional description of target accounts, order volume criteria, or pricing rationale..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>
          </Card>

          {/* Section 2: Configuration */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Configuration & Rules</CardTitle>
                <CardDescription>
                  Set precedence order and default system behaviors.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Priority Weight
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={formData.priority}
                  onChange={(e) => {
                    setFormData({ ...formData, priority: e.target.value });
                    if (errors.priority) setErrors({ ...errors, priority: null });
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl bg-card border text-foreground text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.priority
                      ? 'border-rose-500 focus:ring-rose-500/40'
                      : 'border-border focus:ring-primary/40'
                  }`}
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Higher numbers give precedence if a customer matches multiple classification criteria.
                </p>
                {errors.priority && (
                  <p className="text-xs text-rose-500 mt-1">{errors.priority}</p>
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
                  <option value="ACTIVE">Active (Available for Orders & Customers)</option>
                  <option value="INACTIVE">Inactive (Disabled)</option>
                </select>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Inactive tiers are excluded from active sales order calculations.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-border/80">
              <label className="flex items-start gap-3.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-bold text-foreground">
                    Set as Default Fallback Price Tier
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Customers who do not have a custom assigned price tier will automatically inherit prices from this tier. Only one tier can be default.
                  </p>
                </div>
              </label>
            </div>
          </Card>

          {/* Sticky Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/pricing/tiers')}
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
              {isEdit ? 'Save Changes' : 'Create Price Tier'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
