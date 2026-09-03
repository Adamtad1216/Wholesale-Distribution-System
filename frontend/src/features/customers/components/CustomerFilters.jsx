import React from 'react';
import Card from '../../../components/ui/Card';

export default function CustomerFilters({
  search,
  setSearch,
  customerTypeFilter,
  setCustomerTypeFilter,
  statusFilter,
  setStatusFilter,
  setPage,
  fetchCustomers,
}) {
  return (
    <Card noPadding className="p-4 border border-border bg-card900 backdrop-blur-xl rounded-2xl flex flex-col md:flex-row items-center gap-4">
      {/* Search input */}
      <div className="relative flex-1 w-full">
        <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by customer code, name, email, or phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-10 pr-10 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500 placeholder:text-muted-foreground transition"
        />
        {search && (
          <button
            onClick={() => { setSearch(''); setPage(1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Customer Type Filter */}
      <div className="w-full md:w-48">
        <select
          value={customerTypeFilter}
          onChange={(e) => { setCustomerTypeFilter(e.target.value); setPage(1); }}
          className="w-full px-3 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
        >
          <option value="">All Customer Types</option>
          <option value="ORGANIZATION">Organization / Corporate</option>
          <option value="PERSON">Individual / Person</option>
        </select>
      </div>

      {/* Status Filter */}
      <div className="w-full md:w-40">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="w-full px-3 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Refresh button */}
      <button
        onClick={fetchCustomers}
        title="Refresh List"
        className="w-full md:w-auto px-4 py-2.5 bg-muted800 hover:bg-muted700 active:scale-95 border border-border rounded-xl text-foreground hover: font-semibold text-sm flex items-center justify-center gap-2 transition shadow-sm shrink-0"
      >
        <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Refresh</span>
      </button>
    </Card>
  );
}
