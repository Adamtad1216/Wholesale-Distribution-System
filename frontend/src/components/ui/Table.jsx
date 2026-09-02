import React from 'react';

/**
 * Reusable Table Component System
 */

export default function Table({ children, className = '', containerClassName = '' }) {
  return (
    <div className={`bg-slate-900/60 border border-slate-800 backdrop-blur-xl rounded-lg overflow-hidden ui-table-container ${containerClassName}`}>
      <div className="overflow-x-auto">
        <table className={`w-full text-left text-sm text-slate-300 ${className}`}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function TableHeader({ children, className = '' }) {
  return (
    <thead className={`bg-slate-800/50 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800 ui-table-header ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }) {
  return (
    <tbody className={`divide-y divide-slate-800/60 ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-slate-800/30 transition ${onClick ? 'cursor-pointer' : ''} ${className}`}
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

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-6 py-4 text-slate-300 ${className}`}>
      {children}
    </td>
  );
}
