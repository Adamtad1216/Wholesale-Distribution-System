import React, { useState } from 'react';
import { X, Minus, Plus, ShoppingCart, CheckCircle2, Info } from 'lucide-react';
import ProductImage from './ProductImage';
import StockBadge from './StockBadge';

export default function ProductDetailModal({
  product,
  warehouseId,
  onClose,
  onAdd,
  cartQty = 0,
  unitAbbr,
}) {
  const [qty, setQty] = useState(cartQty || 1);
  if (!product) return null;

  const stock = warehouseId
    ? product?.warehouseStocks?.find((s) => s.warehouseId === warehouseId)
    : product?.warehouseStocks?.[0];
  const availableQty = stock ? Number(stock.availableQuantity) : null;
  const isOutOfStock = availableQty !== null && availableQty <= 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />

      {/* Modal Card - Bright, crisp white background for maximum readability */}
      <div
        className="relative w-full max-w-lg bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all shadow-sm"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Product Image Banner */}
        <div className="relative">
          <ProductImage product={product} size="lg" className="w-full h-56 object-cover" />
          <div className="absolute top-3 left-3 z-10">
            <StockBadge product={product} warehouseId={warehouseId} />
          </div>
          {/* Subtle gradient to blend into the white modal */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent" />
        </div>

        {/* Modal Details Content */}
        <div className="p-6 -mt-3 relative space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                {product.sku}
              </span>
              {cartQty > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {cartQty} in your order
                </span>
              )}
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 leading-snug">{product.name}</h3>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Brand
              </div>
              <div className="text-xs text-slate-800 font-bold truncate mt-0.5">
                {product.brand?.name || 'Standard'}
              </div>
            </div>

            <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Category
              </div>
              <div className="text-xs text-slate-800 font-bold truncate mt-0.5">
                {product.category?.name || 'General'}
              </div>
            </div>

            <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-xs">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Unit
              </div>
              <div className="text-xs text-slate-800 font-bold truncate mt-0.5">
                {product.unit?.name || 'Unit'} ({unitAbbr})
              </div>
            </div>
          </div>

          {/* Price Header (Without premature line calculation) */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Catalog Unit Price
              </div>
              <div className="text-2xl font-black text-slate-900">
                {Number(product.sellingPrice).toLocaleString('en', { minimumFractionDigits: 2 })}
                <span className="text-xs text-slate-500 font-normal ml-1">/{unitAbbr}</span>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-primary" />
              <span>Tier pricing calculated at preview</span>
            </div>
          </div>

          {/* Quantity Controls & Add Button */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl overflow-hidden p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-700 hover:bg-white hover:text-primary transition-all active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="1"
                max={availableQty || undefined}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="w-14 h-9 text-center bg-transparent text-slate-900 text-sm font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                disabled={availableQty !== null && qty >= availableQty}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-700 hover:bg-white hover:text-primary transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => {
                onAdd(product, qty);
                onClose();
              }}
              className="flex-1 h-11 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-xl transition-all shadow-md shadow-primary/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4" />
              {isOutOfStock
                ? 'Out of Stock'
                : cartQty > 0
                ? `Update Order (${qty} ${unitAbbr})`
                : `Add to Order (${qty} ${unitAbbr})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
