import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Reusable Workspace & Global Modal Component (Portal-based)
 * Renders at document.body level via React Portal.
 * Constrained on desktop to start after the sidebar (lg:left-72) when scope='workspace',
 * centering the modal perfectly within the main content workspace.
 *
 * @param {object} props
 * @param {boolean} [props.isOpen=false] - Controls modal visibility
 * @param {function} props.onClose - Triggered when closing modal
 * @param {React.ReactNode} [props.title] - Modal header title
 * @param {React.ReactNode} [props.subtitle] - Modal header description
 * @param {React.ReactNode} [props.icon] - Optional header icon (emoji string or React node)
 * @param {string} [props.maxWidth='max-w-md'] - Max width class (e.g. 'max-w-md', 'max-w-lg', 'max-w-2xl')
 * @param {'workspace' | 'screen'} [props.scope='workspace'] - 'workspace' centers within main content on desktop, 'screen' overlays full viewport
 * @param {string} [props.className] - Optional custom classes for modal container
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
  scope = 'workspace',
  className = '',
  children,
  footer,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const backdropPosition = scope === 'workspace' ? 'fixed inset-0 lg:left-72' : 'fixed inset-0';

  const modalContent = (
    <div
      className={`${backdropPosition} z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-150`}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        className={`bg-card text-card-foreground border border-border rounded-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150 relative my-auto ${className}`}
        style={{ backgroundColor: 'var(--color-card, #1e293b)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        {(title || subtitle || onClose) && (
          <div className="border-b border-border px-6 py-4 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 text-base">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="text-base font-bold text-foreground">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-muted transition text-xs font-bold shrink-0 cursor-pointer"
                aria-label="Close Modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto scrollbar-thin space-y-4 flex-1">
          {children}
        </div>

        {/* Modal Footer (Optional) */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20 rounded-b-2xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
