import React, { useState } from 'react';
import { AlertTriangle, Zap, ArrowRight, CheckCircle, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';

export default function DashboardAlertBanner({
  title,
  description,
  count,
  actionLabel = 'Review Now',
  onAction,
  onDismiss,
  variant = 'warning', // 'warning' | 'info' | 'success'
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !count || count <= 0) return null;

  const handleAction = (e) => {
    setDismissed(true);
    if (onDismiss) onDismiss();
    if (onAction) onAction(e);
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const styles = {
    warning: {
      border: 'border-amber-500/30',
      bg: 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent',
      text: 'text-amber-300',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      btn: 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold',
      icon: <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20 animate-pulse" />,
    },
    info: {
      border: 'border-cyan-500/30',
      bg: 'bg-gradient-to-r from-cyan-500/15 via-cyan-500/5 to-transparent',
      text: 'text-cyan-300',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      btn: 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold',
      icon: <AlertTriangle className="w-5 h-5 text-cyan-400 animate-pulse" />,
    },
    success: {
      border: 'border-emerald-500/30',
      bg: 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent',
      text: 'text-emerald-300',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      btn: 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    },
  }[variant] || styles.warning;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 md:p-5 transition-all shadow-md ${styles.border} ${styles.bg}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2 rounded-xl bg-background/60 backdrop-blur-sm border border-border/60 shrink-0">
            {styles.icon}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-bold text-sm md:text-base ${styles.text}`}>
                {title}
              </h3>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${styles.badge}`}
              >
                {count} Pending
              </span>
            </div>
            {description && (
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onAction && (
            <Button
              size="sm"
              onClick={handleAction}
              className={`rounded-xl gap-1.5 shadow-sm cursor-pointer ${styles.btn}`}
            >
              {actionLabel}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition cursor-pointer"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
