import React from 'react';
import { useSelector } from 'react-redux';
import Card from '../../../../components/ui/Card';

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card noPadding className="p-8 md:p-10 rounded-lg relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <span className="px-3 py-1 text-xs font-semibold badge-violet rounded-full">
            Workspace Active
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100 light:text-slate-900 mt-4">
            Welcome back, {user?.username || 'Partner'}
          </h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Manage your bulk inventory orders, view invoice updates, monitor delivery statuses, and handle B2B documentation in one centralized console.
          </p>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card hoverEffect className="rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold mb-4">
            $
          </div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Orders</h3>
          <p className="text-2xl font-bold text-slate-100 light:text-slate-900 mt-1">128</p>
        </Card>

        <Card hoverEffect className="rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold mb-4">
            📄
          </div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Pending Invoices</h3>
          <p className="text-2xl font-bold text-slate-100 light:text-slate-900 mt-1">12</p>
        </Card>

        <Card hoverEffect className="rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold mb-4">
            ☁️
          </div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Uploaded Docs</h3>
          <p className="text-2xl font-bold text-slate-100 light:text-slate-900 mt-1">45</p>
        </Card>
      </div>
    </div>
  );
}
