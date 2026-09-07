import React from 'react';
import { Search, Filter, Inbox } from 'lucide-react';

export default function DashboardTableCard({
  title,
  subtitle,
  tabs = [],
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  headerActions,
  children,
  emptyMessage = 'No records found matching your filters.',
  isEmpty = false,
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-lg overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 md:p-6 border-b border-border/60 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {onSearchChange !== undefined && (
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
              </div>
            )}
            {headerActions}
          </div>
        </div>

        {/* Tab Filters */}
        {tabs.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-background/80 text-muted-foreground'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Table Body / Content */}
      <div className="overflow-x-auto">
        {isEmpty ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border/80 flex items-center justify-center text-muted-foreground">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search criteria or filter tabs above.
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
