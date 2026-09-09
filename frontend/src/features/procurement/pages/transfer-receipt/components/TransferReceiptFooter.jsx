import React from 'react';
import { ChevronRight } from 'lucide-react';
import Button from '../../../../../components/ui/Button';

export default function TransferReceiptFooter({
  id,
  onNavigateDashboard,
  onNavigateGr,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 print:hidden">
      <Button
        variant="secondary"
        size="md"
        onClick={onNavigateDashboard}
        className="w-full sm:w-auto"
      >
        ← Back to Procurement Dashboard
      </Button>

      {id && (
        <Button
          variant="primary"
          size="md"
          onClick={onNavigateGr}
          className="w-full sm:w-auto"
        >
          View Goods Receipt Details
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </div>
  );
}
