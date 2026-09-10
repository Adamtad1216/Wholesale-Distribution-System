import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { companiesApi } from '../companiesApi';
import { usePermission } from '../../../hooks/usePermission';
import CompanyFormModal from '../components/CompanyFormModal';
import Button from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Shield,
  Phone,
  MapPin,
  GitBranch,
  Edit3,
  Plus,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Globe,
} from 'lucide-react';

export default function CompaniesPage() {
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { can: canUpdate } = usePermission(['companies:update', 'branches:update', 'ADMIN']);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [compRes, regRes] = await Promise.allSettled([
        companiesApi.getCompanies({ limit: 10 }),
        companiesApi.getRegions({ limit: 100 }),
      ]);

      if (compRes.status === 'fulfilled') {
        const d = compRes.value?.data || compRes.value || [];
        const list = Array.isArray(d) ? d : d.companies || d.items || [];
        // Single enterprise company profile
        setCompany(list[0] || null);
      }
      if (regRes.status === 'fulfilled') {
        const d = regRes.value?.data || regRes.value || [];
        setRegions(Array.isArray(d) ? d : d.regions || d.items || []);
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to load enterprise company profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveCompany = async (data) => {
    setSubmitting(true);
    try {
      if (company?.id) {
        await companiesApi.updateCompany(company.id, data);
        toast.success('Enterprise company profile updated successfully');
      } else {
        await companiesApi.createCompany(data);
        toast.success('Enterprise profile created successfully');
      }
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Failed to save company profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 rounded-full absolute" />
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-normal text-foreground">Loading Enterprise Profile</p>
            <p className="text-xs text-muted-foreground mt-0.5">Fetching organization data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-normal text-foreground tracking-tight flex items-center gap-3">
            <span>Company Profile</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Core organization identity, legal compliance, tax registrations, and operational branches.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-slate-50 dark:hover:bg-muted800 text-muted-foreground hover:text-foreground transition flex items-center gap-2 text-xs font-normal"
            title="Refresh enterprise profile data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
            <span className="hidden sm:inline">Sync Data</span>
          </button>

          {company ? (
            canUpdate && (
              <Button
                variant="primary"
                size="md"
                icon={<Edit3 className="w-4 h-4" />}
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Profile
              </Button>
            )
          ) : (
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Initialize Profile
            </Button>
          )}
        </div>
      </div>

      {!company ? (
        /* Empty State */
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-500/20">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-normal text-foreground mb-1">No Enterprise Profile Found</h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mb-5 leading-relaxed">
            Get started by initializing your primary enterprise company profile with your organization&apos;s legal name, TIN, trade license, and headquarters.
          </p>
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsEditModalOpen(true)}
          >
            Create Company Profile
          </Button>
        </div>
      ) : (
        /* Enterprise Profile View */
        <div className="space-y-6">
          {/* Main Organization Identity Banner */}
          <div className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-start sm:items-center gap-4">
                <div className="relative w-16 h-16 shrink-0">
                  <div className="w-full h-full rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl font-normal shadow-xs">
                    {company.name?.charAt(0)?.toUpperCase() || 'E'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center text-white">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-normal tracking-tight text-foreground">
                      {company.name}
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-normal uppercase rounded-full border ${
                        company.status === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                      }`}
                    >
                      {company.status || 'ACTIVE'}
                    </span>
                    {company.isVatRegistered && (
                      <span className="px-2.5 py-0.5 text-xs font-normal uppercase rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                        VAT Registered
                      </span>
                    )}
                  </div>

                  {company.legalName && company.legalName !== company.name && (
                    <p className="text-xs sm:text-sm text-muted-foreground font-normal">
                      Legal Entity: {company.legalName}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-normal pt-0.5">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      {company.region?.name || 'Central Region'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      {(company.branches?.length || 0)} Operational Facilities
                    </span>
                  </div>
                </div>
              </div>

              {canUpdate && (
                <Button
                  variant="outline"
                  size="md"
                  icon={<Edit3 className="w-4 h-4" />}
                  onClick={() => setIsEditModalOpen(true)}
                  className="self-start sm:self-auto shrink-0"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Two Non-Overlapping Panels (NO DUPLICATED DATA) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Panel 1: Legal & Tax Registration */}
            <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-slate-50/60 dark:bg-muted800/30">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-normal text-foreground">Legal & Tax Registration</h3>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-xs text-muted-foreground font-normal block mb-1">Registered Legal Name</span>
                  <p className="font-normal text-foreground">{company.legalName || company.name || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-normal block mb-1">Trade License Number</span>
                  <p className="font-normal text-foreground font-mono font-medium">{company.tradeLicenseNumber || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-normal block mb-1">Taxpayer Identification (TIN)</span>
                  <p className="font-normal text-foreground font-mono font-medium">{company.tinNumber || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-normal block mb-1">VAT Registration</span>
                  <p className="font-normal text-foreground">
                    {company.isVatRegistered ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-normal">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-mono">{company.vatRegistrationNumber || 'Registered'}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Exempt / Not Registered</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Panel 2: Contact & Headquarters */}
            <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-slate-50/60 dark:bg-muted800/30">
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-500/20 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-normal text-foreground">Contact & Headquarters</h3>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-xs text-muted-foreground font-normal block mb-1">Telephone Contacts</span>
                  <p className="font-normal text-foreground">
                    {company.phone || '—'}
                    {company.alternatePhone && ` • ${company.alternatePhone}`}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-normal block mb-1">Corporate Email</span>
                  <p className="font-normal text-foreground truncate">{company.email || '—'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-normal block mb-1">Official Website</span>
                  {company.website ? (
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-normal text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 truncate"
                    >
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{company.website}</span>
                    </a>
                  ) : (
                    <p className="font-normal text-foreground">—</p>
                  )}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-normal block mb-1">Physical Headquarters</span>
                  <p className="font-normal text-foreground leading-relaxed">
                    {[
                      company.city,
                      company.subCity,
                      company.woreda ? `Woreda ${company.woreda}` : null,
                      company.kebele ? `Kebele ${company.kebele}` : null,
                      company.houseNumber ? `#${company.houseNumber}` : null,
                      company.landmark ? `(${company.landmark})` : null,
                    ]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Branches Section */}
          <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-slate-50/60 dark:bg-muted800/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center">
                  <GitBranch className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-normal text-foreground">Operational Facilities & Hubs</h3>
                  <p className="text-xs text-muted-foreground font-normal">Registered branch facilities associated with this enterprise.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/branches')}
                className="text-xs font-normal text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-slate-50 dark:hover:bg-muted800 transition"
              >
                Manage Branches
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5">
              {company.branches && company.branches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {company.branches.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => navigate('/branches')}
                      className="group cursor-pointer p-4 rounded-xl bg-card hover:bg-slate-50/70 dark:hover:bg-muted800/30 border border-border hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0">
                          <h4 className="font-normal text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {b.name}
                          </h4>
                          <span className="text-xs font-normal text-muted-foreground font-mono">
                            {b.branchCode || b.code || 'BR-FACILITY'}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[11px] font-normal rounded-full border shrink-0 ml-2 ${
                            b.status === 'ACTIVE'
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                              : 'bg-slate-100 dark:bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {b.status || 'ACTIVE'}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-border/60 text-xs text-muted-foreground flex items-center justify-between font-normal">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {b.city || 'Regional Center'}
                        </span>
                        <span className="font-normal text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          Details <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 border border-blue-100 dark:border-blue-500/20">
                    <GitBranch className="w-6 h-6" />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-normal">No operational branches linked yet.</p>
                  <button
                    type="button"
                    onClick={() => navigate('/branches')}
                    className="mt-2 text-xs font-normal text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Go to Branch Management →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Audit Footprint */}
          <div className="text-xs text-muted-foreground flex flex-wrap items-center justify-end gap-3 px-1 font-normal">
            <span>
              Last Updated: {company.updatedAt ? new Date(company.updatedAt).toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      <CompanyFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveCompany}
        company={company}
        regions={regions}
        submitting={submitting}
      />
    </div>
  );
}
