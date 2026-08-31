import React from 'react';

export default function SidebarHeader() {
  return (
    <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-650 flex items-center justify-center text-white font-bold text-base shadow-md shadow-violet-500/10">
        W
      </div>
      <div>
        <h1 className="font-bold text-sm bg-gradient-to-r from-white to-slate-350 bg-clip-text text-transparent">
          Wholesale System
        </h1>
        <p className="text-[10px] text-violet-400 font-semibold tracking-wider uppercase">
          Enterprise
        </p>
      </div>
    </div>
  );
}
