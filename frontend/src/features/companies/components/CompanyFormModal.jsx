import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function CompanyFormModal({
  isOpen = false,
  onClose,
  onSave,
  company = null,
  regions = [],
  submitting = false,
}) {
  const isEdit = Boolean(company && company.id);

  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    tradeLicenseNumber: '',
    tinNumber: '',
    vatRegistrationNumber: '',
    isVatRegistered: false,
    phone: '',
    alternatePhone: '',
    email: '',
    website: '',
    regionId: '',
    city: '',
    subCity: '',
    woreda: '',
    kebele: '',
    houseNumber: '',
    landmark: '',
    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        legalName: company.legalName || '',
        tradeLicenseNumber: company.tradeLicenseNumber || '',
        tinNumber: company.tinNumber || '',
        vatRegistrationNumber: company.vatRegistrationNumber || '',
        isVatRegistered: Boolean(company.isVatRegistered),
        phone: company.phone || '',
        alternatePhone: company.alternatePhone || '',
        email: company.email || '',
        website: company.website || '',
        regionId: company.regionId || (regions[0]?.id || ''),
        city: company.city || '',
        subCity: company.subCity || '',
        woreda: company.woreda || '',
        kebele: company.kebele || '',
        houseNumber: company.houseNumber || '',
        landmark: company.landmark || '',
        status: company.status || 'ACTIVE',
      });
    } else {
      setFormData({
        name: '',
        legalName: '',
        tradeLicenseNumber: '',
        tinNumber: '',
        vatRegistrationNumber: '',
        isVatRegistered: false,
        phone: '',
        alternatePhone: '',
        email: '',
        website: '',
        regionId: regions[0]?.id || '',
        city: '',
        subCity: '',
        woreda: '',
        kebele: '',
        houseNumber: '',
        landmark: '',
        status: 'ACTIVE',
      });
    }
    setErrors({});
  }, [company, isOpen, regions]);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name?.trim()) errs.name = 'Company name is required';
    if (!formData.regionId) errs.regionId = 'Region is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Company: ${company.name}` : 'Register New Enterprise'}
      subtitle={isEdit ? 'Modify corporate identity and tax registration' : 'Establish a new parent corporate or subsidiary entity'}
      icon="🏛️"
      maxWidth="max-w-2xl"
      scope="workspace"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Core Identity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Company / Brand Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Acme Wholesale Distribution PLC"
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.name && <p className="text-[10px] text-rose-400 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Official Legal Name
            </label>
            <input
              type="text"
              value={formData.legalName}
              onChange={(e) => handleChange('legalName', e.target.value)}
              placeholder="e.g. Acme Wholesale Distribution Private Limited Co."
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Tax & Regulatory Compliance */}
        <div className="p-3.5 rounded-xl bg-muted800/40 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] uppercase tracking-wider font-semibold text-foreground flex items-center gap-1.5">
              <span>📑</span> Tax & Trade Credentials
            </h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVatRegistered}
                onChange={(e) => handleChange('isVatRegistered', e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs font-semibold text-foreground">VAT Registered</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">TIN Number</label>
              <input
                type="text"
                value={formData.tinNumber}
                onChange={(e) => handleChange('tinNumber', e.target.value.trim())}
                placeholder="10-digit TIN"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">Trade License No.</label>
              <input
                type="text"
                value={formData.tradeLicenseNumber}
                onChange={(e) => handleChange('tradeLicenseNumber', e.target.value.trim())}
                placeholder="TL-0012345"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">VAT Reg. Number</label>
              <input
                type="text"
                value={formData.vatRegistrationNumber}
                onChange={(e) => handleChange('vatRegistrationNumber', e.target.value.trim())}
                placeholder="VAT-987654"
                disabled={!formData.isVatRegistered}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Region & Address */}
        <div className="space-y-3 pt-1 border-t border-border">
          <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            Headquarters Location
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
                    {r.name}
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
                placeholder="e.g. Kirkos"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">Woreda / Kebele</label>
              <input
                type="text"
                value={formData.woreda}
                onChange={(e) => handleChange('woreda', e.target.value)}
                placeholder="e.g. Woreda 05"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">House Number</label>
              <input
                type="text"
                value={formData.houseNumber}
                onChange={(e) => handleChange('houseNumber', e.target.value)}
                placeholder="e.g. 502"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
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

        {/* Contact Info */}
        <div className="space-y-3 pt-1 border-t border-border">
          <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            Contact & Online Presence
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">Primary Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+251 11 555 1234"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="info@acme.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">Website URL</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://acmewholesale.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Enterprise'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
