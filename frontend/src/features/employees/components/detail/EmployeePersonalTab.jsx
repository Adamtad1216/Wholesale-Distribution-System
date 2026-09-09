import React from 'react';
import Card from '../../../../components/ui/Card';

export default function EmployeePersonalTab({
  person,
  email,
  phone,
  selectedEmployee,
  primarySpec,
  formatDate,
  formatDateTime,
  tenure,
  getStatusBadge,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Personal Identity Card */}
      <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-4 shadow-md">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Personal & Contact Information
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">First Name</span>
            <span className="font-semibold text-foreground">{person?.firstName || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Middle Name / Father's Name</span>
            <span className="font-semibold text-foreground">{person?.middleName || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Last Name / Grandfather's Name</span>
            <span className="font-semibold text-foreground">{person?.lastName || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Email Address</span>
            <span className="font-semibold text-foreground">{email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Phone Number</span>
            <span className="font-semibold text-foreground">{phone}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Residential Address</span>
            <span className="font-semibold text-foreground text-right">{person?.address || 'Not Recorded'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Person Record Status</span>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusBadge(person?.status)}`}>
              {person?.status || 'ACTIVE'}
            </span>
          </div>
        </div>
      </Card>

      {/* Employment & Operational Metadata Card */}
      <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-4 shadow-md">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Employment & Operational Details
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Official Employee Code</span>
            <span className="font-mono font-semibold text-foreground">{selectedEmployee?.employeeCode || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Official Hire Date</span>
            <span className="font-semibold text-foreground">{formatDate(selectedEmployee?.hireDate)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Calculated Tenure</span>
            <span className="font-semibold text-foreground">{tenure || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Operational Department</span>
            <span className="font-semibold text-foreground">
              {selectedEmployee?.department || primarySpec?.department || 'General'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Available for Sales Orders</span>
            <span className={`font-semibold ${selectedEmployee?.isAvailableForSales ? 'text-emerald-400' : 'text-muted-foreground'}`}>
              {selectedEmployee?.isAvailableForSales ? 'Yes (Active Sales Agent)' : 'No'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Sales Commission Rate</span>
            <span className="font-semibold text-foreground">
              {selectedEmployee?.commissionRate ? `${selectedEmployee.commissionRate}%` : 'Standard / None'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Assigned Sales Territory</span>
            <span className="font-semibold text-foreground">
              {selectedEmployee?.salesTerritory || 'Unassigned / All Regions'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Driver License Number</span>
            <span className="font-mono font-semibold text-foreground">
              {selectedEmployee?.driverLicenseNumber || 'None'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Driver License Expiry</span>
            <span className="font-semibold text-foreground">
              {formatDate(selectedEmployee?.driverLicenseExpiry)}
            </span>
          </div>
        </div>
      </Card>

      {/* Audit & Record Metadata */}
      <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl lg:col-span-2 space-y-4 shadow-md">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          System Audit & Record History
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-card/60 border border-border">
            <span className="text-muted-foreground block mb-1">Created At</span>
            <span className="text-foreground">{formatDateTime(selectedEmployee?.createdAt)}</span>
          </div>
          <div className="p-3 rounded-lg bg-card/60 border border-border">
            <span className="text-muted-foreground block mb-1">Created By</span>
            <span className="font-semibold text-foreground">
              {selectedEmployee?.createdBy?.person
                ? `${selectedEmployee.createdBy.person.firstName} ${selectedEmployee.createdBy.person.lastName || ''}`
                : 'System Administrator'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-card/60 border border-border">
            <span className="text-muted-foreground block mb-1">Last Profile Update</span>
            <span className="text-foreground">{formatDateTime(selectedEmployee?.updatedAt)}</span>
          </div>
          <div className="p-3 rounded-lg bg-card/60 border border-border">
            <span className="text-muted-foreground block mb-1">Updated By</span>
            <span className="font-semibold text-foreground">
              {selectedEmployee?.updatedBy?.person
                ? `${selectedEmployee.updatedBy.person.firstName} ${selectedEmployee.updatedBy.person.lastName || ''}`
                : 'System'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
