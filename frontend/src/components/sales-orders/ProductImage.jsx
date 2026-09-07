import React, { useState } from 'react';
import { Package } from 'lucide-react';

export default function ProductImage({ product, size = 'md', className = '' }) {
  const [hasError, setHasError] = useState(false);
  const primaryImage = product?.images?.find((img) => img.isPrimary) || product?.images?.[0];
  const sizes = { sm: 'w-10 h-10', md: 'w-full h-44', lg: 'w-full h-56' };
  const sizeClass = sizes[size] || sizes.md;

  const initials = product?.name
    ?.split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (primaryImage?.imageUrl && !hasError) {
    return (
      <img
        src={primaryImage.imageUrl}
        alt={product?.name || 'Product'}
        className={`${sizeClass} object-cover ${className}`}
        onError={() => setHasError(true)}
      />
    );
  }

  // Curated clean, luminous modern palette for maximum legibility
  const palettes = [
    {
      bg: 'from-slate-100 via-indigo-50/70 to-slate-200/90 dark:from-slate-800 dark:via-indigo-950/40 dark:to-slate-900',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-white dark:bg-slate-800',
      iconBorder: 'border-indigo-200 dark:border-indigo-800/60',
      tagBg: 'bg-white/95 dark:bg-slate-800/95',
      tagText: 'text-slate-800 dark:text-slate-100',
      tagBorder: 'border-slate-200 dark:border-slate-700',
    },
    {
      bg: 'from-slate-100 via-violet-50/70 to-slate-200/90 dark:from-slate-800 dark:via-violet-950/40 dark:to-slate-900',
      iconColor: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-white dark:bg-slate-800',
      iconBorder: 'border-violet-200 dark:border-violet-800/60',
      tagBg: 'bg-white/95 dark:bg-slate-800/95',
      tagText: 'text-slate-800 dark:text-slate-100',
      tagBorder: 'border-slate-200 dark:border-slate-700',
    },
    {
      bg: 'from-slate-100 via-cyan-50/70 to-slate-200/90 dark:from-slate-800 dark:via-cyan-950/40 dark:to-slate-900',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      iconBg: 'bg-white dark:bg-slate-800',
      iconBorder: 'border-cyan-200 dark:border-cyan-800/60',
      tagBg: 'bg-white/95 dark:bg-slate-800/95',
      tagText: 'text-slate-800 dark:text-slate-100',
      tagBorder: 'border-slate-200 dark:border-slate-700',
    },
    {
      bg: 'from-slate-100 via-emerald-50/70 to-slate-200/90 dark:from-slate-800 dark:via-emerald-950/40 dark:to-slate-900',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-white dark:bg-slate-800',
      iconBorder: 'border-emerald-200 dark:border-emerald-800/60',
      tagBg: 'bg-white/95 dark:bg-slate-800/95',
      tagText: 'text-slate-800 dark:text-slate-100',
      tagBorder: 'border-slate-200 dark:border-slate-700',
    },
    {
      bg: 'from-slate-100 via-blue-50/70 to-slate-200/90 dark:from-slate-800 dark:via-blue-950/40 dark:to-slate-900',
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-white dark:bg-slate-800',
      iconBorder: 'border-blue-200 dark:border-blue-800/60',
      tagBg: 'bg-white/95 dark:bg-slate-800/95',
      tagText: 'text-slate-800 dark:text-slate-100',
      tagBorder: 'border-slate-200 dark:border-slate-700',
    },
  ];

  const charCodeSum = (product?.name || 'A')
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const palette = palettes[charCodeSum % palettes.length];

  if (size === 'sm') {
    return (
      <div
        className={`${sizeClass} bg-gradient-to-br ${palette.bg} rounded-xl flex items-center justify-center border border-border/80 shrink-0 ${className}`}
      >
        <span className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono">
          {initials || <Package className={`w-4 h-4 ${palette.iconColor}`} />}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} relative bg-gradient-to-br ${palette.bg} flex flex-col items-center justify-center overflow-hidden border-b border-border/60 select-none ${className}`}
    >
      {/* Decorative luminous glow */}
      <div className="absolute w-36 h-36 rounded-full bg-white/40 dark:bg-primary/10 blur-2xl -top-6 -right-6 pointer-events-none" />

      {/* Centered Icon Badge */}
      <div
        className={`relative z-10 w-13 h-13 rounded-2xl ${palette.iconBg} border ${palette.iconBorder} flex items-center justify-center shadow-md mb-2`}
      >
        <Package className={`w-6 h-6 ${palette.iconColor} stroke-[2]`} />
      </div>

      {/* Crystal Clear Initials Pill */}
      <span
        className={`relative z-10 text-xs font-black tracking-widest uppercase font-mono px-2.5 py-0.5 rounded-md ${palette.tagBg} ${palette.tagText} border ${palette.tagBorder} shadow-xs`}
      >
        {initials || product?.sku?.slice(0, 4) || 'ITEM'}
      </span>
    </div>
  );
}
