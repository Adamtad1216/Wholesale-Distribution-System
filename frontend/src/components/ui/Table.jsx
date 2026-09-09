import React from 'react';

/**
 * Reusable Table Component System
 */

export default function Table({ children, className = '', containerClassName = '' }) {
  return (
    <div className={`bg-card border border-border rounded-xl overflow-hidden ui-table-container shadow-sm ${containerClassName}`}>
      <div className="overflow-x-auto">
        <table className={`w-full text-left text-sm text-foreground ${className}`}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function TableHeader({ children, className = '' }) {
  return (
    <thead className={`bg-muted/40 text-muted-foreground uppercase text-xs tracking-wider border-b border-border ui-table-header ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }) {
  return (
    <tbody className={`divide-y divide-border ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-muted/30 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '' }) {
  return (
    <th className={`px-6 py-4 font-semibold ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', colSpan, ...props }) {
  return (
    <td colSpan={colSpan} className={`px-6 py-4 text-foreground ${className}`} {...props}>
      {children}
    </td>
  );
}
