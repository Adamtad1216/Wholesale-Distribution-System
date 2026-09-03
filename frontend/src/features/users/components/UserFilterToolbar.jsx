import React from 'react';
import Card from '../../../components/ui/Card';

export default function UserFilterToolbar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  roleFilter,
  setRoleFilter,
  rolesList,
  totalUsers,
}) {
  return (
    <Card className="p-4 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-sm">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <svg
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search users by name, username, or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500 placeholder:text-muted-foreground transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs font-semibold focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Users</option>
            <option value="INACTIVE">Inactive Users</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs font-semibold focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All System Roles</option>
            {rolesList.map((role) => (
              <option key={role.id} value={role.name}>
                Role: {role.name}
              </option>
            ))}
          </select>

          <div className="text-xs font-semibold text-muted-foreground whitespace-nowrap pl-2 border-l border-border hidden sm:block">
            Total: <span className="text-foreground">{totalUsers}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
