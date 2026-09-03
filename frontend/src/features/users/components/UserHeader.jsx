import React from 'react';
import Button from '../../../components/ui/Button';

export default function UserHeader({ canCreate, handleOpenForm }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <span>👤</span> User Management Directory
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage system authentication users, personnel contacts, security role assignments, and login statuses.
        </p>
      </div>

      {canCreate && (
        <Button
          onClick={() => handleOpenForm()}
          variant="primary"
          size="md"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          }
          className="shadow-lg shadow-indigo-500/20 px-5"
        >
          Provision New User
        </Button>
      )}
    </div>
  );
}
