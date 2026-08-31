import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Glow details */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-650/5 blur-[130px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-650/5 blur-[130px] pointer-events-none z-0"></div>

        {/* Header Panel */}
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Content Section */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
