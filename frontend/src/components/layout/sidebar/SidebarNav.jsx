import React from 'react';
import SidebarNavItem from './SidebarNavItem';
import { navigationItems } from './navigationData';

export default function SidebarNav({ onClose, items = navigationItems }) {
  return (
    <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
      {items.map((item) => (
        <SidebarNavItem key={item.name} item={item} onClick={onClose} />
      ))}
    </nav>
  );
}
