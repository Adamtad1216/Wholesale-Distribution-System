import React from 'react';
import Button from '../../../../components/ui/Button';

export default function EmployeeDetailHeader({
  handleBackToList,
  handleOpenEdit,
  handleDelete,
  selectedEmployee,
  fullName,
  canUpdate = true,
  canDelete = true,
  isSelfSuperAdmin = false,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <button
        onClick={handleBackToList}
        className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition group"
      >
        <div className="p-1.5 rounded-lg bg-card border border-border group-hover:bg-accent transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </div>
        <span>Back to Employee Directory</span>
      </button>

      <div className="flex items-center gap-3">
        {canUpdate && (
          <Button
            variant="secondary"
            size="md"
            onClick={() => handleOpenEdit(selectedEmployee)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          >
            Edit Profile
          </Button>
        )}

        {canDelete && !isSelfSuperAdmin && (
          <Button
            variant="danger"
            size="md"
            onClick={() => handleDelete(selectedEmployee?.id, fullName)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
          >
            Delete
          </Button>
        )}

        {canDelete && isSelfSuperAdmin && (
          <span
            title="A Super Admin cannot delete their own profile"
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-muted800 text-muted-foreground border border-border cursor-not-allowed opacity-60 inline-flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Delete Locked (Self)</span>
          </span>
        )}
      </div>
    </div>
  );
}
