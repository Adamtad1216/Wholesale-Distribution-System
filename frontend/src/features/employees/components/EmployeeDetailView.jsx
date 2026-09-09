import React, { useState } from 'react';
import EmployeeDetailHeader from './detail/EmployeeDetailHeader.jsx';
import EmployeeDetailHero from './detail/EmployeeDetailHero.jsx';
import EmployeeDetailKpis from './detail/EmployeeDetailKpis.jsx';
import EmployeeDetailTabs from './detail/EmployeeDetailTabs.jsx';
import EmployeeJobSpecTab from './detail/EmployeeJobSpecTab.jsx';
import EmployeePersonalTab from './detail/EmployeePersonalTab.jsx';
import EmployeeBranchTab from './detail/EmployeeBranchTab.jsx';
import EmployeeSecurityTab from './detail/EmployeeSecurityTab.jsx';

export default function EmployeeDetailView({
  selectedEmployee,
  handleBackToList,
  handleOpenEdit,
  handleDelete,
  canUpdate = true,
  canDelete = true,
  getEmployeeName,
  getEmployeeEmail,
  getEmployeePhone,
  isSelfSuperAdminEmployee,
}) {
  const [activeTab, setActiveTab] = useState('jobSpec');

  const fullName = getEmployeeName(selectedEmployee) || 'Unknown Employee';
  const email = getEmployeeEmail(selectedEmployee) || 'Not provided';
  const phone = getEmployeePhone(selectedEmployee) || 'Not provided';

  // Primary Job Specification & Specifications List
  const primarySpec = selectedEmployee?.jobSpecification || selectedEmployee?.jobSpecifications?.[0] || null;
  const allSpecs = selectedEmployee?.jobSpecifications || (primarySpec ? [primarySpec] : []);
  const jobTitle = primarySpec?.title || selectedEmployee?.jobTitle || 'General Staff';

  // Facility & Branch
  const branch = selectedEmployee?.branch;

  // Person & Security User Account
  const person = selectedEmployee?.person;
  const userAccount = person?.user;
  const userRole = userAccount?.role || userAccount?.roles?.[0] || null;

  // Operational Counts & Managed Entities
  const counts = selectedEmployee?.counts || {};
  const managedBranches = selectedEmployee?.managedBranches || [];
  const managedWarehouses = selectedEmployee?.managedWarehouses || [];

  // Helper: Format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  // Helper: Format Date Time
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  // Helper: Compute Tenure
  const calculateTenure = (hireDateStr) => {
    if (!hireDateStr) return null;
    try {
      const hire = new Date(hireDateStr);
      const now = new Date();
      let years = now.getFullYear() - hire.getFullYear();
      let months = now.getMonth() - hire.getMonth();
      if (months < 0) {
        years--;
        months += 12;
      }
      if (years <= 0 && months <= 0) return 'Just joined';
      const parts = [];
      if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
      if (months > 0) parts.push(`${months} mo${months > 1 ? 's' : ''}`);
      return parts.join(' ');
    } catch {
      return null;
    }
  };

  const tenure = calculateTenure(selectedEmployee?.hireDate);

  // Status Styling Helper
  const getStatusBadge = (status) => {
    const s = (status || 'ACTIVE').toUpperCase();
    if (s === 'ACTIVE') {
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
    if (s === 'INVITED') {
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
    if (s === 'SUSPENDED' || s === 'TERMINATED') {
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    }
    return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  };

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* 1. Header Navigation & Actions */}
      <EmployeeDetailHeader
        handleBackToList={handleBackToList}
        handleOpenEdit={handleOpenEdit}
        handleDelete={handleDelete}
        selectedEmployee={selectedEmployee}
        fullName={fullName}
        canUpdate={canUpdate}
        canDelete={canDelete}
        isSelfSuperAdmin={isSelfSuperAdminEmployee?.(selectedEmployee)}
      />

      {/* 2. Hero Profile Banner */}
      <EmployeeDetailHero
        fullName={fullName}
        selectedEmployee={selectedEmployee}
        jobTitle={jobTitle}
        branch={branch}
        tenure={tenure}
        userAccount={userAccount}
        getStatusBadge={getStatusBadge}
      />

      {/* 3. Highlight KPI Cards */}
      <EmployeeDetailKpis
        jobTitle={jobTitle}
        primarySpec={primarySpec}
        branch={branch}
        selectedEmployee={selectedEmployee}
        formatDate={formatDate}
        tenure={tenure}
        userAccount={userAccount}
        userRole={userRole}
      />

      {/* 4. Tab Navigation Switcher */}
      <EmployeeDetailTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        specsCount={allSpecs.length}
      />

      {/* 5. Active Tab Content Panels */}
      {activeTab === 'jobSpec' && (
        <EmployeeJobSpecTab
          primarySpec={primarySpec}
          allSpecs={allSpecs}
          selectedEmployee={selectedEmployee}
          getStatusBadge={getStatusBadge}
          formatDateTime={formatDateTime}
        />
      )}

      {activeTab === 'personal' && (
        <EmployeePersonalTab
          person={person}
          email={email}
          phone={phone}
          selectedEmployee={selectedEmployee}
          primarySpec={primarySpec}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
          tenure={tenure}
          getStatusBadge={getStatusBadge}
        />
      )}

      {activeTab === 'branch' && (
        <EmployeeBranchTab
          branch={branch}
          managedBranches={managedBranches}
          managedWarehouses={managedWarehouses}
          counts={counts}
          getStatusBadge={getStatusBadge}
        />
      )}

      {activeTab === 'security' && (
        <EmployeeSecurityTab
          userAccount={userAccount}
          userRole={userRole}
          selectedEmployee={selectedEmployee}
          handleOpenEdit={handleOpenEdit}
          canUpdate={canUpdate}
          formatDateTime={formatDateTime}
          getStatusBadge={getStatusBadge}
        />
      )}
    </div>
  );
}
