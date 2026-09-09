import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, ExternalLink, X } from 'lucide-react';
import { useEmployees } from '../hooks/useEmployees';
import EmployeeHeader from '../components/EmployeeHeader';
import EmployeeStats from '../components/EmployeeStats';
import EmployeeFilters from '../components/EmployeeFilters';
import EmployeeListTable from '../components/EmployeeListTable';
import EmployeeFormView from '../components/EmployeeFormView';
import EmployeeDetailView from '../components/EmployeeDetailView';
import Button from '../../../components/ui/Button';

export default function EmployeesPage() {
  const [copied, setCopied] = useState(false);
  const {
    employees,
    jobSpecifications,
    branches,
    systemRoles,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    viewMode,
    editingEmployee,
    canCreate,
    canUpdate,
    canDelete,
    formData,
    setFormData,
    submitting,
    stats,
    fetchEmployees,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleBackToList,
    handleSubmit,
    handleDelete,
    getEmployeeName,
    getEmployeeEmail,
    getEmployeePhone,
    isSelfSuperAdminEmployee,
    invitationBanner,
    setInvitationBanner,
  } = useEmployees();

  const handleCopyLink = () => {
    if (invitationBanner?.link) {
      navigator.clipboard.writeText(invitationBanner.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // RENDER: CREATE / EDIT FULL PAGE VIEW
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'CREATE' || viewMode === 'EDIT') {
    return (
      <EmployeeFormView
        viewMode={viewMode}
        editingEmployee={editingEmployee}
        formData={formData}
        setFormData={setFormData}
        submitting={submitting}
        handleSubmit={handleSubmit}
        handleBackToList={handleBackToList}
        getEmployeeName={getEmployeeName}
        jobSpecifications={jobSpecifications}
        branches={branches}
        systemRoles={systemRoles}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER: VIEW EMPLOYEE DETAILS FULL PAGE VIEW
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'DETAIL' && editingEmployee) {
    return (
      <EmployeeDetailView
        selectedEmployee={editingEmployee}
        handleBackToList={handleBackToList}
        handleOpenEdit={handleOpenEdit}
        handleDelete={handleDelete}
        canUpdate={canUpdate}
        canDelete={canDelete}
        getEmployeeName={getEmployeeName}
        getEmployeeEmail={getEmployeeEmail}
        getEmployeePhone={getEmployeePhone}
        isSelfSuperAdminEmployee={isSelfSuperAdminEmployee}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER: DEFAULT EMPLOYEE DIRECTORY LIST
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Non-modal Invitation Success Banner */}
      {invitationBanner && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-600/15 via-indigo-600/10 to-violet-600/15 border border-violet-500/30 text-foreground shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="text-sm font-bold flex items-center gap-2 flex-wrap">
                <span>Invitation Link Successfully Created!</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Email Dispatched
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                An invitation email has been sent to <strong className="text-foreground">{invitationBanner.email}</strong> for {invitationBanner.name}. You can also copy or test the link directly:
              </p>
              <div className="flex items-center gap-2 max-w-2xl pt-0.5">
                <input
                  type="text"
                  readOnly
                  value={invitationBanner.link}
                  onClick={(e) => e.target.select()}
                  className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs font-mono text-foreground select-all outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                  title="Click to select full URL"
                />
                <Button
                  size="sm"
                  variant={copied ? 'success' : 'primary'}
                  onClick={handleCopyLink}
                  icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  className="shrink-0 font-semibold"
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(invitationBanner.link, '_blank')}
                  iconRight={<ExternalLink className="w-3.5 h-3.5" />}
                  className="shrink-0"
                >
                  Open Page
                </Button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setInvitationBanner(null)}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition shrink-0 self-start md:self-center cursor-pointer"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <EmployeeHeader
        canCreate={canCreate}
        onAddEmployee={handleOpenCreate}
      />

      {/* Summary KPI Cards */}
      <EmployeeStats stats={stats} />

      {/* Filter and Search Bar */}
      <EmployeeFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        fetchEmployees={fetchEmployees}
      />

      {/* Employees Table */}
      <EmployeeListTable
        employees={employees}
        loading={loading}
        search={search}
        handleOpenDetail={handleOpenDetail}
        handleOpenEdit={handleOpenEdit}
        handleDelete={handleDelete}
        canUpdate={canUpdate}
        canDelete={canDelete}
        getEmployeeName={getEmployeeName}
        getEmployeeEmail={getEmployeeEmail}
        getEmployeePhone={getEmployeePhone}
        isSelfSuperAdminEmployee={isSelfSuperAdminEmployee}
      />
    </div>
  );
}
