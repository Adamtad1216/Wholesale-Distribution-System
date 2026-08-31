import React from 'react';

export default function NotificationButton() {
  return (
    <button
      className="p-2 rounded-xl bg-slate-800/20 border border-slate-800/60 text-slate-400 hover:text-slate-250 hover:bg-slate-800/50 transition relative"
      aria-label="Notifications"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-violet-500 ring-2 ring-slate-900 animate-pulse"></span>
    </button>
  );
}
