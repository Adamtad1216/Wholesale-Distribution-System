import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Tag,
  ArrowLeft,
  Save,
  Package,
  Layers,
  Warehouse,
  AlertCircle,
  Sparkles,
  Info,
  CheckCircle2,
  Search,
  Check,
  X,
  Trash2,
  Percent,
  TrendingDown,
  RotateCcw,
  CheckSquare,
  Square,
  Plus,
} from 'lucide-react';
import { productPricesApi, priceTiersApi } from '../pricingApi';
import api from '../../../services/api';
import PricingBreadcrumbs from '../components/PricingBreadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';

export default function ProductPriceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  // Shared tier & warehouse settings
  const [priceTierId, setPriceTierId] = useState('');
  const [warehouseId, setWarehouseId] = useState(''); // '' = Global
  const [status, setStatus] = useState('ACTIVE');

  // Edit-mode single product state
  const [editProductId, setEditProductId] = useState('');
  const [editUnitPrice, setEditUnitPrice] = useState('');

  // Create-mode multi-product state: map of productId -> { product, unitPrice }
  const [selectedProductMap, setSelectedProductMap] = useState({});

  // Catalog search & filtering state
  const [catalogSearch, setCatalogSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Batch quick-apply toolbar state
  const [quickApplyType, setQuickApplyType] = useState('PERCENT_DISCOUNT'); // 'PERCENT_DISCOUNT' | 'FLAT_DISCOUNT' | 'FIXED_PRICE'
  const [quickApplyValue, setQuickApplyValue] = useState('');

  const [errors, setErrors] = useState({});

  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['catalog-products-all'],
    queryFn: async () => {
      const res = await api.get('/catalog/products', { params: { limit: 300, status: 'ACTIVE' } });
      return res.data?.data || res.data || [];
    },
  });

  // Fetch price tiers
  const { data: tiers = [], isLoading: isLoadingTiers } = useQuery({
    queryKey: ['price-tiers'],
    queryFn: async () => {
      const res = await priceTiersApi.list({ limit: 100 });
      return res.data?.data || res.data || [];
    },
  });

  // Fetch warehouses
  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ['warehouses-all'],
    queryFn: async () => {
      const res = await api.get('/warehouses', { params: { limit: 100, status: 'ACTIVE' } });
      return res.data?.data || res.data || [];
    },
  });

  // Fetch existing price override if editing
  const { data: existingPrice, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['product-price', id],
    queryFn: async () => {
      const res = await productPricesApi.getById(id);
      return res.data?.data || res.data;
    },
    enabled: isEdit,
  });

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category?.name) set.add(p.category.name);
      else if (p.categoryName) set.add(p.categoryName);
    });
    return Array.from(set).sort();
  }, [products]);

  // Initialize form data
  useEffect(() => {
    if (existingPrice && isEdit) {
      setEditProductId(existingPrice.productId || '');
      setPriceTierId(existingPrice.priceTierId || '');
      setWarehouseId(existingPrice.warehouseId || '');
      setEditUnitPrice(existingPrice.unitPrice != null ? String(existingPrice.unitPrice) : '');
      setStatus(existingPrice.status || 'ACTIVE');
    } else if (!isEdit && tiers.length > 0 && !priceTierId) {
      const defaultTier = tiers.find((t) => t.isDefault) || tiers[0];
      setPriceTierId(defaultTier?.id || '');
    }
  }, [existingPrice, tiers, isEdit, priceTierId]);

  // Selected tier & warehouse objects
  const selectedTier = useMemo(() => tiers.find((t) => t.id === priceTierId), [tiers, priceTierId]);
  const selectedWarehouse = useMemo(() => warehouses.find((w) => w.id === warehouseId), [warehouses, warehouseId]);
  const editProduct = useMemo(() => products.find((p) => p.id === editProductId) || existingPrice?.product, [products, editProductId, existingPrice]);

  // Filtered catalog list
  const filteredCatalog = useMemo(() => {
    return products.filter((p) => {
      const q = catalogSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q));

      const catName = p.category?.name || p.categoryName || '';
      const matchesCat = !categoryFilter || catName === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [products, catalogSearch, categoryFilter]);

  // Array of currently selected products
  const selectedProductList = useMemo(() => {
    return Object.values(selectedProductMap);
  }, [selectedProductMap]);

  // Toggle selection of a single product
  const toggleProductSelection = (product) => {
    setSelectedProductMap((prev) => {
      const next = { ...prev };
      if (next[product.id]) {
        delete next[product.id];
      } else {
        next[product.id] = {
          product,
          productId: product.id,
          unitPrice: product.sellingPrice != null ? String(product.sellingPrice) : '',
        };
      }
      return next;
    });
    if (errors.products) setErrors((prev) => ({ ...prev, products: null }));
  };

  // Select all currently filtered products
  const handleSelectAllFiltered = () => {
    setSelectedProductMap((prev) => {
      const next = { ...prev };
      filteredCatalog.forEach((p) => {
        if (!next[p.id]) {
          next[p.id] = {
            product: p,
            productId: p.id,
            unitPrice: p.sellingPrice != null ? String(p.sellingPrice) : '',
          };
        }
      });
      return next;
    });
    if (errors.products) setErrors((prev) => ({ ...prev, products: null }));
  };

  // Clear all selected products
  const handleClearSelection = () => {
    setSelectedProductMap({});
  };

  // Update a single product's tier unit price
  const handleUnitPriceChange = (productId, value) => {
    setSelectedProductMap((prev) => {
      if (!prev[productId]) return prev;
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          unitPrice: value,
        },
      };
    });
    if (errors[`price_${productId}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`price_${productId}`];
        return next;
      });
    }
  };

  // Reset a product's price back to its base selling price
  const handleResetToBase = (productId) => {
    const item = selectedProductMap[productId];
    if (item?.product?.sellingPrice != null) {
      handleUnitPriceChange(productId, String(item.product.sellingPrice));
    }
  };

  // Batch quick-apply to all selected products
  const handleApplyToAll = () => {
    const numVal = Number(quickApplyValue);
    if (isNaN(numVal) || numVal < 0 || quickApplyValue === '') {
      toast.error('Please enter a valid positive number');
      return;
    }

    setSelectedProductMap((prev) => {
      const next = {};
      Object.keys(prev).forEach((pId) => {
        const item = prev[pId];
        const base = Number(item.product?.sellingPrice) || 0;
        let calculated = base;

        if (quickApplyType === 'PERCENT_DISCOUNT') {
          // e.g. 10% off base
          calculated = Math.max(0.01, base * (1 - numVal / 100));
        } else if (quickApplyType === 'FLAT_DISCOUNT') {
          // e.g. 20 ETB off base
          calculated = Math.max(0.01, base - numVal);
        } else if (quickApplyType === 'FIXED_PRICE') {
          // Flat rate
          calculated = Math.max(0.01, numVal);
        }

        next[pId] = {
          ...item,
          unitPrice: calculated.toFixed(2),
        };
      });
      return next;
    });

    toast.success(`Applied rates to ${selectedProductList.length} selected products`);
  };

  // Mutations
  const createBatchMutation = useMutation({
    mutationFn: (payload) => productPricesApi.createBatch(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['product-prices'] });
      const count = Array.isArray(res.data?.data) ? res.data.data.length : selectedProductList.length;
      toast.success(`Successfully configured tier rates for ${count} products`);
      navigate('/pricing/product-prices');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save product price overrides'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => productPricesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-prices'] });
      toast.success('Product price override updated');
      navigate('/pricing/product-prices');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update price override'),
  });

  const isSaving = createBatchMutation.isPending || updateMutation.isPending;

  // Validation
  const validate = () => {
    const errs = {};
    if (!priceTierId) errs.priceTierId = 'Price Tier is required';

    if (isEdit) {
      if (!editUnitPrice || isNaN(Number(editUnitPrice)) || Number(editUnitPrice) <= 0) {
        errs.editUnitPrice = 'Valid unit price greater than 0 is required';
      }
    } else {
      if (selectedProductList.length === 0) {
        errs.products = 'Please select at least one product to assign to this tier';
      } else {
        selectedProductList.forEach((item) => {
          if (!item.unitPrice || isNaN(Number(item.unitPrice)) || Number(item.unitPrice) <= 0) {
            errs[`price_${item.productId}`] = 'Required (> 0)';
          }
        });
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    if (isEdit) {
      updateMutation.mutate({
        warehouseId: warehouseId || null,
        unitPrice: Number(editUnitPrice),
        status,
      });
    } else {
      const payload = {
        priceTierId,
        warehouseId: warehouseId || null,
        status,
        items: selectedProductList.map((item) => ({
          productId: item.productId,
          unitPrice: Number(item.unitPrice),
        })),
      };
      createBatchMutation.mutate(payload);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      <PricingBreadcrumbs
        items={[
          { label: 'Product Pricing', href: '/pricing/product-prices' },
          { label: isEdit ? 'Edit Product Price' : 'Configure Product Prices' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/pricing/product-prices')}
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Tag className="w-6 h-6 text-primary" />
              <span>{isEdit ? 'Edit Product Price' : 'Configure Product Prices'}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEdit
                ? 'Update tier unit rate and branch override location.'
                : 'Assign multiple products to a pricing tier with authoritative tier unit prices.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/pricing/product-prices')}
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
            {isEdit
              ? 'Save Changes'
              : `Save ${selectedProductList.length > 0 ? `(${selectedProductList.length}) Prices` : 'Prices'}`}
          </Button>
        </div>
      </div>

      {/* Concept Distinction Info */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-foreground mb-0.5">
            Key Rule: Price Tier ≠ Product Price
          </span>
          A <strong>Price Tier</strong> is an account level (e.g. &quot;Wholesale&quot;), whereas a <strong>Product Price</strong> is the actual selling rate configured for products under that tier. Selecting &quot;All Warehouses&quot; creates a global tier rate, while selecting a specific warehouse creates a localized branch override.
        </div>
      </div>

      {isLoadingExisting && isEdit ? (
        <div className="p-12 text-center text-muted-foreground text-sm">
          Loading price details...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Target Tier & Warehouse Scope */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Target Pricing Tier & Branch Scope</CardTitle>
                <CardDescription>
                  Choose which pricing tier and warehouse location this rate applies to.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Price Tier */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Target Price Tier <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  disabled={isEdit}
                  value={priceTierId}
                  onChange={(e) => {
                    setPriceTierId(e.target.value);
                    if (errors.priceTierId) setErrors((prev) => ({ ...prev, priceTierId: null }));
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl bg-card border text-foreground text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.priceTierId
                      ? 'border-rose-500 focus:ring-rose-500/40'
                      : 'border-border focus:ring-primary/40'
                  } ${isEdit ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  <option value="">-- Choose Price Tier --</option>
                  {tiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.isDefault ? '★ (Default)' : ''} [Priority: {t.priority}]
                    </option>
                  ))}
                </select>
                {errors.priceTierId && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.priceTierId}</span>
                  </p>
                )}
              </div>

              {/* Warehouse Scope */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Warehouse Override Location
                </label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                >
                  <option value="">🌐 All Warehouses (Global Tier Price)</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      📍 {w.name} ({w.code || 'Branch'}) - Override
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center gap-2">
              <span className="font-semibold text-foreground">Scope Rule:</span>
              {warehouseId
                ? 'High-priority local override for orders originating from this warehouse only.'
                : 'Applies globally across all distribution centers unless an explicit warehouse override exists.'}
            </div>
          </Card>

          {/* EDIT MODE: Single Product View */}
          {isEdit ? (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Product & Rate Details</CardTitle>
                  <CardDescription>
                    Adjust authoritative tier unit price for this product.
                  </CardDescription>
                </div>
              </CardHeader>

              <div className="space-y-5">
                {/* Product Info Banner */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">
                        {editProduct?.name || 'Loading Product...'}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span className="font-mono">SKU: {editProduct?.sku || 'N/A'}</span>
                        <span>•</span>
                        <span>Catalog Base: {Number(editProduct?.sellingPrice || 0).toFixed(2)} ETB</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rate Input */}
                <div className="max-w-xs">
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                    Tier Unit Price (ETB) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={editUnitPrice}
                      onChange={(e) => {
                        setEditUnitPrice(e.target.value);
                        if (errors.editUnitPrice) setErrors((prev) => ({ ...prev, editUnitPrice: null }));
                      }}
                      className={`w-full pl-4 pr-12 py-2.5 rounded-xl bg-card border text-foreground text-sm focus:outline-none focus:ring-2 transition-all font-mono font-bold ${
                        errors.editUnitPrice
                          ? 'border-rose-500 focus:ring-rose-500/40'
                          : 'border-border focus:ring-primary/40'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                      ETB
                    </span>
                  </div>
                  {errors.editUnitPrice && (
                    <p className="text-xs text-rose-500 mt-1">{errors.editUnitPrice}</p>
                  )}
                </div>

                {/* Difference Badge vs Base */}
                {editProduct?.sellingPrice != null && editUnitPrice && !isNaN(Number(editUnitPrice)) && (
                  <div className="text-xs flex items-center gap-2">
                    <span className="text-muted-foreground">Variance vs Base:</span>
                    {Number(editUnitPrice) < Number(editProduct.sellingPrice) ? (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold font-mono">
                        -{(Number(editProduct.sellingPrice) - Number(editUnitPrice)).toFixed(2)} ETB (
                        {(((Number(editProduct.sellingPrice) - Number(editUnitPrice)) / Number(editProduct.sellingPrice)) * 100).toFixed(1)}% Discount)
                      </span>
                    ) : Number(editUnitPrice) > Number(editProduct.sellingPrice) ? (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold font-mono">
                        +{(Number(editUnitPrice) - Number(editProduct.sellingPrice)).toFixed(2)} ETB Premium
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-muted text-muted-foreground font-medium font-mono">
                        Equal to Base Price
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            /* CREATE MODE: Multi-Product Assignment */
            <div className="space-y-6">
              {/* Product Catalog Picker */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Select Catalog Products</CardTitle>
                      <CardDescription>
                        Choose multiple products to set tier unit prices for{' '}
                        <strong className="text-foreground">{selectedTier?.name || 'selected tier'}</strong>.
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllFiltered}
                        className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-primary" />
                        <span>Select All Filtered ({filteredCatalog.length})</span>
                      </button>
                      {selectedProductList.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearSelection}
                          className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Clear ({selectedProductList.length})</span>
                        </button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Filter Toolbar */}
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search products by title or SKU..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  {categories.length > 0 && (
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 min-w-[160px]"
                    >
                      <option value="">All Categories ({products.length})</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {errors.products && (
                  <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.products}</span>
                  </div>
                )}

                {/* Catalog Product Grid / Checklist */}
                <div className="border border-border rounded-xl divide-y divide-border max-h-64 overflow-y-auto bg-card/50">
                  {isLoadingProducts ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      Loading product catalog...
                    </div>
                  ) : filteredCatalog.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No products found matching &quot;{catalogSearch}&quot;
                    </div>
                  ) : (
                    filteredCatalog.map((product) => {
                      const isSelected = Boolean(selectedProductMap[product.id]);
                      return (
                        <div
                          key={product.id}
                          onClick={() => toggleProductSelection(product)}
                          className={`flex items-center justify-between p-3 cursor-pointer transition-colors hover:bg-muted/30 select-none ${
                            isSelected ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'border-muted-foreground/30 bg-card'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-foreground flex items-center gap-2">
                                <span>{product.name}</span>
                                {product.category?.name && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-normal bg-muted text-muted-foreground">
                                    {product.category.name}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                SKU: {product.sku || 'N/A'}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-foreground">
                              {Number(product.sellingPrice || 0).toFixed(2)} ETB
                            </div>
                            <div className="text-[10px] text-muted-foreground">Base Price</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              {/* Selected Products & Rates Table */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span>Configured Tier Rates</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                          {selectedProductList.length} Selected
                        </span>
                      </CardTitle>
                      <CardDescription>
                        Set the tier unit price for each selected product.
                      </CardDescription>
                    </div>

                    {/* Quick Apply Toolbar */}
                    {selectedProductList.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-muted/40 border border-border">
                        <span className="text-xs font-bold text-foreground px-1">Quick Apply:</span>
                        <select
                          value={quickApplyType}
                          onChange={(e) => setQuickApplyType(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                          <option value="PERCENT_DISCOUNT">% Discount off Base</option>
                          <option value="FLAT_DISCOUNT">Flat ETB off Base</option>
                          <option value="FIXED_PRICE">Fixed Price (ETB)</option>
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={quickApplyType === 'PERCENT_DISCOUNT' ? 'e.g. 10' : 'e.g. 50.00'}
                          value={quickApplyValue}
                          onChange={(e) => setQuickApplyValue(e.target.value)}
                          className="w-24 px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                        <button
                          type="button"
                          onClick={handleApplyToAll}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm"
                        >
                          Apply to All
                        </button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                {selectedProductList.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-border rounded-xl">
                    <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-foreground">No Products Selected</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Search and select one or more catalog products in the box above to define their tier rates.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-border rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          <th className="py-3 px-4">Product Details</th>
                          <th className="py-3 px-4 text-right">Catalog Base</th>
                          <th className="py-3 px-4 w-44">Tier Unit Price (ETB)</th>
                          <th className="py-3 px-4">Difference vs Base</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                        {selectedProductList.map((item) => {
                          const base = Number(item.product?.sellingPrice || 0);
                          const current = Number(item.unitPrice);
                          const hasError = errors[`price_${item.productId}`];
                          const diff = !isNaN(current) && current > 0 ? current - base : 0;
                          const pct = base > 0 ? ((diff / base) * 100).toFixed(1) : '0';

                          return (
                            <tr key={item.productId} className="hover:bg-muted/20 transition-colors">
                              {/* Product Details */}
                              <td className="py-3 px-4">
                                <div className="font-bold text-foreground text-xs">
                                  {item.product.name}
                                </div>
                                <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                  SKU: {item.product.sku || 'N/A'}
                                </div>
                              </td>

                              {/* Base Price */}
                              <td className="py-3 px-4 text-right font-mono font-medium text-muted-foreground">
                                {base.toFixed(2)} ETB
                              </td>

                              {/* Tier Unit Price Input */}
                              <td className="py-3 px-4">
                                <div className="relative">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    value={item.unitPrice}
                                    onChange={(e) =>
                                      handleUnitPriceChange(item.productId, e.target.value)
                                    }
                                    placeholder="0.00"
                                    className={`w-full pl-3 pr-10 py-1.5 rounded-lg bg-background border text-xs text-foreground font-mono font-bold focus:outline-none focus:ring-2 transition-all ${
                                      hasError
                                        ? 'border-rose-500 focus:ring-rose-500/40'
                                        : 'border-border focus:ring-primary/40'
                                    }`}
                                  />
                                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-semibold">
                                    ETB
                                  </span>
                                </div>
                                {hasError && (
                                  <p className="text-[10px] text-rose-500 mt-1">{hasError}</p>
                                )}
                              </td>

                              {/* Difference Badge */}
                              <td className="py-3 px-4">
                                {!item.unitPrice || isNaN(current) || current <= 0 ? (
                                  <span className="text-muted-foreground text-[11px]">—</span>
                                ) : diff < 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-bold font-mono">
                                    <TrendingDown className="w-3 h-3" />
                                    <span>
                                      {diff.toFixed(2)} ETB ({pct}%)
                                    </span>
                                  </span>
                                ) : diff > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-bold font-mono">
                                    <span>
                                      +{diff.toFixed(2)} ETB (+{pct}%)
                                    </span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-medium font-mono">
                                    Same as Base
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    title="Reset to Catalog Base Price"
                                    onClick={() => handleResetToBase(item.productId)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Remove from batch"
                                    onClick={() => toggleProductSelection(item.product)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/pricing/product-prices')}
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
              {isEdit
                ? 'Save Changes'
                : `Save ${selectedProductList.length > 0 ? `(${selectedProductList.length}) Prices` : 'Prices'}`}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
