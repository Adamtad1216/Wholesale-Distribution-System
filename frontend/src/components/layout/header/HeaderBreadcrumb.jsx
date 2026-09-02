import React from 'react';

export default function HeaderBreadcrumb({ onMenuToggle }) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-lg bg-muted800 border border-border text-foreground hover:text-foreground lg:hidden focus:outline-none transition"
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>

      <div className="hidden sm:flex items-center gap-2 text-sm text-slate-450">
        <span className="text-muted-foreground font-medium">Console</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-semibold">Workspace</span>
      </div>
    </div>
  );
}
