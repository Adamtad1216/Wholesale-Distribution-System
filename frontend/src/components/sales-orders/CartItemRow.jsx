import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import ProductImage from './ProductImage';

export default function CartItemRow({ item, product, onQuantityChange, onRemove }) {
  const unitAbbr = product?.unit?.abbreviation || product?.unit?.name || 'unit';

  return (
    <div className="flex items-center gap-3.5 px-4 py-3 bg-card/60 border border-border/80 rounded-2xl hover:border-primary/40 transition-colors group">
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-border/80">
        <ProductImage product={product || { name: 'Product', images: [] }} size="sm" className="!w-12 !h-12" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-bold text-foreground truncate">{product?.name || item.productId}</h5>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground font-mono font-medium px-1.5 py-0.5 rounded bg-muted/60 border border-border/40">
            {product?.sku || 'SKU'}
          </span>
          {product?.brand?.name && (
            <span className="text-[11px] text-muted-foreground truncate">{product.brand.name}</span>
          )}
          {product?.category?.name && (
            <>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-[11px] text-primary/80 truncate">{product.category.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Quantity Stepper */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center bg-muted border border-border rounded-xl overflow-hidden p-0.5 shadow-xs">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, item.quantity - 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground transition-all active:scale-95"
            title="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onQuantityChange(Math.max(1, Number(e.target.value)))}
            className="w-12 h-8 text-center bg-transparent text-foreground text-xs font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => onQuantityChange(item.quantity + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground transition-all active:scale-95"
            title="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-xs font-medium text-muted-foreground min-w-[2.5rem]">{unitAbbr}</span>
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={onRemove}
        className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-rose-500/15 hover:text-rose-400 transition-all ml-1"
        title="Remove item"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
