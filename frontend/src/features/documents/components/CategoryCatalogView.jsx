import React from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

export default function CategoryCatalogView({
  docTypes = [],
  rawDocs = [],
  setViewMode,
  setSelectedCategory,
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Document Categories Catalog</h2>
          <p className="text-xs text-muted-foreground">Configured categories for organizing supplier, customer, and system attachment files.</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setViewMode('CREATE_CATEGORY')}
          className="flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <span>+</span> Create Document Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docTypes.map((type) => {
          const categoryDocsCount =
            type._count?.documents ??
            rawDocs.filter(
              (d) => d.documentTypeId === type.id || d.documentType?.code === type.code
            ).length;

          return (
            <Card
              key={type.id}
              className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl flex flex-col justify-between hover:border-indigo-500/50 transition group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-mono font-bold">
                    {type.code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted800 text-muted-foreground border border-border">
                    {categoryDocsCount} Files
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {type.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {type.description || 'No specific description provided for this category.'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(type.id);
                    setViewMode('EXPLORER');
                  }}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  View Category Documents →
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
