import React from 'react';
import Card from '../../../components/ui/Card';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';

export default function EmployeeListTable({
  employees,
  loading,
  search,
  handleOpenDetail,
  handleOpenEdit,
  handleDelete,
  canUpdate = true,
  canDelete = true,
  getEmployeeName,
  getEmployeeEmail,
  getEmployeePhone,
}) {
  if (loading) {
    return (
      <Card className="p-12 text-center text-muted-foreground text-sm rounded-2xl border border-border bg-card900 backdrop-blur-xl">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading workforce profiles...</span>
        </div>
      </Card>
    );
  }

  if (employees.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground text-sm rounded-2xl border border-border bg-card900 backdrop-blur-xl space-y-3">
        <svg className="w-12 h-12 mx-auto text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-foreground font-semibold text-base">No employees found</p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          {search ? 'Try adjusting your search terms.' : 'Click "Add Employee" to register a staff profile.'}
        </p>
      </Card>
    );
  }

  return (
    <Table containerClassName="rounded-2xl border border-border bg-card900 backdrop-blur-xl">
      <TableHeader>
        <TableRow>
          <TableHead>Employee / Code</TableHead>
          <TableHead>Job Title / Spec</TableHead>
          <TableHead>Contact Info</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-left">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((emp) => {
          const fullName = getEmployeeName(emp);
          const email = getEmployeeEmail(emp);
          const phone = getEmployeePhone(emp);
          const jobTitle = emp.jobSpecification?.title || emp.jobTitle || 'Staff Member';

          return (
            <TableRow key={emp.id}>
              {/* Name & Code */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <button
                      onClick={() => handleOpenDetail(emp)}
                      className="font-semibold text-foreground hover:text-violet-400 text-left transition"
                    >
                      {fullName}
                    </button>
                    <div className="mt-0.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium badge-slate">
                        {emp.employeeCode || `EMP-${emp.id?.substring(0, 6)}`}
                      </span>
                    </div>
                  </div>
                </div>
              </TableCell>

              {/* Job Title */}
              <TableCell>
                <div className="font-medium text-foreground text-sm">{jobTitle}</div>
              </TableCell>

              {/* Contact Info */}
              <TableCell>
                <div className="space-y-0.5 text-xs text-foreground">
                  {email !== '-' && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{email}</span>
                    </div>
                  )}
                  {phone !== '-' && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{phone}</span>
                    </div>
                  )}
                  {email === '-' && phone === '-' && <span className="text-muted-foreground">-</span>}
                </div>
              </TableCell>

              {/* Status */}
              <TableCell>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                  emp.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : emp.status === 'SUSPENDED'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    emp.status === 'ACTIVE' ? 'bg-emerald-400' : emp.status === 'SUSPENDED' ? 'bg-rose-400' : 'bg-amber-400'
                  }`}></span>
                  {emp.status || 'ACTIVE'}
                </span>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-left">
                <div className="flex items-center justify-start gap-2">
                  {/* View Button */}
                  <button
                    onClick={() => handleOpenDetail(emp)}
                    title="View Full Profile"
                    className="px-2.5 py-1.5 bg-muted800 hover:bg-muted700 border border-border rounded-xl text-foreground hover: font-semibold text-xs inline-flex items-center gap-1.5 transition shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>View</span>
                  </button>

                  {/* Edit Button */}
                  {canUpdate && (
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      title="Edit Profile"
                      className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400 hover:text-indigo-300 font-semibold text-xs inline-flex items-center gap-1.5 transition shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                  )}

                  {/* Delete Button */}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(emp.id, fullName)}
                      title="Delete Employee"
                      className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 hover:text-rose-300 font-semibold text-xs inline-flex items-center gap-1.5 transition shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
