import React from 'react';
import { useSelector } from 'react-redux';

export default function SidebarHeader() {
  const { role } = useSelector((state) => state.auth);
  const isSalesRep = role === 'SALES_REPRESENTATIVE' || role === 'SALES_REP';
  const isCustomer = role === 'CUSTOMER';

  const badgeText = isSalesRep
    ? 'Sales Representative Portal'
    : isCustomer
    ? 'Customer Wholesale Portal'
    : 'Enterprise Distribution';

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-5 border-b border-sidebar-border">
      {/* Circle Icon Badge */}
      <div className="w-12 h-12 rounded-2xl bg-card border border-sidebar-border flex items-center justify-center shadow-lg mb-3 sidebar-logo-badge">
        <svg className="w-7 h-7 sidebar-logo-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
        </svg>
      </div>

      {/* Brand Title */}
      <h1 className="font-extrabold text-sm tracking-wider text-sidebar-foreground uppercase">
        Wholesale System
      </h1>
      <span className="text-[10px] text-sidebar-muted font-bold tracking-wider uppercase mt-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-sidebar-border">
        {badgeText}
      </span>
    </div>
  );
}
