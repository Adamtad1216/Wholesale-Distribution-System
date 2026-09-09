import React, { useState, useMemo, useRef, useEffect } from 'react';

export default function CustomerTagSelect({ customers, selectedIds, onAdd, onRemove }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const getCustomerName = (cust) => {
    if (!cust) return '';
    return cust.person
      ? `${cust.person.firstName} ${cust.person.lastName}`
      : cust.organization?.name || 'Customer';
  };

  const getCustomerMeta = (cust) => {
    const email = cust.person?.email || cust.organization?.email || '';
    return [cust.customerCode, email].filter(Boolean).join(' • ');
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return customers.filter((c) => {
      if (selectedIds.has(c.id)) return false;
      const name = getCustomerName(c).toLowerCase();
      const email = (c.person?.email || c.organization?.email || '').toLowerCase();
      const code = (c.customerCode || '').toLowerCase();
      return name.includes(q) || email.includes(q) || code.includes(q);
    });
  }, [customers, query, selectedIds]);

  const selectedObjs = useMemo(
    () => customers.filter((c) => selectedIds.has(c.id)),
    [customers, selectedIds]
  );

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && query === '' && selectedIds.size > 0) {
      const lastId = Array.from(selectedIds).pop();
      onRemove(lastId);
    }
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (id) => {
    onAdd(id);
    setQuery('');
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Tag input box */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          minHeight: '46px',
          padding: '6px 10px',
          background: 'var(--color-muted, #1e293b)',
          border: `1.5px solid ${focused ? '#6366f1' : 'var(--color-border, #334155)'}`,
          borderRadius: '10px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '6px',
          cursor: 'text',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        {selectedObjs.map((cust) => (
          <span
            key={cust.id}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              backgroundColor: 'rgba(99,102,241,0.18)', color: '#a5b4fc',
              fontSize: '12px', fontWeight: 500,
              padding: '3px 8px 3px 10px', borderRadius: '6px',
              border: '1px solid rgba(99,102,241,0.35)', userSelect: 'none',
            }}
          >
            {getCustomerName(cust)}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onRemove(cust.id); }}
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '0 1px', display: 'flex', alignItems: 'center' }}
            >
              ×
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setFocused(true); if (query.trim()) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={selectedIds.size === 0 ? 'Type to search users...' : ''}
          style={{
            border: 'none', outline: 'none',
            flex: '1 1 140px', minWidth: '120px',
            fontSize: '13px', color: 'var(--color-foreground, #e2e8f0)',
            background: 'transparent', padding: '4px 0',
          }}
        />
      </div>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'var(--color-card, #1e293b)',
            border: '1.5px solid var(--color-border, #334155)',
            borderRadius: '10px', boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
            zIndex: 10000, maxHeight: '200px', overflowY: 'auto',
          }}
        >
          {query.trim() === '' ? (
            <div style={{ padding: '12px 14px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
              Start typing to search users...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
              No matching users found
            </div>
          ) : (
            filtered.map((cust) => (
              <div
                key={cust.id}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(cust.id); }}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(51,65,85,0.4)', transition: 'background-color 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.12)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground, #e2e8f0)' }}>
                  {getCustomerName(cust)}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {getCustomerMeta(cust)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
