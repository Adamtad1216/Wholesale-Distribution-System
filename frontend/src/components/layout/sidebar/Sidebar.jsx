import React from 'react';
import { useSelector } from 'react-redux';
import SidebarOverlay from './SidebarOverlay';
import SidebarHeader from './SidebarHeader';
import SidebarNav from './SidebarNav';
import SidebarUserProfile from './SidebarUserProfile';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useSelector((state) => state.auth);

  return (
    <>
      <SidebarOverlay isOpen={isOpen} onClose={onClose} />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-900/90 border-r border-slate-800 backdrop-blur-xl transition-transform duration-300 transform lg:translate-x-0 lg:static lg:h-screen ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarHeader />
        <SidebarNav onClose={onClose} />
        <SidebarUserProfile user={user} />
      </aside>
    </>
  );
}
