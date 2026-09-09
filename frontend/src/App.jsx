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
import AcceptInvitation from './features/auth/pages/invitation/AcceptInvitation';

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
import Customers from './features/customers/pages/Customers';
import Documents from './features/documents/pages/Documents';
import Checkout from './features/payments/pages/checkout/Checkout';
import Receipt from './features/payments/pages/receipt/Receipt';
import FinanceDashboard from './features/finance/pages/FinanceDashboard';
import PaymentOptionsPage from './features/finance/components/payment-tab/PaymentOptionsPage';
import ProcurementDashboard from './features/procurement/pages/procurement-dashboard/ProcurementDashboard';
import PurchaseOrderCartPage from './features/procurement/pages/purchase-order-cart/PurchaseOrderCartPage';
import PurchaseOrderDetailPage from './features/procurement/pages/purchase-order-detail/PurchaseOrderDetailPage';
import RecordGoodsReceiptPage from './features/procurement/pages/record-goods-receipt/RecordGoodsReceiptPage';
import GoodsReceiptDetailPage from './features/procurement/pages/goods-receipt-detail/GoodsReceiptDetailPage';
import SettleSupplierPaymentPage from './features/procurement/pages/settle-supplier-payment/SettleSupplierPaymentPage';
import TransferReceiptPage from './features/procurement/pages/transfer-receipt/TransferReceiptPage';
import SuppliersPage from './features/suppliers/pages/suppliers-list/SuppliersPage';
import SupplierDetailPage from './features/suppliers/pages/supplier-detail/SupplierDetailPage';
import NewSupplierPage from './features/suppliers/pages/new-supplier/NewSupplierPage';
import NewSalesOrder from './features/sales-orders/pages/NewSalesOrder';
import MySalesOrders from './features/sales-orders/pages/MySalesOrders';
import SalesOrderDetail from './features/sales-orders/pages/SalesOrderDetail';
import SchedulePreparationPage from './features/sales-orders/pages/SchedulePreparationPage';

