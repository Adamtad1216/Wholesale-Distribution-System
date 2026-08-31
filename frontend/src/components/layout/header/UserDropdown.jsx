import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logout } from '../../../features/auth/authSlice';

export default function UserDropdown() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initial = user?.username ? user.username[0].toUpperCase() : 'U';
  const username = user?.username || 'User';

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2.5 focus:outline-none p-1 rounded-xl hover:bg-slate-800/30 transition"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
          {initial}
        </div>
        <span className="hidden md:inline text-sm font-semibold text-slate-250 hover:text-white">
          {username}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            dropdownOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {dropdownOpen && (
        <>
          <div
            onClick={() => setDropdownOpen(false)}
            className="fixed inset-0 z-40 bg-transparent"
          />
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 py-1.5">
            <div className="px-4 py-2 border-b border-slate-800/80">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="text-sm font-bold text-white truncate">{username}</p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-rose-450 hover:bg-rose-500/10 hover:text-rose-400 font-semibold transition"
            >
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
