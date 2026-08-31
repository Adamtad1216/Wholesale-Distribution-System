import React from 'react';

export default function SidebarUserProfile({ user }) {
  const initial = user?.username ? user.username[0].toUpperCase() : 'U';
  const name = user?.username || 'User';
  const type = user?.customerType || 'PARTNER';

  return (
    <div className="p-4 border-t border-slate-800 bg-slate-900/40">
      <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/20 border border-slate-800/40">
        <div className="w-9 h-9 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-semibold text-sm">
          {initial}
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-semibold text-white truncate">{name}hello</p>
          <p className="text-[10px] text-slate-400 truncate">{type}</p>
        </div>
      </div>
    </div>
  );
}
