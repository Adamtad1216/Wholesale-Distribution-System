import React from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

export default function ProductGrid({
  products = [],
  loading = false,
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 10,
  onPageChange,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  onPreviewImage,
  canUpdate = false,
  canDelete = false,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-72 rounded-2xl bg-muted800/40 border border-border/60 animate-pulse p-4 flex flex-col justify-between"
          >
            <div className="w-full h-36 bg-muted800/80 rounded-xl mb-3" />
            <div className="space-y-2">
              <div className="h-4 bg-muted800/80 rounded w-3/4" />
              <div className="h-3 bg-muted800/60 rounded w-1/2" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="h-5 bg-muted800/80 rounded w-20" />
              <div className="h-5 bg-muted800/80 rounded w-14" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="bg-card/60 border border-border rounded-2xl p-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
        <div className="p-3.5 bg-muted800/80 rounded-2xl border border-border">
          <span className="text-3xl">📦</span>
        </div>
        <h4 className="text-base font-semibold text-foreground">No Products Found</h4>
        <p className="text-xs text-muted-foreground max-w-sm">
          No products match your current search criteria or category filter.
        </p>
      </div>
    );
  }

  const formatPrice = (val) => {
    const num = Number(val);
    if (isNaN(num)) return 'ETB 0.00';
    return `ETB ${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-5">
      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => {
          const images = Array.isArray(product.images) ? product.images : [];
          const primaryImgObj = images.find((img) => img?.isPrimary) || images[0];
          const primaryImageUrl =
            primaryImgObj?.imageUrl ||
            primaryImgObj?.fileUrl ||
            primaryImgObj?.url ||
            (typeof primaryImgObj === 'string' ? primaryImgObj : null) ||
            product.imageUrl ||
            product.image ||
            product.thumbnail ||
            null;
          const warehousePrices = product.warehouseSellingPrices || [];

          return (
            <Card
              key={product.id}
              hoverEffect
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-muted900/60 backdrop-blur transition-all duration-300 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/5"
            >
              {/* Top Image Banner */}
              <div className="relative w-full h-44 bg-muted950/80 overflow-hidden border-b border-border/60">
                {primaryImageUrl ? (
                  <div
                    className="w-full h-full cursor-pointer relative overflow-hidden flex items-center justify-center"
                    onClick={() => onPreviewImage && onPreviewImage(product, 0)}
                    title="Click to view full image"
                  >
                    <img
                      src={primaryImageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.grid-img-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div className="grid-img-fallback hidden flex-col items-center justify-center p-4 text-muted-foreground">
                      <span className="text-3xl mb-1">📦</span>
                      <span className="text-[10px]">Image preview</span>
                    </div>

                    {/* Hover Magnifying Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Preview
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center text-muted-foreground cursor-pointer bg-muted900/40"
                    onClick={() => onViewProduct(product)}
                  >
                    <span className="text-3xl mb-1">📦</span>
                    <span className="text-[11px]">No photo added</span>
                  </div>
                )}

                {/* Status Badge Top Left */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                      product.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800/80 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        product.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    {product.status || 'ACTIVE'}
                  </span>
                </div>

                {/* Image Count Top Right */}
                {images.length > 0 && (
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewImage && onPreviewImage(product, 0);
                      }}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-md border border-white/10 hover:bg-violet-600 transition flex items-center gap-1"
                      title="View all images"
                    >
                      <span>🖼️</span>
                      <span>{images.length}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  {/* Category & Brand Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-muted800 text-muted-foreground border border-border">
                      {product.category?.name || 'Category'}
                    </span>
                    {product.brand?.name && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20">
                        {product.brand.name}
                      </span>
                    )}
                  </div>

                  {/* Title & SKU */}
                  <h4
                    onClick={() => onViewProduct(product)}
                    className="font-semibold text-foreground text-sm line-clamp-1 hover:text-violet-400 cursor-pointer transition"
                    title={product.name}
                  >
                    {product.name}
                  </h4>
                  <p className="text-[11px] font-mono text-muted-foreground">
                    SKU: {product.sku || 'N/A'}
                  </p>
                </div>

                {/* Pricing Block (Selling & Wholesale Prices, NO purchase price) */}
                <div className="p-2.5 rounded-xl bg-muted950/60 border border-border/80 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px]">Selling Price</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {formatPrice(product.sellingPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px]">Wholesale Price</span>
                    <span className="font-semibold text-sky-400 font-mono">
                      {formatPrice(product.wholesalePrice)}
                    </span>
                  </div>

                  {/* Warehouse Price Pill */}
                  {warehousePrices.length > 0 && (
                    <div className="pt-1 border-t border-border/40 flex items-center justify-between text-[10px]">
                      <span className="text-violet-400 font-medium flex items-center gap-1">
                        <span>🏢</span> {warehousePrices.length} Facility Override{warehousePrices.length > 1 ? 's' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => onViewProduct(product)}
                        className="text-muted-foreground hover:text-foreground transition underline"
                      >
                        Details
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Action Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => onViewProduct(product)}
                    className="text-xs font-semibold text-muted-foreground hover:text-violet-400 flex items-center gap-1 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>

                  <div className="flex items-center gap-1">
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10 transition"
                        title="Edit product"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(product)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete product"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Showing Page <span className="font-semibold text-foreground">{page}</span> of{' '}
            <span className="font-semibold text-foreground">{totalPages}</span> ({total} total products)
          </span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              ← Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
