import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import ImagePreviewModal from './ImagePreviewModal';

export default function ProductDetailModal({
  isOpen = false,
  onClose,
  product = null,
  onEdit,
  canUpdate = false,
  totalWarehouses = 0,
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Reset active image index whenever the product or modal open status changes
  useEffect(() => {
    setActiveImageIndex(0);
    setIsLightboxOpen(false);
  }, [product?.id, isOpen]);

  // Normalize images safely without breaking React hook rules
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

  const warehouseSellingPrices = useMemo(() => {
    return Array.isArray(product?.warehouseSellingPrices) ? product.warehouseSellingPrices : [];
  }, [product]);

  // Early return ONLY after all hooks have been invoked
  if (!isOpen || !product) return null;

  const activeImage = normalizedImages[activeImageIndex]?.imageUrl || normalizedImages[0]?.imageUrl;

  const formatPrice = (val) => {
    const num = Number(val);
    if (isNaN(num)) return 'ETB 0.00';
    return `ETB ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const assignedPricesCount = warehouseSellingPrices.length;
  const allWarehousesAssigned = totalWarehouses > 0 && assignedPricesCount >= totalWarehouses;
  const showStandardPrices = !allWarehousesAssigned;

  const sellPrice = Number(product.sellingPrice) || 0;
  const wholePrice = Number(product.wholesalePrice) || 0;
  const catalogDiscount =
    sellPrice > 0 && wholePrice > 0
      ? (((sellPrice - wholePrice) / sellPrice) * 100).toFixed(1)
      : null;

  const minStock = Number(product.minimumStockLevel) || 0;
  const reorder = Number(product.reorderLevel) || 0;

  const creatorName = product.createdBy?.person
    ? `${product.createdBy.person.firstName || ''} ${product.createdBy.person.lastName || ''}`.trim()
    : null;
  const updaterName = product.updatedBy?.person
    ? `${product.updatedBy.person.firstName || ''} ${product.updatedBy.person.lastName || ''}`.trim()
    : null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={product.name}
        subtitle={`SKU: ${product.sku || 'N/A'}`}
        icon="📦"
        maxWidth="max-w-3xl"
        scope="workspace"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="secondary" size="md" onClick={onClose}>
              Close
            </Button>
            {canUpdate && (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  onClose();
                  if (onEdit) onEdit(product);
                }}
              >
                Edit Product
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-5 text-xs">
          {/* Top Row: Gallery + Key Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Image Gallery */}
            <div className="space-y-2">
              <div
                onClick={() => activeImage && setIsLightboxOpen(true)}
                className={`w-full h-52 rounded-xl bg-muted800 border border-border overflow-hidden flex items-center justify-center relative group ${
                  activeImage ? 'cursor-pointer hover:border-blue-500 hover:shadow-lg transition' : ''
                }`}
                title={activeImage ? 'Click to enlarge photo' : ''}
              >
                {activeImage ? (
                  <>
                    <img
                      src={activeImage}
                      alt={product.name}
                      className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.detail-img-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    {/* Hover Zoom Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                      <span className="px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-xs font-normal flex items-center gap-1.5 shadow-lg">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Click to Expand
                      </span>
                    </div>
                    <div className="detail-img-fallback hidden flex-col items-center justify-center text-center text-muted-foreground p-4">
                      <span className="text-4xl block mb-1">🖼️</span>
                      <span className="text-xs">Image preview unavailable</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <span className="text-4xl block mb-1">📦</span>
                    <span className="text-xs">No image available</span>
                  </div>
                )}
              </div>

              {normalizedImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {normalizedImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-12 h-12 rounded-lg border overflow-hidden shrink-0 transition ${
                        activeImageIndex === idx
                          ? 'border-blue-500 ring-2 ring-blue-500'
                          : 'border-border opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.imageUrl}
                        alt={`Thumb ${idx}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Classification & Status */}
            <div className="space-y-3 bg-muted800/40 p-4 rounded-xl border border-border flex flex-col justify-between">
              <div>
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">Status</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full font-normal mt-1 ${
                    product.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-700/20 text-slate-400 border border-slate-700/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      product.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-400'
                    }`}
                  />
                  {product.status || 'ACTIVE'}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">Category</span>
                <p className="font-normal text-foreground mt-0.5">
                  {product.category?.name || 'Unassigned'}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">Brand / Manufacturer</span>
                <p className="font-normal text-foreground mt-0.5">
                  {product.brand?.name || '—'}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">Unit of Measure</span>
                <p className="font-normal text-foreground mt-0.5">
                  {product.unit?.name ? `${product.unit.name} (${product.unit.abbreviation || ''})` : '—'}
                </p>
              </div>

              {(minStock > 0 || reorder > 0) && (
                <div className="pt-2 border-t border-border/60 flex items-center gap-4 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block">Min Stock:</span>
                    <span className="font-mono font-normal text-foreground">{minStock}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Reorder Level:</span>
                    <span className="font-mono font-medium text-amber-700 dark:text-amber-400">{reorder}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Warehouse Stock Inventory Section */}
          <div className="bg-muted800/40 border border-border rounded-xl p-4 space-y-3">
            <h5 className="text-xs font-normal text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>📊</span> Warehouse Stock Inventory
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">
                {warehouseStocks.length} facility record{warehouseStocks.length === 1 ? '' : 's'}
              </span>
            </h5>

            {/* Quick Stock KPI Counters */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 rounded-lg bg-muted900 border border-border">
                <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Total On Hand</span>
                <span className="text-sm font-normal text-foreground font-mono mt-0.5 block">
                  {stockSummary.totalQuantity.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted900 border border-border">
                <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Available</span>
                <span
                  className={`text-sm font-normal font-mono mt-0.5 block ${
                    stockSummary.availableQuantity > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {stockSummary.availableQuantity.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted900 border border-border">
                <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Reserved</span>
                <span className="text-sm font-normal text-amber-400 font-mono mt-0.5 block">
                  {stockSummary.reservedQuantity.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Warehouse Stock Breakdown List */}
            {warehouseStocks.length > 0 ? (
              <div className="space-y-2 mt-2">
                {warehouseStocks.map((stock, idx) => {
                  const qty = Number(stock.quantity) || 0;
                  const avail = Number(stock.availableQuantity) || 0;
                  const res = Number(stock.reservedQuantity) || 0;
                  const minLvl = Number(stock.minimumStock) || 0;
                  const reorderLvl = Number(stock.reorderLevel) || 0;
                  const isLow = reorderLvl > 0 && avail <= reorderLvl && avail > 0;
                  const isOut = avail <= 0;
                  const branchName = stock.warehouse?.branch?.name;

                  // Find warehouse selling price override if present
                  const matchingWp = warehouseSellingPrices.find(
                    (wp) => wp.warehouseId === stock.warehouseId
                  );
                  const effectiveSellPrice = matchingWp
                    ? Number(matchingWp.sellingPrice)
                    : sellPrice;

                  return (
                    <div
                      key={stock.id || idx}
                      className="p-3 rounded-xl bg-muted900 border border-border space-y-2 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-border/50 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-normal text-foreground text-sm">
                            {stock.warehouse?.name || 'Warehouse'}
                          </span>
                          {branchName && (
                            <span className="text-xs text-muted-foreground">
                              ({branchName})
                            </span>
                          )}
                          {stock.warehouse?.code && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted800 text-muted-foreground border border-border">
                              {stock.warehouse.code}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-emerald-400 font-normal text-xs">
                            Selling Price: {formatPrice(effectiveSellPrice)}
                          </span>
                          {matchingWp ? (
                            <span className="text-[9px] font-normal px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                              Override
                            </span>
                          ) : (
                            <span className="text-[9px] text-muted-foreground">
                              (Base)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] pt-0.5">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-muted-foreground">
                            On Hand: <span className="text-foreground">{qty.toLocaleString()}</span>
                          </span>
                          <span className="text-muted-foreground">
                            Avail: <span className={isOut ? 'text-rose-400' : 'text-emerald-400'}>{avail.toLocaleString()}</span>
                          </span>
                          {res > 0 && (
                            <span className="text-muted-foreground">
                              Res: <span className="text-amber-400">{res.toLocaleString()}</span>
                            </span>
                          )}
                          <span className="text-muted-foreground">
                            Min Stock: <span className="text-rose-700 dark:text-rose-400 font-medium">{minLvl.toLocaleString()}</span>
                          </span>
                          <span className="text-muted-foreground">
                            Reorder Level: <span className="text-amber-700 dark:text-amber-400 font-medium">{reorderLvl.toLocaleString()}</span>
                          </span>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-normal self-start sm:self-auto ${
                            isOut
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                              : isLow
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : isLow ? 'Reorder Needed' : 'Optimal Stock'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground text-center py-2">
                No warehouse stock records yet. Stock will be recorded upon purchase order receipts or stock adjustments.
              </p>
            )}
          </div>

          {/* Standard Catalog Pricing Section */}
          {showStandardPrices && (
            <div className="bg-muted800/60 border border-border rounded-xl p-4">
              <h5 className="text-xs font-normal text-foreground mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>💵</span> Standard Catalog Pricing
                </span>
                <div className="flex items-center gap-2">
                  {assignedPricesCount > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Default for unassigned facilities
                    </span>
                  )}
                  {catalogDiscount && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {catalogDiscount}% Wholesale Discount
                    </span>
                  )}
                </div>
              </h5>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-muted900 border border-border/80">
                  <span className="text-[11px] text-muted-foreground block">Selling Price</span>
                  <span className="text-base font-normal text-emerald-400 font-mono mt-0.5 block">
                    {formatPrice(sellPrice)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-muted900 border border-border/80">
                  <span className="text-[11px] text-muted-foreground block">Wholesale Price</span>
                  <span className="text-base font-normal text-sky-400 font-mono mt-0.5 block">
                    {formatPrice(wholePrice)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Warehouse-Specific Pricing Overrides Section */}
          {assignedPricesCount > 0 ? (
            <div className="bg-muted800/60 border border-border rounded-xl p-4 space-y-2.5">
              <h5 className="text-xs font-normal text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>🏢</span> Warehouse Pricing Overrides
                </span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  {assignedPricesCount} facility override{assignedPricesCount === 1 ? '' : 's'}
                </span>
              </h5>

              <div className="space-y-2">
                {warehouseSellingPrices.map((wp, idx) => {
                  const sell = Number(wp.sellingPrice) || 0;
                  const whole = Number(wp.wholesalePrice) || 0;
                  const wholeDisc =
                    sell > 0 && whole > 0 ? (((sell - whole) / sell) * 100).toFixed(1) : null;

                  return (
                    <div
                      key={wp.id || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-muted900 border border-border gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-normal text-foreground">
                          {wp.warehouse?.name || 'Warehouse'}
                        </span>
                        {wp.warehouse?.branch?.name && (
                          <span className="text-[11px] text-muted-foreground">
                            ({wp.warehouse.branch.name})
                          </span>
                        )}
                        {wp.warehouse?.code && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted800 text-muted-foreground border border-border">
                            {wp.warehouse.code}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 font-mono">
                        <span className="text-emerald-400 font-normal">
                          Sell: {formatPrice(wp.sellingPrice)}
                        </span>
                        <span className="text-sky-400">
                          Whole: {formatPrice(wp.wholesalePrice)}
                        </span>
                        {wholeDisc && (
                          <span className="text-[10px] text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                            -{wholeDisc}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-muted800/40 border border-border rounded-xl p-3 text-center text-xs text-muted-foreground">
              No warehouse-specific pricing overrides defined. Standard catalog prices apply across all facilities.
            </div>
          )}

          {/* System Audit & Timestamps */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-3 gap-2">
            <div className="flex flex-wrap items-center gap-3">
              {creatorName && (
                <span>
                  Created by: <span className="text-foreground">{creatorName}</span>
                </span>
              )}
              {updaterName && (
                <span>
                  Updated by: <span className="text-foreground">{updaterName}</span>
                </span>
              )}
            </div>
            <div>
              <span>
                Added: {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
              </span>
              {product.updatedAt && (
                <span className="ml-2">
                  (Updated: {new Date(product.updatedAt).toLocaleDateString()})
                </span>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Full Screen Image Lightbox Preview */}
      <ImagePreviewModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={normalizedImages}
        initialIndex={activeImageIndex}
        productName={product.name}
      />
    </>
  );
}
