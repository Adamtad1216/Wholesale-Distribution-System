import React from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

export default function CompanyDetailModal({
  isOpen = false,
  onClose,
  company = null,
  onEdit,
  canUpdate = false,
}) {
  if (!isOpen || !company) return null;

  const creatorName = company.createdBy?.person
    ? `${company.createdBy.person.firstName || ''} ${company.createdBy.person.lastName || ''}`.trim()
    : null;

  const updaterName = company.updatedBy?.person
    ? `${company.updatedBy.person.firstName || ''} ${company.updatedBy.person.lastName || ''}`.trim()
    : null;

  const branches = Array.isArray(company.branches) ? company.branches : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={company.name}
      subtitle={company.legalName || 'Corporate Enterprise Profile'}
      icon="🏛️"
      maxWidth="max-w-2xl"
      scope="workspace"
      footer={
        <div className="flex items-center justify-between w-full">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              company.status === 'ACTIVE'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-700/20 text-slate-400 border border-slate-700/40'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                company.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-400'
              }`}
            />
            {company.status || 'ACTIVE'}
          </span>

          <div className="flex items-center gap-2.5">
            <Button variant="secondary" size="md" onClick={onClose}>
              Close
            </Button>
            {canUpdate && (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  onClose();
                  if (onEdit) onEdit(company);
                }}
              >
                Edit Enterprise
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Tax & Regulatory Compliance Card */}
        <div className="p-3.5 rounded-xl bg-muted800/40 border border-border space-y-2.5">
          <h4 className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>📑</span> Legal & Tax Identification
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                company.isVatRegistered
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-muted800 text-muted-foreground border border-border'
              }`}
            >
              {company.isVatRegistered ? 'VAT Registered' : 'Non-VAT Entity'}
            </span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
            <div className="p-2 rounded-lg bg-muted900 border border-border/80">
              <span className="text-[10px] text-muted-foreground font-sans block">TIN Number</span>
              <strong className="text-foreground text-xs">{company.tinNumber || 'Not recorded'}</strong>
            </div>

            <div className="p-2 rounded-lg bg-muted900 border border-border/80">
              <span className="text-[10px] text-muted-foreground font-sans block">Trade License</span>
              <strong className="text-foreground text-xs">{company.tradeLicenseNumber || 'Not recorded'}</strong>
            </div>

            <div className="p-2 rounded-lg bg-muted900 border border-border/80">
              <span className="text-[10px] text-muted-foreground font-sans block">VAT Registration</span>
              <strong className="text-foreground text-xs">{company.vatRegistrationNumber || (company.isVatRegistered ? 'Yes' : 'None')}</strong>
            </div>
          </div>
        </div>

        {/* Location & Contact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Address */}
          <div className="p-3.5 rounded-xl bg-muted800/30 border border-border space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>📍</span> Corporate Headquarters
            </h4>
            <div className="space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Region:</span>
                <strong className="text-foreground">{company.region?.name || '—'}</strong>
              </div>
              <div className="flex justify-between">
                <span>City:</span>
                <span className="text-foreground">{company.city || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Sub-City / Woreda:</span>
                <span className="text-foreground">
                  {[company.subCity, company.woreda].filter(Boolean).join(' / ') || '—'}
                </span>
              </div>
              {company.kebele && (
                <div className="flex justify-between">
                  <span>Kebele / House:</span>
                  <span className="text-foreground">
                    {[company.kebele, company.houseNumber].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-3.5 rounded-xl bg-muted800/30 border border-border space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>📞</span> Official Communication
            </h4>
            <div className="space-y-1.5 text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>Primary Phone:</span>
                <span className="font-mono text-foreground">{company.phone || '—'}</span>
              </div>
              {company.alternatePhone && (
                <div className="flex justify-between items-center">
                  <span>Alt. Phone:</span>
                  <span className="font-mono text-foreground">{company.alternatePhone}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span>Email Address:</span>
                <span className="text-foreground">{company.email || '—'}</span>
              </div>
              {company.website && (
                <div className="flex justify-between items-center">
                  <span>Website:</span>
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {company.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Operating Branches List */}
        <div className="p-3.5 rounded-xl bg-muted800/40 border border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>🏢</span> Operating Branches Under This Enterprise
            </h4>
            <span className="text-[11px] text-muted-foreground font-mono">
              {branches.length} {branches.length === 1 ? 'branch' : 'branches'}
            </span>
          </div>

          {branches.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {branches.map((b, idx) => (
                <div
                  key={b.id || idx}
                  className="p-2.5 rounded-lg bg-muted900 border border-border flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{b.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted800 text-muted-foreground border border-border">
                      {b.branchCode || b.code}
                    </span>
                    {b.isHeadOffice && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase">
                        HQ
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                      b.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-slate-700/20 text-slate-400'
                    }`}
                  >
                    {b.status || 'ACTIVE'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-muted-foreground bg-muted900/60 rounded-lg border border-dashed border-border text-[11px]">
              No branches registered under this enterprise yet.
            </div>
          )}
        </div>

        {/* System Audit */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-3 gap-2">
          <div className="flex items-center gap-3">
            {creatorName && (
              <span>
                Created by: <strong className="text-foreground">{creatorName}</strong>
              </span>
            )}
            {updaterName && (
              <span>
                Updated by: <strong className="text-foreground">{updaterName}</strong>
              </span>
            )}
          </div>
          <div>
            <span>Added: {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}</span>
            {company.updatedAt && (
              <span className="ml-2">
                (Updated: {new Date(company.updatedAt).toLocaleDateString()})
              </span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
