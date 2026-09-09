import React from 'react';
import ErrorBoundary from '../../../../components/ui/ErrorBoundary';
import useRecordGoodsReceipt from './hooks/useRecordGoodsReceipt';
import RecordGoodsReceiptHeader from './components/RecordGoodsReceiptHeader';
import SelectPurchaseOrderTable from './components/SelectPurchaseOrderTable';
import DeliveredItemsInspectionTable from './components/DeliveredItemsInspectionTable';
import EvidenceAndInspectionNotes from './components/EvidenceAndInspectionNotes';
import RecordGoodsReceiptActions from './components/RecordGoodsReceiptActions';

function RecordGoodsReceiptForm() {
  const {
    loadingPos,
    approvedPos,
    selectedPoForGr,
    loadingPoDetails,
    documentTypes,
    grFormItems,
    evidenceCategory,
    setEvidenceCategory,
    evidenceFile,
    evidencePreview,
    grNotes,
    setGrNotes,
    submittingGr,
    handlePoSelectionChange,
    handleDeselectPo,
    handleItemUpdate,
    handleFileChange,
    handleRemoveFile,
    handleSubmitGoodsReceipt,
    getSupplierName,
    navigate,
  } = useRecordGoodsReceipt();

  return (
    <div className="p-6 space-y-6 min-h-[calc(100vh-100px)] w-full">
      {/* Top Header */}
      <RecordGoodsReceiptHeader onCancel={() => navigate('/procurement', { state: { activeTab: 'ON_DELIVERY_PO' } })} />

      <form onSubmit={handleSubmitGoodsReceipt} className="space-y-6">
        {/* Step 1: Select Approved Purchase Order Table */}
        <SelectPurchaseOrderTable
          approvedPos={approvedPos}
          loadingPos={loadingPos}
          selectedPoId={selectedPoForGr}
          onSelectPo={handlePoSelectionChange}
          onDeselect={handleDeselectPo}
          getSupplierName={getSupplierName}
        />

        {/* Step 2: Line Items Verification */}
        {selectedPoForGr && (
          <DeliveredItemsInspectionTable
            items={grFormItems}
            loadingPoDetails={loadingPoDetails}
            onUpdateItem={handleItemUpdate}
          />
        )}

        {/* Steps 3 & 4: Supporting Evidence & Inspection Notes */}
        {selectedPoForGr && (
          <EvidenceAndInspectionNotes
            documentTypes={documentTypes}
            evidenceCategory={evidenceCategory}
            onChangeEvidenceCategory={setEvidenceCategory}
            evidenceFile={evidenceFile}
            evidencePreview={evidencePreview}
            onFileChange={handleFileChange}
            onRemoveFile={handleRemoveFile}
            grNotes={grNotes}
            onChangeNotes={setGrNotes}
          />
        )}

        {/* Submit Actions */}
        <RecordGoodsReceiptActions
          submittingGr={submittingGr}
          disabled={!selectedPoForGr}
          onCancel={() => navigate('/procurement', { state: { activeTab: 'ON_DELIVERY_PO' } })}
        />
      </form>
    </div>
  );
}

export default function RecordGoodsReceiptPage() {
  return (
    <ErrorBoundary>
      <RecordGoodsReceiptForm />
    </ErrorBoundary>
  );
}
