import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { productsApi } from '../productsApi';
import ImagePreviewModal from './ImagePreviewModal';
import CascadingCategoryDropdowns from './CascadingCategoryDropdowns';
import QuickCategoryModal from './QuickCategoryModal';

export default function ProductFormModal({
  isOpen = false,
  onClose,
  onSave,
  product = null,
  categories = [],
  brands = [],
  units = [],
  warehouses = [],
  submitting = false,
}) {
  const isEdit = Boolean(product && product.id);

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

  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxPreviewIndex, setLightboxPreviewIndex] = useState(null);

  // Dynamic Registration Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalParentId, setCategoryModalParentId] = useState('');

  const handleOpenCategoryModal = (parentId = '') => {
    setCategoryModalParentId(parentId);
    setIsCategoryModalOpen(true);
  };

  // Initialize defaults on open or product edit
  useEffect(() => {
    const activeWarehouses = warehouses || [];

    if (product) {
      const existingMap = new Map(
        (product.warehouseSellingPrices || []).map((wp) => [wp.warehouseId, wp])
      );

      const mappedWarehousePrices = activeWarehouses.map((w) => {
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
        name: product.name || '',
        sku: product.sku || '',
        categoryId: product.categoryId || product.category?.id || '',
        brandId: product.brandId || product.brand?.id || '',
        unitId: product.unitId || product.unit?.id || '',
        status: product.status || 'ACTIVE',
        sellingPrice:
          product.sellingPrice !== undefined && product.sellingPrice !== null
            ? String(product.sellingPrice)
            : '',
        wholesalePrice:
          product.wholesalePrice !== undefined && product.wholesalePrice !== null
            ? String(product.wholesalePrice)
            : '',
        images: (product.images && product.images.length > 0)
          ? product.images
            .map((img) => ({
              imageUrl: typeof img === 'string' ? img : (img.imageUrl || img.fileUrl || img.url || ''),
              isPrimary: Boolean(img.isPrimary),
            }))
            .filter((img) => Boolean(img.imageUrl))
          : (product.imageUrl || product.image)
            ? [{ imageUrl: product.imageUrl || product.image, isPrimary: true }]
            : [],
        warehouseSellingPrices: mappedWarehousePrices,
      });
    } else {
      const initialWarehousePrices = activeWarehouses.map((w) => ({
        warehouseId: w.id,
        warehouseName: w.name,
        warehouseCode: w.code,
        sellingPrice: '',
        wholesalePrice: '',
        status: 'ACTIVE',
      }));

      setFormData({
        name: '',
        sku: '',
        categoryId: categories[0]?.id || '',
        brandId: '',
        unitId: units[0]?.id || '',
        status: 'ACTIVE',
        sellingPrice: '',
        wholesalePrice: '',
        images: [],
        warehouseSellingPrices: initialWarehousePrices,
      });
    }
  }, [product, isOpen, categories, units, warehouses]);

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Product name is required');
      return;
    }

    if (!formData.categoryId) {
      alert('Please select a product category');
      return;
    }

    if (!formData.unitId) {
      alert('Unit of measurement is required');
      return;
    }

    // Validate warehouse prices
    for (let i = 0; i < formData.warehouseSellingPrices.length; i++) {
      const wp = formData.warehouseSellingPrices[i];
      const whName = wp.warehouseName || `Facility ${i + 1}`;
      if (wp.sellingPrice !== '' && Number(wp.sellingPrice) < 0) {
        alert(`Selling price cannot be negative for ${whName}`);
        return;
      }
      if (wp.wholesalePrice !== '' && Number(wp.wholesalePrice) < 0) {
        alert(`Wholesale price cannot be negative for ${whName}`);
        return;
      }
    }

    const baseSell =
      formData.sellingPrice !== '' && formData.sellingPrice !== undefined && formData.sellingPrice !== null
        ? Math.max(0, Number(formData.sellingPrice))
        : 0;
    const baseWhole =
      formData.wholesalePrice !== '' && formData.wholesalePrice !== undefined && formData.wholesalePrice !== null
        ? Math.max(0, Number(formData.wholesalePrice))
        : 0;

    const warehouseSellingPrices = (formData.warehouseSellingPrices || [])
      .filter((wp) => {
        const hasCustomSell =
          wp.sellingPrice !== undefined && wp.sellingPrice !== null && String(wp.sellingPrice).trim() !== '';
        const hasCustomWhole =
          wp.wholesalePrice !== undefined && wp.wholesalePrice !== null && String(wp.wholesalePrice).trim() !== '';
        return Boolean(wp.warehouseId) && (hasCustomSell || hasCustomWhole);
      })
      .map((wp) => {
        const hasCustomSell =
          wp.sellingPrice !== undefined && wp.sellingPrice !== null && String(wp.sellingPrice).trim() !== '';
        const hasCustomWhole =
          wp.wholesalePrice !== undefined && wp.wholesalePrice !== null && String(wp.wholesalePrice).trim() !== '';
        return {
          warehouseId: wp.warehouseId,
          sellingPrice: hasCustomSell ? Math.max(0, Number(wp.sellingPrice)) : 0,
          wholesalePrice: hasCustomWhole ? Math.max(0, Number(wp.wholesalePrice)) : 0,
          status: wp.status || 'ACTIVE',
        };
      });

    onSave({
      ...formData,
      sellingPrice: baseSell,
      wholesalePrice: baseWhole,
      warehouseSellingPrices,
    });
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? 'Edit Product' : 'Register New Product'}
        subtitle={
          isEdit
            ? `Update specifications and pricing for ${formData.name || 'product'}`
            : 'Fill in product specifications, images, and warehouse pricing in one place'
        }
        icon="📦"
        maxWidth="max-w-4xl"
        scope="workspace"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── SECTION 1: GENERAL SPECIFICATIONS ─────────────────── */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-1 border-b border-border">
              <span className="text-base">📋</span>
              <h4 className="text-xs font-normal text-foreground uppercase tracking-wider">
                1. Product Information & Classification
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1">
                  Product Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Ultra-Durable Industrial Drill Bit"
                  className="w-full px-3 py-2 bg-muted800/80 border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Connected Category Selection (allows root category if no children) */}
              <div className="sm:col-span-2">
                <CascadingCategoryDropdowns
                  categories={categories}
                  value={formData.categoryId}
                  onChange={(val) => handleChange('categoryId', val)}
                  required
                  onAddNew={handleOpenCategoryModal}
                />
                <span className="text-[11px] text-muted-foreground mt-1.5 block">
                  Select a Main Category. If it has subcategories, choose the relevant subcategory. Root categories without children are directly supported.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  SKU Code (Auto-generated if blank)
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  placeholder="e.g. PRD-DRL-001"
                  className="w-full px-3 py-2 bg-muted800/80 border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Brand / Manufacturer
                </label>
                <select
                  value={formData.brandId}
                  onChange={(e) => handleChange('brandId', e.target.value)}
                  className="w-full px-3 py-2 bg-muted800/80 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">None (Generic / Unbranded)</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1">
                  Unit of Measurement <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={formData.unitId}
                  onChange={(e) => handleChange('unitId', e.target.value)}
                  className="w-full px-3 py-2 bg-muted800/80 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Select Unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.abbreviation})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: BASE PRICING ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-base">💵</span>
                <h4 className="text-xs font-normal text-foreground uppercase tracking-wider">
                  2. Default Base Pricing
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  className="w-full px-3 py-2 bg-muted800/80 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-foreground">
                    Standard Wholesale Price (ETB)
                  </label>
                  {Number(formData.sellingPrice) > 0 && Number(formData.wholesalePrice) > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {(((Number(formData.sellingPrice) - Number(formData.wholesalePrice)) / Number(formData.sellingPrice)) * 100).toFixed(1)}% Discount
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
                  className="w-full px-3 py-2 bg-muted800/80 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* ── SECTION 3: WAREHOUSE-SPECIFIC PRICES ────────────────── */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-base">🏢</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-normal text-foreground uppercase tracking-wider">
                      3. Warehouse-Specific Selling & Wholesale Prices
                    </h4>
                    {formData.warehouseSellingPrices.length > 0 && (
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                        {formData.warehouseSellingPrices.length} {formData.warehouseSellingPrices.length === 1 ? 'Registered Facility' : 'Registered Facilities'}
                      </span>
                    )}
                  </div>
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
              <div className="p-4 text-center border border-dashed border-border rounded-xl">
                <p className="text-xs text-muted-foreground">
                  No warehouses found in your organization. Create warehouses first under Branches & Warehouses to configure facility-level price overrides.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {formData.warehouseSellingPrices.map((wp, idx) => {
                  const matchingWh = warehouses.find((w) => w.id === wp.warehouseId);
                  const whName = wp.warehouseName || matchingWh?.name || `Warehouse ${idx + 1}`;
                  const whCode = wp.warehouseCode || matchingWh?.code;

                  const hasOverride = wp.sellingPrice !== '' || wp.wholesalePrice !== '';

                  return (
                    <div
                      key={wp.warehouseId || idx}
                      className={`p-3 rounded-xl border transition ${hasOverride
                          ? 'border-violet-500/40 bg-violet-500/5 hover:bg-violet-500/10'
                          : 'border-border bg-muted800/40 hover:bg-muted800/70'
                        }`}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        {/* Facility Information (Fixed registered warehouse) */}
                        <div className="sm:col-span-4 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-muted800 border border-border flex items-center justify-center text-sm shrink-0">
                            🏢
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-normal text-foreground truncate" title={whName}>
                                {whName}
                              </span>
                              {whCode && (
                                <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-muted900 text-muted-foreground border border-border shrink-0">
                                  {whCode}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {hasOverride ? 'Custom Override Active' : 'Uses Default Base Rate'}
                            </span>
                          </div>
                        </div>

                        {/* Selling Price Override */}
                        <div className="sm:col-span-4">
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
                            placeholder="Optional (e.g. 0.00)"
                            className="w-full px-2.5 py-1.5 bg-muted900 border border-border rounded-lg text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-muted-foreground/50"
                          />
                        </div>

                        {/* Wholesale Price Override */}
                        <div className="sm:col-span-4">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-medium text-foreground">
                              Wholesale Price (ETB)
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={wp.wholesalePrice}
                              onChange={(e) =>
                                handleUpdateWarehousePrice(idx, 'wholesalePrice', e.target.value)
                              }
                              placeholder="Optional (e.g. 0.00)"
                              className="w-full px-2.5 py-1.5 bg-muted900 border border-border rounded-lg text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-muted-foreground/50"
                            />
                            {hasOverride && (
                              <button
                                type="button"
                                onClick={() => handleResetWarehousePrice(idx)}
                                className="p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded transition shrink-0"
                                title="Clear override for this facility"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── SECTION 4: PRODUCT IMAGES ──────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-base">🖼️</span>
                <div>
                  <h4 className="text-xs font-normal text-foreground uppercase tracking-wider">
                    4. Product Photos & Gallery ({formData.images.length})
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Upload images from your computer. The primary photo is displayed across the catalog.
                  </p>
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

            {/* Hidden File Input for Multiple Uploads */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Local Image Upload Card / Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-5 border-2 border-dashed rounded-xl transition cursor-pointer flex flex-col items-center justify-center text-center group ${isDragging
                  ? 'border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/30'
                  : 'border-border hover:border-violet-500/60 bg-muted800/25 hover:bg-muted800/50'
                }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 transition ${isDragging
                  ? 'bg-violet-600 text-white scale-110'
                  : 'bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20 group-hover:scale-110'
                }`}>
                {uploadingImage ? (
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                ) : isDragging ? (
                  <span className="text-xl">📥</span>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="space-y-1 max-w-sm">
                <p className="text-xs font-normal text-foreground group-hover:text-violet-300 transition">
                  {uploadingImage
                    ? 'Uploading selected image(s)...'
                    : isDragging
                      ? 'Drop image files now to upload'
                      : 'Click to browse or drop product photos here'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Supports JPG, PNG, WEBP, and GIF up to 10MB each. Multiple files supported.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={uploadingImage}
                className="mt-3 text-xs pointer-events-none"
              >
                {uploadingImage ? 'Processing...' : '📁 Choose Images from Computer'}
              </Button>
            </div>

            {/* Gallery Filmstrip - Small Size Preview */}
            {formData.images.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-normal text-foreground">
                      Uploaded Photos ({formData.images.length})
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      (Click photo to preview)
                    </span>
                  </div>
                  <span className="text-[10px] text-violet-400 font-medium">
                    ★ Primary photo shown on catalog
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 p-2.5 rounded-xl bg-muted900/50 border border-border/80">
                  {formData.images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border overflow-hidden group shrink-0 bg-muted900 transition-all ${img.isPrimary
                          ? 'border-violet-500 ring-2 ring-violet-500/40 shadow-sm'
                          : 'border-border hover:border-violet-500/60'
                        }`}
                    >
                      <img
                        src={img.imageUrl || img.url || img.fileUrl}
                        alt={`Product thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition"
                        onClick={() => setLightboxPreviewIndex(idx)}
                        title="Click to preview full size"
                      />

                      {/* Primary Badge */}
                      {img.isPrimary && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-normal bg-violet-600 text-white shadow-md z-10">
                          ★ Primary
                        </span>
                      )}

                      {/* Quick Action Overlay */}
                      <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 p-1 z-20 backdrop-blur-[1px]">
                        <button
                          type="button"
                          onClick={() => setLightboxPreviewIndex(idx)}
                          className="p-1 rounded-md bg-muted800/90 hover:bg-violet-600 text-foreground hover:text-white text-xs transition"
                          title="Enlarge preview"
                        >
                          🔍
                        </button>
                        {!img.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="p-1 rounded-md bg-violet-600/90 hover:bg-violet-500 text-white text-xs transition"
                            title="Set as primary photo"
                          >
                            ★
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1 rounded-md bg-rose-600/90 hover:bg-rose-500 text-white text-xs transition"
                          title="Remove photo"
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
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-dashed border-border hover:border-violet-500/80 bg-muted800/20 hover:bg-muted800/40 text-muted-foreground hover:text-violet-300 transition flex flex-col items-center justify-center gap-1 text-[11px] shrink-0"
                    title="Upload more photos"
                  >
                    <span className="text-base">+</span>
                    <span>Add</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION: PUBLICATION & STATUS ─────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-border">
              <span className="text-base">🚀</span>
              <div>
                <h4 className="text-xs font-normal text-foreground uppercase tracking-wider">
                  {isEdit ? '4. Product Status & Visibility' : '5. Product Status & Visibility'}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Determine whether this product is active for sales orders, catalog browsing, and warehouse allocations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`relative flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${formData.status === 'ACTIVE'
                    ? 'border-emerald-500/80 bg-emerald-500/10 ring-1 ring-emerald-500/40'
                    : 'border-border bg-muted800/40 hover:bg-muted800/80'
                  }`}
              >
                <input
                  type="radio"
                  name="productStatus"
                  value="ACTIVE"
                  checked={formData.status === 'ACTIVE'}
                  onChange={() => handleChange('status', 'ACTIVE')}
                  className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-normal text-foreground">ACTIVE</span>
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-normal bg-emerald-500/20 text-emerald-400">
                      Live in Catalog
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Available for stock receipts, warehouse pricing, order fulfillment, and client quoting.
                  </p>
                </div>
              </label>

              <label
                className={`relative flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${formData.status === 'INACTIVE'
                    ? 'border-amber-500/80 bg-amber-500/10 ring-1 ring-amber-500/40'
                    : 'border-border bg-muted800/40 hover:bg-muted800/80'
                  }`}
              >
                <input
                  type="radio"
                  name="productStatus"
                  value="INACTIVE"
                  checked={formData.status === 'INACTIVE'}
                  onChange={() => handleChange('status', 'INACTIVE')}
                  className="mt-0.5 text-amber-500 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-normal text-foreground">INACTIVE</span>
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-normal bg-amber-500/20 text-amber-400">
                      Draft / Inactive
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Hidden from standard sales operations and new orders. Can be activated at any time.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* ── FINAL FORM ACTIONS (AT THE BOTTOM OF ALL FORMS) ─────── */}
          <div className="pt-6 border-t border-border flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              disabled={submitting}
              className="w-full sm:w-auto px-6"
            >
              {isEdit ? 'Save Changes' : 'Register Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Fullscreen Lightbox Preview */}
      <ImagePreviewModal
        isOpen={lightboxPreviewIndex !== null}
        onClose={() => setLightboxPreviewIndex(null)}
        images={formData.images}
        initialIndex={lightboxPreviewIndex || 0}
        productName={formData.name || 'Product Image Preview'}
      />

      {/* Quick Dynamic Category Registration Modal */}
      <QuickCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        defaultParentId={categoryModalParentId}
        existingCategories={categories}
        onSuccess={(newCat) => {
          setFormData((prev) => ({ ...prev, categoryId: newCat.id }));
        }}
      />
    </>
  );
}
