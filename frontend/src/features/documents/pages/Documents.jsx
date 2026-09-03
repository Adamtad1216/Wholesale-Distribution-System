import React from 'react';
import { useDocumentManager } from '../hooks/useDocumentManager';

import DocumentHeader from '../components/DocumentHeader';
import DocumentStatsOverview from '../components/DocumentStatsOverview';
import DocumentExplorerView from '../components/DocumentExplorerView';
import CategoryCatalogView from '../components/CategoryCatalogView';
import CreateCategoryForm from '../components/CreateCategoryForm';

export default function Documents() {
  const docManager = useDocumentManager();

  // Full Blank Page for Category Creation
  if (docManager.viewMode === 'CREATE_CATEGORY') {
    return <CreateCategoryForm {...docManager} />;
  }

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {docManager.toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 animate-bounce">
          <span className="text-emerald-400 text-lg">✓</span>
          <span className="text-sm font-semibold">{docManager.toastMessage}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <DocumentHeader
        viewMode={docManager.viewMode}
        setViewMode={docManager.setViewMode}
        totalDocs={docManager.totalDocs}
        categoryCount={docManager.docTypes.length}
      />

      {/* KPI Stats Overview */}
      <DocumentStatsOverview
        totalDocs={docManager.totalDocs}
        verifiedCount={docManager.verifiedCount}
        pendingCount={docManager.pendingCount}
        categoryCount={docManager.docTypes.length}
      />

      {/* Main Content Area */}
      {docManager.viewMode === 'CATEGORIES' ? (
        <CategoryCatalogView {...docManager} />
      ) : (
        <DocumentExplorerView {...docManager} />
      )}
    </div>
  );
}
