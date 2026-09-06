import React from 'react';
import Button from '../../../components/ui/Button';

export default function CompaniesHeader({
  totalCompanies = 0,
  canCreate = false,
  onOpenCreateModal,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <span>🏛️</span> Enterprises & Companies
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage corporate entities, legal trade licenses, TIN numbers, and subsidiary networks
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-muted800 text-muted-foreground border border-border">
          {totalCompanies} {totalCompanies === 1 ? 'enterprise' : 'enterprises'}
        </span>

        {canCreate && (
          <Button
            variant="primary"
            size="md"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
            onClick={onOpenCreateModal}
          >
            Add Company
          </Button>
        )}
      </div>
    </div>
  );
}
