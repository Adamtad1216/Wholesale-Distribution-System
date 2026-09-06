import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';

export default function ImagePreviewModal({
  isOpen = false,
  onClose,
  images = [],
  initialIndex = 0,
  productName = 'Product Image Preview',
}) {
  // Normalize images into array of objects with valid imageUrl
  const normalizedImages = useMemo(() => {
    if (!images) return [];
    const rawList = Array.isArray(images)
      ? images
      : typeof images === 'string'
      ? [images]
      : typeof images === 'object'
      ? [images]
      : [];

    const results = [];
    for (const item of rawList) {
      if (!item) continue;
      if (typeof item === 'string' && item.trim()) {
        results.push({ imageUrl: item.trim(), isPrimary: false });
      } else if (typeof item === 'object') {
        const url =
          item.imageUrl ||
          item.fileUrl ||
          item.url ||
          item.secure_url ||
          item.src ||
          item.document?.fileUrl;
        if (url && typeof url === 'string' && url.trim()) {
          results.push({
            imageUrl: url.trim(),
            isPrimary: Boolean(item.isPrimary),
          });
        }
      }
    }

    if (results.length > 0 && !results.some((img) => img.isPrimary)) {
      results[0].isPrimary = true;
    }

    return results;
  }, [images]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const idx = typeof initialIndex === 'number' && initialIndex >= 0 ? initialIndex : 0;
    setCurrentIndex(idx);
    setImageError(false);
  }, [initialIndex, isOpen]);

  const total = normalizedImages.length;
  const safeIndex = total > 0 ? Math.max(0, Math.min(currentIndex, total - 1)) : 0;
  const currentImg = normalizedImages[safeIndex] || null;

  // Reset error whenever the active image changes
  useEffect(() => {
    setImageError(false);
  }, [safeIndex, currentImg?.imageUrl]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  }, [total]);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  }, [total]);

  // Keyboard navigation with capture phase to prevent closing parent modals
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.stopPropagation();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.stopPropagation();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose, handleNext, handlePrev]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Lightbox Container */}
      <div className="relative z-10 max-w-4xl w-full my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col items-center bg-muted900/95 border border-border/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Header Bar */}
        <div className="w-full px-5 py-3.5 flex items-center justify-between border-b border-border/60 bg-muted800/40">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <span className="text-xl shrink-0">🖼️</span>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground truncate">
                {productName}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                {currentImg?.isPrimary && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    ★ Primary Photo
                  </span>
                )}
                {total > 1 && (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {safeIndex + 1} of {total}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Open in new tab (only for non-data URLs) */}
            {currentImg?.imageUrl && !currentImg.imageUrl.startsWith('data:') && (
              <a
                href={currentImg.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted700/50 transition"
                title="Open image in new tab"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-rose-500/10 hover:text-rose-400 transition"
              title="Close preview (Esc)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Image Preview Body */}
        <div className="relative w-full flex-1 flex items-center justify-center p-4 min-h-[300px] max-h-[62vh] overflow-hidden bg-black/40">
          {/* Navigation Prev Button */}
          {total > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 z-20 p-2.5 rounded-full bg-muted900/80 text-foreground hover:bg-violet-600 hover:text-white border border-border/80 shadow-lg backdrop-blur transition transform hover:scale-105"
              title="Previous photo (←)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Current Image / Empty / Error State */}
          <div className="w-full h-full flex items-center justify-center relative">
            {currentImg && !imageError ? (
              <img
                key={currentImg.imageUrl}
                src={currentImg.imageUrl}
                alt={productName}
                className="max-h-[58vh] max-w-full object-contain rounded-lg transition duration-200 shadow-xl"
                onError={() => setImageError(true)}
              />
            ) : currentImg && imageError ? (
              <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <span className="text-4xl mb-2">🖼️</span>
                <p className="text-sm font-semibold text-rose-400">Failed to load image preview</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm truncate">
                  {currentImg.imageUrl}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <span className="text-4xl mb-2">📦</span>
                <p className="text-sm font-semibold text-foreground">No image preview available</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload an image to preview it in high resolution.
                </p>
              </div>
            )}
          </div>

          {/* Navigation Next Button */}
          {total > 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 z-20 p-2.5 rounded-full bg-muted900/80 text-foreground hover:bg-violet-600 hover:text-white border border-border/80 shadow-lg backdrop-blur transition transform hover:scale-105"
              title="Next photo (→)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Thumbnail Carousel Footer */}
        {total > 1 && (
          <div className="w-full px-5 py-3 border-t border-border/60 bg-muted800/40 flex items-center justify-center gap-2 overflow-x-auto">
            {normalizedImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-12 h-12 rounded-lg border overflow-hidden shrink-0 transition relative ${
                  safeIndex === idx
                    ? 'border-violet-500 ring-2 ring-violet-500 scale-105'
                    : 'border-border opacity-60 hover:opacity-100 hover:border-border/90'
                }`}
              >
                <img
                  src={img.imageUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {img.isPrimary && (
                  <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-violet-400 ring-1 ring-black" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
