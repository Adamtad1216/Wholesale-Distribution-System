import React from 'react';
import { useEmployees } from '../hooks/useEmployees';
import EmployeeHeader from '../components/EmployeeHeader';
import EmployeeStats from '../components/EmployeeStats';
import EmployeeFilters from '../components/EmployeeFilters';
import EmployeeListTable from '../components/EmployeeListTable';
import EmployeeFormView from '../components/EmployeeFormView';
import EmployeeDetailView from '../components/EmployeeDetailView';

export default function EmployeesPage() {
  const {
    employees,
    jobSpecifications,
    branches,
    systemRoles,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    viewMode,
    editingEmployee,
    canCreate,
    canUpdate,
    canDelete,
    formData,
    setFormData,
    submitting,
    stats,
    fetchEmployees,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleBackToList,
    handleSubmit,
    handleDelete,
    getEmployeeName,
    getEmployeeEmail,
    getEmployeePhone,
    isSelfSuperAdminEmployee,
  } = useEmployees();

  // ═════════════════════════════════════════════════════════════════
  // RENDER: CREATE / EDIT FULL PAGE VIEW
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'CREATE' || viewMode === 'EDIT') {
    return (
      <EmployeeFormView
        viewMode={viewMode}
        editingEmployee={editingEmployee}
        formData={formData}
        setFormData={setFormData}
        submitting={submitting}
        handleSubmit={handleSubmit}
        handleBackToList={handleBackToList}
        getEmployeeName={getEmployeeName}
        jobSpecifications={jobSpecifications}
        branches={branches}
        systemRoles={systemRoles}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER: VIEW EMPLOYEE DETAILS FULL PAGE VIEW
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'DETAIL' && editingEmployee) {
    return (
      <EmployeeDetailView
        selectedEmployee={editingEmployee}
        handleBackToList={handleBackToList}
        handleOpenEdit={handleOpenEdit}
        handleDelete={handleDelete}
        canUpdate={canUpdate}
        canDelete={canDelete}
        getEmployeeName={getEmployeeName}
        getEmployeeEmail={getEmployeeEmail}
        getEmployeePhone={getEmployeePhone}
        isSelfSuperAdminEmployee={isSelfSuperAdminEmployee}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER: DEFAULT EMPLOYEE DIRECTORY LIST
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <EmployeeHeader
        canCreate={canCreate}
        onAddEmployee={handleOpenCreate}
      />

      {/* Summary KPI Cards */}
      <EmployeeStats stats={stats} />

      {/* Filter and Search Bar */}
      <EmployeeFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        fetchEmployees={fetchEmployees}
      />

      {/* Employees Table */}
      <EmployeeListTable
        employees={employees}
        loading={loading}
        search={search}
        handleOpenDetail={handleOpenDetail}
        handleOpenEdit={handleOpenEdit}
        handleDelete={handleDelete}
        canUpdate={canUpdate}
        canDelete={canDelete}
        getEmployeeName={getEmployeeName}
        getEmployeeEmail={getEmployeeEmail}
        getEmployeePhone={getEmployeePhone}
        isSelfSuperAdminEmployee={isSelfSuperAdminEmployee}
      />
    </div>
  );
}
