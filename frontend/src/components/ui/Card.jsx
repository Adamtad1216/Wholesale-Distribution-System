import React from 'react';

/**
 * Reusable Card Component
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.className] - Extra Tailwind classes
 * @param {boolean} [props.hoverEffect] - Add hover lift effect
 * @param {boolean} [props.noPadding] - Remove default padding
 */
export default function Card({
  children,
  className = '',
  hoverEffect = false,
  noPadding = false,
  ...rest
}) {
  return (
    <div
      className={[
        'bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-xl rounded-lg shadow-sm main-panel ui-card',
        noPadding ? '' : 'p-6',
        hoverEffect ? 'ui-card-hover hover:border-slate-700' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`pb-4 mb-4 border-b border-slate-800/80 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-bold text-slate-100 light:text-slate-900 tracking-tight ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-xs text-slate-400 mt-0.5 ${className}`}>
      {children}
    </p>
  );
}
