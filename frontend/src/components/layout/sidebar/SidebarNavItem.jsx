import React from 'react';
import { NavLink } from 'react-router-dom';

export default function SidebarNavItem({ item, onClick }) {
  return (
    <NavLink
      to={item.href}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition duration-200 ${
          isActive
            ? 'bg-gradient-to-r from-violet-600/15 to-indigo-600/5 text-violet-400 border-l-[3px] border-violet-500 pl-[13px]'
            : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 pl-4'
        }`
      }
    >
      {item.icon}
      {item.name}
    </NavLink>
  );
}
