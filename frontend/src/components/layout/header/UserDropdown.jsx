import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logout } from '../../../features/auth/authSlice';

export default function UserDropdown() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleProfile = () => {
    setDropdownOpen(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const person = user?.person || {};
  const avatarUrl = person.avatarUrl || user?.avatarUrl;
  const firstName = person.firstName;
  const lastName = person.lastName;
  const displayName = firstName ? `${firstName} ${lastName || ''}`.trim() : (user?.username || 'User');
  const initials = firstName
    ? `${firstName[0]}${lastName ? lastName[0] : ''}`.toUpperCase()
    : (user?.username ? user.username[0].toUpperCase() : 'U');

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2.5 focus:outline-none p-1 rounded-xl border border-transparent transition cursor-pointer user-dropdown-trigger"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-lg object-cover border border-violet-500/30 shadow-md"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {initials}
          </div>
        )}
        <span className="hidden md:inline text-sm font-semibold user-dropdown-title">
          {displayName}
        </span>
        <svg
          className={`w-4 h-4 user-dropdown-subtitle transition-transform duration-200 ${
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
        <div className="absolute right-0 mt-2 w-52 rounded-xl border backdrop-blur-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150 user-dropdown-menu">
          <div className="px-4 py-2.5 border-b user-dropdown-header flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-9 h-9 rounded-lg object-cover border border-violet-500/30"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                {initials}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs user-dropdown-subtitle">Signed in as</p>
              <p className="text-sm font-bold truncate user-dropdown-title">{displayName}</p>
            </div>
          </div>

          <button
            onClick={handleProfile}
            className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm font-medium transition cursor-pointer user-dropdown-item"
          >
            <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </button>

          <div className="border-t user-dropdown-divider my-1" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm font-medium transition cursor-pointer user-dropdown-item"
          >
            <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
