import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePermission } from '../hooks/usePermission';

function AccessDenied({ permission }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-rose-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 10c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.249-8.25-3.286z"
          />
        </svg>
      </div>

      <span className="px-3 py-1 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full mb-4 uppercase tracking-wider">
        Access Denied
      </span>

      <h2 className="text-2xl font-extrabold  mb-2">
        You don't have permission
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        Your account does not have the{' '}
        {permission ? (
          <code className="px-1.5 py-0.5 bg-muted800 text-violet-400 rounded text-xs font-mono">
            {Array.isArray(permission) ? permission.join(', ') : permission}
          </code>
        ) : (
          'required'
        )}{' '}
        permission to view this page. Contact your administrator if you believe this is an error.
      </p>

      <button
        onClick={() => window.history.back()}
        className="mt-8 px-5 py-2.5 rounded-xl bg-muted800 hover:bg-muted700 border border-border text-sm font-semibold text-foreground transition"
      >
        ← Go Back
      </button>
    </div>
  );
}

export default function PermissionRoute({ permission, mode = 'any', roles, redirectTo }) {
  const { isAuthenticated, role: userRole } = useSelector((state) => state.auth);
  const location = useLocation();
  const { can } = usePermission(permission, mode);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(userRole)) {
      if (redirectTo) return <Navigate to={redirectTo} replace />;
      return <AccessDenied permission={permission} />;
    }
  }

  if (!can) {
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    return <AccessDenied permission={permission} />;
  }

  return <Outlet />;
}
