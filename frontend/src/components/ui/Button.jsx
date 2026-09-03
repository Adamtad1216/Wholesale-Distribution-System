import React from 'react';

/**
 * Reusable Button Component
 *
 * @param {object}  props
 * @param {'primary'|'secondary'|'danger'|'ghost'|'outline'|'success'} props.variant  - Visual style
 * @param {'sm'|'md'|'lg'}                                             props.size     - Button size
 * @param {boolean}                                                     props.loading  - Show spinner
 * @param {boolean}                                                     props.disabled - Disabled state
 * @param {boolean}                                                     props.fullWidth - Take full width
 * @param {React.ReactNode}                                             props.icon     - Left icon element
 * @param {React.ReactNode}                                             props.iconRight - Right icon element
 * @param {'button'|'submit'|'reset'}                                   props.type    - HTML button type
 * @param {string}                                                      props.className - Extra classes
 * @param {Function}                                                     props.onClick
 * @param {React.ReactNode}                                             props.children
 */

const VARIANT_CLASSES = {
  primary:
    'btn-primary bg-violet-600 hover:bg-violet-500  shadow-md shadow-violet-600/30 border border-violet-500 font-semibold',
  secondary:
    'btn-secondary bg-muted700 hover:bg-slate-600  shadow-md border border-border font-semibold',
  danger:
    'btn-danger bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold',
  'danger-solid':
    'btn-danger-solid bg-rose-600 hover:bg-rose-500  border border-rose-500 shadow-md shadow-rose-600/30 font-semibold',
  ghost:
    'btn-ghost bg-muted800 hover:bg-muted700 text-foreground hover: border border-border font-medium',
  outline:
    'btn-outline bg-violet-600/15 hover:bg-violet-600/25 text-violet-300 border border-violet-500/60 font-semibold',
  success:
    'btn-success bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold',
};

const SIZE_CLASSES = {
  xs:  'px-2.5 py-1 text-xs rounded-md gap-1.5',
  sm:  'px-3 py-1.5 text-xs rounded-md gap-2',
  md:  'px-4 py-2.5 text-sm rounded-md gap-2',
  lg:  'px-5 py-3 text-base rounded-md gap-2.5',
};

const ICON_SIZE = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const Spinner = ({ sizeClass }) => (
  <svg
    className={`animate-spin ${sizeClass}`}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconRight,
  type = 'button',
  className = '',
  onClick,
  children,
  ...rest
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background select-none',
        VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary,
        SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading ? (
        <Spinner sizeClass={ICON_SIZE[size]} />
      ) : icon ? (
        <span className={`shrink-0 ${ICON_SIZE[size]}`}>{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
      {!loading && iconRight && (
        <span className={`shrink-0 ${ICON_SIZE[size]}`}>{iconRight}</span>
      )}
    </button>
  );
}
