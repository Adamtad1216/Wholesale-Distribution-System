import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { companiesApi } from '../companiesApi';
import { usePermission } from '../../../hooks/usePermission';
import CompanyFormModal from '../components/CompanyFormModal';
import { useNavigate } from 'react-router-dom';

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
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wide">Loading Enterprise Profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Company Profile
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Master Enterprise
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Core organization identity, legal compliance, tax registrations, and operational branches.
          </p>
        </div>

        {company ? (
          canUpdate && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-indigo-500/20 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 transition-all duration-200 active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Company Profile
            </button>
          )
        ) : (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all duration-200 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Initialize Enterprise Profile
          </button>
        )}
      </div>

      {!company ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4m-4 0H9m4-4H9m4 0H7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">No Enterprise Profile Found</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 mb-6">
            Get started by initializing your primary enterprise company profile with your organization's legal name, TIN, trade license, and headquarters.
          </p>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition"
          >
            Create Company Profile
          </button>
        </div>
      ) : (
        /* Rich Enterprise Profile View */
        <div className="space-y-6">
          {/* Hero Banner Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-indigo-500/20">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-5">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-3xl font-black text-white shadow-inner flex-shrink-0 border-2 border-white/20">
                  {company.name?.charAt(0)?.toUpperCase() || 'E'}
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      {company.name}
                    </h2>
                    <span className="px-3 py-0.5 text-xs font-extrabold uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {company.status || 'ACTIVE'}
                    </span>
                    {company.isVatRegistered && (
                      <span className="px-2.5 py-0.5 text-xs font-extrabold uppercase rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        VAT Registered
                      </span>
                    )}
                  </div>
                  <p className="text-base font-semibold text-indigo-200">
                    {company.legalName || company.name}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <span>Region: <strong className="text-white">{company.region?.name || 'Central'}</strong></span>
                    <span>•</span>
                    <span>TIN: <strong className="text-white">{company.tinNumber || 'N/A'}</strong></span>
                    <span>•</span>
                    <span>License: <strong className="text-white">{company.tradeLicenseNumber || 'N/A'}</strong></span>
                  </p>
                </div>
              </div>

              {canUpdate && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="self-start md:self-auto px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 transition flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Branches</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {company.branchCount || company.branches?.length || 0}
              </p>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1 block">Operational Facilities</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">VAT Compliance</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {company.isVatRegistered ? 'Registered' : 'Exempt'}
              </p>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 block">
                {company.vatRegistrationNumber || 'No VAT Number'}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">TIN Identifier</span>
              <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 truncate">
                {company.tinNumber || 'Pending'}
              </p>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 block">Tax Identity No.</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">License Status</span>
              <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 truncate">
                {company.tradeLicenseNumber || 'Standard'}
              </p>
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-1 block">Verified Entity</span>
            </div>
          </div>

          {/* Profile Details Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Legal & Corporate Identity */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4m-4 0H9m4-4H9m4 0H7" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Corporate Identification
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Trade Name</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{company.name}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Registered Legal Name</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{company.legalName || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Trade License Number</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{company.tradeLicenseNumber || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Enterprise Status</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{company.status || 'ACTIVE'}</p>
                </div>
              </div>
            </div>

            {/* Card 2: Tax & Legal Compliance */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tax & Compliance
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-medium">TIN Number</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{company.tinNumber || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">VAT Registration Status</span>
                  <p className="font-bold mt-0.5">
                    {company.isVatRegistered ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Registered (Subject to VAT)</span>
                    ) : (
                      <span className="text-slate-500 font-semibold">Not Registered</span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">VAT Registration No.</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{company.vatRegistrationNumber || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Operating Region</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {company.region?.name ? `${company.region.name} (${company.region.code || ''})` : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Contact & Communications */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Contact & Communications
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Primary Phone</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{company.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Alternate Phone</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{company.alternatePhone || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Corporate Email</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{company.email || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Official Website</span>
                  {company.website ? (
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5 block truncate"
                    >
                      {company.website}
                    </a>
                  ) : (
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">-</p>
                  )}
                </div>
              </div>
            </div>

            {/* Card 4: Physical Headquarters Location */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Headquarters & Physical Address
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-medium">City / Municipality</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{company.city || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Sub-City</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{company.subCity || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Woreda / Kebele</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {company.woreda ? `Woreda ${company.woreda}` : ''}
                    {company.kebele ? ` / Kebele ${company.kebele}` : ''}
                    {!company.woreda && !company.kebele ? '-' : ''}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">House Number & Landmark</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {company.houseNumber ? `#${company.houseNumber}` : ''}
                    {company.landmark ? ` (${company.landmark})` : ''}
                    {!company.houseNumber && !company.landmark ? '-' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Operational Branches */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4m-4 0H9m4-4H9m4 0H7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Operational Branches & Depots
                  </h3>
                  <p className="text-xs text-slate-400">All registered distribution centers linked to this enterprise.</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/branches')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1"
              >
                Manage Branches
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {company.branches && company.branches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {company.branches.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => navigate('/branches')}
                    className="group cursor-pointer p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {b.name}
                        </h4>
                        <span className="text-xs font-semibold text-slate-400 font-mono">
                          {b.branchCode || b.code || 'BR-FACILITY'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                        {b.status || 'ACTIVE'}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>{b.city || 'Regional Center'}</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">View Details ➔</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic py-4 text-center">
                No active branches linked to this enterprise yet.
              </p>
            )}
          </div>

          {/* Audit Timestamp Footer */}
          <div className="text-xs text-slate-400 dark:text-slate-500 flex flex-wrap items-center justify-between gap-3 px-2 pt-2">
            <span>Enterprise ID: <code className="font-mono text-slate-600 dark:text-slate-300">{company.id}</code></span>
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
