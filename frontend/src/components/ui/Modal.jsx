import React, { useEffect } from 'react';

/**
 * Reusable Workspace & Global Modal Component
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {function} props.onClose - Triggered when closing modal
 * @param {React.ReactNode} [props.title] - Modal header title
 * @param {React.ReactNode} [props.subtitle] - Modal header description
 * @param {React.ReactNode} [props.icon] - Optional header icon emoji/svg
 * @param {string} [props.maxWidth='max-w-md'] - Max width class (e.g. 'max-w-md', 'max-w-lg', 'max-w-2xl')
 * @param {'workspace' | 'screen'} [props.scope='workspace'] - 'workspace' centers within main content, 'screen' overlays entire viewport
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
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const backdropPositionClass =
    scope === 'workspace'
      ? 'absolute -inset-6 md:-inset-8'
      : 'fixed inset-0';

  return (
    <div
      className={`${backdropPositionClass} z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px] p-4 animate-in fade-in duration-150`}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        className={`border border-border rounded-2xl w-full ${maxWidth} p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 relative -translate-y-8 md:-translate-y-12`}
        style={{ backgroundColor: 'var(--color-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        {(title || subtitle || onClose) && (
          <div className="border-b border-border pb-3 flex items-start justify-between gap-4">
            <div>
              {title && (
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  {icon && <span>{icon}</span>}
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition text-xs font-bold"
                aria-label="Close Modal"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="space-y-4">{children}</div>

        {/* Modal Footer (Optional) */}
        {footer && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
