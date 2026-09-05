import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Reusable Workspace Modal Component (Portal-based)
 * Renders at document.body level via React Portal.
 * Constrained on desktop to start after the sidebar (lg:left-72),
 * centering the modal perfectly within the main content workspace.
 *
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {function} props.onClose - Triggered when closing modal
 * @param {React.ReactNode} [props.title] - Modal header title
 * @param {React.ReactNode} [props.subtitle] - Modal header description
 * @param {React.ReactNode} [props.icon] - Optional header icon
 * @param {string} [props.maxWidth='max-w-md'] - Max width class
 * @param {React.ReactNode} props.children - Modal inner content / form
 * @param {React.ReactNode} [props.footer] - Custom modal footer actions
 */
export default function Modal({
  isOpen = false,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = 'max-w-md',
  children,
  footer,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 lg:left-72 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        className={`border border-border rounded-2xl w-full ${maxWidth} shadow-2xl relative animate-in zoom-in-95 duration-150`}
        style={{
          backgroundColor: 'var(--color-card, #1e293b)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || subtitle || onClose) && (
          <div
            className="border-b border-border flex items-start justify-between gap-4"
            style={{ padding: '20px 24px 16px' }}
          >
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
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition text-sm font-bold shrink-0"
                aria-label="Close Modal"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '20px 24px' }} className="space-y-4">
          {children}
        </div>

        {/* Footer (Optional) */}
        {footer && (
          <div
            className="flex items-center justify-end gap-3 border-t border-border"
            style={{ padding: '16px 24px' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
