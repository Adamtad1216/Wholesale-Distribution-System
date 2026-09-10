import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Package,
  ArrowLeft,
  Edit,
  Tag,
  Warehouse,
  Coins,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Layers,
  BarChart3,
  Calendar,
  Clock,
  User,
  RefreshCw,
  Maximize2,
} from 'lucide-react';

import { productsApi } from '../productsApi';
import { usePermission } from '../../../hooks/usePermission';
import Button from '../../../components/ui/Button';
import ImagePreviewModal from '../components/ImagePreviewModal';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [totalWarehouses, setTotalWarehouses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [allWarehouses, setAllWarehouses] = useState([]);

  const { can: canUpdate } = usePermission('products:update');

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [prodRes, whRes] = await Promise.allSettled([
        productsApi.getProductById(id),
        productsApi.getWarehouses({ limit: 100 }),
      ]);

      if (prodRes.status === 'fulfilled') {
        const d = prodRes.value?.data || prodRes.value;
        setProduct(d);
      } else {
        toast.error(prodRes.reason?.message || 'Failed to load product details');
      }

      if (whRes.status === 'fulfilled') {
        const raw = whRes.value;
        const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        setAllWarehouses(list);
        const total = raw?.meta?.total ?? list.length;
        setTotalWarehouses(total);
      }
    } catch (err) {
      toast.error(err?.message || 'An unexpected error occurred loading product');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Normalize images safely
  const normalizedImages = useMemo(() => {
    if (!product) return [];
    const list = Array.isArray(product?.images) ? [...product.images] : [];
    if (list.length === 0 && (product?.imageUrl || product?.image || product?.thumbnail)) {
      list.push({ imageUrl: product.imageUrl || product.image || product.thumbnail, isPrimary: true });
    }
    return list
      .map((item) => {
        if (!item) return null;
        if (typeof item === 'string' && item.trim()) return { imageUrl: item.trim(), isPrimary: false };
        const url = item.imageUrl || item.fileUrl || item.url || item.secure_url || item.src;
        if (!url || typeof url !== 'string' || !url.trim()) return null;
        return {
          ...item,
          imageUrl: url.trim(),
          isPrimary: Boolean(item.isPrimary),
        };
      })
      .filter(Boolean);
  }, [product]);

  const warehouseStocks = useMemo(() => {
    return Array.isArray(product?.warehouseStocks) ? product.warehouseStocks : [];
  }, [product]);

  const stockSummary = useMemo(() => {
    let totalQty = 0;
    let totalAvail = 0;
    let totalRes = 0;
    warehouseStocks.forEach((s) => {
      totalQty += Number(s.quantity) || 0;
      totalAvail += Number(s.availableQuantity) || 0;
      totalRes += Number(s.reservedQuantity) || 0;
    });
    return {
      totalQuantity: totalQty,
      availableQuantity: totalAvail,
      reservedQuantity: totalRes,
    };
  }, [warehouseStocks]);

  const totalMinStock = useMemo(() => {
    return warehouseStocks.reduce((sum, s) => sum + (Number(s.minimumStock) || 0), 0);
  }, [warehouseStocks]);

  const totalReorderLevel = useMemo(() => {
    return warehouseStocks.reduce((sum, s) => sum + (Number(s.reorderLevel) || 0), 0);
  }, [warehouseStocks]);

  const warehouseSellingPrices = useMemo(() => {
    return Array.isArray(product?.warehouseSellingPrices) ? product.warehouseSellingPrices : [];
  }, [product]);

  // Selling prices computed for EVERY warehouse depot
  const allWarehousePrices = useMemo(() => {
    if (!product) return [];
    const baseSell = Number(product.sellingPrice) || 0;
    const baseWhole = Number(product.wholesalePrice) || 0;

    const customPricesMap = new Map();
    (product.warehouseSellingPrices || []).forEach((wp) => {
      if (wp.warehouseId) {
        customPricesMap.set(wp.warehouseId, wp);
      }
    });

    const warehouseMap = new Map();
    allWarehouses.forEach((w) => warehouseMap.set(w.id, w));
    (product.warehouseStocks || []).forEach((s) => {
      if (s.warehouse && !warehouseMap.has(s.warehouseId)) {
        warehouseMap.set(s.warehouseId, { ...s.warehouse, id: s.warehouseId });
      }
    });
    (product.warehouseSellingPrices || []).forEach((wp) => {
      if (wp.warehouse && !warehouseMap.has(wp.warehouseId)) {
        warehouseMap.set(wp.warehouseId, { ...wp.warehouse, id: wp.warehouseId });
      }
    });

    const list = Array.from(warehouseMap.values());
    if (list.length === 0 && (product.warehouseStocks || []).length > 0) {
      return product.warehouseStocks.map((s) => {
        const custom = customPricesMap.get(s.warehouseId);
        return {
          warehouseId: s.warehouseId,
          warehouse: s.warehouse,
          sellingPrice: custom ? Number(custom.sellingPrice) : baseSell,
          wholesalePrice: custom ? Number(custom.wholesalePrice) : baseWhole,
          isCustom: Boolean(custom),
        };
      });
    }

    return list.map((w) => {
      const custom = customPricesMap.get(w.id);
      return {
        warehouseId: w.id,
        warehouse: w,
        sellingPrice: custom ? Number(custom.sellingPrice) : baseSell,
        wholesalePrice: custom ? Number(custom.wholesalePrice) : baseWhole,
        isCustom: Boolean(custom),
      };
    });
  }, [product, allWarehouses]);

  const formatPrice = (val) => {
    const num = Number(val);
    if (isNaN(num)) return 'ETB 0.00';
    return `ETB ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const activeImage = normalizedImages[activeImageIndex]?.imageUrl || normalizedImages[0]?.imageUrl;

  const sellPrice = Number(product?.sellingPrice) || 0;
  const wholePrice = Number(product?.wholesalePrice) || 0;
  const costPrice = Number(product?.costPrice) || 0;
  const catalogDiscount =
    sellPrice > 0 && wholePrice > 0
      ? (((sellPrice - wholePrice) / sellPrice) * 100).toFixed(1)
      : null;

  const minStock = Number(product?.minimumStockLevel) || 0;
  const reorder = Number(product?.reorderLevel) || 0;

  const creatorName = product?.createdBy?.person
    ? `${product.createdBy.person.firstName || ''} ${product.createdBy.person.lastName || ''}`.trim()
    : null;
  const updaterName = product?.updatedBy?.person
    ? `${product.updatedBy.person.firstName || ''} ${product.updatedBy.person.lastName || ''}`.trim()
    : null;

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 my-12">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-normal text-foreground">Product Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The requested product record does not exist or has been removed from the catalog.
        </p>
        <Button variant="outline" onClick={() => navigate('/products')}>
          Back to Products Catalog
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
      {/* Top Header / Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="p-2 rounded-xl bg-card border border-border hover:bg-muted800 text-muted-foreground hover:text-foreground transition"
            title="Back to Products Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-normal px-2 py-0.5 rounded-md bg-muted800 text-muted-foreground border border-border">
                {product.sku || 'SKU-N/A'}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-normal border ${product.status === 'ACTIVE'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-muted800 text-muted-foreground border-border'
                  }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${product.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-muted-foreground'
                    }`}
                />
                {product.status || 'ACTIVE'}
              </span>
            </div>
            <h1 className="text-2xl font-normal text-foreground tracking-tight mt-1">{product.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Button variant="outline" size="sm" onClick={fetchProduct} className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          {canUpdate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/products/${product.id}/edit`)}
              className="flex items-center gap-2 shadow-lg shadow-violet-500/20"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Product</span>
            </Button>
          )}
        </div>
      </div>

      {/* Hero Grid: Media Gallery & Core Attributes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Gallery & Lightbox Trigger (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div
            onClick={() => activeImage && setIsLightboxOpen(true)}
            className={`w-full h-80 rounded-3xl bg-card border border-border overflow-hidden flex items-center justify-center relative group shadow-sm ${activeImage ? 'cursor-pointer hover:border-violet-500/50 transition' : ''
              }`}
          >
            {activeImage ? (
              <>
                <img
                  src={activeImage}
                  alt={product.name}
                  className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.detail-img-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                  <span className="px-3.5 py-2 rounded-full bg-black/70 backdrop-blur-md text-xs font-normal flex items-center gap-2 shadow-xl">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Click to Enlarge</span>
                  </span>
                </div>
                <div className="detail-img-fallback hidden flex-col items-center justify-center text-center text-muted-foreground p-6">
                  <Package className="w-12 h-12 opacity-40 mb-2" />
                  <span className="text-xs">Image unavailable</span>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground p-6">
                <Package className="w-16 h-16 opacity-30 mx-auto mb-2" />
                <span className="text-xs">No media images uploaded</span>
              </div>
            )}
          </div>

          {/* Thumbnail Carousel */}
          {normalizedImages.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
              {normalizedImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 bg-card p-1 transition ${activeImageIndex === idx
                      ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-md'
                      : 'border-border opacity-70 hover:opacity-100 hover:border-muted-foreground'
                    }`}
                >
                  <img src={img.imageUrl} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Specifications & Commercial Parameters (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Classification & Identification */}
          <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
            <h3 className="text-xs font-normal uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-violet-400" />
              <span>Classification & Identification</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Category</span>
                <span className="text-foreground font-normal">
                  {product.category?.name || 'Uncategorized'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Brand</span>
                <span className="text-foreground font-normal">{product.brand?.name || 'Generic / None'}</span>
              </div>

              <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Measurement Unit</span>
                <span className="text-foreground font-normal">
                  {product.unit?.name || 'Unit'}
                  {product.unit?.abbreviation ? ` (${product.unit.abbreviation})` : ''}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Barcode / UPC</span>
                <span className="font-mono text-xs text-foreground font-normal">{product.barcode || '—'}</span>
              </div>

              <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Total Reorder Level</span>
                <span className="font-normal text-amber-400">
                  {totalReorderLevel > 0 ? totalReorderLevel.toLocaleString() : 'Per Warehouse'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Total Min Stock</span>
                <span className="font-normal text-rose-400">
                  {totalMinStock > 0 ? totalMinStock.toLocaleString() : 'Per Warehouse'}
                </span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-2 border-t border-border/60">
                <span className="text-[10px] font-normal uppercase tracking-wider text-muted-foreground block mb-1">
                  Description / Specification Notes
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line bg-muted800/20 p-3 rounded-xl border border-border/50">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Pricing & Commercial Structure */}
          <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
            <h3 className="text-xs font-normal uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>Standard Commercial Pricing</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] uppercase font-normal text-emerald-300 block mb-1">Selling Price</span>
                <span className="text-base font-normal text-emerald-400 block">{formatPrice(sellPrice)}</span>
                <span className="text-[10px] text-emerald-300/70">Standard retail base</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <span className="text-[10px] uppercase font-normal text-sky-300 block mb-1">Wholesale Price</span>
                <span className="text-base font-normal text-sky-400 block">{formatPrice(wholePrice)}</span>
                <span className="text-[10px] text-sky-300/70">Bulk distributor tier</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted800/50 border border-border">
                <span className="text-[10px] uppercase font-normal text-muted-foreground block mb-1">Cost Price</span>
                <span className="text-base font-normal text-foreground block">{formatPrice(costPrice)}</span>
                <span className="text-[10px] text-muted-foreground">Standard procurement</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                <span className="text-[10px] uppercase font-normal text-violet-300 block mb-1">Catalog Margin</span>
                <span className="text-base font-normal text-violet-400 block">
                  {catalogDiscount !== null ? `${catalogDiscount}%` : '—'}
                </span>
                <span className="text-[10px] text-violet-300/70">Wholesale spread</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Warehouse Stock Breakdown Table (Wide) */}
      <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Warehouse className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-normal text-foreground">Facility Stock Distribution</h3>
              <p className="text-[11px] text-muted-foreground">
                Current inventory levels across all warehouse depots
              </p>
            </div>
          </div>

          {/* Quick Summary Pill */}
          <div className="flex items-center gap-3 text-xs bg-muted800/60 px-3.5 py-1.5 rounded-xl border border-border/80 self-start sm:self-auto">
            <span>
              Available: <span className="text-emerald-400 font-normal">{stockSummary.availableQuantity.toLocaleString()}</span>
            </span>
            <span className="text-border">|</span>
            <span>
              Reserved: <span className="text-sky-400 font-normal">{stockSummary.reservedQuantity.toLocaleString()}</span>
            </span>
            <span className="text-border">|</span>
            <span>
              Total: <span className="text-foreground font-normal">{stockSummary.totalQuantity.toLocaleString()}</span>
            </span>
          </div>
        </div>

        {warehouseStocks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-muted800/20 border border-border/60 text-muted-foreground space-y-1">
            <Package className="w-8 h-8 opacity-40 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs font-normal">No warehouse stock records found for this product</p>
            <p className="text-[11px]">Stock records will populate once received or transferred into warehouses.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted900/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-normal">Warehouse Depot</th>
                  <th className="py-3 px-4 font-normal">Facility Code</th>
                  <th className="py-3 px-4 font-normal text-right">Depot Selling Price</th>
                  <th className="py-3 px-4 font-normal text-right">Available Qty</th>
                  <th className="py-3 px-4 font-normal text-right">Reserved Qty</th>
                  <th className="py-3 px-4 font-normal text-right">Total On Hand</th>
                  <th className="py-3 px-4 font-normal text-right">Min Stock</th>
                  <th className="py-3 px-4 font-normal text-right">Reorder Level</th>
                  <th className="py-3 px-4 font-normal text-center">Stock Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {warehouseStocks.map((s) => {
                  const avail = Number(s.availableQuantity) || 0;
                  const res = Number(s.reservedQuantity) || 0;
                  const total = Number(s.quantity) || 0;
                  const minStockLevel = Number(s.minimumStock) || 0;
                  const reorderPoint = Number(s.reorderLevel) || 0;
                  const isLow = reorderPoint > 0 && avail <= reorderPoint && avail > 0;
                  const isOut = avail <= 0;
                  const branchName = s.warehouse?.branch?.name;

                  // Lookup warehouse specific price
                  const whPrice = allWarehousePrices.find((p) => p.warehouseId === s.warehouseId);
                  const sSell = whPrice ? whPrice.sellingPrice : sellPrice;

                  return (
                    <tr key={s.id || s.warehouseId} className="hover:bg-muted800/30 transition">
                      <td className="py-3 px-4 font-normal text-foreground">
                        <div className="flex items-center gap-2">
                          <Warehouse className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>{s.warehouse?.name || 'Warehouse'}</span>
                          {branchName && (
                            <span className="text-[11px] font-normal text-muted-foreground">
                              ({branchName})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{s.warehouse?.code || '—'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-normal text-emerald-400 font-mono text-sm">{formatPrice(sSell)}</span>
                          {whPrice?.isCustom ? (
                            <span className="text-[9px] font-normal uppercase px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                              Custom Override
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium text-muted-foreground">
                              Standard Base
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-normal text-emerald-700 dark:text-emerald-400 text-sm">
                        {avail.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-sky-700 dark:text-sky-400">
                        {res > 0 ? res.toLocaleString() : '0'}
                      </td>
                      <td className="py-3 px-4 text-right font-normal text-foreground">{total.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-rose-700 dark:text-rose-400 font-medium">
                        {minStockLevel.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-700 dark:text-amber-400 font-medium">
                        {reorderPoint.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3 h-3" />
                            <span>Out of Stock</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Reorder Needed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-normal bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Optimal</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Warehouse Specific Pricing Table for All Warehouses */}
      {allWarehousePrices.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-normal text-foreground">Facility Selling Prices (All Warehouses)</h3>
                <p className="text-[11px] text-muted-foreground">
                  Active commercial selling and wholesale price schedule across every warehouse facility
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-300 font-normal text-[11px]">
                {warehouseSellingPrices.length} Custom Override{warehouseSellingPrices.length === 1 ? '' : 's'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-muted800 border border-border text-muted-foreground font-normal text-[11px]">
                {Math.max(0, allWarehousePrices.length - warehouseSellingPrices.length)} Standard Catalog
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted900/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-normal">Depot Facility</th>
                  <th className="py-3 px-4 font-normal">Depot Code</th>
                  <th className="py-3 px-4 font-normal text-right">Depot Selling Price</th>
                  <th className="py-3 px-4 font-normal text-right">Depot Wholesale Price</th>
                  <th className="py-3 px-4 font-normal text-center">Pricing Model</th>
                  <th className="py-3 px-4 font-normal text-center">Price Differential</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {allWarehousePrices.map((wp) => {
                  const wpSell = Number(wp.sellingPrice) || 0;
                  const wpWhole = Number(wp.wholesalePrice) || 0;
                  const diff = sellPrice > 0 ? wpSell - sellPrice : 0;
                  const branchName = wp.warehouse?.branch?.name;

                  return (
                    <tr key={wp.warehouseId} className="hover:bg-muted800/30 transition">
                      <td className="py-3 px-4 font-normal text-foreground">
                        <div className="flex items-center gap-2">
                          <Warehouse className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>{wp.warehouse?.name || 'Warehouse'}</span>
                          {branchName && (
                            <span className="text-[11px] font-normal text-muted-foreground">
                              ({branchName})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{wp.warehouse?.code || '—'}</td>
                      <td className="py-3 px-4 text-right font-normal text-emerald-400 text-sm">
                        {formatPrice(wpSell)}
                      </td>
                      <td className="py-3 px-4 text-right font-normal text-sky-400">{formatPrice(wpWhole)}</td>
                      <td className="py-3 px-4 text-center">
                        {wp.isCustom ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-normal bg-sky-500/15 text-sky-400 border border-sky-500/30">
                            Custom Override
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted800 text-muted-foreground border border-border">
                            Standard Base
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-normal">
                        {diff === 0 ? (
                          <span className="text-muted-foreground text-[11px]">Standard Base</span>
                        ) : diff > 0 ? (
                          <span className="text-emerald-400 font-mono">+{formatPrice(diff)}</span>
                        ) : (
                          <span className="text-rose-400 font-mono">{formatPrice(diff)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Audit Information Card */}
      <div className="p-4 rounded-2xl border border-border/80 bg-muted900/30 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          {creatorName && (
            <span>
              Created by: <span className="text-foreground">{creatorName}</span>
            </span>
          )}
          {product.createdAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(product.createdAt).toLocaleDateString()}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {updaterName && (
            <span>
              Last updated by: <span className="text-foreground">{updaterName}</span>
            </span>
          )}
          {product.updatedAt && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono">{new Date(product.updatedAt).toLocaleString()}</span>
            </span>
          )}
        </div>
      </div>

      {/* Lightbox / Zoom Preview Modal */}
      {isLightboxOpen && (
        <ImagePreviewModal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          images={normalizedImages}
          initialIndex={activeImageIndex}
          productName={product.name}
        />
      )}
    </div>
  );
}
