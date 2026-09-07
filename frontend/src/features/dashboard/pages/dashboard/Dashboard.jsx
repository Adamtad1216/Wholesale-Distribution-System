import React from 'react';
import { useSelector } from 'react-redux';
import SalesRepDashboard from '../../components/SalesRepDashboard';
import CustomerDashboard from '../../components/CustomerDashboard';
import AdminDashboard from '../../components/AdminDashboard';
import WarehouseManagerDashboard from '../../components/WarehouseManagerDashboard';
import StoreKeeperDashboard from '../../components/StoreKeeperDashboard';
import DriverDashboard from '../../components/DriverDashboard';

export default function Dashboard() {
  const { user, role, customer } = useSelector((state) => state.auth);

  // Check role types
  const isWhManager =
    role === 'WAREHOUSE_MANAGER' ||
    role === 'WH_MANAGER';

  const isStoreKeeper =
    role === 'STORE_KEEPER' ||
    role === 'STOREKEEPER';

  const isDriver =
    role === 'DRIVER';

  const isSalesRep =
    role === 'SALES_REPRESENTATIVE' ||
    role === 'SALES_REP' ||
    Boolean(user?.person?.employee?.isAvailableForSales);

  const isCustomer =
    role === 'CUSTOMER' ||
    Boolean(customer) ||
    Boolean(user?.person?.customers?.length);

  if (isWhManager) {
    return <WarehouseManagerDashboard />;
  }

  if (isStoreKeeper) {
    return <StoreKeeperDashboard />;
  }

  if (isDriver) {
    return <DriverDashboard />;
  }

  if (isSalesRep) {
    return <SalesRepDashboard />;
  }

  if (isCustomer) {
    return <CustomerDashboard />;
  }

  // Default to Admin / Executive Dashboard
  return <AdminDashboard />;
}

