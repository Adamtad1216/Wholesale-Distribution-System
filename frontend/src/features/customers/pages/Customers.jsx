import React from 'react';
import { useCustomers } from '../hooks/useCustomers';
import CustomerHeader from '../components/CustomerHeader';
import CustomerStats from '../components/CustomerStats';
import CustomerFilters from '../components/CustomerFilters';
import CustomerListTable from '../components/CustomerListTable';
import CustomerFormView from '../components/CustomerFormView';
import CustomerDetailView from '../components/CustomerDetailView';

export default function Customers() {
  const {
    customers,
    meta,
    loading,
    paymentTerms,
    search,
    setSearch,
    customerTypeFilter,
    setCustomerTypeFilter,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    limit,
    setLimit,
    viewMode,
    selectedCustomer,
    canCreate,
    canUpdate,
    canDelete,
    formData,
    setFormData,
    submitting,
    stats,
    fetchCustomers,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleBackToList,
    handleDeleteCustomer,
    handleSubmit,
    getCustomerDisplayName,
    getCustomerEmail,
    getCustomerPhone,
    formatCurrency,
  } = useCustomers();

  // ═════════════════════════════════════════════════════════════════
  // RENDER: CREATE / EDIT FULL PAGE VIEW
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'CREATE' || viewMode === 'EDIT') {
    return (
      <CustomerFormView
        viewMode={viewMode}
        selectedCustomer={selectedCustomer}
        formData={formData}
        setFormData={setFormData}
        submitting={submitting}
        paymentTerms={paymentTerms}
        handleSubmit={handleSubmit}
        handleBackToList={handleBackToList}
        getCustomerDisplayName={getCustomerDisplayName}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER: VIEW CUSTOMER DETAILS FULL PAGE VIEW
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'DETAIL' && selectedCustomer) {
    return (
      <CustomerDetailView
        selectedCustomer={selectedCustomer}
        handleBackToList={handleBackToList}
        handleOpenEdit={handleOpenEdit}
        handleDeleteCustomer={handleDeleteCustomer}
        canUpdate={canUpdate}
        canDelete={canDelete}
        getCustomerDisplayName={getCustomerDisplayName}
        getCustomerEmail={getCustomerEmail}
        getCustomerPhone={getCustomerPhone}
        formatCurrency={formatCurrency}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER: DEFAULT CUSTOMER DIRECTORY LIST
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <CustomerHeader
        canCreate={canCreate}
        onAddCustomer={handleOpenCreate}
      />

      {/* Summary KPI Cards */}
      <CustomerStats
        stats={stats}
        formatCurrency={formatCurrency}
      />

      {/* Filter and Search Bar */}
      <CustomerFilters
        search={search}
        setSearch={setSearch}
        customerTypeFilter={customerTypeFilter}
        setCustomerTypeFilter={setCustomerTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        setPage={setPage}
        fetchCustomers={fetchCustomers}
      />

      {/* Customers Table */}
      <CustomerListTable
        customers={customers}
        loading={loading}
        meta={meta}
        page={page}
        limit={limit}
        setPage={setPage}
        setLimit={setLimit}
        handleOpenDetail={handleOpenDetail}
        handleOpenEdit={handleOpenEdit}
        handleDeleteCustomer={handleDeleteCustomer}
        canUpdate={canUpdate}
        canDelete={canDelete}
        search={search}
        customerTypeFilter={customerTypeFilter}
        statusFilter={statusFilter}
        getCustomerDisplayName={getCustomerDisplayName}
        getCustomerEmail={getCustomerEmail}
        getCustomerPhone={getCustomerPhone}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
