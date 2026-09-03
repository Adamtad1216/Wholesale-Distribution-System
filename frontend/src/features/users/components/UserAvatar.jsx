import React from 'react';

export default function UserAvatar({ avatarUrl, name, username, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg text-xs',
    md: 'w-10 h-10 rounded-xl text-sm',
    lg: 'w-16 h-16 rounded-2xl text-2xl',
  };

  const initial = (username || name || 'U').charAt(0).toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || username}
        className={`${sizeClasses[size]} object-cover shadow-md border border-border`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-extrabold flex items-center justify-center shadow-md border border-indigo-400/30`}
    >
      {initial}
    </div>
  );
}
