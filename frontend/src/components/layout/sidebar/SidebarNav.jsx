import React from 'react';
import { useSelector } from 'react-redux';
import SidebarNavItem from './SidebarNavItem';
import { navigationSections } from './navigationData';

export default function SidebarNav({ onClose }) {
  const { permissions = [], role } = useSelector((state) => state.auth);

  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const hasWildcard =
    isSuperAdmin ||
    permissions.includes('*') ||
    permissions.includes('all') ||
    permissions.includes('system:all');

  return (
    <nav className="flex-1 px-3 py-5 overflow-y-auto scrollbar-thin space-y-6">
      {navigationSections.map((section) => {
        const visibleItems = section.items.filter((item) => {
          if (!item.permission) return true;
          if (hasWildcard) return true;
          const required = Array.isArray(item.permission) ? item.permission : [item.permission];
          return required.some((p) => permissions.includes(p));
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={section.title} className="space-y-0.5">
            <h3 className="px-3 mb-2 text-[11px] font-bold tracking-widest sidebar-section-label uppercase">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {visibleItems.map((item) => (
                <SidebarNavItem key={item.name} item={item} onClick={onClose} />
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
