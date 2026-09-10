import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { branchesApi } from '../branchesApi';

export default function BranchFormModal({
  isOpen = false,
  onClose,
  onSave,
  branch = null,
  companies = [],
  regions = [],
  employees = [],
  submitting = false,
}) {
  const isEdit = Boolean(branch && branch.id);

  const [formData, setFormData] = useState({
    companyId: '',
    branchCode: '',
    name: '',
    isHeadOffice: false,
    regionId: '',
    city: '',
    subCity: '',
    woreda: '',
    kebele: '',
    houseNumber: '',
    landmark: '',
    managerId: '',
    phone: '',
    email: '',
    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState({});
  const [managers, setManagers] = useState(employees);
  const [loadingManagers, setLoadingManagers] = useState(false);

  // Fetch eligible branch managers dynamically
  useEffect(() => {
    if (employees && employees.length > 0) {
      setManagers(employees);
    } else if (isOpen) {
      setLoadingManagers(true);
      branchesApi.getEligibleBranchManagers()
        .then((res) => {
          const list = res?.data || res || [];
          setManagers(Array.isArray(list) ? list : []);
        })
        .catch(() => {})
        .finally(() => setLoadingManagers(false));
    }
  }, [isOpen, employees]);

  useEffect(() => {
    if (branch) {
      const currentMgrId =
        branch.managerAssignments?.find((a) => a.isCurrent)?.employeeId ||
        branch.manager?.id ||
        branch.managerId ||
        '';

      setFormData({
        companyId: branch.companyId || (companies[0]?.id || ''),
        branchCode: branch.branchCode || branch.code || '',
        name: branch.name || '',
        isHeadOffice: Boolean(branch.isHeadOffice),
        regionId: branch.regionId || '',
        city: branch.city || '',
        subCity: branch.subCity || '',
        woreda: branch.woreda || '',
        kebele: branch.kebele || '',
        houseNumber: branch.houseNumber || '',
        landmark: branch.landmark || '',
        managerId: currentMgrId,
        phone: branch.phone || '',
        email: branch.email || '',
        status: branch.status || 'ACTIVE',
      });
    } else {
      setFormData({
        companyId: companies[0]?.id || '',
        branchCode: '',
        name: '',
        isHeadOffice: false,
        regionId: regions[0]?.id || '',
        city: '',
        subCity: '',
        woreda: '',
        kebele: '',
        houseNumber: '',
        landmark: '',
        managerId: '',
        phone: '',
        email: '',
        status: 'ACTIVE',
      });
    }
    setErrors({});
  }, [branch, isOpen, companies, regions]);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name?.trim()) errs.name = 'Branch name is required';
    if (!formData.branchCode?.trim()) errs.branchCode = 'Branch code is required';
    if (!formData.regionId) errs.regionId = 'Region is required';
    if (!formData.companyId) errs.companyId = 'Company / Enterprise is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstError = Object.values(errs)[0];
      toast.error(firstError);
    }
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
      title={isEdit ? `Edit Branch: ${branch.name}` : 'Register New Branch'}
      subtitle={isEdit ? 'Modify branch details and regional assignment' : 'Add a new regional office or facility hub'}
      icon="🏢"
      maxWidth="max-w-2xl"
      scope="workspace"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Basic Identity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Company / Enterprise <span className="text-rose-400">*</span>
            </label>
            <select
              value={formData.companyId}
              onChange={(e) => handleChange('companyId', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select Company...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.companyId && <p className="text-[10px] text-rose-400 mt-1">{errors.companyId}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Branch Code <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.branchCode}
              onChange={(e) => handleChange('branchCode', e.target.value.toUpperCase())}
              placeholder="e.g. BR-ADDIS-01"
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.branchCode && <p className="text-[10px] text-rose-400 mt-1">{errors.branchCode}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Branch Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Addis Ababa Central Branch"
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.name && <p className="text-[10px] text-rose-400 mt-1">{errors.name}</p>}
          </div>
        </div>

        {/* Head Office & Status */}
        <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-muted800/50 border border-border gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isHeadOffice}
              onChange={(e) => handleChange('isHeadOffice', e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <span className="font-semibold text-foreground block">Head Office (HQ)</span>
              <span className="text-[10px] text-muted-foreground block">Designate as principal headquarters facility</span>
            </div>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-foreground">Status:</span>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        {/* Regional & Physical Location */}
        <div className="space-y-3 pt-1 border-t border-border">
          <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            Location & Geographic Region
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

            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">Woreda / Kebele</label>
              <input
                type="text"
                value={formData.woreda}
                onChange={(e) => handleChange('woreda', e.target.value)}
                placeholder="e.g. Woreda 03"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">House Number</label>
              <input
                type="text"
                value={formData.houseNumber}
                onChange={(e) => handleChange('houseNumber', e.target.value)}
                placeholder="e.g. 1024"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">Nearby Landmark</label>
              <input
                type="text"
                value={formData.landmark}
                onChange={(e) => handleChange('landmark', e.target.value)}
                placeholder="e.g. Near Medhanialem Mall"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Management & Contact */}
        <div className="space-y-3 pt-1 border-t border-border">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
              Leadership & Communication
            </h4>
            {loadingManagers && (
              <span className="text-[10px] text-muted-foreground animate-pulse">
                Loading managers...
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">
                Branch Manager
              </label>
              <select
                value={formData.managerId}
                onChange={(e) => handleChange('managerId', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Unassigned (Select Employee)</option>
                {managers.map((emp) => {
                  const empName = emp.name || (emp.person
                    ? `${emp.person.firstName || ''} ${emp.person.lastName || ''}`.trim()
                    : emp.employeeCode || emp.id);
                  const role = emp.primaryRole || emp.department || 'Employee';
                  const branchNote = emp.currentBranch
                    ? ` • Currently at ${emp.currentBranch}`
                    : '';
                  return (
                    <option key={emp.id} value={emp.id}>
                      {empName} ({emp.employeeCode || 'EMP'}) — {role}{branchNote}
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
              <label className="block text-[11px] font-medium text-foreground mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+251 91 234 5678"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="branch@company.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Branch'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
