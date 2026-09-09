import React from 'react';
import Card from '../../../../../components/ui/Card';

export default function EvidenceAndInspectionNotes({
  documentTypes = [],
  evidenceCategory = '',
  onChangeEvidenceCategory,
  evidenceFile = null,
  evidencePreview = '',
  onFileChange,
  onRemoveFile,
  grNotes = '',
  onChangeNotes,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
          <span>3️⃣</span> Delivery Proof / Evidence
        </h3>

        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Document Type *
          </label>
          <select
            value={evidenceCategory}
            onChange={(e) => onChangeEvidenceCategory(e.target.value)}
            style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
            className="w-full px-3.5 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-xs font-bold focus:outline-none focus:border-indigo-500"
          >
            <option value="" disabled className="bg-[#0f172a] text-slate-400">
              {documentTypes.length > 0 ? '-- Select Document Type --' : 'Loading document types...'}
            </option>
            {documentTypes.map((dt) => (
              <option key={dt.id || dt.code} value={dt.code || dt.id} className="bg-[#0f172a] text-slate-100">
                {dt.name} {dt.code ? `(${dt.code})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Attach Evidence File
          </label>
          <div className="p-4 border-2 border-dashed border-border hover:border-indigo-500/50 rounded-xl text-center bg-muted800/30 transition">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={onFileChange}
              className="hidden"
              id="page-evidence-upload-input"
            />
            <label htmlFor="page-evidence-upload-input" className="cursor-pointer space-y-1 block">
              <div className="text-2xl">📷</div>
              <div className="font-semibold text-foreground text-xs">
                {evidenceFile ? evidenceFile.name : 'Click to attach evidence file (Image / PDF)'}
              </div>
              <div className="text-[11px] text-muted-foreground">Supports JPG, PNG, PDF formats</div>
            </label>
          </div>
        </div>

        {evidencePreview && (
          <div className="p-2 bg-muted800 rounded-lg border border-border flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-semibold">✓ Attached: {evidenceFile?.name}</span>
            <button
              type="button"
              onClick={onRemoveFile}
              className="text-xs text-rose-400 font-bold hover:underline"
            >
              Remove
            </button>
          </div>
        )}
      </Card>

      <Card className="p-6 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-lg space-y-3">
        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
          <span>4️⃣</span> Inspection Notes & Observations
        </h3>
        <textarea
          rows={4}
          placeholder="Notes on physical goods condition, delivery vehicle info, or discrepancies..."
          value={grNotes}
          onChange={(e) => onChangeNotes(e.target.value)}
          style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}
          className="w-full p-3 border border-border rounded-xl text-xs focus:outline-none focus:border-indigo-500"
        />
      </Card>
    </div>
  );
}
