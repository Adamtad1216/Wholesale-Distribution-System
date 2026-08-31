import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';

// Layout
import MainLayout from '../layouts/MainLayout';

// Auth guards
import ProtectedRoute from '../routes/ProtectedRoute';

// Hooks
import { useTokenExpiry } from '../hooks/useTokenExpiry';

// Public pages
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';

// Protected pages
import Dashboard from '../features/dashboard/pages/Dashboard';
import Customers from '../features/customers/pages/Customers';
import Documents from '../features/documents/pages/Documents';
import Payments from '../features/payments/pages/Payments';

/**
 * AppRoutes — inner component mounted inside <Router>.
 * useTokenExpiry must be called here (not in App) because
 * it uses useNavigate which requires the Router context.
 */
function AppRoutes() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Auto-logout when the JWT access token expires
  useTokenExpiry();

  return (
    <Routes>
      {/* ── Public Routes ─────────────────────────────────────── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ── Protected App Shell (auth required) ───────────────── */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard — available to all authenticated users */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* TODO: wrap with <PermissionRoute> once permissions are wired */}
        <Route path="/customers" element={<Customers />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/payments" element={<Payments />} />

        {/* Default redirect inside the shell */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* ── Global Fallbacks ──────────────────────────────────── */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #1e293b',
            borderRadius: '12px',
          },
          duration: 4000,
        }}
      />
      <AppRoutes />
    </Router>
  );
}

export default App;
