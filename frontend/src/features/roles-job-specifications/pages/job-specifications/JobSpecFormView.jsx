import React from 'react';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';

export default function JobSpecFormView({
  editingJobSpec,
  jobSpecFormData,
  setJobSpecFormData,
  submitting,
  handleSubmit,
  handleBackToList,
}) {
  const isEdit = Boolean(editingJobSpec);

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Roles & Job Specifications
        </button>
      </div>

      {/* Header Title */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {isEdit ? `Edit Job Specification: ${editingJobSpec.title}` : 'Create Job Specification'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Specify organizational job title, department categorization, and work specification details.
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-6">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">
            Job Specification Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Job Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Warehouse Specialist"
                value={jobSpecFormData.title}
                onChange={(e) => setJobSpecFormData({ ...jobSpecFormData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Department</label>
              <input
                type="text"
                placeholder="e.g. Logistics, Sales, Finance"
                value={jobSpecFormData.department}
                onChange={(e) => setJobSpecFormData({ ...jobSpecFormData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1.5">Job Specification Description</label>
              <textarea
                rows="4"
                placeholder="Describe primary responsibilities, qualifications, or requirements for this job title..."
                value={jobSpecFormData.description}
                onChange={(e) => setJobSpecFormData({ ...jobSpecFormData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-violet-500 resize-none"
              ></textarea>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
          <Button type="button" variant="secondary" size="lg" onClick={handleBackToList}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="lg" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Update Job Specification' : 'Create Job Specification'}
          </Button>
        </div>
      </form>
    </div>
  );
}
