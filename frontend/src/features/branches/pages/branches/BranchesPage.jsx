import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Building2, Warehouse, MapPin } from 'lucide-react';
import { branchesApi } from '../../branchesApi';
import { usePermission } from '../../../../hooks/usePermission';
import ConfirmDeleteModal from '../../../../components/ui/ConfirmDeleteModal';

import BranchesHeader from '../../components/BranchesHeader';
import BranchesStats from '../../components/BranchesStats';
import BranchesFilters from '../../components/BranchesFilters';
import BranchesTable from '../../components/BranchesTable';
import BranchesGrid from '../../components/BranchesGrid';
import BranchDetailModal from '../../components/BranchDetailModal';
import BranchFormModal from '../../components/BranchFormModal';

import WarehousesTable from '../../components/WarehousesTable';
import WarehousesGrid from '../../components/WarehousesGrid';
import WarehouseFormModal from '../../components/WarehouseFormModal';

import RegionsTab from '../../components/RegionsTab';
import RegionFormModal from '../../components/RegionFormModal';

export default function BranchesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'branches'); // 'branches' | 'warehouses' | 'regions'
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [regions, setRegions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [branchManagers, setBranchManagers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters & Views
  const [search, setSearch] = useState('');
  const [regionId, setRegionId] = useState('');
  const [status, setStatus] = useState('');
  const [viewMode, setViewMode] = useState('table');

  // Modals state
  const [isBranchFormOpen, setIsBranchFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [viewingBranch, setViewingBranch] = useState(null);

  const [isWarehouseFormOpen, setIsWarehouseFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);

  const [isRegionFormOpen, setIsRegionFormOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'branch' | 'warehouse' | 'region', item: object }

  // Permissions
  const { can: canReadBranch } = usePermission('branches:read');
  const { can: canCreateBranch } = usePermission('branches:create');
  const { can: canUpdateBranch } = usePermission('branches:update');
  const { can: canDeleteBranch } = usePermission('branches:delete');

  const { can: canReadWarehouse } = usePermission('warehouses:read');
  const { can: canCreateWarehouse } = usePermission('warehouses:create');
  const { can: canUpdateWarehouse } = usePermission('warehouses:update');
  const { can: canDeleteWarehouse } = usePermission('warehouses:delete');

  const { can: canReadRegion } = usePermission(['regions:read', 'branches:read']);
  const { can: canCreateRegion } = usePermission(['regions:create', 'branches:create']);
  const { can: canUpdateRegion } = usePermission(['regions:update', 'branches:update']);
  const { can: canDeleteRegion } = usePermission(['regions:delete', 'branches:delete']);

  // Fetch Lookups (Companies, Regions, Employees)
  const fetchLookups = useCallback(async () => {
    try {
      const [regRes, compRes, empRes, brEmpRes] = await Promise.allSettled([
        branchesApi.getRegions({ limit: 100 }),
        branchesApi.getCompanies({ limit: 100 }),
        branchesApi.getEligibleWarehouseManagers(),
        branchesApi.getEligibleBranchManagers(),
      ]);

      if (regRes.status === 'fulfilled') {
        const d = regRes.value?.data || regRes.value || [];
        setRegions(Array.isArray(d) ? d : d.regions || d.items || []);
      }
      if (compRes.status === 'fulfilled') {
        const d = compRes.value?.data || compRes.value || [];
        setCompanies(Array.isArray(d) ? d : d.companies || d.items || []);
      }
      if (empRes.status === 'fulfilled') {
        const d = empRes.value?.data || empRes.value || [];
        setEmployees(Array.isArray(d) ? d : d.employees || d.items || []);
      }
      if (brEmpRes.status === 'fulfilled') {
        const d = brEmpRes.value?.data || brEmpRes.value || [];
        setBranchManagers(Array.isArray(d) ? d : d.employees || d.items || []);
      }
    } catch {
      // Non-blocking lookup failure
    }
  }, []);

  // Fetch Main Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      const [bRes, wRes] = await Promise.allSettled([
        branchesApi.getBranches(params),
        branchesApi.getWarehouses(params),
      ]);

      if (bRes.status === 'fulfilled') {
        const d = bRes.value?.data || bRes.value || [];
        setBranches(Array.isArray(d) ? d : d.branches || d.items || []);
      }
      if (wRes.status === 'fulfilled') {
        const d = wRes.value?.data || wRes.value || [];
        setWarehouses(Array.isArray(d) ? d : d.warehouses || d.items || []);
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch facilities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLookups();
    fetchData();
  }, [fetchLookups, fetchData]);

  // Filtered lists
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        b.name?.toLowerCase().includes(q) ||
        b.branchCode?.toLowerCase().includes(q) ||
        b.code?.toLowerCase().includes(q) ||
        b.city?.toLowerCase().includes(q);

      const matchRegion = !regionId || b.regionId === regionId;
      const matchStatus = !status || b.status === status;

      return matchSearch && matchRegion && matchStatus;
    });
  }, [branches, search, regionId, status]);

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((w) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        w.name?.toLowerCase().includes(q) ||
        w.code?.toLowerCase().includes(q) ||
        w.location?.toLowerCase().includes(q) ||
        w.city?.toLowerCase().includes(q);

      const matchRegion = !regionId || w.regionId === regionId;
      const matchStatus = !status || w.status === status;

      return matchSearch && matchRegion && matchStatus;
    });
  }, [warehouses, search, regionId, status]);

  const filteredRegions = useMemo(() => {
    return regions.filter((r) => {
      const q = search.trim().toLowerCase();
      return (
        !q ||
        r.name?.toLowerCase().includes(q) ||
        r.code?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    });
  }, [regions, search]);

  const handleResetFilters = () => {
    setSearch('');
    setRegionId('');
    setStatus('');
  };

  // Branch CRUD Handlers
  const handleSaveBranch = async (data) => {
    setSubmitting(true);
    try {
      if (editingBranch) {
        await branchesApi.updateBranch(editingBranch.id, data);
        toast.success('Branch updated successfully');
      } else {
        await branchesApi.createBranch(data);
        toast.success('Branch registered successfully');
      }
      setIsBranchFormOpen(false);
      setEditingBranch(null);
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Failed to save branch');
    } finally {
      setSubmitting(false);
    }
  };

  // Warehouse CRUD Handlers
  const handleSaveWarehouse = async (data) => {
    setSubmitting(true);
    try {
      if (editingWarehouse) {
        await branchesApi.updateWarehouse(editingWarehouse.id, data);
        toast.success('Warehouse updated successfully');
      } else {
        await branchesApi.createWarehouse(data);
        toast.success('Warehouse created successfully');
      }
      setIsWarehouseFormOpen(false);
      setEditingWarehouse(null);
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Failed to save warehouse');
    } finally {
      setSubmitting(false);
    }
  };

  // Region CRUD Handlers
  const handleSaveRegion = async (data) => {
    setSubmitting(true);
    try {
      if (editingRegion) {
        await branchesApi.updateRegion(editingRegion.id, data);
        toast.success('Region updated successfully');
      } else {
        await branchesApi.createRegion(data);
        toast.success('Region added successfully');
      }
      setIsRegionFormOpen(false);
      setEditingRegion(null);
      fetchLookups();
    } catch (err) {
      toast.error(err?.message || 'Failed to save region');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      if (deleteTarget.type === 'branch') {
        await branchesApi.deleteBranch(deleteTarget.item.id);
        toast.success(`Branch "${deleteTarget.item.name}" deleted`);
        fetchData();
      } else if (deleteTarget.type === 'warehouse') {
        await branchesApi.deleteWarehouse(deleteTarget.item.id);
        toast.success(`Warehouse "${deleteTarget.item.name}" deleted`);
        fetchData();
      } else if (deleteTarget.type === 'region') {
        await branchesApi.deleteRegion(deleteTarget.item.id);
        toast.success(`Region "${deleteTarget.item.name}" deleted`);
        fetchLookups();
      }
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete record');
    } finally {
      setSubmitting(false);
    }
  };

  // Tabs configuration matching InventoryPage
  const tabs = useMemo(() => [
    {
      id: 'branches',
      label: 'Branches Directory',
      icon: <Building2 className="w-4 h-4" />,
      count: branches.length,
      visible: canReadBranch,
    },
    {
      id: 'warehouses',
      label: 'Storage Warehouses',
      icon: <Warehouse className="w-4 h-4" />,
      count: warehouses.length,
      visible: canReadWarehouse,
    },
    {
      id: 'regions',
      label: 'Operational Regions',
      icon: <MapPin className="w-4 h-4" />,
      count: regions.length,
      visible: canReadRegion,
    },
  ].filter((t) => t.visible), [branches.length, warehouses.length, regions.length, canReadBranch, canReadWarehouse, canReadRegion]);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((t) => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <BranchesHeader
        activeTab={activeTab}
        canCreateBranch={canCreateBranch}
        canCreateWarehouse={canCreateWarehouse}
        canCreateRegion={canCreateRegion}
        onOpenCreateModal={() => {
          if (activeTab === 'branches') {
            setEditingBranch(null);
            setIsBranchFormOpen(true);
          } else if (activeTab === 'warehouses') {
            setEditingWarehouse(null);
            setIsWarehouseFormOpen(true);
          } else if (activeTab === 'regions') {
            setEditingRegion(null);
            setIsRegionFormOpen(true);
          }
        }}
        onRefresh={fetchData}
        refreshing={loading}
      />

      {/* KPI Stats Strip */}
      <BranchesStats
        branches={branches}
        warehouses={warehouses}
        regions={regions}
        loading={loading}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          handleResetFilters();
        }}
      />

      {/* Modern High-Contrast Blue & White Tab Navigation Bar */}
      <div className="border-b-2 border-slate-200 dark:border-slate-800 flex items-center gap-2 flex-wrap pb-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                handleResetFilters();
              }}
              className={`px-4 py-3 border-b-2 text-xs sm:text-sm flex items-center gap-2.5 transition cursor-pointer -mb-[2px] ${
                isActive
                  ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 font-bold rounded-t-lg'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-muted800/40 rounded-t-lg font-medium'
              }`}
            >
              <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}>
                {tab.icon}
              </span>
              <span className={`tracking-tight ${isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                {tab.label}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 shadow-xs'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters Toolbar */}
      <BranchesFilters
        search={search}
        onSearchChange={setSearch}
        regionId={regionId}
        onRegionChange={setRegionId}
        status={status}
        onStatusChange={setStatus}
        regions={regions}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onReset={handleResetFilters}
        placeholder={
          activeTab === 'branches'
            ? 'Search branches by code, name, city...'
            : activeTab === 'warehouses'
              ? 'Search warehouses by code, name, location...'
              : 'Search regions by code or name...'
        }
      />

      {/* Main Tab Content */}
      <div className="space-y-4">
        {/* TAB 1: BRANCHES */}
        {activeTab === 'branches' && (
          <div>
            {viewMode === 'table' ? (
              <BranchesTable
                branches={filteredBranches}
                loading={loading}
                onView={(b) => setViewingBranch(b)}
                onEdit={(b) => {
                  setEditingBranch(b);
                  setIsBranchFormOpen(true);
                }}
                onDelete={(b) => setDeleteTarget({ type: 'branch', item: b })}
                canUpdate={canUpdateBranch}
                canDelete={canDeleteBranch}
              />
            ) : (
              <BranchesGrid
                branches={filteredBranches}
                loading={loading}
                onView={(b) => setViewingBranch(b)}
                onEdit={(b) => {
                  setEditingBranch(b);
                  setIsBranchFormOpen(true);
                }}
                onDelete={(b) => setDeleteTarget({ type: 'branch', item: b })}
                canUpdate={canUpdateBranch}
                canDelete={canDeleteBranch}
              />
            )}
          </div>
        )}

        {/* TAB 2: WAREHOUSES */}
        {activeTab === 'warehouses' && (
          <div>
            {viewMode === 'table' ? (
              <WarehousesTable
                warehouses={filteredWarehouses}
                loading={loading}
                onView={(w) => navigate(`/branches/warehouses/${w.id}`)}
                onEdit={(w) => {
                  setEditingWarehouse(w);
                  setIsWarehouseFormOpen(true);
                }}
                onDelete={(w) => setDeleteTarget({ type: 'warehouse', item: w })}
                canUpdate={canUpdateWarehouse}
                canDelete={canDeleteWarehouse}
              />
            ) : (
              <WarehousesGrid
                warehouses={filteredWarehouses}
                loading={loading}
                onView={(w) => navigate(`/branches/warehouses/${w.id}`)}
                onEdit={(w) => {
                  setEditingWarehouse(w);
                  setIsWarehouseFormOpen(true);
                }}
                onDelete={(w) => setDeleteTarget({ type: 'warehouse', item: w })}
                canUpdate={canUpdateWarehouse}
                canDelete={canDeleteWarehouse}
              />
            )}
          </div>
        )}

        {/* TAB 3: REGIONS */}
        {activeTab === 'regions' && (
          <RegionsTab
            regions={filteredRegions}
            loading={loading}
            onEdit={(r) => {
              setEditingRegion(r);
              setIsRegionFormOpen(true);
            }}
            onDelete={(r) => setDeleteTarget({ type: 'region', item: r })}
            onOpenCreateModal={() => {
              setEditingRegion(null);
              setIsRegionFormOpen(true);
            }}
            canCreate={canCreateRegion}
            canUpdate={canUpdateRegion}
            canDelete={canDeleteRegion}
          />
        )}
      </div>

      {/* Modals */}
      <BranchDetailModal
        isOpen={Boolean(viewingBranch)}
        onClose={() => setViewingBranch(null)}
        branch={viewingBranch}
        onEdit={(b) => {
          setViewingBranch(null);
          setEditingBranch(b);
          setIsBranchFormOpen(true);
        }}
        canUpdate={canUpdateBranch}
      />

      <BranchFormModal
        isOpen={isBranchFormOpen}
        onClose={() => {
          setIsBranchFormOpen(false);
          setEditingBranch(null);
        }}
        onSave={handleSaveBranch}
        branch={editingBranch}
        companies={companies}
        regions={regions}
        employees={branchManagers}
        submitting={submitting}
      />

      <WarehouseFormModal
        isOpen={isWarehouseFormOpen}
        onClose={() => {
          setIsWarehouseFormOpen(false);
          setEditingWarehouse(null);
        }}
        onSave={handleSaveWarehouse}
        warehouse={editingWarehouse}
        branches={branches}
        regions={regions}
        employees={employees}
        submitting={submitting}
      />

      <RegionFormModal
        isOpen={isRegionFormOpen}
        onClose={() => {
          setIsRegionFormOpen(false);
          setEditingRegion(null);
        }}
        onSave={handleSaveRegion}
        region={editingRegion}
        submitting={submitting}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteTarget?.type === 'branch'
            ? 'Branch'
            : deleteTarget?.type === 'warehouse'
              ? 'Warehouse'
              : 'Region'
          }`}
        message={`Are you sure you want to delete "${deleteTarget?.item?.name}"? This action cannot be undone.`}
        submitting={submitting}
      />
    </div>
  );
}
