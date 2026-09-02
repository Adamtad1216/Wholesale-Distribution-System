import React from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

export default function CustomerFormView({
  viewMode,
  selectedCustomer,
  formData,
  setFormData,
  submitting,
  paymentTerms,
  handleSubmit,
  handleBackToList,
  getCustomerDisplayName,
}) {
  const isEdit = viewMode === 'EDIT';

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Navigation Topbar */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Customers Directory
        </button>
      </div>

      {/* Page Title Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {isEdit ? `Edit Customer Profile: ${getCustomerDisplayName(selectedCustomer)}` : 'Register New B2B Customer'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isEdit
            ? 'Update commercial terms, contact information, and business details.'
            : 'Complete customer onboarding details to generate commercial account and credit line.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Account Type Selector (Creation only) */}
        {!isEdit && (
          <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Select Account Entity Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, customerType: 'ORGANIZATION' })}
                className={`p-5 rounded-xl border text-left flex items-start gap-4 transition ${
                  formData.customerType === 'ORGANIZATION'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold shadow-lg'
                    : 'border-border bg-muted800 text-muted-foreground hover:bg-muted800'
                }`}
              >
                <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <div className="text-base font-bold text-foreground">Organization / Corporate Entity</div>
                  <div className="text-xs text-muted-foreground mt-1 font-normal">
                    For registered commercial businesses, wholesalers, retail chains, and enterprise clients.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, customerType: 'PERSON' })}
                className={`p-5 rounded-xl border text-left flex items-start gap-4 transition ${
                  formData.customerType === 'PERSON'
                    ? 'border-violet-500 bg-violet-500/10 text-violet-300 font-semibold shadow-lg'
                    : 'border-border bg-muted800 text-muted-foreground hover:bg-muted800'
                }`}
              >
                <div className="p-3 bg-violet-500/20 rounded-xl text-violet-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-base font-bold text-foreground">Individual Person</div>
                  <div className="text-xs text-muted-foreground mt-1 font-normal">
                    For sole proprietors, independent traders, or retail buyer accounts.
                  </div>
                </div>
              </button>
            </div>
          </Card>
        )}

        {/* Section 1: Financial & Terms Configuration */}
        <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-6">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">
            1. Commercial & Payment Terms
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Customer Code</label>
              <input
                type="text"
                disabled={isEdit}
                placeholder="Auto-generated (e.g. CUS-M29-V92)"
                value={formData.customerCode}
                onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Credit Limit ($)</label>
              <input
                type="number"
                min="0"
                step="500"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Payment Terms</label>
              <select
                value={formData.paymentTermsId}
                onChange={(e) => setFormData({ ...formData, paymentTermsId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
              >
                <option value="">Default (COD 0 Days)</option>
                {paymentTerms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.days} Days)
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-foreground mb-1.5">Account Status</label>
              <div className="flex items-center gap-4">
                {['ACTIVE', 'INACTIVE', 'SUSPENDED'].map((st) => (
                  <label key={st} className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                    <input
                      type="radio"
                      name="accountStatus"
                      value={st}
                      checked={formData.status === st}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="text-violet-600 focus:ring-violet-500"
                    />
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      st === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : st === 'SUSPENDED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {st}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Entity & Contact Details */}
        <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-6">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">
            2. {formData.customerType === 'ORGANIZATION' ? 'Organization Information' : 'Individual Profile Information'}
          </h3>

          {formData.customerType === 'ORGANIZATION' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Organization Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ethiopian Supply Chain & Wholesale PLC"
                    value={formData.organization.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      organization: { ...formData.organization, name: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Registration Number</label>
                  <input
                    type="text"
                    placeholder="REG-901823"
                    value={formData.organization.registrationNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      organization: { ...formData.organization, registrationNumber: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Tax Identification (TIN)</label>
                  <input
                    type="text"
                    placeholder="TIN-001293"
                    value={formData.organization.taxNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      organization: { ...formData.organization, taxNumber: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Company Email</label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={formData.organization.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      organization: { ...formData.organization, email: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Company Phone</label>
                  <input
                    type="text"
                    placeholder="+251 911 000 222"
                    value={formData.organization.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      organization: { ...formData.organization, phone: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Business Address</label>
                  <input
                    type="text"
                    placeholder="Street, Woreda, City, Region"
                    value={formData.organization.address}
                    onChange={(e) => setFormData({
                      ...formData,
                      organization: { ...formData.organization, address: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {!isEdit && (
                <div className="p-5 bg-muted800 border border-border rounded-xl space-y-4">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Primary Corporate Contact Person</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">First Name</label>
                      <input
                        type="text"
                        placeholder="Abebe"
                        value={formData.organization.contacts[0]?.firstName || ''}
                        onChange={(e) => {
                          const newContacts = [...formData.organization.contacts];
                          newContacts[0] = { ...newContacts[0], firstName: e.target.value };
                          setFormData({ ...formData, organization: { ...formData.organization, contacts: newContacts } });
                        }}
                        className="w-full px-3 py-2 bg-muted800 border border-border rounded-xl text-foreground text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Last Name</label>
                      <input
                        type="text"
                        placeholder="Kebede"
                        value={formData.organization.contacts[0]?.lastName || ''}
                        onChange={(e) => {
                          const newContacts = [...formData.organization.contacts];
                          newContacts[0] = { ...newContacts[0], lastName: e.target.value };
                          setFormData({ ...formData, organization: { ...formData.organization, contacts: newContacts } });
                        }}
                        className="w-full px-3 py-2 bg-muted800 border border-border rounded-xl text-foreground text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Position / Job Title</label>
                      <input
                        type="text"
                        placeholder="Procurement Manager"
                        value={formData.organization.contacts[0]?.position || ''}
                        onChange={(e) => {
                          const newContacts = [...formData.organization.contacts];
                          newContacts[0] = { ...newContacts[0], position: e.target.value };
                          setFormData({ ...formData, organization: { ...formData.organization, contacts: newContacts } });
                        }}
                        className="w-full px-3 py-2 bg-muted800 border border-border rounded-xl text-foreground text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+251 911 333 444"
                        value={formData.organization.contacts[0]?.phone || ''}
                        onChange={(e) => {
                          const newContacts = [...formData.organization.contacts];
                          newContacts[0] = { ...newContacts[0], phone: e.target.value };
                          setFormData({ ...formData, organization: { ...formData.organization, contacts: newContacts } });
                        }}
                        className="w-full px-3 py-2 bg-muted800 border border-border rounded-xl text-foreground text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Hika"
                  value={formData.person.firstName}
                  onChange={(e) => setFormData({
                    ...formData,
                    person: { ...formData.person, firstName: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Middle Name</label>
                <input
                  type="text"
                  placeholder="Wakjira"
                  value={formData.person.middleName}
                  onChange={(e) => setFormData({
                    ...formData,
                    person: { ...formData.person, middleName: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Tolasa"
                  value={formData.person.lastName}
                  onChange={(e) => setFormData({
                    ...formData,
                    person: { ...formData.person, lastName: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Phone Number</label>
                <input
                  type="text"
                  placeholder="0961868196"
                  value={formData.person.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    person: { ...formData.person, phone: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="hika@gmail.com"
                  value={formData.person.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    person: { ...formData.person, email: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-foreground mb-1.5">Physical Address</label>
                <input
                  type="text"
                  placeholder="Nekemte, Oromia, Ethiopia"
                  value={formData.person.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    person: { ...formData.person, address: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Section 3: Portal Login Credentials (Creation Only) */}
        {!isEdit && (
          <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">
              3. Customer Portal Login Credentials (Optional)
            </h3>
            <p className="text-xs text-muted-foreground">
              Generate portal credentials to enable customer self-service ordering and online invoice payment.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Login Username</label>
                <input
                  type="text"
                  placeholder="e.g. hika_client"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Login Password</label>
                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Form Action Controls */}
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
            {submitting ? 'Processing...' : isEdit ? 'Save Customer Changes' : 'Register Customer Account'}
          </Button>
        </div>
      </form>
    </div>
  );
}
