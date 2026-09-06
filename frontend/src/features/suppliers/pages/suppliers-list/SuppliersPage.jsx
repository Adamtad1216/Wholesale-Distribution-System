import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuppliers } from './hooks/useSuppliers';
import SuppliersHeader from './components/SuppliersHeader';
import SuppliersStats from './components/SuppliersStats';
import SuppliersToolbar from './components/SuppliersToolbar';
import SuppliersTable from './components/SuppliersTable';

export default function SuppliersPage() {
  const navigate = useNavigate();
  const {
    filteredSuppliers,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    totalSuppliers,
    activeSuppliers,
    totalSpentETB,
    handleArchive,
  } = useSuppliers();

  return (
    <div className="p-6 space-y-6 relative min-h-[calc(100vh-100px)]">
      {/* Title & Banner Header */}
      <SuppliersHeader onRegisterNew={() => navigate('/suppliers/new')} />

      {/* Quick KPI Stat Cards */}
      <SuppliersStats
        totalSuppliers={totalSuppliers}
        activeSuppliers={activeSuppliers}
        totalSpentETB={totalSpentETB}
      />

      {/* Toolbar: Search & Filter */}
      <SuppliersToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Suppliers Table */}
      <SuppliersTable
        suppliers={filteredSuppliers}
        loading={loading}
        onView={(id) => navigate(`/suppliers/${id}`)}
        onEdit={(id) => navigate(`/suppliers/${id}/edit`)}
        onArchive={handleArchive}
      />
    </div>
  );
}
