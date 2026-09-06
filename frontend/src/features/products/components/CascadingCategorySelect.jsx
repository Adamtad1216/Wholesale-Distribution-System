import React, { useState, useMemo, useRef, useEffect } from 'react';

/**
 * Builds category lookup maps, hierarchy tree, and full breadcrumb paths.
 */
function processCategories(categories = [], excludeId = null) {
  const catMap = new Map();
  const childrenMap = new Map();

  // Filter out excluded ID (e.g. when editing category to prevent self-parenting)
  // and descendants of excluded ID to prevent circular hierarchy
  const excludedIds = new Set();
  if (excludeId) {
    excludedIds.add(excludeId);
    let added = true;
    while (added) {
      added = false;
      categories.forEach((c) => {
        if (c.parentId && excludedIds.has(c.parentId) && !excludedIds.has(c.id)) {
          excludedIds.add(c.id);
          added = true;
        }
      });
    }
  }

  const validCategories = categories.filter((c) => !excludedIds.has(c.id));

  validCategories.forEach((c) => {
    catMap.set(c.id, c);
    if (!childrenMap.has(c.id)) {
      childrenMap.set(c.id, []);
    }
  });

  validCategories.forEach((c) => {
    if (c.parentId && childrenMap.has(c.parentId)) {
      childrenMap.get(c.parentId).push(c);
    }
  });

  // Calculate breadcrumbs and leaf status
  const getBreadcrumbs = (catId) => {
    const crumbs = [];
    let curr = catMap.get(catId);
    const visited = new Set();
    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      crumbs.unshift(curr);
      curr = curr.parentId ? catMap.get(curr.parentId) : null;
    }
    return crumbs;
  };

  const processed = validCategories.map((c) => {
    const children = childrenMap.get(c.id) || [];
    const isRoot = !c.parentId;
    const isLeaf = children.length === 0;
    const crumbs = getBreadcrumbs(c.id);
    const breadcrumbPath = crumbs.map((crumb) => crumb.name).join(' ➔ ');

    return {
      ...c,
      children,
      isRoot,
      isLeaf,
      crumbs,
      breadcrumbPath,
      level: crumbs.length - 1,
    };
  });

  const roots = processed.filter((c) => c.isRoot);

  return {
    processedMap: new Map(processed.map((c) => [c.id, c])),
    roots,
    allList: processed,
    childrenMap,
  };
}

/**
 * CascadingCategorySelect Component
 * 
 * Props:
 * - value: string (category ID)
 * - onChange: (id: string, categoryObj?: object) => void
 * - categories: Array of category objects
 * - onlyLeaf: boolean (if true, only leaf/subcategories without children can be selected)
 * - placeholder: string
 * - allowClear: boolean
 * - includeAllOption: boolean (e.g. for filters to choose "All Categories")
 * - allOptionLabel: string (default "All Categories")
 * - allowNone: boolean (for parent selection: "None / Top Level")
 * - noneLabel: string (default "None (Top-Level Category)")
 * - excludeId: string (ID to exclude from parent options)
 * - size: 'sm' | 'md' (default 'md')
 * - disabled: boolean
 * - required: boolean
 * - error: string
 */
