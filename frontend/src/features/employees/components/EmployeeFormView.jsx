import React from 'react';
import { useSelector } from 'react-redux';
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

  const currentUser = useSelector((state) => state.auth?.user);
  const currentRole = useSelector((state) => state.auth?.role);

  const isSelf = Boolean(
    currentUser &&
    editingEmployee &&
    (String(editingEmployee.person?.user?.id) === String(currentUser.id) ||
     String(editingEmployee.personId) === String(currentUser.personId || currentUser.person?.id))
  );

  const isSelfSuperAdmin = Boolean(
    isSelf &&
    (currentRole === 'SUPER_ADMIN' ||
     currentUser?.roles?.some((r) => r.name === 'SUPER_ADMIN' || r.code === 'SUPER_ADMIN' || r === 'SUPER_ADMIN'))
  );

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
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Employee Directory
        </button>
      </div>

      {/* Page Title Banner */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {isEdit ? `Edit Staff Profile: ${getEmployeeName(editingEmployee)}` : 'Onboard New Employee'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isEdit
            ? 'Update job specification, contact information, and account access status.'
            : 'Fill in personnel profile details, select job specification, and configure user account credentials if required.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8" autoComplete="off">
        {/* Hidden dummy fields to absorb aggressive browser credential autofill */}
        <input type="text" name="fake_username_autofill" tabIndex={-1} aria-hidden="true" className="sr-only" autoComplete="off" />
        <input type="password" name="fake_password_autofill" tabIndex={-1} aria-hidden="true" className="sr-only" autoComplete="new-password" />

        {/* Section 1: Employment & Job Specification */}
        <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              1. Employment & Job Specification
            </h3>
            <button
              type="button"
              onClick={handleNavigateToCreateJobSpec}
              className="text-xs font-bold text-foreground bg-violet-400 hover:bg-violet-300 transition flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-violet-300 shadow-sm"
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
              <label className="block text-xs font-semibold text-foreground mb-1.5">Hire Date *</label>
              <input
                type="date"
                required
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Job Specification</label>
              <select
                value={formData.jobSpecificationId}
                onChange={(e) => setFormData({ ...formData, jobSpecificationId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
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
              <label className="block text-xs font-semibold text-foreground mb-1.5">Custom Job Title (If Not Listed)</label>
              <input
                type="text"
                placeholder="e.g. Senior Representative"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Department</label>
              <input
                type="text"
                placeholder="e.g. Logistics, Sales, Operations"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Assigned Branch *</label>
              <select
                required
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
              >
                <option value="">-- Select Assigned Branch * --</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.branchCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Employment Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE" disabled={isSelfSuperAdmin}>
                  {isSelfSuperAdmin ? 'INACTIVE (Disabled: Cannot deactivate own profile)' : 'INACTIVE'}
                </option>
                <option value="SUSPENDED" disabled={isSelfSuperAdmin}>
                  {isSelfSuperAdmin ? 'SUSPENDED (Disabled: Cannot suspend own profile)' : 'SUSPENDED'}
                </option>
              </select>
              {isSelfSuperAdmin && (
                <p className="text-[11px] text-amber-500 mt-1">
                  🔒 As a Super Admin, your own employment status must remain ACTIVE.
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Section 2: Personal Profile & Contact Details */}
        <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-6">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">
            2. Personal Profile & Contact Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">First Name *</label>
              <input
                type="text"
                required
                placeholder="Abebe"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Middle Name</label>
              <input
                type="text"
                placeholder="Kebede"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Last Name *</label>
              <input
                type="text"
                required
                placeholder="Bikila"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="abebe@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Phone Number</label>
              <input
                type="text"
                placeholder="+251 911 223 344"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Residential / Office Address</label>
              <input
                type="text"
                placeholder="Addis Ababa, Bole Subcity"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: User Account & Access Credentials */}
        <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                3. User Account & Access Details
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enable system login credentials and assign security permissions role for this staff member.
              </p>
            </div>

            {/* Checkbox Toggle */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className={`relative inline-flex items-center select-none ${isSelfSuperAdmin ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  disabled={isSelfSuperAdmin}
                  checked={formData.needsUserAccount}
                  onChange={(e) => {
                    if (isSelfSuperAdmin) return;
                    const checked = e.target.checked;
                    setFormData({
                      ...formData,
                      needsUserAccount: checked,
                      password: '', // Explicitly clear any password on toggle
                    });
                  }}
                  className="sr-only"
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors duration-200 relative border shrink-0 ${
                    formData.needsUserAccount
                      ? 'bg-violet-600 border-violet-600 shadow-sm shadow-violet-600/30'
                      : 'bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform duration-200 transform ${
                      formData.needsUserAccount ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="ml-3 text-xs font-semibold text-foreground w-44 text-left">
                  {formData.needsUserAccount ? 'System Account Enabled' : 'No System Account Needed'}
                </span>
              </label>
              {isSelfSuperAdmin && (
                <p className="text-[11px] text-amber-500 mt-0.5">
                  🔒 Super Admin accounts cannot be detached from employee profile.
                </p>
              )}
            </div>
          </div>

          {formData.needsUserAccount && (
            <div className="space-y-4 pt-2 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Username {formData.password ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="text"
                    required={Boolean(formData.password)}
                    placeholder="e.g. abebe.b (optional for invite)"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500 font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {formData.password ? 'Required when setting password directly.' : 'If left blank, employee chooses it via the invite link.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    {isEdit ? 'New Password (Blank = keep current)' : 'Password (Blank = Send Invite)'}
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    placeholder={isEdit ? '••••••••' : 'Leave empty to send invite email'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500 font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {isEdit ? 'Leave blank to preserve current password.' : 'Leave blank to generate an invitation link.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    System Security Role *
                  </label>
                  <select
                    required={formData.needsUserAccount}
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
                  >
                    <option value="">-- Select System Role * --</option>
                    {systemRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} {role.description ? `(${role.description})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Permissions assigned upon invitation acceptance.
                  </p>
                </div>
              </div>

              {/* Informational Guidance Callout */}
              {!isEdit && (
                <div className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                  formData.password
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300'
                    : 'bg-violet-500/10 border-violet-500/20 text-violet-800 dark:text-violet-300'
                }`}>
                  <span className="text-base leading-none mt-0.5">
                    {formData.password ? '🔑' : '✉️'}
                  </span>
                  <div>
                    {formData.password ? (
                      <div>
                        <strong>Manual Credentials Mode:</strong> The user account will be activated immediately with the password specified above.
                      </div>
                    ) : (
                      <div>
                        <strong>Invitation Link Mode:</strong> An invitation link will be sent to{' '}
                        <span className="font-semibold underline">{formData.email || 'the employee\'s email'}</span>.
                        The employee will click the link to set up their own username & password and activate their account.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
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
