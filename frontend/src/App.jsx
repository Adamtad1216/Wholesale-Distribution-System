import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';

// Layout
import MainLayout from './layouts/MainLayout';

// Auth guards
import ProtectedRoute from './routes/ProtectedRoute';
import PermissionRoute from './routes/PermissionRoute';

// Hooks
import { useTokenExpiry } from './hooks/useTokenExpiry';

// Public pages
import Login from './features/auth/pages/login/Login';
import Register from './features/auth/pages/register/Register';

// Auth API & Slice
import { authApi } from './features/auth/authApi';
import { setProfile } from './features/auth/authSlice';

// Protected pages
import Dashboard from './features/dashboard/pages/dashboard/Dashboard';
import ProfilePage from './features/auth/pages/profile/ProfilePage';
import UsersPage from './features/users/pages/UsersPage';
import RolesJobSpecsMainPage from './features/roles-job-specifications/pages/RolesJobSpecsMainPage';
import PermissionsPage from './features/permissions/pages/permissions/PermissionsPage';
import EmployeesPage from './features/employees/pages/EmployeesPage';
import BranchesPage from './features/branches/pages/branches/BranchesPage';
import CompaniesPage from './features/companies/pages/CompaniesPage';
import Customers from './features/customers/pages/Customers';
import ProductsPage from './features/products/pages/ProductsPage';
import ProductFormPage from './features/products/pages/ProductFormPage';
import ProductDetailPage from './features/products/pages/ProductDetailPage';
import CategoriesPage from './features/products/pages/CategoriesPage';
import BrandsPage from './features/products/pages/BrandsPage';
import UnitsPage from './features/products/pages/UnitsPage';
import Documents from './features/documents/pages/Documents';
import Payments from './features/payments/pages/payments/Payments';
import NewSalesOrder from './features/sales-orders/pages/NewSalesOrder';
import MySalesOrders from './features/sales-orders/pages/MySalesOrders';
import SalesOrderDetail from './features/sales-orders/pages/SalesOrderDetail';

// Inventory & Operations
import InventoryPage from './features/inventory/pages/InventoryPage';
import StockDetailPage from './features/inventory/pages/StockDetailPage';
import TransferDetailPage from './features/inventory/pages/TransferDetailPage';
import AdjustmentDetailPage from './features/inventory/pages/AdjustmentDetailPage';
import ReservationDetailPage from './features/inventory/pages/ReservationDetailPage';

/**
 * AppRoutes — inner component mounted inside <Router>.
 * useTokenExpiry must be called here (not in App) because
 * it uses useNavigate which requires the Router context.
 */
function AppRoutes() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Auto-logout when the JWT access token expires
  useTokenExpiry();

  // Sync profile and permissions upon login/mount
  React.useEffect(() => {
    if (isAuthenticated) {
      authApi.getProfile()
        .then((res) => {
          const profileData = res?.data || res;
          if (profileData) {
            dispatch(setProfile(profileData));
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, dispatch]);

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
        {/* Dashboard & Profile — available to all authenticated users */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Phase 1 Identity & Access Permission-gated routes */}
        <Route element={<PermissionRoute permission="users:read" />}>
          <Route path="/users" element={<UsersPage />} />
        </Route>

        <Route element={<PermissionRoute permission="roles:read" />}>
          <Route path="/roles" element={<RolesJobSpecsMainPage />} />
        </Route>

        <Route element={<PermissionRoute permission="permissions:read" />}>
          <Route path="/permissions" element={<PermissionsPage />} />
        </Route>

        <Route element={<PermissionRoute permission="employees:read" />}>
          <Route path="/employees" element={<EmployeesPage />} />
        </Route>

        {/* Module 06: Facilities & Corporate Structure */}
        <Route element={<PermissionRoute permission="branches:read" />}>
          <Route path="/branches" element={<BranchesPage />} />
        </Route>
        <Route element={<PermissionRoute permission="companies:read" />}>
          <Route path="/companies" element={<CompaniesPage />} />
        </Route>

        {/* Other module routes */}
        <Route element={<PermissionRoute permission="customers:read" />}>
          <Route path="/customers" element={<Customers />} />
        </Route>

        <Route element={<PermissionRoute permission="products:read" />}>
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/new" element={<ProductFormPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/products/:id/edit" element={<ProductFormPage />} />
          <Route path="/product-catalog" element={<ProductsPage />} />
          <Route path="/product-catalog/new" element={<ProductFormPage />} />
          <Route path="/product-catalog/:id" element={<ProductDetailPage />} />
          <Route path="/product-catalog/:id/edit" element={<ProductFormPage />} />
        </Route>

        {/* Inventory Management & Detail Pages */}
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/stocks/:id" element={<StockDetailPage />} />
        <Route path="/inventory/transfers/:id" element={<TransferDetailPage />} />
        <Route path="/inventory/adjustments/:id" element={<AdjustmentDetailPage />} />
        <Route path="/inventory/reservations/:id" element={<ReservationDetailPage />} />

        <Route element={<PermissionRoute permission="categories:read" />}>
          <Route path="/categories" element={<CategoriesPage />} />
        </Route>

        <Route element={<PermissionRoute permission="units:read" />}>
          <Route path="/units" element={<UnitsPage />} />
        </Route>

        <Route element={<PermissionRoute permission="brands:read" />}>
          <Route path="/brands" element={<BrandsPage />} />
        </Route>

        <Route element={<PermissionRoute permission="documents:read" />}>
          <Route path="/documents" element={<Documents />} />
        </Route>

        <Route element={<PermissionRoute permission="payments:read" />}>
          <Route path="/payments" element={<Payments />} />
        </Route>

        <Route path="/sales-orders/new" element={<NewSalesOrder />} />
        <Route path="/sales-orders" element={<MySalesOrders />} />
        <Route path="/sales-orders/:id" element={<SalesOrderDetail />} />

        {/* Default redirect inside the shell */}
        <Route index element={<Navigate to="/dashboard" replace />} />
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
