import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { branchesApi } from '../branchesApi';

export default function WarehouseFormModal({
  isOpen = false,
  onClose,
  onSave,
  warehouse = null,
  branches = [],
  regions = [],
  employees = [],
  submitting = false,
}) {
  const isEdit = Boolean(warehouse && warehouse.id);

  const [formData, setFormData] = useState({
    branchId: '',
    code: '',
    name: '',
    regionId: '',
    location: '',
    city: '',
    subCity: '',
    woreda: '',
    kebele: '',
    houseNumber: '',
    managerId: '',
    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState({});
  const [managers, setManagers] = useState(employees);
  const [loadingManagers, setLoadingManagers] = useState(false);

  // Fetch eligible managers dynamically if not provided
  useEffect(() => {
    if (employees && employees.length > 0) {
      setManagers(employees);
    } else if (isOpen) {
      setLoadingManagers(true);
      branchesApi.getEligibleWarehouseManagers()
        .then((res) => {
          const list = res?.data || res || [];
          setManagers(Array.isArray(list) ? list : []);
        })
        .catch(() => {})
        .finally(() => setLoadingManagers(false));
    }
  }, [isOpen, employees]);

  useEffect(() => {
    if (warehouse) {
      setFormData({
        branchId: warehouse.branchId || (branches[0]?.id || ''),
        code: warehouse.code || '',
        name: warehouse.name || '',
        regionId: warehouse.regionId || '',
        location: warehouse.location || '',
        city: warehouse.city || '',
        subCity: warehouse.subCity || '',
        woreda: warehouse.woreda || '',
        kebele: warehouse.kebele || '',
        houseNumber: warehouse.houseNumber || '',
        managerId: warehouse.managerId || '',
        status: warehouse.status || 'ACTIVE',
      });
    } else {
      setFormData({
        branchId: branches[0]?.id || '',
        code: '',
        name: '',
        regionId: regions[0]?.id || '',
        location: '',
        city: '',
        subCity: '',
        woreda: '',
        kebele: '',
        houseNumber: '',
        managerId: '',
        status: 'ACTIVE',
      });
    }
    setErrors({});
  }, [warehouse, isOpen, branches, regions]);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name?.trim()) errs.name = 'Warehouse name is required';
    if (!formData.code?.trim()) errs.code = 'Warehouse code is required';
    if (!formData.branchId) errs.branchId = 'Parent branch is required';
    if (!formData.regionId) errs.regionId = 'Region is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      ...formData,
      managerId: formData.managerId?.trim() ? formData.managerId : null,
    };
    onSave(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Warehouse: ${warehouse.name}` : 'Register Storage Warehouse'}
      subtitle={isEdit ? 'Update warehouse facility attributes and manager' : 'Establish a new storage and fulfillment hub'}
      icon="🏬"
      maxWidth="max-w-2xl"
      scope="workspace"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Core Attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Parent Branch <span className="text-rose-400">*</span>
            </label>
            <select
              value={formData.branchId}
              onChange={(e) => handleChange('branchId', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select Branch...</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.branchCode || b.code || 'BR'})
                </option>
              ))}
            </select>
            {errors.branchId && <p className="text-[10px] text-rose-400 mt-1">{errors.branchId}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Warehouse Code <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              placeholder="e.g. WH-BOLE-01"
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.code && <p className="text-[10px] text-rose-400 mt-1">{errors.code}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Warehouse Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Bole Main Distribution Center"
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.name && <p className="text-[10px] text-rose-400 mt-1">{errors.name}</p>}
          </div>
        </div>

        {/* Region & Location */}
        <div className="space-y-3 pt-1 border-t border-border">
          <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            Location & Facility Geography
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">
                Region <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.regionId}
                onChange={(e) => handleChange('regionId', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select Region...</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
              {errors.regionId && <p className="text-[10px] text-rose-400 mt-1">{errors.regionId}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="e.g. Addis Ababa"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">Sub-City / Zone</label>
              <input
                type="text"
                value={formData.subCity}
                onChange={(e) => handleChange('subCity', e.target.value)}
                placeholder="e.g. Bole"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-medium text-foreground mb-1">Physical Location Note</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g. Warehouse Compound B, Gate 4"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Manager & Status */}
        <div className="space-y-3 pt-1 border-t border-border">
          <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            Management & Operations
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium text-foreground">
                  Warehouse Custodian / Manager
                </label>
                {loadingManagers && (
                  <span className="text-[10px] text-muted-foreground animate-pulse">
                    Loading managers...
                  </span>
                )}
              </div>
              <select
                value={formData.managerId}
                onChange={(e) => handleChange('managerId', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Unassigned (No Manager)</option>
                {managers.map((emp) => {
                  const empName = emp.name || (emp.person
                    ? `${emp.person.firstName || ''} ${emp.person.lastName || ''}`.trim()
                    : emp.employeeCode || emp.id);
                  const role = emp.primaryRole || emp.department || 'Employee';
                  const whNote = emp.currentWarehouse
                    ? ` • Currently at ${emp.currentWarehouse}`
                    : '';
                  return (
                    <option key={emp.id} value={emp.id}>
                      {empName} ({emp.employeeCode || 'EMP'}) — {role}{whNote}
                    </option>
                  );
                })}
              </select>

              {/* Selected manager preview badge */}
              {formData.managerId && (() => {
                const selected = managers.find((m) => m.id === formData.managerId);
                if (!selected) return null;
                const selName = selected.name || (selected.person
                  ? `${selected.person.firstName || ''} ${selected.person.lastName || ''}`.trim()
                  : selected.employeeCode);
                return (
                  <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold text-xs">👤</span>
                      <div>
                        <span className="font-semibold text-foreground">{selName}</span>
                        <span className="text-muted-foreground block text-[10px]">
                          Code: {selected.employeeCode} • {selected.primaryRole || selected.department || 'Manager'}
                          {selected.phone ? ` • Tel: ${selected.phone}` : ''}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange('managerId', '')}
                      className="text-[10px] text-rose-400 hover:underline px-1.5 py-0.5"
                    >
                      Clear
                    </button>
                  </div>
                );
              })()}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">Operational Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Warehouse'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
