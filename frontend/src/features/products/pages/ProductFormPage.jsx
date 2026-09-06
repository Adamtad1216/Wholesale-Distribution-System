import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import SearchableSelect from '../../../components/ui/SearchableSelect';
import { productsApi } from '../productsApi';
import ImagePreviewModal from '../components/ImagePreviewModal';
import CascadingCategoryDropdowns from '../components/CascadingCategoryDropdowns';
import QuickCategoryModal from '../components/QuickCategoryModal';
import QuickBrandModal from '../components/QuickBrandModal';
import QuickUnitModal from '../components/QuickUnitModal';

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    brandId: '',
    unitId: '',
    status: 'ACTIVE',
    sellingPrice: '',
    wholesalePrice: '',
    images: [],
    warehouseSellingPrices: [],
  });

  // Reference Lookups
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxPreviewIndex, setLightboxPreviewIndex] = useState(null);

  // Memoized Select Options for Brand & Unit
  const brandOptions = useMemo(() => [
    { value: '', label: 'None' },
    ...brands.map((b) => ({ value: b.id, label: b.name })),
  ], [brands]);

  const unitOptions = useMemo(() => [
    { value: '', label: 'None' },
    ...units.map((u) => ({
      value: u.id,
      label: `${u.name} (${u.abbreviation})`,
    })),
  ], [units]);
  const fileInputRef = useRef(null);

  // Dynamic Registration Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalParentId, setCategoryModalParentId] = useState('');
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  const handleOpenCategoryModal = (parentId = '') => {
    setCategoryModalParentId(parentId);
    setIsCategoryModalOpen(true);
  };

  // Fetch Reference Data & Product Data (if edit)
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        if (isEdit) setLoading(true);

        const [catRes, brandRes, unitRes, whRes, productRes] = await Promise.allSettled([
          productsApi.getCategories({ limit: 100 }),
          productsApi.getBrands({ limit: 100 }),
          productsApi.getUnits({ limit: 100 }),
          productsApi.getWarehouses({ limit: 100 }),
          isEdit ? productsApi.getProductById(id) : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        let loadedCategories = [];
        let loadedBrands = [];
        let loadedUnits = [];
        let loadedWarehouses = [];

        if (catRes.status === 'fulfilled') {
          const raw = catRes.value;
          loadedCategories = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : raw?.data?.items || [];
          setCategories(loadedCategories);
        }

        if (brandRes.status === 'fulfilled') {
          const raw = brandRes.value;
          loadedBrands = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : raw?.data?.items || [];
          setBrands(loadedBrands);
        }

        if (unitRes.status === 'fulfilled') {
          const raw = unitRes.value;
          loadedUnits = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : raw?.data?.items || [];
          setUnits(loadedUnits);
        }

        if (whRes.status === 'fulfilled') {
          const raw = whRes.value;
          loadedWarehouses = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : raw?.data?.items || raw?.warehouses || [];
          setWarehouses(loadedWarehouses);
        }

        if (isEdit && productRes.status === 'fulfilled' && productRes.value) {
          const prod = productRes.value.data || productRes.value;
          const existingMap = new Map(
            (prod.warehouseSellingPrices || []).map((wp) => [wp.warehouseId, wp])
          );

          const mappedWarehousePrices = loadedWarehouses.map((w) => {
            const existing = existingMap.get(w.id);
            return {
              warehouseId: w.id,
              warehouseName: w.name,
              warehouseCode: w.code,
              sellingPrice:
                existing?.sellingPrice !== undefined && existing?.sellingPrice !== null
                  ? String(existing.sellingPrice)
                  : '',
              wholesalePrice:
                existing?.wholesalePrice !== undefined && existing?.wholesalePrice !== null
                  ? String(existing.wholesalePrice)
                  : '',
              status: existing?.status || 'ACTIVE',
            };
          });

          setFormData({
            name: prod.name || '',
            sku: prod.sku || '',
            categoryId: prod.categoryId || prod.category?.id || '',
            brandId: prod.brandId || prod.brand?.id || '',
            unitId: prod.unitId || prod.unit?.id || '',
            status: prod.status || 'ACTIVE',
            sellingPrice:
              prod.sellingPrice !== undefined && prod.sellingPrice !== null
                ? String(prod.sellingPrice)
                : '',
            wholesalePrice:
              prod.wholesalePrice !== undefined && prod.wholesalePrice !== null
                ? String(prod.wholesalePrice)
                : '',
            images: (prod.images && prod.images.length > 0)
              ? prod.images
                  .map((img) => ({
                    imageUrl: typeof img === 'string' ? img : (img.imageUrl || img.fileUrl || img.url || ''),
                    isPrimary: Boolean(img.isPrimary),
                  }))
                  .filter((img) => Boolean(img.imageUrl))
              : (prod.imageUrl || prod.image)
              ? [{ imageUrl: prod.imageUrl || prod.image, isPrimary: true }]
              : [],
            warehouseSellingPrices: mappedWarehousePrices,
          });
        } else if (!isEdit) {
          const initialWarehousePrices = loadedWarehouses.map((w) => ({
            warehouseId: w.id,
            warehouseName: w.name,
            warehouseCode: w.code,
            sellingPrice: '',
            wholesalePrice: '',
            status: 'ACTIVE',
          }));

          setFormData((prev) => ({
            ...prev,
            categoryId: '',
            unitId: '',
            warehouseSellingPrices: initialWarehousePrices,
          }));
        }
      } catch (err) {
        toast.error(err?.message || 'Failed to load product details');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, isEdit]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const processFiles = async (filesList) => {
    const files = Array.from(filesList || []);
    if (files.length === 0) return;

    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 10MB limit`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploadingImage(true);
    try {
      const newImageUrls = [];
      for (const file of validFiles) {
        let uploadedUrl = null;
        try {
          const uploadRes = await productsApi.uploadProductImage(file, 'Products');
          uploadedUrl =
            uploadRes?.data?.fileUrl ||
            uploadRes?.fileUrl ||
            uploadRes?.data?.url ||
            uploadRes?.url ||
            uploadRes?.data?.document?.fileUrl;
        } catch {
          // Fallback to local Data URI if upload route unavailable
        }

        if (!uploadedUrl) {
          uploadedUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read image file'));
            reader.readAsDataURL(file);
          });
        }

        if (uploadedUrl) {
          newImageUrls.push(uploadedUrl);
        }
      }

      if (newImageUrls.length > 0) {
        setFormData((prev) => {
          const existingUrls = new Set(prev.images.map((img) => img.imageUrl));
          const additions = [];
          for (const url of newImageUrls) {
            if (!existingUrls.has(url)) {
              existingUrls.add(url);
              additions.push({
                imageUrl: url,
                isPrimary: prev.images.length === 0 && additions.length === 0,
              });
            }
          }
          return {
            ...prev,
            images: [...prev.images, ...additions],
          };
        });

        toast.success(
          newImageUrls.length === 1
            ? 'Product image uploaded successfully'
            : `${newImageUrls.length} images uploaded successfully`
        );
      }
    } catch {
      toast.error('Failed to process image file');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = (e) => {
    processFiles(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleSetPrimaryImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      })),
    }));
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => {
      const updated = prev.images.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return { ...prev, images: updated };
    });
  };

  // Warehouse Pricing Handlers
  const handleUpdateWarehousePrice = (index, field, val) => {
    setFormData((prev) => {
      const updated = [...prev.warehouseSellingPrices];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, warehouseSellingPrices: updated };
    });
  };

  const handleApplyBasePricesToAll = () => {
    setFormData((prev) => ({
      ...prev,
      warehouseSellingPrices: prev.warehouseSellingPrices.map((wp) => ({
        ...wp,
        sellingPrice: prev.sellingPrice || wp.sellingPrice,
        wholesalePrice: prev.wholesalePrice || wp.wholesalePrice,
      })),
    }));
    toast.success('Base prices copied to all warehouse overrides');
  };

  const handleClearAllWarehousePrices = () => {
    setFormData((prev) => ({
      ...prev,
      warehouseSellingPrices: prev.warehouseSellingPrices.map((wp) => ({
        ...wp,
        sellingPrice: '',
        wholesalePrice: '',
      })),
    }));
    toast.success('Warehouse overrides cleared');
  };

  const handleResetWarehousePrice = (index) => {
    setFormData((prev) => {
      const updated = [...prev.warehouseSellingPrices];
      updated[index] = { ...updated[index], sellingPrice: '', wholesalePrice: '' };
      return { ...prev, warehouseSellingPrices: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!formData.categoryId) {
      toast.error('Please select a product category');
      return;
    }

    if (!formData.unitId) {
      toast.error('Unit of measurement is required');
      return;
    }

    // Validate warehouse prices
    for (let i = 0; i < formData.warehouseSellingPrices.length; i++) {
      const wp = formData.warehouseSellingPrices[i];
      const whName = wp.warehouseName || `Facility ${i + 1}`;
      if (wp.sellingPrice !== '' && Number(wp.sellingPrice) < 0) {
        toast.error(`Selling price cannot be negative for ${whName}`);
        return;
      }
      if (wp.wholesalePrice !== '' && Number(wp.wholesalePrice) < 0) {
        toast.error(`Wholesale price cannot be negative for ${whName}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const baseSell = formData.sellingPrice ? Number(formData.sellingPrice) : 0;
      const baseWhole = formData.wholesalePrice ? Number(formData.wholesalePrice) : 0;

      // Ensure all warehouses are saved:
      // Facilities with custom prices use their entered prices.
      // Facilities left blank inherit the default base catalog prices (baseSell / baseWhole).
      const warehouseSellingPrices = (formData.warehouseSellingPrices || [])
        .filter((wp) => Boolean(wp.warehouseId))
        .map((wp) => {
          const hasCustomSell = wp.sellingPrice !== undefined && String(wp.sellingPrice).trim() !== '';
          const hasCustomWhole = wp.wholesalePrice !== undefined && String(wp.wholesalePrice).trim() !== '';

          const sell = hasCustomSell ? Math.max(0, Number(wp.sellingPrice)) : (baseSell || 0);
          const whole = hasCustomWhole ? Math.max(0, Number(wp.wholesalePrice)) : (baseWhole || 0);

          return {
            warehouseId: wp.warehouseId,
            sellingPrice: sell,
            wholesalePrice: whole,
            status: wp.status || 'ACTIVE',
            hasCustom: hasCustomSell || hasCustomWhole,
          };
        })
        .filter((wp) => wp.hasCustom || baseSell > 0 || baseWhole > 0 || wp.sellingPrice > 0 || wp.wholesalePrice > 0)
        .map(({ hasCustom, ...rest }) => rest);

      // Primary selling & wholesale price for the master product record
      const primarySell =
        baseSell > 0
          ? baseSell
          : warehouseSellingPrices.length > 0
          ? warehouseSellingPrices[0].sellingPrice
          : 0;

      const primaryWhole =
        baseWhole > 0
          ? baseWhole
          : warehouseSellingPrices.length > 0
          ? warehouseSellingPrices[0].wholesalePrice
          : 0;

      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim() || undefined,
        categoryId: formData.categoryId,
        brandId: formData.brandId || undefined,
        unitId: formData.unitId,
        status: 'ACTIVE',
        sellingPrice: primarySell,
        wholesalePrice: primaryWhole,
        images: formData.images.map((img) => ({
          imageUrl: img.imageUrl,
          isPrimary: Boolean(img.isPrimary),
        })),
        warehouseSellingPrices,
      };

      if (isEdit) {
        await productsApi.updateProduct(id, payload);
        toast.success('Product updated successfully');
      } else {
        await productsApi.createProduct(payload);
        toast.success('Product created successfully');
      }

      navigate('/products');
    } catch (err) {
      toast.error(err?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-muted800 rounded-lg w-64"></div>
        <div className="h-4 bg-muted800 rounded w-96"></div>
        <div className="h-96 bg-muted800/60 rounded-2xl border border-border"></div>
      </div>
    );
  }

  const totalWarehousesCount = warehouses.length;
  const assignedCount = (formData.warehouseSellingPrices || []).filter(
    (wp) => String(wp.sellingPrice).trim() !== '' || String(wp.wholesalePrice).trim() !== ''
  ).length;

  // Default base prices are hidden in edit mode; shown ONLY in create mode per requirement.
  const hideDefaultPrices = isEdit;

  return (
    <div className="w-full max-w-[1500px] mx-auto space-y-6">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted800 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Catalog</span>
            </button>
            <span className="text-border">/</span>
            <span className="text-xs font-medium text-muted-foreground">
              {isEdit ? 'Edit Product' : 'New Registration'}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span>📦</span>
            <span>{isEdit ? `Edit: ${formData.name || 'Product'}` : 'Register New Product'}</span>
          </h1>
          {isEdit && formData.sku && (
            <p className="text-xs text-muted-foreground font-mono">
              SKU: {formData.sku}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate('/products')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            loading={submitting}
            onClick={handleSubmit}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            }
          >
            {isEdit ? 'Save Changes' : 'Register Product'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── SECTION 1: GENERAL SPECIFICATIONS (3 fields per row) ─────────────────── */}
        <div className="relative z-20 bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">📋</span>
              <div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  1. Product Information & Classification
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
            {/* Field 1: Product Name */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Product Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Ultra-Durable Industrial Drill Bit"
                className="w-full px-3.5 py-2.5 bg-muted800/80 border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Field 2: SKU Code */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                SKU Code (Auto-generated if blank)
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                placeholder="e.g. PRD-DRL-001"
                className="w-full px-3.5 py-2.5 bg-muted800/80 border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            {/* Field 3: Brand / Manufacturer */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">
                  Brand / Manufacturer
                </label>
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(true)}
                  className="text-[11px] text-blue-500 hover:text-blue-400 font-semibold transition"
                >
                  + New Brand
                </button>
              </div>
              <SearchableSelect
                value={formData.brandId}
                onChange={(val) => handleChange('brandId', val)}
                options={brandOptions}
                placeholder="None"
                searchPlaceholder="Search brands..."
              />
            </div>

            {/* Dynamic Cascading Categories (Main, Subcategory, Child Subcategory) */}
            <CascadingCategoryDropdowns
              value={formData.categoryId}
              onChange={(catId) => handleChange('categoryId', catId)}
              categories={categories}
              required={true}
              layout="contents"
              onAddNew={handleOpenCategoryModal}
            />

            {/* Unit of Measurement */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">
                  Unit of Measurement <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(true)}
                  className="text-[11px] text-blue-500 hover:text-blue-400 font-semibold transition"
                >
                  + New Unit
                </button>
              </div>
              <SearchableSelect
                value={formData.unitId}
                onChange={(val) => handleChange('unitId', val)}
                options={unitOptions}
                placeholder="None"
                searchPlaceholder="Search units..."
                required
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 2: DEFAULT BASE PRICING (Hidden when warehouse prices are assigned in edit mode) ── */}
        {!hideDefaultPrices && (
          <div className="relative z-10 bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border">
              <span className="text-lg">💵</span>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                2. Default Base Pricing
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {/* Field 1: Selling Price */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Standard Selling Price (ETB)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sellingPrice}
                  onChange={(e) => handleChange('sellingPrice', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-muted800/80 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              {/* Field 2: Wholesale Price */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-foreground">
                    Standard Wholesale Price (ETB)
                  </label>
                  {Number(formData.sellingPrice) > 0 && Number(formData.wholesalePrice) > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
                      {(((Number(formData.sellingPrice) - Number(formData.wholesalePrice)) / Number(formData.sellingPrice)) * 100).toFixed(1)}% Off
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.wholesalePrice}
                  onChange={(e) => handleChange('wholesalePrice', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-muted800/80 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              {/* Field 3: Pricing Analytics Card */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-muted800/40 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                  Margin & Spread Summary
                </span>
                <div className="grid grid-cols-2 gap-2 my-1 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Selling:</span>
                    <span className="font-mono font-semibold text-emerald-400">
                      {formData.sellingPrice ? `ETB ${Number(formData.sellingPrice).toFixed(2)}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Wholesale:</span>
                    <span className="font-mono font-semibold text-sky-400">
                      {formData.wholesalePrice ? `ETB ${Number(formData.wholesalePrice).toFixed(2)}` : '—'}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Wholesale Margin:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {Number(formData.sellingPrice) > 0 && Number(formData.wholesalePrice) > 0
                      ? `ETB ${(Number(formData.sellingPrice) - Number(formData.wholesalePrice)).toFixed(2)} (${(((Number(formData.sellingPrice) - Number(formData.wholesalePrice)) / Number(formData.sellingPrice)) * 100).toFixed(1)}%)`
                      : 'Base rate'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION: WAREHOUSE-SPECIFIC PRICES (3 per row) ────────────────── */}
        <div className="relative z-0 bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🏢</span>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  {hideDefaultPrices
                    ? '2. Warehouse-Specific Selling & Wholesale Prices'
                    : '3. Warehouse-Specific Selling & Wholesale Prices'}
                </h3>
                {formData.warehouseSellingPrices.length > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {formData.warehouseSellingPrices.length} {formData.warehouseSellingPrices.length === 1 ? 'Registered Facility' : 'Registered Facilities'}
                  </span>
                )}
              </div>
            </div>

            {formData.warehouseSellingPrices.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllWarehousePrices}
                className="text-xs text-muted-foreground hover:text-rose-400 transition shrink-0"
                title="Clear custom overrides to fall back to default catalog base prices"
              >
                Clear All
              </button>
            )}
          </div>

          {warehouses.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-border rounded-xl">
              <p className="text-xs text-muted-foreground">
                No warehouses found in your organization. Create warehouses first under Branches & Warehouses to configure facility-level price overrides.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {formData.warehouseSellingPrices.map((wp, idx) => {
                const matchingWh = warehouses.find((w) => w.id === wp.warehouseId);
                const whName = wp.warehouseName || matchingWh?.name || `Warehouse ${idx + 1}`;
                const whCode = wp.warehouseCode || matchingWh?.code;

                const sellPrice = Number(wp.sellingPrice) || 0;
                const wholePrice = Number(wp.wholesalePrice) || 0;
                const discountPct =
                  sellPrice > 0 && wholePrice > 0
                    ? (((sellPrice - wholePrice) / sellPrice) * 100).toFixed(1)
                    : null;

                const hasOverride = wp.sellingPrice !== '' || wp.wholesalePrice !== '';

                return (
                  <div
                    key={wp.warehouseId || idx}
                    className={`p-4 rounded-xl border transition flex flex-col justify-between gap-3 ${
                      hasOverride
                        ? 'border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10'
                        : 'border-border bg-muted800/40 hover:bg-muted800/70'
                    }`}
                  >
                    {/* Facility Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-muted800 border border-border flex items-center justify-center text-base shrink-0">
                          🏢
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground truncate" title={whName}>
                              {whName}
                            </span>
                            {whCode && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted900 text-muted-foreground border border-border shrink-0">
                                {whCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {hasOverride && (
                        <button
                          type="button"
                          onClick={() => handleResetWarehousePrice(idx)}
                          className="p-1 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                          title="Reset facility override to default"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                      <div>
                        <label className="block text-[11px] font-medium text-foreground mb-1">
                          Selling Price (ETB)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={wp.sellingPrice}
                          onChange={(e) =>
                            handleUpdateWarehousePrice(idx, 'sellingPrice', e.target.value)
                          }
                          placeholder={formData.sellingPrice ? `${formData.sellingPrice} (Base)` : '0.00'}
                          className="w-full px-2.5 py-1.5 bg-muted900 border border-border rounded-lg text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-muted-foreground/50"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-medium text-foreground">
                            Wholesale Price (ETB)
                          </label>
                          {discountPct && (
                            <span className="text-[10px] font-mono px-1 rounded text-sky-400 bg-sky-500/10 border border-sky-500/20 font-semibold">
                              -{discountPct}%
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={wp.wholesalePrice}
                          onChange={(e) =>
                            handleUpdateWarehousePrice(idx, 'wholesalePrice', e.target.value)
                          }
                          placeholder={formData.wholesalePrice ? `${formData.wholesalePrice} (Base)` : '0.00'}
                          className="w-full px-2.5 py-1.5 bg-muted900 border border-border rounded-lg text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-muted-foreground/50"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SECTION 4: PRODUCT IMAGES ──────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🖼️</span>
              <div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  {hideDefaultPrices ? '3. Product Photos & Gallery' : '4. Product Photos & Gallery'} ({formData.images.length})
                </h3>
              </div>
            </div>

            {formData.images.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="text-xs"
              >
                {uploadingImage ? 'Uploading...' : '+ Add More Photos'}
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {formData.images.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition space-y-2.5 ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10 ring-4 ring-blue-500/20 scale-[1.01]'
                  : 'border-border hover:border-blue-500/60 bg-muted800/30 hover:bg-muted800/60'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto text-xl transition ${
                isDragging ? 'bg-blue-600 text-white scale-110' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              }`}>
                {isDragging ? '📥' : '📁'}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {uploadingImage
                    ? 'Uploading image...'
                    : isDragging
                    ? 'Drop image files here to upload'
                    : 'Drag & drop photos here, or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Supports PNG, JPG, WEBP up to 10MB per file
                </p>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-2xl p-1 transition ${
                isDragging ? 'ring-2 ring-blue-500 bg-blue-500/5' : ''
              }`}
            >
              {isDragging && (
                <div className="absolute inset-0 z-20 rounded-2xl bg-blue-600/15 border-2 border-dashed border-blue-500 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                  <div className="p-3.5 rounded-xl bg-card border border-border shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-bold text-foreground">
                    <span className="text-base">📥</span> Drop images here to add to gallery
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      Uploaded Photos ({formData.images.length})
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      (Click photo to preview)
                    </span>
                  </div>
                  <span className="text-[11px] text-blue-400 font-medium">
                    ★ Primary photo shown on catalog
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-muted900/50 border border-border/80">
                  {formData.images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border overflow-hidden group shrink-0 bg-muted900 transition-all ${
                        img.isPrimary
                          ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-sm'
                          : 'border-border hover:border-blue-500/60'
                      }`}
                    >
                      <img
                        src={img.imageUrl || img.url || img.fileUrl}
                        alt={`Product preview ${idx + 1}`}
                        className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition"
                        onClick={() => setLightboxPreviewIndex(idx)}
                        title="Click to preview full size"
                      />

                      {img.isPrimary && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-600 text-white shadow-md z-10">
                          ★ Primary
                        </span>
                      )}

                      <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 p-1 z-20 backdrop-blur-[1px]">
                        <button
                          type="button"
                          onClick={() => setLightboxPreviewIndex(idx)}
                          className="p-1 rounded-md bg-card/90 text-foreground hover:bg-blue-600 hover:text-white text-xs font-medium transition"
                          title="Preview full size"
                        >
                          🔍
                        </button>
                        {!img.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="p-1 rounded-md bg-blue-600/90 text-white hover:bg-blue-500 text-xs font-medium transition"
                            title="Set as primary thumbnail"
                          >
                            ★
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1 rounded-md bg-rose-600/90 text-white hover:bg-rose-500 text-xs font-medium transition"
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Inline Mini Add Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-dashed border-border hover:border-blue-500/80 bg-muted800/20 hover:bg-muted800/40 text-muted-foreground hover:text-blue-300 transition flex flex-col items-center justify-center gap-1 text-[11px] shrink-0"
                    title="Upload more photos"
                  >
                    <span className="text-base">+</span>
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Page Bottom Sticky Actions ───────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate('/products')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={submitting}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            }
          >
            {isEdit ? 'Save Changes' : 'Register Product'}
          </Button>
        </div>
      </form>

      {/* Lightbox Preview */}
      <ImagePreviewModal
        isOpen={lightboxPreviewIndex !== null}
        onClose={() => setLightboxPreviewIndex(null)}
        images={formData.images}
        initialIndex={lightboxPreviewIndex || 0}
        productName={formData.name || 'Product Photo Preview'}
      />

      {/* Quick Dynamic Category Registration Modal */}
      <QuickCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        defaultParentId={categoryModalParentId}
        existingCategories={categories}
        onSuccess={(newCat) => {
          setCategories((prev) => {
            const exists = prev.some((c) => c.id === newCat.id);
            return exists ? prev : [...prev, newCat];
          });
          setFormData((prev) => ({ ...prev, categoryId: newCat.id }));
        }}
      />

      {/* Quick Dynamic Brand Registration Modal */}
      <QuickBrandModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onSuccess={(newBrand) => {
          setBrands((prev) => [...prev, newBrand]);
          setFormData((prev) => ({ ...prev, brandId: newBrand.id }));
        }}
      />

      {/* Quick Dynamic Unit Registration Modal */}
      <QuickUnitModal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        onSuccess={(newUnit) => {
          setUnits((prev) => [...prev, newUnit]);
          setFormData((prev) => ({ ...prev, unitId: newUnit.id }));
        }}
      />
    </div>
  );
}
