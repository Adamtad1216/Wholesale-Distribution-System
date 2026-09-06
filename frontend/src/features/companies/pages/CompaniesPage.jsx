import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { companiesApi } from '../companiesApi';
import { usePermission } from '../../../hooks/usePermission';
import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';

import CompaniesHeader from '../components/CompaniesHeader';
import CompaniesStats from '../components/CompaniesStats';
import CompaniesFilters from '../components/CompaniesFilters';
import CompaniesTable from '../components/CompaniesTable';
import CompaniesGrid from '../components/CompaniesGrid';
import CompanyDetailModal from '../components/CompanyDetailModal';
import CompanyFormModal from '../components/CompanyFormModal';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters & Views
  const [search, setSearch] = useState('');
  const [regionId, setRegionId] = useState('');
  const [status, setStatus] = useState('');
  const [vatFilter, setVatFilter] = useState('');
  const [viewMode, setViewMode] = useState('table');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [viewingCompany, setViewingCompany] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Permissions (fallback to branches:read/manage if companies specific permission isn't assigned)
  const { can: canCreate } = usePermission(['companies:create', 'branches:create']);
  const { can: canUpdate } = usePermission(['companies:update', 'branches:update']);
  const { can: canDelete } = usePermission(['companies:delete', 'branches:delete']);

  // Fetch Lookups & Main Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [compRes, regRes] = await Promise.allSettled([
        companiesApi.getCompanies({ limit: 100 }),
        companiesApi.getRegions({ limit: 100 }),
      ]);

      if (compRes.status === 'fulfilled') {
        const d = compRes.value?.data || compRes.value || [];
        setCompanies(Array.isArray(d) ? d : d.companies || d.items || []);
      }
      if (regRes.status === 'fulfilled') {
        const d = regRes.value?.data || regRes.value || [];
        setRegions(Array.isArray(d) ? d : d.regions || d.items || []);
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter logic
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        c.name?.toLowerCase().includes(q) ||
        c.legalName?.toLowerCase().includes(q) ||
        c.tinNumber?.toLowerCase().includes(q) ||
        c.tradeLicenseNumber?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q);

      const matchRegion = !regionId || c.regionId === regionId;
      const matchStatus = !status || c.status === status;
      const matchVat =
        !vatFilter ||
        (vatFilter === 'true' && Boolean(c.isVatRegistered)) ||
        (vatFilter === 'false' && !c.isVatRegistered);

      return matchSearch && matchRegion && matchStatus && matchVat;
    });
  }, [companies, search, regionId, status, vatFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setRegionId('');
    setStatus('');
    setVatFilter('');
  };

  // CRUD Handlers
  const handleSaveCompany = async (data) => {
    setSubmitting(true);
    try {
      if (editingCompany) {
        await companiesApi.updateCompany(editingCompany.id, data);
        toast.success('Company updated successfully');
      } else {
        await companiesApi.createCompany(data);
        toast.success('Company registered successfully');
      }
      setIsFormOpen(false);
      setEditingCompany(null);
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Failed to save company');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await companiesApi.deleteCompany(deleteTarget.id);
      toast.success(`Company "${deleteTarget.name}" deleted successfully`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete company');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Header */}
      <CompaniesHeader
        totalCompanies={companies.length}
        canCreate={canCreate}
        onOpenCreateModal={() => {
          setEditingCompany(null);
          setIsFormOpen(true);
        }}
      />

      {/* KPI Stats */}
      <CompaniesStats companies={companies} loading={loading} />

      {/* Filters Toolbar */}
      <CompaniesFilters
        search={search}
        onSearchChange={setSearch}
        regionId={regionId}
        onRegionChange={setRegionId}
        status={status}
        onStatusChange={setStatus}
        vatFilter={vatFilter}
        onVatFilterChange={setVatFilter}
        regions={regions}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onReset={handleResetFilters}
      />

      {/* Company List Display */}
      <div>
        {viewMode === 'table' ? (
          <CompaniesTable
            companies={filteredCompanies}
            loading={loading}
            onView={(c) => setViewingCompany(c)}
            onEdit={(c) => {
              setEditingCompany(c);
              setIsFormOpen(true);
            }}
            onDelete={(c) => setDeleteTarget(c)}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        ) : (
          <CompaniesGrid
            companies={filteredCompanies}
            loading={loading}
            onView={(c) => setViewingCompany(c)}
            onEdit={(c) => {
              setEditingCompany(c);
              setIsFormOpen(true);
            }}
            onDelete={(c) => setDeleteTarget(c)}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
      </div>

      {/* Modals */}
      <CompanyDetailModal
        isOpen={Boolean(viewingCompany)}
        onClose={() => setViewingCompany(null)}
        company={viewingCompany}
        onEdit={(c) => {
          setViewingCompany(null);
          setEditingCompany(c);
          setIsFormOpen(true);
        }}
        canUpdate={canUpdate}
      />

      <CompanyFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCompany(null);
        }}
        onSave={handleSaveCompany}
        company={editingCompany}
        regions={regions}
        submitting={submitting}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Company"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All related branches must be transferred or removed first.`}
        submitting={submitting}
      />
    </div>
  );
}