import DeliveriesPage from './features/deliveries/pages/DeliveriesPage';
import VehiclesListPage from './features/vehicles/pages/VehiclesListPage';
import VehicleFormPage from './features/vehicles/pages/VehicleFormPage';
import VehicleDetailPage from './features/vehicles/pages/VehicleDetailPage';
import PricingHubPage from './features/pricing/pages/PricingHubPage';
import PriceTiersListPage from './features/pricing/pages/PriceTiersListPage';
import PriceTierFormPage from './features/pricing/pages/PriceTierFormPage';
import ProductPricesListPage from './features/pricing/pages/ProductPricesListPage';
import ProductPriceFormPage from './features/pricing/pages/ProductPriceFormPage';
import CustomerPricingPage from './features/pricing/pages/CustomerPricingPage';
import AssignCustomerTierPage from './features/pricing/pages/AssignCustomerTierPage';
import DiscountRulesListPage from './features/pricing/pages/DiscountRulesListPage';
import DiscountRuleFormPage from './features/pricing/pages/DiscountRuleFormPage';
import SalesQuotasListPage from './features/pricing/pages/SalesQuotasListPage';
import SalesQuotaFormPage from './features/pricing/pages/SalesQuotaFormPage';

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
      <Route path="/accept-invitation" element={<AcceptInvitation />} />

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

        <Route element={<PermissionRoute permission="branches:read" />}>
          <Route path="/branches" element={<BranchesPage />} />
        </Route>

        {/* Customer management route */}
        <Route element={<PermissionRoute permission="customers:read" />}>
          <Route path="/customers" element={<Customers />} />
        </Route>

        <Route element={<PermissionRoute permission="documents:read" />}>
          <Route path="/documents" element={<Documents />} />
        </Route>

        <Route element={<PermissionRoute permission={['payments:read', 'payments:read_all', 'invoices:read', 'invoices:read_all', 'credits:read', 'credits:read_all', 'payment-terms:read', 'payment-terms:read_all']} />}>
          <Route path="/finance" element={<FinanceDashboard />} />
        </Route>

        <Route element={<PermissionRoute permission="deliveries:read" />}>
          <Route path="/deliveries" element={<DeliveriesPage />} />
        </Route>

        <Route element={<PermissionRoute permission="vehicles:read" />}>
          <Route path="/vehicles" element={<VehiclesListPage />} />
          <Route path="/vehicles/new" element={<VehicleFormPage />} />
          <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="/vehicles/:id/edit" element={<VehicleFormPage />} />
        </Route>

        <Route element={<PermissionRoute permission={['PRICE_TIER_VIEW', 'PRODUCT_PRICE_VIEW', 'DISCOUNT_VIEW', 'QUOTA_VIEW']} />}>
          <Route path="/pricing" element={<Navigate to="/pricing/tiers" replace />} />
          <Route path="/pricing/tiers" element={<PriceTiersListPage />} />
          <Route path="/pricing/tiers/new" element={<PriceTierFormPage />} />
          <Route path="/pricing/tiers/:id/edit" element={<PriceTierFormPage />} />
          <Route path="/pricing/product-prices" element={<ProductPricesListPage />} />
          <Route path="/pricing/product-prices/new" element={<ProductPriceFormPage />} />
          <Route path="/pricing/product-prices/:id/edit" element={<ProductPriceFormPage />} />
          <Route path="/pricing/customer-pricing" element={<CustomerPricingPage />} />
          <Route path="/pricing/customers" element={<CustomerPricingPage />} />
          <Route path="/pricing/customers/price-tier" element={<AssignCustomerTierPage />} />
          <Route path="/pricing/discounts" element={<DiscountRulesListPage />} />
          <Route path="/pricing/discounts/new" element={<DiscountRuleFormPage />} />
          <Route path="/pricing/discounts/:id/edit" element={<DiscountRuleFormPage />} />
          <Route path="/pricing/quotas" element={<SalesQuotasListPage />} />
          <Route path="/pricing/quotas/new" element={<SalesQuotaFormPage />} />
          <Route path="/pricing/quotas/:id/edit" element={<SalesQuotaFormPage />} />
        </Route>

        <Route path="/catalog" element={<Navigate to="/sales-orders/new" replace />} />

        <Route element={<PermissionRoute permission={['payment-options:manage', 'payment-option:manage', 'payment-options:read', 'payment-option:read', 'payments:update', 'payments:read_all', 'payment:read_all']} />}>
          <Route path="/finance/payment-options" element={<PaymentOptionsPage />} />
        </Route>

        <Route path="/procurement" element={<ProcurementDashboard />} />
        <Route path="/procurement/cart" element={<PurchaseOrderCartPage />} />
        <Route path="/procurement/orders/:id" element={<PurchaseOrderDetailPage />} />
        <Route path="/procurement/receipts/new" element={<RecordGoodsReceiptPage />} />
        <Route path="/procurement/receipts/:id" element={<GoodsReceiptDetailPage />} />
        <Route path="/procurement/receipts/:id/settle" element={<SettleSupplierPaymentPage />} />
        <Route path="/procurement/receipts/:id/transfer-receipt" element={<TransferReceiptPage />} />
        <Route path="/procurement/transfer-receipt" element={<TransferReceiptPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/suppliers/new" element={<NewSupplierPage />} />
        <Route path="/suppliers/:id/edit" element={<NewSupplierPage />} />
        <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
        <Route path="/sales-orders/new" element={<NewSalesOrder />} />
        <Route path="/sales-orders" element={<MySalesOrders />} />
        <Route path="/sales-orders/:id/schedule-preparation" element={<SchedulePreparationPage />} />
        <Route path="/sales-orders/:id" element={<SalesOrderDetail />} />
        <Route path="/checkout/:id" element={<Checkout />} />
        <Route path="/receipt" element={<Receipt />} />

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
