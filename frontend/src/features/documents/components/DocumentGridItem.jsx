import React from 'react';
import Card from '../../../components/ui/Card';

export default function DocumentGridItem({ doc, copyToClipboard, deleteDocMutation }) {
  const getFileExtension = (name = '') => {
    const ext = name.split('.').pop()?.toLowerCase();
    return ext || 'file';
  };

  const getFileBadgeStyle = (fileName = '') => {
    const ext = getFileExtension(fileName);
    if (['pdf'].includes(ext)) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
    if (['csv', 'xlsx', 'xls'].includes(ext)) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
  };

  const ext = getFileExtension(doc.fileName);
  const isApproved = doc.status === 'APPROVED' || doc.status === 'VERIFIED';
  const isRejected = doc.status === 'REJECTED';

  return (
    <Card className="p-5 border border-border bg-card900 backdrop-blur-xl rounded-2xl flex flex-col justify-between hover:border-indigo-500/50 transition group shadow-md hover:shadow-xl">
      <div className="space-y-3">
        {/* Badge & Status */}
        <div className="flex items-center justify-between">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${getFileBadgeStyle(doc.fileName)}`}>
            {ext}
          </span>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              isApproved
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : isRejected
                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
            }`}
          >
            {isApproved ? 'VERIFIED' : isRejected ? 'REJECTED' : 'PENDING'}
          </span>
        </div>

        {/* File Name & Category */}
        <div>
          <h4 className="text-sm font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-2" title={doc.fileName}>
            {doc.fileName || 'Untitled Document'}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {doc.documentType?.name || 'General System File'}
          </p>
        </div>

        {/* Metadata Details */}
        <div className="text-[11px] text-muted-foreground space-y-1 bg-muted800 p-2.5 rounded-xl border border-border/50">
          <div className="flex items-center justify-between">
            <span>Entity Source:</span>
            <span className="font-semibold text-foreground uppercase">{doc.entityType || 'SYSTEM'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Date Added:</span>
            <span className="font-medium text-foreground">
              {new Date(doc.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {doc.notes && (
          <p className="text-xs text-muted-foreground italic line-clamp-2">
            "{doc.notes}"
          </p>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-border mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
          >
            <span>👁️</span> Open File
          </a>

          <button
            type="button"
            onClick={() => copyToClipboard(doc.fileUrl)}
            className="p-1.5 bg-muted800 hover:bg-muted text-muted-foreground hover:text-foreground border border-border rounded-xl text-xs transition"
            title="Copy Link"
          >
            📋
          </button>
        </div>

        {!doc.isSystemAttachment && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Delete this document?')) deleteDocMutation.mutate(doc.id);
            }}
            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition"
            title="Delete Document"
          >
            🗑️
          </button>
        )}
      </div>
    </Card>
  );
}
