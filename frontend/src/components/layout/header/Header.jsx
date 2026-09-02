import React from 'react';
import HeaderBreadcrumb from './HeaderBreadcrumb';
import ThemeToggle from './ThemeToggle';
import NotificationButton from './NotificationButton';
import UserDropdown from './UserDropdown';

export default function Header({ onMenuToggle }) {
  return (
    <header className="h-16 border-b border-slate-800 light:border-slate-200 bg-slate-900/40 light:bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
      <HeaderBreadcrumb onMenuToggle={onMenuToggle} />

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <NotificationButton />
        <UserDropdown />
      </div>
    </header>
  );
}
