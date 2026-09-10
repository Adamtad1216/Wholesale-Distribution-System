import React from 'react';
import { RotateCw, Plus, Building2, Warehouse, MapPin } from 'lucide-react';
import Button from '../../../components/ui/Button';

export default function BranchesHeader({
  activeTab = 'branches',
  canCreateBranch = false,
  canCreateWarehouse = false,
  canCreateRegion = false,
  onOpenCreateModal,
  onRefresh,
  refreshing = false,
}) {
  const getActionConfig = () => {
    if (activeTab === 'branches' && canCreateBranch) {
      return {
        label: 'Register Branch',
        icon: <Building2 className="w-4 h-4" />,
        action: onOpenCreateModal,
      };
    }
    if (activeTab === 'warehouses' && canCreateWarehouse) {
      return {
        label: 'Register Warehouse',
        icon: <Warehouse className="w-4 h-4" />,
        action: onOpenCreateModal,
      };
    }
    if (activeTab === 'regions' && canCreateRegion) {
      return {
        label: 'Add Region',
        icon: <MapPin className="w-4 h-4" />,
        action: onOpenCreateModal,
      };
    }
    return null;
  };

  const action = getActionConfig();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-normal text-foreground tracking-tight flex items-center gap-3">
          <span>Facilities & Distribution Hubs</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
          Manage corporate branch offices, regional storage warehouses, fulfillment centers, and geographic distribution zones.
        </p>
      </div>

      <div className="flex items-center gap-2.5 self-start md:self-auto">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted800 text-muted-foreground hover:text-foreground transition flex items-center gap-2 text-xs font-normal"
            title="Refresh facilities directory"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">Sync Data</span>
          </button>
        )}

        {action && (
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={action.action}
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
