import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '../documentsApi';

export default function Documents() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => documentsApi.getDocumentTypes().catch(() => ({ data: [] })),
  });

  const docTypes = response?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Document Vault</h2>
        <p className="text-sm text-slate-400">Upload and verify procurement invoices, certifications, and delivery sheets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload form card */}
        <div className="p-6 rounded-2xl backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 shadow-md md:col-span-1 space-y-4">
          <h3 className="text-base font-bold text-white">Upload Document</h3>
          
          <div className="border-2 border-dashed border-slate-800 hover:border-violet-500/50 rounded-xl p-8 text-center cursor-pointer transition">
            <span className="text-3xl block mb-2">☁️</span>
            <span className="text-xs text-slate-400 block">Click or Drag invoice to upload</span>
            <span className="text-[10px] text-slate-500 block mt-1">PDF, JPG, PNG (Max 10MB)</span>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Document Category</label>
            <select className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm outline-none text-slate-350 bg-slate-950">
              <option value="">Select Category...</option>
              {docTypes.map((type) => (
                <option key={type.id} value={type.code}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-550 hover:to-indigo-550 text-sm font-semibold transition">
            Submit Document
          </button>
        </div>

        {/* Upload history card */}
        <div className="p-6 rounded-2xl backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 shadow-md md:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-white">Upload History</h3>

          <div className="text-center py-12 text-slate-500 text-sm">
            No documents uploaded yet.
          </div>
        </div>
      </div>
    </div>
  );
}
