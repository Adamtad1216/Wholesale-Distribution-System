import React from 'react';
import { useUserManager } from '../hooks/useUserManager';

// Sub-components
import UserHeader from '../components/UserHeader';
import UserFilterToolbar from '../components/UserFilterToolbar';
import UserListTable from '../components/UserListTable';
import UserFormView from '../components/UserFormView';
import UserDetailView from '../components/UserDetailView';
import ResetPasswordModal from '../components/ResetPasswordModal';
import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';

export default function UsersPage() {
  const {
    viewMode,
    users,
    rolesList,
    loading,
    submitting,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    selectedUserForView,
    editingUser,
    formData,
    setFormData,
    resetUserTarget,
    setResetUserTarget,
    deleteUserTarget,
    setDeleteUserTarget,
    canCreate,
    canUpdate,
    canDelete,
    handleOpenForm,
    handleViewDetail,
    handleBackToList,
    handleSubmit,
    handleDeleteRequest,
    handleConfirmDelete,
    handleResetPasswordSubmit,
    handleStatusChange,
  } = useUserManager();

  // Render Full Blank Details Page
  if (viewMode === 'DETAILS') {
    return (
      <div className="p-6 relative min-h-[calc(100vh-100px)]">
        <UserDetailView
          user={selectedUserForView}
          handleBackToList={handleBackToList}
          handleOpenForm={handleOpenForm}
          handleDelete={handleDeleteRequest}
          handleOpenResetPassword={(u) => setResetUserTarget(u)}
          handleStatusChange={handleStatusChange}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
        {resetUserTarget && (
          <ResetPasswordModal
            user={resetUserTarget}
            onClose={() => setResetUserTarget(null)}
            onReset={handleResetPasswordSubmit}
          />
        )}
        {deleteUserTarget && (
          <ConfirmDeleteModal
            isOpen={Boolean(deleteUserTarget)}
            onClose={() => setDeleteUserTarget(null)}
            onConfirm={handleConfirmDelete}
            title="Delete User Account"
            message={`Are you sure you want to delete user account "@${deleteUserTarget.username}"? This action will archive their profile and revoke system access.`}
            submitting={submitting}
          />
        )}
      </div>
    );
  }

  // Render Full Blank Creation / Editing Page
  if (viewMode === 'FORM') {
    return (
      <div className="p-6 relative min-h-[calc(100vh-100px)]">
        <UserFormView
          editingUser={editingUser}
          formData={formData}
          setFormData={setFormData}
          submitting={submitting}
          handleSubmit={handleSubmit}
          handleBackToList={handleBackToList}
          rolesList={rolesList}
        />
      </div>
    );
  }

  // Render User Directory View
  return (
    <div className="p-6 space-y-6 relative min-h-[calc(100vh-100px)]">
      {/* Top Title Banner */}
      <UserHeader canCreate={canCreate} handleOpenForm={handleOpenForm} />

      {/* Filter Toolbar */}
      <UserFilterToolbar
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        rolesList={rolesList}
        totalUsers={users.length}
      />

      {/* Users Data Table */}
      <UserListTable
        users={users}
        loading={loading}
        canUpdate={canUpdate}
        canDelete={canDelete}
        handleOpenForm={handleOpenForm}
        handleDelete={handleDeleteRequest}
        handleViewDetail={handleViewDetail}
      />

      {/* Reset Password Modal */}
      {resetUserTarget && (
        <ResetPasswordModal
          user={resetUserTarget}
          onClose={() => setResetUserTarget(null)}
          onReset={handleResetPasswordSubmit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteUserTarget && (
        <ConfirmDeleteModal
          isOpen={Boolean(deleteUserTarget)}
          onClose={() => setDeleteUserTarget(null)}
          onConfirm={handleConfirmDelete}
          title="Delete User Account"
          message={`Are you sure you want to delete user account "@${deleteUserTarget.username}"? This action will archive their profile and revoke system access.`}
          submitting={submitting}
        />
      )}
    </div>
  );
}
