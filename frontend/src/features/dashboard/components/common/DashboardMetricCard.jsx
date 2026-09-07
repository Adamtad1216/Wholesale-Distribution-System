import React from 'react';

const COLOR_MAP = {
  blue: {
    bg: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    iconBg: 'bg-blue-500/15 text-blue-400',
    glow: 'group-hover:shadow-[0_0_25px_rgba(59,130,246,0.15)]',
    badge: 'bg-blue-500/15 text-blue-400',
  },
  emerald: {
    bg: 'from-emerald-500/10 to-emerald-600/5',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    iconBg: 'bg-emerald-500/15 text-emerald-400',
    glow: 'group-hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]',
    badge: 'bg-emerald-500/15 text-emerald-400',
  },
  amber: {
    bg: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    iconBg: 'bg-amber-500/15 text-amber-400',
    glow: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]',
    badge: 'bg-amber-500/15 text-amber-400',
  },
  purple: {
    bg: 'from-purple-500/10 to-purple-600/5',
    border: 'border-purple-500/20 hover:border-purple-500/40',
    iconBg: 'bg-purple-500/15 text-purple-400',
    glow: 'group-hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]',
    badge: 'bg-purple-500/15 text-purple-400',
  },
  cyan: {
    bg: 'from-cyan-500/10 to-cyan-600/5',
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    iconBg: 'bg-cyan-500/15 text-cyan-400',
    glow: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]',
    badge: 'bg-cyan-500/15 text-cyan-400',
  },
  rose: {
    bg: 'from-rose-500/10 to-rose-600/5',
    border: 'border-rose-500/20 hover:border-rose-500/40',
    iconBg: 'bg-rose-500/15 text-rose-400',
    glow: 'group-hover:shadow-[0_0_25px_rgba(244,63,94,0.15)]',
    badge: 'bg-rose-500/15 text-rose-400',
  },
};

export default function DashboardMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  badgeText,
  onClick,
  active = false,
}) {
  const theme = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md bg-gradient-to-br ${
        theme.bg
      } ${theme.border} ${theme.glow} ${
        onClick ? 'cursor-pointer hover:-translate-y-1' : ''
      } ${active ? 'ring-2 ring-primary/60' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              {value}
            </span>
            {badgeText && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${theme.badge}`}
              >
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${theme.iconBg}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Interactive Bottom Bar */}
      {onClick && (
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          <span>Filter view</span>
          <span className="text-xs font-bold transition-transform group-hover:translate-x-1">→</span>
        </div>
      )}
    </div>
  );
}
