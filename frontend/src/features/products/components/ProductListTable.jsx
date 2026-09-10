import React from 'react';
import Table, {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';

export default function ProductListTable({
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
  canUpdate = false,
  canDelete = false,
  onPreviewImage,
}) {
  if (loading) {
    return (
      <div className="bg-card/60 border border-border rounded-lg p-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
        <svg className="w-8 h-8 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm">Loading product catalog items...</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="bg-card/60 border border-border rounded-lg p-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
        <div className="p-3 bg-muted800/80 rounded-full">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h4 className="text-base font-normal text-foreground">No Products Found</h4>
        <p className="text-xs text-muted-foreground max-w-sm">
          No products match your current filter parameters or the catalog is empty.
        </p>
      </div>
    );
  }

  const formatPrice = (val) => {
    const num = Number(val);
    if (isNaN(num)) return 'ETB 0.00';
    return `ETB ${num.toFixed(2)}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Info</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Pricing (Selling / Wholesale)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const images = Array.isArray(product.images) ? product.images : [];
            const primaryImage =
              images.find((img) => img?.isPrimary)?.imageUrl ||
              images.find((img) => img?.isPrimary)?.fileUrl ||
              images.find((img) => img?.isPrimary)?.url ||
              images[0]?.imageUrl ||
              images[0]?.fileUrl ||
              images[0]?.url ||
              (typeof images[0] === 'string' ? images[0] : null) ||
              product.imageUrl ||
              product.image ||
              product.thumbnail ||
              null;

            return (
              <TableRow key={product.id}>
                {/* Product Name + SKU + Image */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => primaryImage && onPreviewImage && onPreviewImage(product, 0)}
                      className={`relative w-11 h-11 rounded-xl bg-muted800 border border-border overflow-hidden shrink-0 flex items-center justify-center transition group ${
                        primaryImage ? 'cursor-pointer hover:border-blue-500 hover:ring-2 hover:ring-blue-500/30' : ''
                      }`}
                      title={primaryImage ? 'Click to preview full image' : 'No photo'}
                    >
                      {primaryImage ? (
                        <>
                          <img
                            src={primaryImage}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.parentElement?.querySelector('.img-table-fallback');
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          {/* Hover preview icon */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                        </>
                      ) : null}
                      <span
                        className={`img-table-fallback text-xs text-muted-foreground ${
                          primaryImage ? 'hidden' : 'flex'
                        } items-center justify-center`}
                      >
                        📦
                      </span>

                      {/* Multi-image count tag */}
                      {images.length > 1 && (
                        <span className="absolute bottom-0 right-0 bg-blue-600/90 text-white text-[9px] font-normal px-1 rounded-tl">
                          +{images.length - 1}
                        </span>
                      )}
                    </div>
                    <div>
                      <span
                        onClick={() => onViewProduct(product)}
                        className="font-normal text-foreground block line-clamp-1 hover:text-blue-500 cursor-pointer transition"
                      >
                        {product.name}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        SKU: {product.sku || 'N/A'}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Category */}
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-normal bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50">
                    {product.category?.name || 'Unassigned'}
                  </span>
                </TableCell>

                {/* Brand */}
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {product.brand?.name || '—'}
                  </span>
                </TableCell>

                {/* Unit */}
                <TableCell>
                  <span className="text-xs font-normal text-foreground">
                    {product.unit?.name ? `${product.unit.name} (${product.unit.abbreviation})` : '—'}
                  </span>
                </TableCell>

                {/* Prices & Warehouse-Specific Prices */}
                <TableCell>
                  <div className="space-y-1.5 text-xs min-w-[170px]">
                    {product.warehouseSellingPrices && product.warehouseSellingPrices.length > 0 ? (
                      <div className="space-y-1">
                        {product.warehouseSellingPrices.slice(0, 2).map((wp, i) => (
                          <div
                            key={i}
                            className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[11px] leading-tight"
                          >
                            <span className="font-normal text-blue-400 block truncate max-w-[170px]">
                              🏢 {wp.warehouse?.name || wp.warehouse?.code || 'Warehouse'}
                              {wp.warehouse?.branch?.name ? ` (${wp.warehouse.branch.name})` : ''}
                            </span>
                            <div className="flex items-center gap-2 font-mono mt-0.5 text-[11px]">
                              <span className="text-emerald-400 font-normal">
                                Sell: {formatPrice(wp.sellingPrice)}
                              </span>
                              <span className="text-sky-400">
                                Whole: {formatPrice(wp.wholesalePrice)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {product.warehouseSellingPrices.length > 2 && (
                          <button
                            type="button"
                            onClick={() => onViewProduct(product)}
                            className="text-[10px] text-blue-400 hover:text-blue-300 font-normal block"
                          >
                            +{product.warehouseSellingPrices.length - 2} more warehouse prices
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <div className="text-emerald-400 font-normal font-mono">
                          Sell: {formatPrice(product.sellingPrice)}
                        </div>
                        <div className="text-sky-400 font-mono">
                          Wholesale: {formatPrice(product.wholesalePrice)}
                        </div>
                        <span className="text-[10px] text-muted-foreground block">
                          Global catalog price
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-normal ${
                      product.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-700/20 text-slate-400 border border-slate-700/40'
                    }`}
                  >
                    {product.status || 'ACTIVE'}
                  </span>
                </TableCell>

                {/* Created Date */}
                <TableCell className="whitespace-nowrap">
                  <div className="text-xs flex flex-col">
                    <span className="font-normal text-foreground">
                      {formatDate(product.createdAt)}
                    </span>
                    {product.createdAt && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(product.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* View Details */}
                    <button
                      type="button"
                      onClick={() => onViewProduct(product)}
                      title="View Details"
                      className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                    >
                      <svg className="w-4 h-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>

                    {/* Edit */}
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        title="Edit Product"
                        className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                      >
                        <svg className="w-4 h-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}

                    {/* Delete */}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(product)}
                        title="Delete Product"
                        className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                      >
                        <svg className="w-4 h-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 text-xs text-muted-foreground">
        <div>
          Showing {products.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
          {Math.min(page * limit, total)} of {total} products
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="font-normal text-foreground px-2">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
