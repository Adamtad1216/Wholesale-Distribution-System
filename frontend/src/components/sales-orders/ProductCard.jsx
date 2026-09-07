import React from 'react';
import { ShoppingCart, Eye, Plus, Minus, Check } from 'lucide-react';
import ProductImage from './ProductImage';
import StockBadge from './StockBadge';

export default function ProductCard({
  product,
  warehouseId,
  onViewDetail,
  onQuickAdd,
  onUpdateQty,
  onRemove,
  cartQty = 0,
}) {
  const unitAbbr = product?.unit?.abbreviation || product?.unit?.name || 'unit';
  const price = Number(product?.sellingPrice || 0);

  const stock = warehouseId
    ? product?.warehouseStocks?.find((s) => s.warehouseId === warehouseId)
    : product?.warehouseStocks?.[0];
  const availableQty = stock ? Number(stock.availableQuantity) : null;
  const isOutOfStock = availableQty !== null && availableQty <= 0;

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (onUpdateQty) {
      onUpdateQty(product.id, cartQty + 1);
    } else if (onQuickAdd) {
      onQuickAdd(product);
    }
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (cartQty <= 1) {
      if (onRemove) onRemove(product.id);
      else if (onUpdateQty) onUpdateQty(product.id, 0);
    } else {
      if (onUpdateQty) onUpdateQty(product.id, cartQty - 1);
    }
  };

  const isInCart = cartQty > 0;

  return (
    <div
      className={`group relative flex flex-col justify-between bg-card rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 ${
        isInCart
          ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-md shadow-indigo-500/10'
          : 'border-border/80 hover:border-primary/50'
      }`}
    >
      {/* Top Image Container */}
      <div className="relative cursor-pointer overflow-hidden select-none" onClick={() => onViewDetail(product)}>
        <ProductImage
          product={product}
          size="md"
          className="group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Hover overlay with high-contrast Quick View button */}
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span className="px-4 py-2 rounded-full bg-slate-900/95 backdrop-blur-md border border-white/25 text-xs font-bold !text-white flex items-center gap-2 shadow-2xl transform translate-y-1 group-hover:translate-y-0 transition-all duration-200 hover:scale-105">
            <Eye className="w-4 h-4 !text-indigo-400" />
            <span>Quick View</span>
          </span>
        </div>

        {/* Top-Left: Stock Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <StockBadge product={product} warehouseId={warehouseId} />
        </div>

        {/* Top-Right: In Cart Badge (High-contrast bright white on vibrant indigo) */}
        {isInCart && (
          <div className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 !text-white text-xs font-black shadow-md shadow-indigo-600/40 border border-white/20 animate-in fade-in zoom-in duration-150">
            <Check className="w-3.5 h-3.5 stroke-[3] !text-white" />
            <span>{cartQty} in cart</span>
          </div>
        )}

        {/* Bottom edge of image: Brand tag (High-contrast solid glass pill) */}
        {product?.brand?.name && (
          <div className="absolute bottom-2.5 left-2.5 z-10 px-2.5 py-1 rounded-lg bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border border-white/20 text-[11px] font-bold !text-white shadow-md">
            {product.brand.name}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* SKU and Category row */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-muted/80 text-foreground border border-border/60">
              {product?.sku || 'SKU'}
            </span>
            {product?.category?.name && (
              <span className="text-[11px] font-semibold text-primary truncate max-w-[130px]">
                {product.category.name}
              </span>
            )}
          </div>

          {/* Product Title */}
          <h4
            className="text-sm font-extrabold text-foreground line-clamp-2 leading-snug cursor-pointer hover:text-primary transition-colors min-h-[2.5rem]"
            onClick={() => onViewDetail(product)}
            title={product?.name}
          >
            {product?.name}
          </h4>
        </div>

        {/* Price & Action Section */}
        <div className="pt-2 border-t border-border/60 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Price
            </span>
            <div className="text-right">
              <span className="text-xl font-black tracking-tight text-foreground">
                {price.toLocaleString('en', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-muted-foreground font-medium ml-1">/{unitAbbr}</span>
            </div>
          </div>

          {/* Action Button: Stepper if in cart, or Add / Out-of-Stock */}
          {isInCart ? (
            <div className="flex items-center justify-between gap-2 p-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-rose-500 hover:!text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all shadow-xs active:scale-95"
                title="Decrease quantity"
              >
                <Minus className="w-4 h-4 stroke-[3]" />
              </button>

              <div className="flex-1 text-center font-black text-sm text-foreground">
                {cartQty} <span className="text-xs font-medium text-muted-foreground">{unitAbbr}</span>
              </div>

              <button
                type="button"
                onClick={handleIncrement}
                disabled={availableQty !== null && cartQty >= availableQty}
                className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 !text-white flex items-center justify-center transition-all shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Increase quantity"
              >
                <Plus className="w-4 h-4 stroke-[3] !text-white" />
              </button>
            </div>
          ) : isOutOfStock ? (
            <button
              type="button"
              disabled
              className="w-full h-10 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold bg-muted/60 text-muted-foreground border border-border/60 cursor-not-allowed"
            >
              Out of Stock
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onQuickAdd(product)}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all duration-200 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
