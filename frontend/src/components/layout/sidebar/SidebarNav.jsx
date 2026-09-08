import React from 'react';
import { useSelector } from 'react-redux';
import SidebarNavItem from './SidebarNavItem';
import {
  navigationSections,
  customerNavigationSections,
  salesRepNavigationSections,
  warehouseManagerNavigationSections,
  storeKeeperNavigationSections,
  driverNavigationSections,
} from './navigationData';

export default function SidebarNav({ onClose }) {
  const { permissions = [], role } = useSelector((state) => state.auth);

  const isCustomer = role === 'CUSTOMER';
  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const isSalesRep = role === 'SALES_REPRESENTATIVE' || role === 'SALES_REP';
  const isWhManager = role === 'WAREHOUSE_MANAGER' || role === 'WH_MANAGER';
  const isStoreKeeper = role === 'STORE_KEEPER' || role === 'STOREKEEPER';
  const isDriver = role === 'DRIVER';

  const hasWildcard =
    isSuperAdmin ||
    permissions.includes('*') ||
    permissions.includes('all') ||
    permissions.includes('system:all');

  const handleItemClick = () => {
    if (onClose) onClose();
  };

  const sectionsToRender = isCustomer
    ? customerNavigationSections
    : isSalesRep
    ? salesRepNavigationSections
    : isWhManager
    ? warehouseManagerNavigationSections
    : isStoreKeeper
    ? storeKeeperNavigationSections
    : isDriver
    ? driverNavigationSections
    : navigationSections;

  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin space-y-5">
      {/* Navigation Sections */}
      {sectionsToRender.map((section) => {
        let visibleItems = section.items.filter((item) => {
          if (isCustomer && item.href === '/customers') return false;
          if (!item.permission) return true;
          if (hasWildcard) return true;
          const required = Array.isArray(item.permission) ? item.permission : [item.permission];
          return required.some((p) => permissions.includes(p));
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={section.title} className="space-y-0.5">
            <h3 className="px-3 mb-2 text-[11px] font-bold tracking-widest sidebar-section-label uppercase">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {visibleItems.map((item) => {
                let displayName = item.name;

                if (item.href === '/sales-orders') {
                  if (isSalesRep) {
                    displayName = 'Sales Orders';
                  } else if (isWhManager) {
                    displayName = 'Preparation Queue';
                  } else if (isStoreKeeper) {
                    displayName = 'Preparation Tasks';
                  } else if (isSuperAdmin) {
                    displayName = 'Sales Orders';
                  }
                } else if (item.href === '/deliveries') {
                  if (isDriver) {
                    displayName = 'My Deliveries';
                  }
                }

                return (
                  <SidebarNavItem
                    key={item.name}
                    item={{ ...item, name: displayName }}
                    onClick={() => handleItemClick(item)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

