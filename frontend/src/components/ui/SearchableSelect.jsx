import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * Reusable Searchable Select / Combobox Component
 * Lightweight, responsive, keyboard-friendly, and dark-theme styled.
 */
export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Type to search...',
  allowClear = true,
  disabled = false,
  required = false,
  size = 'md',
  emptyMessage = 'No matching options',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  // Selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value)) || null;
  }, [options, value]);

  // Filtered options based on search
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((opt) => {
      const labelMatch = opt.label && String(opt.label).toLowerCase().includes(q);
      const sublabelMatch = opt.sublabel && String(opt.sublabel).toLowerCase().includes(q);
      return labelMatch || sublabelMatch;
    });
  }, [options, search]);

  const handleSelect = (opt) => {
    if (opt.disabled) return;
    onChange?.(opt.value, opt);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e?.stopPropagation();
    onChange?.('', null);
    setSearch('');
  };

  const isSmall = size === 'sm';

  return (
    <div className={`relative w-full ${isOpen ? 'z-50' : 'z-10'} ${className}`} ref={containerRef}>
      {/* Hidden input for HTML5 form validation */}
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

      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          backgroundColor: 'var(--input-bg, var(--color-card))',
        }}
        className={`w-full flex items-center justify-between transition cursor-pointer select-none rounded-xl border ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-border text-muted-foreground'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 text-foreground'
            : 'border-border hover:border-slate-400 dark:hover:border-slate-500 text-foreground'
        } ${isSmall ? 'h-9 px-3 text-xs' : 'px-3 py-2 text-sm'}`}
      >
        <div className="flex items-center gap-1.5 truncate flex-1 mr-1">
          {selectedOption ? (
            <span className="font-semibold text-foreground truncate">
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-muted-foreground truncate">{placeholder}</span>
          )}
          {selectedOption?.badge && (
            <span className="shrink-0 px-1.5 py-0.2 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {allowClear && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-muted-foreground hover:text-foreground rounded transition"
              title="Clear selection"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg
            className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-foreground' : ''
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

      {/* Dropdown Menu (Guaranteed solid opaque background & elevated z-index) */}
      {isOpen && (
        <div
          className="absolute z-[100] left-0 mt-1 w-full min-w-[220px] searchable-select-menu border border-border shadow-2xl rounded-xl overflow-hidden"
          style={{
            backgroundColor: 'var(--color-popover, #ffffff)',
            maxHeight: '300px',
          }}
        >
          {/* Search Box */}
          <div
            className="p-2 border-b border-border"
            style={{ backgroundColor: 'var(--color-popover, #ffffff)' }}
          >
            <div className="relative">
              <svg
                className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                style={{ backgroundColor: 'var(--input-bg, var(--color-card))' }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div
            className="max-h-[220px] overflow-y-auto p-1 space-y-0.5"
            style={{ backgroundColor: 'var(--color-popover, #ffffff)' }}
          >
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(value) === String(opt.value);

                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt)}
                    className={`searchable-select-option flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-pointer select-none ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed text-muted-foreground'
                        : isSelected
                        ? 'selected bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-foreground font-medium'
                    }`}
                  >
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate">{opt.label}</span>
                        {opt.badge && (
                          <span className="shrink-0 px-1 py-0.2 rounded text-[10px] bg-muted text-muted-foreground border border-border">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.sublabel && (
                        <p className={`text-[10px] truncate font-mono ${isSelected ? 'text-blue-100' : 'text-muted-foreground'}`}>
                          {opt.sublabel}
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <span className="text-white text-xs shrink-0 ml-1.5 font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
