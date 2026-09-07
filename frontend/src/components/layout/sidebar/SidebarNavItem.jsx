import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export default function SidebarNavItem({ item, onClick }) {
  const location = useLocation();

  // Prevent parent route '/sales-orders' from being marked active when on '/sales-orders/new'
  const isCurrentActive = (() => {
    if (item.href === '/sales-orders') {
      if (location.pathname === '/sales-orders/new' || location.pathname.startsWith('/sales-orders/new')) {
        return false;
      }
      return location.pathname === '/sales-orders' || location.pathname.startsWith('/sales-orders/');
    }
    if (item.end) {
      return location.pathname === item.href;
    }
    return location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href + '/'));
  })();

  return (
    <NavLink
      to={item.href}
      onClick={onClick}
      className={
        `sidebar-nav-link flex items-center gap-3.5 px-4 py-2.5 text-sm font-semibold transition-all duration-200 rounded-lg ${
          isCurrentActive
            ? 'is-active sidebar-active-link'
            : 'sidebar-inactive-link'
        }`
      }
    >
      <span className={isCurrentActive ? 'sidebar-active-icon' : 'sidebar-inactive-icon'}>
        {item.icon}
      </span>
      <span className="flex-1 truncate">{item.name}</span>
      {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
        <span className="ml-auto flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-400 text-slate-950 shadow-sm border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-950 animate-pulse" />
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}
