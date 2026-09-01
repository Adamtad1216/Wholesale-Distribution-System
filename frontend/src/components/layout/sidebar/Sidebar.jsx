import React from 'react';
import SidebarOverlay from './SidebarOverlay';
import SidebarHeader from './SidebarHeader';
import SidebarNav from './SidebarNav';

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <SidebarOverlay isOpen={isOpen} onClose={onClose} />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 text-white shadow-2xl transition-transform duration-300 transform lg:translate-x-0 lg:static lg:h-screen sidebar-panel ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarHeader />
        <SidebarNav onClose={onClose} />
      </aside>
    </>
  );
}
