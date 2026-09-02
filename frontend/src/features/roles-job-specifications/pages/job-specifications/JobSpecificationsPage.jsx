import React from 'react';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';

export default function JobSpecificationsPage({
  jobSpecs = [],
  loading,
  canUpdateJobSpec,
  canDeleteJobSpec,
  handleOpenJobSpecForm,
  handleJobSpecDelete,
}) {
  if (loading) {
    return (
      <Card className="p-12 text-center text-muted-foreground text-sm rounded-xl">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading job specifications...</span>
        </div>
      </Card>
    );
  }

  if (jobSpecs.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground text-sm rounded-xl space-y-3">
        <svg className="w-12 h-12 mx-auto text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p className="text-foreground font-semibold text-base">No Job Specifications Found</p>
        <p className="text-xs text-muted-foreground">Click "Create Job Specification" to add job titles for employees.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobSpecs.map((spec) => (
        <Card
          key={spec.id}
          hoverEffect
          className="flex flex-col justify-between rounded-xl border border-border bg-card900 backdrop-blur-xl p-5"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider badge-indigo">
                {spec.department || 'GENERAL'}
              </span>
              {spec.code && (
                <span className="text-xs text-muted-foreground font-mono font-medium">
                  {spec.code}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold ">{spec.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {spec.description || 'No description specified for this job specification.'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-5 mt-4 border-t border-border">
            <Button
              onClick={() => handleOpenJobSpecForm(spec)}
              variant="secondary"
              size="sm"
            >
              Edit
            </Button>
            <Button
              onClick={() => handleJobSpecDelete(spec.id, spec.title)}
              variant="danger"
              size="sm"
            >
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
