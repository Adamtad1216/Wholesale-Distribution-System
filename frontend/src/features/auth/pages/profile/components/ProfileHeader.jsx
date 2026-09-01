import React, { useRef } from 'react';
import Card from '../../../../../components/ui/Card';

export default function ProfileHeader({ user, role, personData, joinedDate, getInitials, onAvatarUpload }) {
  const fileInputRef = useRef(null);
  const person = user?.person || {};
  const firstName = person.firstName || '';
  const lastName = person.lastName || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || user?.username || 'User';

  const avatarUrl = personData.avatarUrl || user?.avatarUrl || person.avatarUrl || null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      if (onAvatarUpload) {
        onAvatarUpload(file);
      }
    }
  };

  return (
    <Card noPadding className="overflow-hidden border border-slate-200 dark:border-slate-800">
      <div className="h-28 sm:h-36 bg-gradient-to-r from-blue-600/20 via-indigo-600/15 to-violet-600/20 w-full relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent" />
      </div>

      <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row items-center md:items-end justify-between gap-6 -mt-14 sm:-mt-16">
        {/* Avatar + Details */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
          {/* Avatar Container with Upload Camera Overlay */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white text-blue-600 font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-xl ring-4 ring-emerald-500 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                getInitials()
              )}
            </div>

            {/* Camera Upload Icon */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Change profile picture"
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg ring-2 ring-white transition-transform hover:scale-110 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="space-y-1.5 pb-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold">{fullName}</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                {user?.accountStatus || 'Active'}
              </span>
            </div>

            <p className="text-sm font-medium text-muted">{role || 'User'}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs font-medium text-muted">
              {personData.address && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{personData.address}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Joined {joinedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Metric */}
        <div className="text-center md:text-right shrink-0 pb-1">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">100%</div>
          <div className="text-xs font-medium text-muted mt-0.5">Overall Performance</div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 mt-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            +0.0%
          </div>
        </div>
      </div>
    </Card>
  );
}
