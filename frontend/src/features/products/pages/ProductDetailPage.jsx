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

  const { can: canUpdate } = usePermission('products:update');

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [prodRes, whRes] = await Promise.allSettled([
        productsApi.getProductById(id),
        productsApi.getWarehouses({ limit: 1 }),
      ]);

      if (prodRes.status === 'fulfilled') {
        const d = prodRes.value?.data || prodRes.value;
        setProduct(d);
      } else {
        toast.error(prodRes.reason?.message || 'Failed to load product details');
      }

      if (whRes.status === 'fulfilled') {
        const raw = whRes.value;
        const total = raw?.meta?.total ?? (Array.isArray(raw?.data) ? raw.data.length : 0);
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
        <h2 className="text-xl font-bold text-foreground">Product Not Found</h2>
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
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted800 text-muted-foreground border border-border">
                {product.sku || 'SKU-N/A'}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${product.status === 'ACTIVE'
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
            <h1 className="text-2xl font-black text-foreground tracking-tight mt-1">{product.name}</h1>
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
                  <span className="px-3.5 py-2 rounded-full bg-black/70 backdrop-blur-md text-xs font-bold flex items-center gap-2 shadow-xl">
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-violet-400" />
              <span>Classification & Identification</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Category</span>
                <strong className="text-foreground font-semibold">
                  {product.category?.name || 'Uncategorized'}
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Brand</span>
                <strong className="text-foreground font-semibold">{product.brand?.name || 'Generic / None'}</strong>
              </div>

              <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Measurement Unit</span>
                <strong className="text-foreground font-semibold">
                  {product.unit?.name || 'Unit'}
                  {product.unit?.abbreviation ? ` (${product.unit.abbreviation})` : ''}
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Barcode / UPC</span>
                <span className="font-mono text-xs text-foreground font-bold">{product.barcode || '—'}</span>
              </div>

              <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Total Reorder Level</span>
                <span className="font-bold text-amber-400">
                  {totalReorderLevel > 0 ? totalReorderLevel.toLocaleString() : 'Per Warehouse'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted800/40 border border-border/80">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Total Min Stock</span>
                <span className="font-bold text-rose-400">
                  {totalMinStock > 0 ? totalMinStock.toLocaleString() : 'Per Warehouse'}
                </span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-2 border-t border-border/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>Standard Commercial Pricing</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] uppercase font-bold text-emerald-300 block mb-1">Selling Price</span>
                <strong className="text-base font-black text-emerald-400 block">{formatPrice(sellPrice)}</strong>
                <span className="text-[10px] text-emerald-300/70">Standard retail base</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <span className="text-[10px] uppercase font-bold text-sky-300 block mb-1">Wholesale Price</span>
                <strong className="text-base font-black text-sky-400 block">{formatPrice(wholePrice)}</strong>
                <span className="text-[10px] text-sky-300/70">Bulk distributor tier</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted800/50 border border-border">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Cost Price</span>
                <strong className="text-base font-black text-foreground block">{formatPrice(costPrice)}</strong>
                <span className="text-[10px] text-muted-foreground">Standard procurement</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                <span className="text-[10px] uppercase font-bold text-violet-300 block mb-1">Catalog Margin</span>
                <strong className="text-base font-black text-violet-400 block">
                  {catalogDiscount !== null ? `${catalogDiscount}%` : '—'}
                </strong>
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
              <h3 className="text-sm font-bold text-foreground">Facility Stock Distribution</h3>
              <p className="text-[11px] text-muted-foreground">
                Current inventory levels across all warehouse depots
              </p>
            </div>
          </div>

          {/* Quick Summary Pill */}
          <div className="flex items-center gap-3 text-xs bg-muted800/60 px-3.5 py-1.5 rounded-xl border border-border/80 self-start sm:self-auto">
            <span>
              Available: <strong className="text-emerald-400 font-black">{stockSummary.availableQuantity.toLocaleString()}</strong>
            </span>
            <span className="text-border">|</span>
            <span>
              Reserved: <strong className="text-sky-400 font-black">{stockSummary.reservedQuantity.toLocaleString()}</strong>
            </span>
            <span className="text-border">|</span>
            <span>
              Total: <strong className="text-foreground font-black">{stockSummary.totalQuantity.toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {warehouseStocks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-muted800/20 border border-border/60 text-muted-foreground space-y-1">
            <Package className="w-8 h-8 opacity-40 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs font-semibold">No warehouse stock records found for this product</p>
            <p className="text-[11px]">Stock records will populate once received or transferred into warehouses.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted900/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Warehouse Depot</th>
                  <th className="py-3 px-4 font-bold">Facility Code</th>
                  <th className="py-3 px-4 font-bold text-right">Available Qty</th>
                  <th className="py-3 px-4 font-bold text-right">Reserved Qty</th>
                  <th className="py-3 px-4 font-bold text-right">Total On Hand</th>
                  <th className="py-3 px-4 font-bold text-right">Min Stock</th>
                  <th className="py-3 px-4 font-bold text-right">Reorder Level</th>
                  <th className="py-3 px-4 font-bold text-center">Stock Health</th>
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

                  return (
                    <tr key={s.id || s.warehouseId} className="hover:bg-muted800/30 transition">
                      <td className="py-3 px-4 font-bold text-foreground">
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
                      <td className="py-3 px-4 text-right font-black text-emerald-400 text-sm">
                        {avail.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-sky-400">
                        {res > 0 ? res.toLocaleString() : '0'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-foreground">{total.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-rose-400 font-semibold">
                        {minStockLevel.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-400 font-semibold">
                        {reorderPoint.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3 h-3" />
                            <span>Out of Stock</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Reorder Needed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
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

      {/* Warehouse Specific Pricing Table (Wide) */}
      {warehouseSellingPrices.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border/80 pb-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Facility Specific Selling Prices</h3>
              <p className="text-[11px] text-muted-foreground">
                Custom override pricing tailored to regional or warehouse facility depots
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted900/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Depot Facility</th>
                  <th className="py-3 px-4 font-bold">Depot Code</th>
                  <th className="py-3 px-4 font-bold text-right">Depot Selling Price</th>
                  <th className="py-3 px-4 font-bold text-right">Depot Wholesale Price</th>
                  <th className="py-3 px-4 font-bold text-center">Price Differential</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {warehouseSellingPrices.map((wp) => {
                  const wpSell = Number(wp.sellingPrice) || 0;
                  const wpWhole = Number(wp.wholesalePrice) || 0;
                  const diff = sellPrice > 0 ? wpSell - sellPrice : 0;

                  return (
                    <tr key={wp.id || wp.warehouseId} className="hover:bg-muted800/30 transition">
                      <td className="py-3 px-4 font-bold text-foreground">{wp.warehouse?.name || 'Warehouse'}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{wp.warehouse?.code || '—'}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-400 text-sm">
                        {formatPrice(wpSell)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-sky-400">{formatPrice(wpWhole)}</td>
                      <td className="py-3 px-4 text-center font-bold">
                        {diff === 0 ? (
                          <span className="text-muted-foreground">Standard Base</span>
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
              Created by: <strong className="text-foreground">{creatorName}</strong>
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
              Last updated by: <strong className="text-foreground">{updaterName}</strong>
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
