import React from 'react';
import Card from '../../../components/ui/Card';

export default function DocumentTableList({ filteredDocs, copyToClipboard, deleteDocMutation }) {
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

  return (
    <Card className="overflow-hidden border border-border bg-card900 rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted800 text-xs uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="p-4">Document Title</th>
              <th className="p-4">Category</th>
              <th className="p-4">Source Entity</th>
              <th className="p-4">Date Added</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredDocs.map((doc) => {
              const isApproved = doc.status === 'APPROVED' || doc.status === 'VERIFIED';
              const isRejected = doc.status === 'REJECTED';

              return (
                <tr key={doc.id} className="hover:bg-muted/50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase ${getFileBadgeStyle(doc.fileName)}`}>
                        {getFileExtension(doc.fileName)}
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">{doc.fileName}</p>
                        {doc.notes && <p className="text-xs text-muted-foreground">{doc.notes}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                      {doc.documentType?.name || 'General'}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-semibold text-foreground uppercase">
                    {doc.entityType || 'SYSTEM'}
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        isApproved
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                          : isRejected
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {isApproved ? 'VERIFIED' : isRejected ? 'REJECTED' : 'PENDING'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-semibold transition"
                      >
                        View File
                      </a>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(doc.fileUrl)}
                        className="px-2 py-1 bg-muted800 hover:bg-muted text-muted-foreground hover:text-foreground border border-border rounded-lg text-xs transition"
                      >
                        Copy Link
                      </button>

                      {!doc.isSystemAttachment && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Delete this document?')) deleteDocMutation.mutate(doc.id);
                          }}
                          className="px-2 py-1 bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
