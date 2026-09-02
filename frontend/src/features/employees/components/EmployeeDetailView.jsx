import React from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

export default function EmployeeDetailView({
  selectedEmployee,
  handleBackToList,
  handleOpenEdit,
  handleDelete,
  canUpdate = true,
  canDelete = true,
  getEmployeeName,
  getEmployeeEmail,
  getEmployeePhone,
}) {
  const fullName = getEmployeeName(selectedEmployee);
  const email = getEmployeeEmail(selectedEmployee);
  const phone = getEmployeePhone(selectedEmployee);
  const jobTitle = selectedEmployee?.jobSpecification?.title || selectedEmployee?.jobTitle || 'Staff Member';

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

        <div className="flex items-center gap-3">
          {canUpdate && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleOpenEdit(selectedEmployee)}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
            >
              Edit Profile
            </Button>
          )}

          {canDelete && (
            <Button
              variant="danger"
              size="md"
              onClick={() => handleDelete(selectedEmployee.id, fullName)}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
            >
              Delete Profile
            </Button>
          )}
        </div>
      </div>

      {/* Staff Hero Banner Card */}
      <Card className="p-6 border border-slate-800 bg-slate-900/60 backdrop-blur-xl rounded-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center font-bold text-2xl shrink-0">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-100">{fullName}</h1>
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold badge-slate">
                  {selectedEmployee.employeeCode || `EMP-${selectedEmployee.id?.substring(0, 6)}`}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="text-violet-400 font-semibold">{jobTitle}</span>
                <span>•</span>
                <span>Registered: {selectedEmployee.createdAt ? new Date(selectedEmployee.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-2 ${
              selectedEmployee.status === 'ACTIVE'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : selectedEmployee.status === 'SUSPENDED'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                selectedEmployee.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}></span>
              {selectedEmployee.status || 'ACTIVE'} STATUS
            </span>
          </div>
        </div>
      </Card>

      {/* Profile Info Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card className="p-6 border border-slate-800 bg-slate-900/60 backdrop-blur-xl rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Information
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-800/60">
              <span className="text-slate-400">Email Address</span>
              <span className="font-semibold text-slate-200">{email}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-800/60">
              <span className="text-slate-400">Phone Number</span>
              <span className="font-semibold text-slate-200">{phone}</span>
            </div>
          </div>
        </Card>

        {/* Position & System Metadata */}
        <Card className="p-6 border border-slate-800 bg-slate-900/60 backdrop-blur-xl rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Job & Account Details
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-800/60">
              <span className="text-slate-400">Job Title / Specification</span>
              <span className="font-semibold text-slate-200">{jobTitle}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-800/60">
              <span className="text-slate-400">Employee Code</span>
              <span className="font-mono font-semibold text-slate-200">
                {selectedEmployee.employeeCode || `EMP-${selectedEmployee.id?.substring(0, 6)}`}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-400">Last Profile Update</span>
              <span className="text-slate-300">
                {selectedEmployee.updatedAt ? new Date(selectedEmployee.updatedAt).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
