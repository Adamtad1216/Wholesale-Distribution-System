import React from 'react';
import { useSelector } from 'react-redux';

export default function StockBadge({ product, warehouseId, className = '' }) {
  const { role, customer, permissions = [] } = useSelector((state) => state.auth);

  // Staff (Super Admin, Admin, Sales Reps, Managers, Inventory staff) can see stock counts
  const isStaff =
    !customer &&
    (role === 'SUPER_ADMIN' ||
      role === 'ADMIN' ||
      role === 'SALES_REP' ||
      role === 'SALES_REPRESENTATIVE' ||
      role === 'STAFF' ||
      role === 'MANAGER' ||
      permissions.includes('*') ||
      permissions.includes('all') ||
      permissions.includes('system:all') ||
      permissions.includes('inventory:read') ||
      permissions.includes('stock:read') ||
      permissions.includes('sales:orders:create'));

  const stock = warehouseId
    ? product?.warehouseStocks?.find((s) => s.warehouseId === warehouseId)
    : product?.warehouseStocks?.[0];
  const available = stock ? Number(stock.availableQuantity) : null;

  // Customers should NOT see warehouse stock quantities
  if (!isStaff) {
    if (available !== null && available <= 0) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 backdrop-blur-md text-rose-400 border border-rose-500/30 shadow-sm ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
          Out of stock
        </span>
      );
    }
    // For in-stock items, do not show "100 in stock" or any number for customers
    return null;
  }

  // For staff: display the exact stock levels
  if (available === null) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/80 backdrop-blur-md text-muted-foreground border border-border/80 ${className}`}
      >
        Stock unlisted
      </span>
    );
  }

  if (available <= 0) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 backdrop-blur-md text-rose-400 border border-rose-500/30 shadow-sm ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
        Out of stock
      </span>
    );
  }

  if (available < 10) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 backdrop-blur-md text-amber-400 border border-amber-500/30 shadow-sm ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Only {available} left
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 backdrop-blur-md text-emerald-400 border border-emerald-500/30 shadow-sm ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      {available} in stock
    </span>
  );
}
