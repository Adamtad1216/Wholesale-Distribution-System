import React, { useState, useEffect } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { personsApi } from '../personsApi';
import { toast } from 'react-hot-toast';

export default function UserFormView({
  editingUser,
  formData,
  setFormData,
  submitting,
  handleSubmit,
  handleBackToList,
  rolesList = [],
}) {
  const isEdit = Boolean(editingUser);

  // Top-Down Person Search State for Provisioning Mode
  const [personSearchQuery, setPersonSearchQuery] = useState('');
  const [personResults, setPersonResults] = useState([]);
  const [isSearchingPersons, setIsSearchingPersons] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounced Top-Down Person Search (Only persons WITHOUT a user account)
  useEffect(() => {
    if (isEdit || !personSearchQuery.trim() || selectedPerson) {
      setPersonResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingPersons(true);
        const res = await personsApi.getPersons({
          search: personSearchQuery.trim(),
          hasUserAccount: 'false', // 🔴 Strictly excludes persons who already have a user account
        });
        const personList = res?.data || res || [];
        setPersonResults(Array.isArray(personList) ? personList : []);
        setShowDropdown(Array.isArray(personList) && personList.length > 0);
      } catch (err) {
        console.error('Failed to search person records:', err);
      } finally {
        setIsSearchingPersons(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [personSearchQuery, isEdit, selectedPerson]);

  // Handle selecting a Person to autofill
  const handleSelectPerson = (person) => {
    setSelectedPerson(person);
    setShowDropdown(false);
    
    const fullName = `${person.firstName || ''} ${person.lastName || ''}`.trim();
    const empCode = person.employee?.employeeCode ? ` (${person.employee.employeeCode})` : '';
    setPersonSearchQuery(`${fullName}${empCode}`);

    // Suggested username handle
    const suggestedUsername = person.firstName && person.lastName
      ? `${person.firstName.toLowerCase()}.${person.lastName.charAt(0).toLowerCase()}`
      : (person.firstName?.toLowerCase() || formData.username || '');

    setFormData({
      ...formData,
      personId: person.id,
      firstName: person.firstName || '',
      middleName: person.middleName || '',
      lastName: person.lastName || '',
      email: person.email || '',
      phone: person.phone || '',
      address: person.address || '',
      username: formData.username || suggestedUsername,
    });

    toast.success(`Selected ${fullName} for user provisioning`);
  };

  // Clear selected person
  const handleClearSelectedPerson = () => {
    setSelectedPerson(null);
    setPersonSearchQuery('');
    setPersonResults([]);
    setFormData({
      ...formData,
      personId: null,
    });
  };

  const toggleRoleSelection = (roleId) => {
    const currentRoles = formData.roleIds || [];
    if (currentRoles.includes(roleId)) {
      setFormData({
        ...formData,
        roleIds: currentRoles.filter((id) => id !== roleId),
      });
    } else {
      setFormData({
        ...formData,
        roleIds: [...currentRoles, roleId],
      });
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Back Header */}
      <div className="space-y-3 border-b border-border pb-4">
        <div>
          <button
            type="button"
            onClick={handleBackToList}
            className="px-3 py-1.5 rounded-xl bg-muted800 hover:bg-muted text-foreground border border-border transition inline-flex items-center gap-1.5 text-xs font-semibold"
          >
            ← Back to User Directory
          </button>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? `Edit User Account: @${editingUser.username}` : 'Provision New System User'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure system authentication credentials, personal contact details, and security roles.
          </p>
        </div>
      </div>

      {/* Blank Page Form Container (Left-aligned) */}
      <div className="max-w-4xl">
        {/* Top-Down Person Lookup & Autofill Search Bar (Only shown on Creation) */}
        {!isEdit && (
          <Card className="p-6 border border-indigo-500/30 bg-card900/90 backdrop-blur-xl rounded-2xl shadow-xl space-y-3 mb-6 relative z-20">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <span>🔍</span> Search Existing Person Record (Without User Account)
              </label>
              {selectedPerson && (
                <button
                  type="button"
                  onClick={handleClearSelectedPerson}
                  className="text-xs text-muted-foreground hover:text-rose-400 font-semibold transition"
                >
                  ✕ Clear Selection
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Type name, email, or employee code to search..."
                value={personSearchQuery}
                onChange={(e) => {
                  setPersonSearchQuery(e.target.value);
                  if (selectedPerson) setSelectedPerson(null);
                }}
                className="w-full px-4 py-3 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
              />

              {isSearchingPersons && (
                <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              )}

              {/* Autocomplete Search Dropdown */}
              {showDropdown && personResults.length > 0 && (
                <div
                  className="absolute left-0 right-0 top-full mt-2 border border-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto"
                  style={{ backgroundColor: 'var(--color-card)', opacity: 1 }}
                >
                  {personResults.map((person) => {
                    const fullName = `${person.firstName || ''} ${person.middleName || ''} ${person.lastName || ''}`.trim();
                    const empCode = person.employee?.employeeCode;

                    return (
                      <div
                        key={person.id}
                        onClick={() => handleSelectPerson(person)}
                        className="p-3.5 border-b border-border/50 hover:bg-indigo-600/20 cursor-pointer transition flex items-center justify-between gap-4 bg-card"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{fullName}</span>
                            {empCode ? (
                              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold rounded-md">
                                Employee: {empCode}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px] font-bold rounded-md">
                                Person Record
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Email: {person.email || 'N/A'} • Phone: {person.phone || 'N/A'}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-bold border border-indigo-500/20">
                          Select ↵
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              Searches top-level Person records. Persons who already have an active user account are automatically excluded.
            </p>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Authentication & Credentials */}
          <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-xl space-y-6">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <span>🔐</span> 1. System Account Credentials
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. abebe.b"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  className="w-full px-4 py-3 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Unique login handle used for system access.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  {isEdit ? 'New Password (Leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!isEdit}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Must be at least 8 characters long.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Account Status
                </label>
                <select
                  value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'ACTIVE' })}
                  className="w-full px-4 py-3 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="ACTIVE">ACTIVE (Can log in)</option>
                  <option value="INACTIVE">INACTIVE (Access blocked)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Section 2: Personal Information */}
          <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-xl space-y-6">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <span>👤</span> 2. Personnel Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Abebe"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  placeholder="Kebede"
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  className="w-full px-4 py-3 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Bikila"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="abebe@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+251 911 223 344"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Addis Ababa, Ethiopia"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </Card>

          {/* Section 3: System Roles Assignment */}
          <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-xl space-y-6">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <span>🛡️</span> 3. Security Roles Assignment
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select one or more security roles to grant access permissions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rolesList.map((role) => {
                const isSelected = (formData.roleIds || []).includes(role.id);
                return (
                  <div
                    key={role.id}
                    onClick={() => toggleRoleSelection(role.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500 text-foreground'
                        : 'bg-muted800/40 border-border text-muted-foreground hover:bg-muted800 hover:text-foreground'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-border text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-foreground">{role.name}</div>
                      {role.description && (
                        <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {role.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Form Action Controls */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleBackToList}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting}
              className="px-6 shadow-lg shadow-indigo-500/20"
            >
              {submitting ? 'Saving User Account...' : isEdit ? 'Update User Account' : 'Provision User Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
