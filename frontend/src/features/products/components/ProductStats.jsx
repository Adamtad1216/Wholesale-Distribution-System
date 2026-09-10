import React from 'react';
import Card from '../../../components/ui/Card';

export default function ProductStats({
  totalProducts = 0,
  activeProducts = 0,
  totalCategories = 0,
  totalBrands = 0,
  loading = false,
}) {
  const stats = [
    {
      label: 'Total Products',
      value: totalProducts,
      icon: (
        <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      bgClass: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    },
    {
      label: 'Active in Catalog',
      value: activeProducts,
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      label: 'Categories',
      value: totalCategories,
      icon: (
        <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
      bgClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    },
    {
      label: 'Brands / Makers',
      value: totalBrands,
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((item, idx) => (
        <Card key={idx} hoverEffect className="relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-normal text-muted-foreground tracking-wide uppercase">
                {item.label}
              </p>
              <h3 className="text-2xl font-normal text-foreground mt-1 tracking-tight">
                {loading ? '...' : item.value.toLocaleString()}
              </h3>
            </div>
            <div className={`p-3 rounded-xl border ${item.bgClass}`}>
              {item.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
