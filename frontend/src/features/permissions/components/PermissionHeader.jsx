import React from 'react';
import Card from '../../../components/ui/Card';

export default function PermissionHeader({
  viewMode,
  setViewMode,
  totalRoles,
  totalPermissions,
  totalModules,
  search,
  setSearch,
  selectedModule,
  setSelectedModule,
  selectedRoleFilter,
  setSelectedRoleFilter,
  modulesList,
  rolesList,
}) {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Permissions Matrix</h1>
              <p className="text-sm text-muted-foreground">
                Manage access rights, module authorizations, and security roles across the system.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-card p-1.5 border border-border rounded-xl">
          <button
            onClick={() => setViewMode('MATRIX')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              viewMode === 'MATRIX'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Matrix Grid View
          </button>
          <button
            onClick={() => setViewMode('DIRECTORY')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              viewMode === 'DIRECTORY'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Key Directory View
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between border border-border rounded-xl bg-card">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Modules</p>
            <h3 className="text-xl font-bold text-foreground mt-1">{totalModules} Active Modules</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm">
            {totalModules}
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border border-border rounded-xl bg-card">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Configured Roles</p>
            <h3 className="text-xl font-bold text-foreground mt-1">{totalRoles} System Roles</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
            {totalRoles}
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border border-border rounded-xl bg-card">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Permission Keys</p>
            <h3 className="text-xl font-bold text-foreground mt-1">{totalPermissions} Keys Defined</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
            {totalPermissions}
          </div>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <Card noPadding className="p-4 flex flex-col md:flex-row items-center gap-4 rounded-xl bg-card border border-border">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <svg
            className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search permissions by name, key, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-emerald-500 placeholder:text-muted-foreground"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter by Module */}
        <div className="w-full md:w-56">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-emerald-500"
          >
            {modulesList.map((mod) => (
              <option key={mod} value={mod}>
                {mod === 'ALL' ? 'Filter: All Modules' : `Module: ${mod.toUpperCase()}`}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Role (Matrix View) */}
        {viewMode === 'MATRIX' && (
          <div className="w-full md:w-56">
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Filter: All Roles</option>
              {rolesList.map((role) => (
                <option key={role.id} value={role.id}>
                  Role: {role.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </Card>
    </div>
  );
}
