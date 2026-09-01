import React from 'react';

export default function SidebarHeader() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-7 border-b border-white/10">
      {/* White Circle Icon Badge */}
      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg mb-4 sidebar-logo-badge">
        <svg className="w-8 h-8 sidebar-logo-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
        </svg>
      </div>

      {/* Brand Title */}
      <h1 className="font-extrabold text-sm tracking-widest text-white/60 uppercase">
        Wholesale System
      </h1>
      <p className="text-[11px] text-white/60 font-medium tracking-wide mt-1">
        Enterprise Distribution System
      </p>
    </div>
  );
}
