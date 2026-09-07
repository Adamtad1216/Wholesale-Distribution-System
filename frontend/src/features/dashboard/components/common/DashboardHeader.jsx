import React from 'react';
import { RefreshCw, MapPin, Building2, Truck, Shield, Clock } from 'lucide-react';
import Button from '../../../../components/ui/Button';

export default function DashboardHeader({
  title,
  subtitle,
  roleLabel,
  roleColor = 'emerald', // 'emerald' | 'blue' | 'amber' | 'purple' | 'cyan'
  hubName,
  hubType = 'warehouse', // 'warehouse' | 'territory' | 'vehicle' | 'facility'
  onRefresh,
  isRefreshing = false,
  lastUpdated,
  actions,
}) {
  const getRoleBadgeStyle = () => {
    switch (roleColor) {
      case 'cyan':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'amber':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'purple':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'blue':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'emerald':
      default:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  const getHubIcon = () => {
    switch (hubType) {
      case 'territory':
        return <MapPin className="w-3.5 h-3.5 text-indigo-400" />;
      case 'vehicle':
        return <Truck className="w-3.5 h-3.5 text-purple-400" />;
      case 'facility':
        return <Building2 className="w-3.5 h-3.5 text-amber-400" />;
      case 'warehouse':
      default:
        return <Building2 className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card/90 via-card/70 to-card/40 p-6 md:p-8 backdrop-blur-xl shadow-xl transition-all">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left Info Column */}
        <div className="space-y-3">
          {/* Badges Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {roleLabel && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border shadow-sm ${getRoleBadgeStyle()}`}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                {roleLabel}
              </span>
            )}

            {hubName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-border/80 bg-background/60 text-muted-foreground backdrop-blur-sm">
                {getHubIcon()}
                <span className="font-semibold text-foreground">{hubName}</span>
              </span>
            )}

            {lastUpdated && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground/70 hidden sm:inline-flex">
                <Clock className="w-3 h-3" />
                Updated {lastUpdated}
              </span>
            )}
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm md:text-base text-muted-foreground mt-1 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Actions Column */}
        <div className="flex items-center gap-3 shrink-0">
          {actions}

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-2 border-border/80 bg-background/50 hover:bg-muted/80 backdrop-blur-sm rounded-xl cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              <span className="hidden sm:inline font-medium">Refresh</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