export default function CascadingCategorySelect({
  value = '',
  onChange,
  categories = [],
  onlyLeaf = false,
  placeholder = 'Select Category...',
  allowClear = true,
  includeAllOption = false,
  allOptionLabel = 'All Categories',
  allowNone = false,
  noneLabel = 'None (Top-Level Category)',
  excludeId = null,
  size = 'md',
  disabled = false,
  required = false,
  error = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('CASCADING'); // 'CASCADING' | 'ALL'
  
  // Drilldown state for cascading mode: array of selected category objects at each depth level
  const [drilldownPath, setDrilldownPath] = useState([]);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Process categories into hierarchy
  const { processedMap, roots, allList } = useMemo(
    () => processCategories(categories, excludeId),
    [categories, excludeId]
  );

  // Currently selected category object
  const selectedCategory = useMemo(() => {
    if (!value) return null;
    return processedMap.get(value) || null;
  }, [value, processedMap]);

  // Sync drilldown path when dropdown opens or value changes
  useEffect(() => {
    if (selectedCategory) {
      const parentCrumbs = selectedCategory.crumbs.slice(0, -1);
      setDrilldownPath(parentCrumbs);
    } else {
      setDrilldownPath([]);
    }
  }, [selectedCategory, isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens or switches to search
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filtered categories for "Search All" mode
  const searchResults = useMemo(() => {
    if (!search.trim()) return allList;
    const q = search.toLowerCase();
    return allList.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.breadcrumbPath.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    });
  }, [search, allList]);

  const handleSelect = (category) => {
    if (onlyLeaf && !category.isLeaf) {
      // In onlyLeaf mode, clicking a non-leaf drills into its subcategories
      setActiveTab('CASCADING');
      setDrilldownPath(category.crumbs);
      return;
    }
    onChange?.(category.id, category);
    setIsOpen(false);
    setSearch('');
  };

  const handleSelectNone = () => {
    onChange?.('', null);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e?.stopPropagation();
    onChange?.('', null);
    setSearch('');
    setDrilldownPath([]);
  };

  // Compute current column options in cascading mode
  const currentLevelOptions = useMemo(() => {
    if (drilldownPath.length === 0) {
      return roots;
    }
    const currentParent = drilldownPath[drilldownPath.length - 1];
    return currentParent.children || [];
  }, [drilldownPath, roots]);

  const isSizeSm = size === 'sm';

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between transition cursor-pointer select-none rounded-xl border ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-muted800/40 border-border text-muted-foreground'
            : isOpen
            ? 'bg-muted800/90 border-violet-500 ring-2 ring-violet-500/20 text-foreground'
            : 'bg-muted800/70 border-border hover:border-border/80 text-foreground hover:bg-muted800'
        } ${isSizeSm ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'} ${
          error ? 'border-rose-500 ring-1 ring-rose-500/30' : ''
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1">
          <span className="text-violet-400 shrink-0">
            {selectedCategory ? '📁' : '📂'}
          </span>
          {selectedCategory ? (
            <div className="flex items-center gap-1.5 truncate">
              {selectedCategory.crumbs.length > 1 && (
                <span className="text-muted-foreground/80 font-normal truncate text-[11px]">
                  {selectedCategory.crumbs
                    .slice(0, -1)
                    .map((c) => c.name)
                    .join(' › ')}{' '}
                  ›
                </span>
              )}
              <span className="font-semibold text-foreground truncate">
                {selectedCategory.name}
              </span>
              {selectedCategory.isLeaf && (
                <span className="shrink-0 px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Leaf
                </span>
              )}
            </div>
          ) : allowNone && value === '' ? (
            <span className="text-muted-foreground italic truncate">
              {noneLabel}
            </span>
          ) : includeAllOption && value === '' ? (
            <span className="text-foreground font-medium truncate">
              {allOptionLabel}
            </span>
          ) : (
            <span className="text-muted-foreground truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {allowClear && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted700 transition"
              title="Clear category selection"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-violet-400' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Hidden input for HTML form validation */}
      {required && (
        <input
          type="text"
          value={value || ''}
          onChange={() => {}}
          required
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 mt-1.5 w-full min-w-[320px] sm:min-w-[420px] max-w-[520px] bg-slate-900/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ maxHeight: '440px' }}
        >
          {/* Header Bar with Search & Mode Switcher */}
          <div className="p-3 border-b border-border bg-muted800/40 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <svg
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (e.target.value.trim() && activeTab !== 'ALL') {
                      setActiveTab('ALL');
                    }
                  }}
                  placeholder="Search all categories across levels..."
                  className="w-full pl-9 pr-8 py-1.5 bg-muted900/80 border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center p-0.5 rounded-lg bg-muted900 border border-border shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('CASCADING')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                    activeTab === 'CASCADING'
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Cascading Tree Drilldown"
                >
                  <span>🔀</span>
                  <span>Cascading</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ALL')}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                    activeTab === 'ALL'
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Search All Categories"
                >
                  <span>🔍</span>
                  <span>All ({allList.length})</span>
                </button>
              </div>
            </div>

            {/* Quick Action Pills (All Categories / None) */}
            <div className="flex items-center gap-2 pt-0.5 text-xs overflow-x-auto pb-0.5">
              {includeAllOption && (
                <button
                  type="button"
                  onClick={handleSelectNone}
                  className={`px-2.5 py-1 rounded-lg border text-xs transition shrink-0 flex items-center gap-1 ${
                    value === ''
                      ? 'bg-violet-500/20 text-violet-300 border-violet-500/40 font-semibold'
                      : 'bg-muted900/60 text-muted-foreground hover:text-foreground border-border hover:bg-muted800'
                  }`}
                >
                  <span>🌐</span>
                  <span>{allOptionLabel}</span>
                </button>
              )}

              {allowNone && (
                <button
                  type="button"
                  onClick={handleSelectNone}
                  className={`px-2.5 py-1 rounded-lg border text-xs transition shrink-0 flex items-center gap-1 ${
                    value === ''
                      ? 'bg-violet-500/20 text-violet-300 border-violet-500/40 font-semibold'
                      : 'bg-muted900/60 text-muted-foreground hover:text-foreground border-border hover:bg-muted800'
                  }`}
                >
                  <span>🔝</span>
                  <span>{noneLabel}</span>
                </button>
              )}

              {onlyLeaf && (
                <span className="text-[11px] text-amber-400/90 ml-auto flex items-center gap-1 shrink-0 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <span>ℹ️</span>
                  <span>Subcategory (Leaf) required for products</span>
                </span>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="max-h-[290px] overflow-y-auto divide-y divide-border/40">
            {activeTab === 'CASCADING' && !search.trim() ? (
              <div>
                {/* Breadcrumb Trail Navigation */}
                <div className="px-3 py-2 bg-muted900/50 border-b border-border flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                  <button
                    type="button"
                    onClick={() => setDrilldownPath([])}
                    className={`hover:text-foreground transition font-medium ${
                      drilldownPath.length === 0 ? 'text-violet-400 font-semibold' : ''
                    }`}
                  >
                    Root Categories
                  </button>

                  {drilldownPath.map((step, idx) => {
                    const isLast = idx === drilldownPath.length - 1;
                    return (
                      <React.Fragment key={step.id}>
                        <span className="text-muted-foreground/60">›</span>
                        <button
                          type="button"
                          onClick={() => setDrilldownPath(drilldownPath.slice(0, idx + 1))}
                          className={`hover:text-foreground transition truncate max-w-[140px] ${
                            isLast ? 'text-violet-400 font-semibold' : 'text-muted-foreground'
                          }`}
                        >
                          {step.name}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Categories at current level */}
                <div className="p-2 space-y-1">
                  {currentLevelOptions.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      <p>No subcategories found in this category.</p>
                      {drilldownPath.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setDrilldownPath(drilldownPath.slice(0, -1))}
                          className="mt-2 text-violet-400 hover:underline inline-flex items-center gap-1"
                        >
                          ← Go back to previous level
                        </button>
                      )}
                    </div>
                  ) : (
                    currentLevelOptions.map((cat) => {
                      const isSelected = value === cat.id;
                      const hasChildren = (cat.children || []).length > 0;
                      const isSelectable = !onlyLeaf || cat.isLeaf;

                      return (
                        <div
                          key={cat.id}
                          className={`group flex items-center justify-between p-2 rounded-xl transition ${
                            isSelected
                              ? 'bg-violet-500/20 border border-violet-500/40 text-violet-200'
                              : 'hover:bg-muted800/80 text-foreground'
                          }`}
                        >
                          <div
                            onClick={() => {
                              if (hasChildren) {
                                setDrilldownPath([...drilldownPath, cat]);
                              } else if (isSelectable) {
                                handleSelect(cat);
                              }
                            }}
                            className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                          >
                            <span className="text-base">
                              {hasChildren ? '📁' : '📄'}
                            </span>
                            <div className="truncate flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm truncate">
                                  {cat.name}
                                </span>
                                {cat.isLeaf ? (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Leaf
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    {(cat.children || []).length} subcategories
                                  </span>
                                )}
                              </div>
                              {cat.description && (
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                  {cat.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            {/* If it's a parent category, user can either drilldown or select (if allowed) */}
                            {hasChildren && (
                              <button
                                type="button"
                                onClick={() => setDrilldownPath([...drilldownPath, cat])}
                                className="px-2 py-1 rounded-lg text-xs font-medium bg-muted800 hover:bg-muted700 text-muted-foreground hover:text-foreground flex items-center gap-1 transition"
                                title="Explore subcategories"
                              >
                                <span>Subcategories</span>
                                <span>›</span>
                              </button>
                            )}

                            {isSelectable && (
                              <button
                                type="button"
                                onClick={() => handleSelect(cat)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                  isSelected
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/30'
                                }`}
                              >
                                {isSelected ? 'Selected ✓' : 'Select'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* All Categories / Search Results Mode */
              <div className="p-2 space-y-1">
                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">No categories matched "{search}"</p>
                    <p className="mt-1">Try another keyword or browse the cascading tree.</p>
                  </div>
                ) : (
                  searchResults.map((cat) => {
                    const isSelected = value === cat.id;
                    const isSelectable = !onlyLeaf || cat.isLeaf;

                    return (
                      <div
                        key={cat.id}
                        onClick={() => {
                          if (isSelectable) {
                            handleSelect(cat);
                          } else {
                            // Non-leaf clicked in onlyLeaf mode -> drill down
                            setActiveTab('CASCADING');
                            setDrilldownPath(cat.crumbs);
                          }
                        }}
                        className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                          isSelected
                            ? 'bg-violet-500/20 border border-violet-500/40 text-violet-200'
                            : 'hover:bg-muted800/80 text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="text-base shrink-0">
                            {cat.isLeaf ? '📄' : '📁'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-sm text-foreground">
                                {cat.name}
                              </span>
                              {cat.isLeaf ? (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Leaf Subcategory
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  Root Category
                                </span>
                              )}
                            </div>

                            {/* Full Breadcrumb Path */}
                            <p className="text-[11px] text-muted-foreground/90 truncate mt-0.5 font-mono">
                              {cat.breadcrumbPath}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 ml-2">
                          {isSelectable ? (
                            <span
                              className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                                isSelected
                                  ? 'bg-violet-600 text-white'
                                  : 'text-violet-400 group-hover:text-violet-300'
                              }`}
                            >
                              {isSelected ? 'Selected ✓' : 'Select'}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab('CASCADING');
                                setDrilldownPath(cat.crumbs);
                              }}
                              className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-0.5"
                            >
                              <span>View subcategories</span>
                              <span>›</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-2.5 bg-muted900/80 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div>
              {selectedCategory ? (
                <span className="truncate max-w-[240px] block text-foreground">
                  Active: <strong className="text-violet-400">{selectedCategory.name}</strong>{' '}
                  <span className="text-[10px] text-muted-foreground">({selectedCategory.breadcrumbPath})</span>
                </span>
              ) : (
                <span>No category selected</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {value && allowClear && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2 py-1 rounded text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                >
                  Clear Selection
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 rounded-lg bg-muted800 hover:bg-muted700 text-foreground font-medium transition text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
