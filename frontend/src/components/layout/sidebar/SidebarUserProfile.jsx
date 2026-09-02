import React from 'react';

export default function SidebarUserProfile({ user }) {
  const initial = user?.username ? user.username[0].toUpperCase() : 'U';
  const name = user?.username || 'User';

  return (
    <div className="p-4 border-t border-blue-900/40 bg-blue-950/20">
      <div className="flex items-center gap-3 p-2 rounded-xl bg-card/5 border border-white/10">
        <div className="w-9 h-9 rounded-full bg-card text-[#1E3A8A] font-extrabold text-sm flex items-center justify-center shadow">
          {initial}
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-bold  truncate">{name}</p>
          <p className="text-[10px] text-blue-200/70 font-semibold truncate uppercase">Active Session</p>
        </div>
      </div>
    </div>
  );
}
