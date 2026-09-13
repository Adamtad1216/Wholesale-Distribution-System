import React, { useState } from 'react';
import { Package } from 'lucide-react';

/**
 * Extracts the best available image URL for a product record.
 */
export function getProductImageUrl(product) {
  if (!product) return null;

  const images = Array.isArray(product.images) ? product.images : [];
  const primary = images.find((img) => img && img.isPrimary && !img.isArchived);
  if (primary?.imageUrl) return primary.imageUrl;
  if (primary?.fileUrl) return primary.fileUrl;
  if (primary?.url) return primary.url;

  const activeFirst = images.find((img) => img && !img.isArchived);
  if (activeFirst?.imageUrl) return activeFirst.imageUrl;
  if (activeFirst?.fileUrl) return activeFirst.fileUrl;
  if (activeFirst?.url) return activeFirst.url;

  if (images.length > 0) {
    const first = images[0];
    if (typeof first === 'string' && first.trim()) return first.trim();
    if (first?.imageUrl) return first.imageUrl;
    if (first?.fileUrl) return first.fileUrl;
    if (first?.url) return first.url;
  }

  return (
    product.imageUrl ||
    product.image ||
    product.thumbnail ||
    product.fileUrl ||
    null
  );
}

const SIZE_CONFIGS = {
  xs: {
    container: 'w-6 h-6 rounded-md',
    icon: 'w-3 h-3',
  },
  sm: {
    container: 'w-8 h-8 rounded-lg',
    icon: 'w-4 h-4',
  },
  md: {
    container: 'w-12 h-12 rounded-xl',
    icon: 'w-6 h-6',
  },
  lg: {
    container: 'w-16 h-16 rounded-2xl',
    icon: 'w-8 h-8',
  },
  xl: {
    container: 'w-24 h-24 rounded-2xl',
    icon: 'w-10 h-10',
  },
  '2xl': {
    container: 'w-32 h-32 rounded-3xl',
    icon: 'w-14 h-14',
  },
};

/**
 * Reusable Product Thumbnail component for inventory UI.
 * Renders the product image if present, or an elegant placeholder icon if missing or failed to load.
 */
export default function ProductThumbnail({
  product,
  size = 'md',
  className = '',
  alt = '',
  onClick,
}) {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getProductImageUrl(product);
  const config = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;
  const productName = product?.name || 'Product';

  const shouldRenderImage = Boolean(imageUrl && !hasError);

  return (
    <div
      onClick={onClick}
      className={`relative ${config.container} shrink-0 overflow-hidden border border-border bg-muted800/60 flex items-center justify-center transition ${
        onClick ? 'cursor-pointer hover:opacity-90' : ''
      } ${className}`}
      title={productName}
    >
      {shouldRenderImage ? (
        <img
          src={imageUrl}
          alt={alt || productName}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-violet-500/10 text-violet-400 flex items-center justify-center">
          <Package className={config.icon} />
        </div>
      )}
    </div>
  );
}
