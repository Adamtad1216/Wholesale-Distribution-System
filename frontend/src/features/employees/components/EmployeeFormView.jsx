import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

export default function EmployeeFormView({
  viewMode,
  editingEmployee,
  formData,
  setFormData,
  submitting,
  handleSubmit,
  handleBackToList,
  getEmployeeName,
  jobSpecifications = [],
  branches = [],
  systemRoles = [],
}) {
  const isEdit = viewMode === 'EDIT';
  const navigate = useNavigate();

  const handleNavigateToCreateJobSpec = () => {
    navigate('/roles', {
      state: {
        createJobSpec: true,
        returnTo: '/employees',
        draftFormData: formData,
        isEditMode: isEdit,
        editingEmployeeId: editingEmployee?.id,
      },
    });
  };

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Top Navigation Control */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-100 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Employee Directory
        </button>
      </div>

      {/* Page Title Banner */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
          {isEdit ? `Edit Staff Profile: ${getEmployeeName(editingEmployee)}` : 'Onboard New Employee'}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {isEdit
            ? 'Update job specification, contact information, and account access status.'
            : 'Fill in personnel profile details, select job specification, and configure user account credentials if required.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Employment & Job Specification */}
        <Card className="p-6 border border-slate-800 bg-slate-900/60 backdrop-blur-xl rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              1. Employment & Job Specification
            </h3>
            <button
              type="button"
              onClick={handleNavigateToCreateJobSpec}
              className="text-xs font-bold text-slate-950 bg-violet-400 hover:bg-violet-300 transition flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-violet-300 shadow-sm"
              title="Create a new job specification page and auto-return"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              + Create Job Specification
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Employee Code</label>
              <input
                type="text"
                placeholder="Auto-generated if empty (e.g. EMP-001)"
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hire Date *</label>
              <input
                type="date"
                required
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Job Specification</label>
              <select
                value={formData.jobSpecificationId}
                onChange={(e) => setFormData({ ...formData, jobSpecificationId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500"
              >
                <option value="">-- Select Job Specification --</option>
                {jobSpecifications.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.title} ({spec.department || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Custom Job Title (If Not Listed)</label>
              <input
                type="text"
                placeholder="e.g. Senior Representative"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Department</label>
              <input
                type="text"
                placeholder="e.g. Logistics, Sales, Operations"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            {branches.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assigned Branch</label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500"
                >
                  <option value="">-- Main Branch / Default --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.branchCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Employment Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Section 2: Personal Profile & Contact Details */}
        <Card className="p-6 border border-slate-800 bg-slate-900/60 backdrop-blur-xl rounded-2xl space-y-6">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3">
            2. Personal Profile & Contact Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">First Name *</label>
              <input
                type="text"
                required
                placeholder="Abebe"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Middle Name</label>
              <input
                type="text"
                placeholder="Kebede"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Last Name *</label>
              <input
                type="text"
                required
                placeholder="Bikila"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="abebe@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
              <input
                type="text"
                placeholder="+251 911 223 344"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Residential / Office Address</label>
              <input
                type="text"
                placeholder="Addis Ababa, Bole Subcity"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: User Account & Access Credentials */}
        <Card className="p-6 border border-slate-800 bg-slate-900/60 backdrop-blur-xl rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                3. User Account & Access Details
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Enable system login credentials and assign security permissions role for this staff member.
              </p>
            </div>

            {/* Checkbox Toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.needsUserAccount}
                onChange={(e) => setFormData({ ...formData, needsUserAccount: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
              <span className="ml-3 text-xs font-semibold text-slate-200">
                {formData.needsUserAccount ? 'System Account Enabled' : 'No System Account Needed'}
              </span>
            </label>
          </div>

          {formData.needsUserAccount && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username *</label>
                <input
                  type="text"
                  required={formData.needsUserAccount}
                  placeholder="e.g. abebe.b"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isEdit ? 'New Password (Leave blank to keep unchanged)' : 'Initial Password *'}
                </label>
                <input
                  type="password"
                  required={formData.needsUserAccount && !isEdit}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">System Security Role</label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500"
                >
                  <option value="">-- Select System Role --</option>
                  {systemRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} {role.description ? `(${role.description})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </Card>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleBackToList}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={submitting}
          >
            {submitting ? 'Processing...' : isEdit ? 'Save Employee Changes' : 'Register Staff Account'}
          </Button>
        </div>
      </form>
    </div>
  );
}
