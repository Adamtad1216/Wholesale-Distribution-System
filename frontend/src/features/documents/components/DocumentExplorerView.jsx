import React from 'react';
import Card from '../../../components/ui/Card';
import DocumentFilterToolbar from './DocumentFilterToolbar';
import DocumentGridItem from './DocumentGridItem';
import DocumentTableList from './DocumentTableList';

export default function DocumentExplorerView({
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  layoutStyle,
  setLayoutStyle,
  selectedCategory,
  setSelectedCategory,
  docTypes,
  totalDocs,
  rawDocs,
  loadingDocs,
  filteredDocs,
  copyToClipboard,
  deleteDocMutation,
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Filter Toolbar */}
      <DocumentFilterToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        layoutStyle={layoutStyle}
        setLayoutStyle={setLayoutStyle}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        docTypes={docTypes}
        totalDocsCount={totalDocs}
        rawDocs={rawDocs}
      />

      {/* Document Content List / Grid */}
      {loadingDocs ? (
        <Card className="p-12 text-center border border-border">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading system documents...</p>
        </Card>
      ) : filteredDocs.length === 0 ? (
        <Card className="p-12 text-center border border-border space-y-4">
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center text-3xl mx-auto">
            📂
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">No System Documents Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No documents match your active search or category filters.
            </p>
          </div>
        </Card>
      ) : layoutStyle === 'GRID' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocs.map((doc) => (
            <DocumentGridItem
              key={doc.id}
              doc={doc}
              copyToClipboard={copyToClipboard}
              deleteDocMutation={deleteDocMutation}
            />
          ))}
        </div>
      ) : (
        <DocumentTableList
          filteredDocs={filteredDocs}
          copyToClipboard={copyToClipboard}
          deleteDocMutation={deleteDocMutation}
        />
      )}
    </div>
  );
}
