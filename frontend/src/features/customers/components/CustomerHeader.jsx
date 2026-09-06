import React from 'react';
import Button from '../../../components/ui/Button';

export default function CustomerHeader({ canCreate, onAddCustomer }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Customer Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Directory of corporate organizations, retail partners, and individual customer accounts.
        </p>
      </div>

      {canCreate && (
        <Button
          variant="primary"
          onClick={onAddCustomer}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Add Customer
        </Button>
      )}
    </div>
  );
}
