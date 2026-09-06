import React from 'react';
import Button from '../../../components/ui/Button';

export default function BranchesHeader({
  activeTab = 'branches',
  onTabChange,
  counts = { branches: 0, warehouses: 0, regions: 0 },
  canCreateBranch = false,
  canCreateWarehouse = false,
  canCreateRegion = false,
  onOpenCreateModal,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <span>🏢</span> Facilities & Distribution Hubs
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage regional branch offices, storage warehouses, and geographic operational zones
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Tab Controls */}
        <div className="flex items-center p-1 bg-muted800/80 border border-border rounded-xl">
          <button
            type="button"
            onClick={() => onTabChange('branches')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'branches'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted700/50'
            }`}
          >
            <span>🏢 Branches</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'branches'
                  ? 'bg-white/20 text-white'
                  : 'bg-muted900 text-muted-foreground'
              }`}
            >
              {counts.branches}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('warehouses')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'warehouses'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted700/50'
            }`}
          >
            <span>🏬 Warehouses</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'warehouses'
                  ? 'bg-white/20 text-white'
                  : 'bg-muted900 text-muted-foreground'
              }`}
            >
              {counts.warehouses}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('regions')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'regions'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted700/50'
            }`}
          >
            <span>📍 Regions</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'regions'
                  ? 'bg-white/20 text-white'
                  : 'bg-muted900 text-muted-foreground'
              }`}
            >
              {counts.regions}
            </span>
          </button>
        </div>

        {/* Action Button */}
        {activeTab === 'branches' && canCreateBranch && (
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
            Add Branch
          </Button>
        )}

        {activeTab === 'warehouses' && canCreateWarehouse && (
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
            Add Warehouse
          </Button>
        )}

        {activeTab === 'regions' && canCreateRegion && (
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
            Add Region
          </Button>
        )}
      </div>
    </div>
  );
}
