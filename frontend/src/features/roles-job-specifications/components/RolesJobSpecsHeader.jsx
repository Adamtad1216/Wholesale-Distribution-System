import React from 'react';
import Button from '../../../components/ui/Button';

export default function RolesJobSpecsHeader({
  canCreateRole,
  onCreateRole,
  onCreateJobSpec,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Roles & Job Specifications</h1>
        <p className="text-sm text-muted-foreground">
          Configure system security roles and organizational job specifications
        </p>
      </div>

      <div className="flex items-center gap-3">
        {canCreateRole && (
          <Button
            onClick={onCreateRole}
            variant="secondary"
            size="md"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Create Security Role
          </Button>
        )}

        <Button
          onClick={onCreateJobSpec}
          variant="primary"
          size="md"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Create Job Specification
        </Button>
      </div>
    </div>
  );
}
