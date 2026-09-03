import React from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

export default function CreateCategoryForm({
  categoryFormData,
  setCategoryFormData,
  handleCategoryFormSubmit,
  createCategoryMutation,
  setViewMode,
}) {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Breadcrumb & Header stacked on separate lines */}
      <div className="space-y-3 border-b border-border pb-4">
        <div>
          <button
            type="button"
            onClick={() => setViewMode('CATEGORIES')}
            className="px-3 py-1.5 rounded-xl bg-muted800 hover:bg-muted text-foreground border border-border transition inline-flex items-center gap-1.5 text-xs font-semibold"
          >
            ← Back to Categories
          </button>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Document Category</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Add a new official document category classification to the system.</p>
        </div>
      </div>

      {/* Blank Page Form Container (Left-aligned) */}
      <div className="max-w-3xl">
        <Card className="p-8 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-xl space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>🏷️</span> Category Information
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Define the code and display title used for organizing system files and entity uploads.
            </p>
          </div>

          <form onSubmit={handleCategoryFormSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Category Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tax & Compliance Certificate"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                className="w-full px-4 py-3 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Human-readable label displayed in document listings (system code generated automatically).</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Category Description
              </label>
              <textarea
                rows="4"
                placeholder="Provide details on what files belong in this category (e.g. Annual government tax filings, VAT clearance slips)..."
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                className="w-full px-4 py-3 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
              ></textarea>
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setViewMode('CATEGORIES')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={createCategoryMutation.isLoading}
                className="px-6 shadow-lg shadow-indigo-500/20"
              >
                {createCategoryMutation.isLoading ? 'Saving Category...' : 'Save & Publish Category'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
