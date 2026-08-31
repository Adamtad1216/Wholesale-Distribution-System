import React from 'react';
import { useSelector } from 'react-redux';

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-8 md:p-10 rounded-2xl bg-gradient-to-tr from-violet-950/30 to-slate-900/40 border border-violet-900/20 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <span className="px-3 py-1 text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full">
            Workspace Active
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mt-4">
            Welcome back, {user?.username || 'Partner'}
          </h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Manage your bulk inventory orders, view invoice updates, monitor delivery statuses, and handle B2B documentation in one centralized console.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold mb-4">
            $
          </div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Orders</h3>
          <p className="text-2xl font-bold text-white mt-1">128</p>
        </div>
        <div className="p-6 rounded-2xl backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold mb-4">
            📄
          </div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Pending Invoices</h3>
          <p className="text-2xl font-bold text-white mt-1">12</p>
        </div>
        <div className="p-6 rounded-2xl backdrop-blur-xl bg-slate-900/40 border border-slate-800/60 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold mb-4">
            ☁️
          </div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Uploaded Docs</h3>
          <p className="text-2xl font-bold text-white mt-1">45</p>
        </div>
      </div>
    </div>
  );
}
