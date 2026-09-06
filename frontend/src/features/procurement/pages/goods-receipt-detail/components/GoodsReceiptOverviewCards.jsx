import React from 'react';
import Card from '../../../../../components/ui/Card';

export default function GoodsReceiptOverviewCards({
  purchaseOrder = {},
  warehouse = {},
  notes = '',
  evidenceUrl = '',
  supplierName = 'Vendor Supplier',
  onNavigateToPo,
}) {
  const hasNotesOrEvidence = Boolean(notes || evidenceUrl);

  return (
    <div className={`grid grid-cols-1 ${hasNotesOrEvidence ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 w-full`}>
      {/* Linked Purchase Order Card */}
      <div className="p-5 border border-slate-200 bg-white text-slate-800 rounded-2xl shadow-sm space-y-3 w-full">
        <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
          <span>📄</span> Linked Purchase Order
        </h3>
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">PO Number</span>
            <span
              onClick={onNavigateToPo}
              className={`font-mono font-bold text-indigo-600 text-sm ${
                purchaseOrder?.id ? 'hover:underline cursor-pointer' : ''
              }`}
            >
              {purchaseOrder?.poNumber || 'N/A'} {purchaseOrder?.id ? '↗' : ''}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Vendor Supplier</span>
            <span className="font-bold text-slate-900">
              {supplierName}
            </span>
          </div>
        </div>
      </div>

      {/* Receiving Destination Warehouse Card */}
      <div className="p-5 border border-slate-200 bg-white text-slate-800 rounded-2xl shadow-sm space-y-3 w-full">
        <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
          <span>🏭</span> Receiving Warehouse Location
        </h3>
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Warehouse Name</span>
            <span className="font-bold text-slate-900 text-sm">{warehouse?.name || 'Main Warehouse'}</span>
          </div>
          {warehouse?.code && (
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Code</span>
              <span className="font-mono text-slate-700">{warehouse.code}</span>
            </div>
          )}
        </div>
      </div>

      {/* Inspection Notes / Evidence Proof Card */}
      {hasNotesOrEvidence && (
        <div className="p-5 border border-slate-200 bg-white text-slate-800 rounded-2xl shadow-sm space-y-3 w-full">
          <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
            <span>🔍</span> Inspection & Evidence Proof
          </h3>
          {notes && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-800 block mb-1">Notes / Observations</span>
              {notes}
            </div>
          )}
          {evidenceUrl && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Attached Evidence</span>
              <a
                href={evidenceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold border border-indigo-200 transition"
              >
                <span>🖼️</span> View Delivery Attachment ↗
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
