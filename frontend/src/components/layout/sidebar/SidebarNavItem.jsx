import React from 'react';
import { NavLink } from 'react-router-dom';

export default function SidebarNavItem({ item, onClick }) {
  return (
    <NavLink
      to={item.href}
      onClick={onClick}
      className={({ isActive }) =>
        `sidebar-nav-link flex items-center gap-3.5 px-4 py-2.5 text-sm font-semibold transition-all duration-200 rounded-lg ${
          isActive
            ? 'is-active sidebar-active-link'
            : 'sidebar-inactive-link'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? 'sidebar-active-icon' : 'sidebar-inactive-icon'}>
            {item.icon}
          </span>
          <span>{item.name}</span>
        </>
      )}
    </NavLink>
  );
}
