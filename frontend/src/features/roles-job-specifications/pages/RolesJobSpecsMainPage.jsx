import React from 'react';
import { useRolesJobSpecs } from '../hooks/useRolesJobSpecs';
import RolesJobSpecsHeader from '../components/RolesJobSpecsHeader';
import RolesJobSpecsTabs from '../components/RolesJobSpecsTabs';

// Sub-components / Views
import RolesPage from '../components/roles/RolesPage';
import RoleFormView from '../components/roles/RoleFormView';
import RoleDetailsView from '../components/roles/RoleDetailsView';
import AssignedUsersPage from '../components/roles/AssignedUsersPage';
import RoleUserAssignmentView from '../components/roles/RoleUserAssignmentView';
import JobSpecificationsPage from '../components/job-specifications/JobSpecificationsPage';
import JobSpecFormView from '../components/job-specifications/JobSpecFormView';

export default function RolesJobSpecsMainPage() {
  const {
    viewMode,
    activeTab,
    setActiveTab,
    roles,
    jobSpecs,
    loading,
    selectedRoleForView,
    setSelectedRoleForView,
    editingRole,
    roleFormData,
    setRoleFormData,
    editingJobSpec,
    jobSpecFormData,
    setJobSpecFormData,
    submitting,
    canCreateRole,
    canUpdateRole,
    canDeleteRole,
    canCreateJobSpec,
    canUpdateJobSpec,
    canDeleteJobSpec,
    fetchData,
    handleBackToList,
    handleViewRole,
    handleOpenAssignUsers,
    handleOpenRoleForm,
    handleRoleSubmit,
    handleRoleDelete,
    handleOpenJobSpecForm,
    handleJobSpecSubmit,
    handleJobSpecDelete,
  } = useRolesJobSpecs();

  // ═════════════════════════════════════════════════════════════════
  // RENDER FULL PAGE VIEW: ROLE DETAILS
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'ROLE_DETAILS') {
    return (
      <RoleDetailsView
        roleId={selectedRoleForView?.id}
        initialRole={selectedRoleForView}
        canUpdateRole={canUpdateRole}
        canDeleteRole={canDeleteRole}
        handleOpenRoleForm={handleOpenRoleForm}
        handleRoleDelete={handleRoleDelete}
        handleBackToList={handleBackToList}
        handleOpenAssignUsers={handleOpenAssignUsers}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER FULL PAGE VIEW: ASSIGN USERS VIEW
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'ASSIGN_USERS_VIEW') {
    return (
      <RoleUserAssignmentView
        role={selectedRoleForView}
        roles={roles}
        onRoleChange={setSelectedRoleForView}
        handleBackToList={handleBackToList}
        onSuccess={fetchData}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER FULL PAGE VIEW: ROLE FORM
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'ROLE_FORM') {
    return (
      <RoleFormView
        editingRole={editingRole}
        roleFormData={roleFormData}
        setRoleFormData={setRoleFormData}
        submitting={submitting}
        handleSubmit={handleRoleSubmit}
        handleBackToList={handleBackToList}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER FULL PAGE VIEW: JOB SPEC FORM
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'JOB_SPEC_FORM') {
    return (
      <JobSpecFormView
        editingJobSpec={editingJobSpec}
        jobSpecFormData={jobSpecFormData}
        setJobSpecFormData={setJobSpecFormData}
        submitting={submitting}
        handleSubmit={handleJobSpecSubmit}
        handleBackToList={handleBackToList}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER DIRECTORY LIST VIEW (TABS CONTAINER)
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 space-y-6">
      {/* Header Bar */}
      <RolesJobSpecsHeader
        canCreateRole={canCreateRole}
        onCreateRole={() => handleOpenRoleForm()}
        onCreateJobSpec={() => handleOpenJobSpecForm()}
      />

      {/* Tabs Navigation */}
      <RolesJobSpecsTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        rolesCount={roles.length}
        jobSpecsCount={jobSpecs.length}
      />

      {/* Tab Content View */}
      {activeTab === 'ROLES' && (
        <RolesPage
          roles={roles}
          loading={loading}
          canUpdateRole={canUpdateRole}
          canDeleteRole={canDeleteRole}
          handleOpenRoleForm={handleOpenRoleForm}
          handleRoleDelete={handleRoleDelete}
          handleViewRole={handleViewRole}
        />
      )}

      {activeTab === 'JOB_SPECS' && (
        <JobSpecificationsPage
          jobSpecs={jobSpecs}
          loading={loading}
          canUpdateJobSpec={canUpdateJobSpec}
          canDeleteJobSpec={canDeleteJobSpec}
          handleOpenJobSpecForm={handleOpenJobSpecForm}
          handleJobSpecDelete={handleJobSpecDelete}
        />
      )}

      {activeTab === 'ASSIGNED_USERS' && (
        <AssignedUsersPage
          roles={roles}
          canUpdateRole={canUpdateRole}
          refreshData={fetchData}
          handleOpenAssignUsers={handleOpenAssignUsers}
        />
      )}
    </div>
  );
}
