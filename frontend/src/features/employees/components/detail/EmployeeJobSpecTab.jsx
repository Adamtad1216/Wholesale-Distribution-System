import React from 'react';
import Card from '../../../../components/ui/Card';

export default function EmployeeJobSpecTab({
  primarySpec,
  allSpecs = [],
  selectedEmployee,
  getStatusBadge,
  formatDateTime,
}) {
  return (
    <div className="space-y-6">
      {primarySpec ? (
        <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-6 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded border border-violet-500/20">
                  Primary Job Specification
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusBadge(primarySpec.status)}`}>
                  {primarySpec.status || 'ACTIVE'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">{primarySpec.title}</h2>
              <p className="text-xs font-mono text-muted-foreground">Code: {primarySpec.code || 'N/A'}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-2 rounded-xl bg-card border border-border text-center">
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm font-semibold text-foreground">
                  {primarySpec.department || selectedEmployee?.department || 'Unspecified'}
                </p>
              </div>
            </div>
          </div>

          {/* Full Description / Duties / Responsibilities */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Full Job Specification Description & Responsibilities
            </h3>

            <div className="p-5 rounded-xl bg-background/60 border border-border text-foreground/90 text-sm leading-relaxed whitespace-pre-line">
              {primarySpec.description && primarySpec.description.trim() ? (
                primarySpec.description
              ) : (
                <span className="text-muted-foreground italic">
                  No comprehensive duties or description have been logged for this job specification yet. You can edit this job specification in Roles & Job Specifications settings.
                </span>
              )}
            </div>
          </div>

          {/* Specification Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border text-xs">
            <div className="p-3 rounded-lg bg-card/60 border border-border">
              <span className="text-muted-foreground block mb-1">Specification ID</span>
              <span className="font-mono text-foreground break-all">{primarySpec.id || 'N/A'}</span>
            </div>
            <div className="p-3 rounded-lg bg-card/60 border border-border">
              <span className="text-muted-foreground block mb-1">Assigned Department</span>
              <span className="font-semibold text-foreground">{primarySpec.department || 'Not Assigned'}</span>
            </div>
            <div className="p-3 rounded-lg bg-card/60 border border-border">
              <span className="text-muted-foreground block mb-1">Created Date</span>
              <span className="text-foreground">{formatDateTime(primarySpec.createdAt)}</span>
            </div>
            <div className="p-3 rounded-lg bg-card/60 border border-border">
              <span className="text-muted-foreground block mb-1">Last Modified</span>
              <span className="text-foreground">{formatDateTime(primarySpec.updatedAt)}</span>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-8 border border-border bg-card900 backdrop-blur-xl rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-foreground">No Job Specification Assigned</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            This employee does not currently have a linked Job Specification record. Edit the profile to attach one.
          </p>
        </Card>
      )}

      {/* Secondary Job Specifications (if multiple exist) */}
      {allSpecs.length > 1 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400" />
            Additional Assigned Job Specifications ({allSpecs.length - 1})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allSpecs.slice(1).map((spec, idx) => (
              <Card key={spec.id || idx} className="p-5 border border-border bg-card900 backdrop-blur-xl rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground">{spec.title}</h4>
                  <span className="text-xs font-mono bg-muted/40 px-2 py-0.5 rounded text-muted-foreground">
                    {spec.code}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {spec.description || 'No detailed duties provided.'}
                </p>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-border">
                  <span className="text-muted-foreground">Department: {spec.department || 'General'}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusBadge(spec.status)}`}>
                    {spec.status || 'ACTIVE'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
