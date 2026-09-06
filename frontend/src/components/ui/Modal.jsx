import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Reusable Workspace & Global Modal Component
 * Fully responsive across all screen sizes without top-cropping on small viewports.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {function} props.onClose - Triggered when closing modal
 * @param {React.ReactNode} [props.title] - Modal header title
 * @param {React.ReactNode} [props.subtitle] - Modal header description
 * @param {React.ReactNode} [props.icon] - Optional header icon emoji/svg
 * @param {string} [props.maxWidth='max-w-md'] - Max width class (e.g. 'max-w-md', 'max-w-lg', 'max-w-2xl', 'max-w-3xl')
 * @param {'workspace' | 'screen'} [props.scope='workspace']
 * @param {React.ReactNode} props.children - Modal inner content / form
 * @param {React.ReactNode} [props.footer] - Custom modal footer actions
 */
export default function Modal({
  isOpen = true,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = 'max-w-md',
  scope = 'workspace',
  children,
  footer,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className="flex min-h-full items-start sm:items-center justify-center p-3 sm:p-5 text-left">
        <div
          className={`relative w-full ${maxWidth} my-3 sm:my-6 border border-border rounded-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col shadow-2xl bg-card animate-in zoom-in-95 duration-150 overflow-hidden`}
          style={{ backgroundColor: 'var(--color-card)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pinned Header */}
          {(title || subtitle || onClose) && (
            <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-border flex items-start justify-between gap-4 shrink-0 bg-card sticky top-0 z-10">
              <div className="min-w-0">
                {title && (
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2 truncate">
                    {icon && <span className="shrink-0">{icon}</span>}
                    <span>{title}</span>
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{subtitle}</p>
                )}
              </div>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted800 transition text-xs font-bold shrink-0"
                  aria-label="Close Modal"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Scrollable Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4">{children}</div>

          {/* Optional Pinned Footer */}
          {footer && (
            <div className="px-5 sm:px-6 py-3.5 border-t border-border flex items-center justify-end gap-3 shrink-0 bg-muted900/40 rounded-b-2xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
