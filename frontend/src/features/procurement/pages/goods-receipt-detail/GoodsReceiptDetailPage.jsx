import React from 'react';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import useGoodsReceiptDetail from './hooks/useGoodsReceiptDetail';
import GoodsReceiptHeader from './components/GoodsReceiptHeader';
import GoodsReceiptOverviewCards from './components/GoodsReceiptOverviewCards';
import GoodsReceiptItemsTable from './components/GoodsReceiptItemsTable';
import GoodsReceiptRejectModal from './components/GoodsReceiptRejectModal';

export default function GoodsReceiptDetailPage() {
  const {
    id,
    loading,
    gr,
    submittingAction,
    showRejectModal,
    setShowRejectModal,
    rejectionReason,
    setRejectionReason,
    handleConfirmRejectGr,
    supplierName,
    navigate,
  } = useGoodsReceiptDetail();

  if (loading) {
    return (
      <div className="p-6 min-h-[calc(100vh-100px)] flex items-center justify-center">
        <Card className="p-12 text-center border border-border bg-card text-foreground max-w-md w-full shadow-2xl">
          <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-semibold text-muted-foreground">Loading Goods Receipt details...</p>
        </Card>
      </div>
    );
  }

  if (!gr) {
    return (
      <div className="p-6 min-h-[calc(100vh-100px)] space-y-4">
        <button
          onClick={() => navigate('/procurement')}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition flex items-center gap-1"
        >
          ← Back to Procurement
        </button>
        <Card className="p-12 text-center border border-border bg-card text-foreground space-y-4 shadow-xl">
          <div className="text-4xl">❌</div>
          <h3 className="text-xl font-bold text-foreground">Goods Receipt Not Found</h3>
          <p className="text-xs text-muted-foreground">The requested goods receipt could not be located in the database.</p>
          <Button variant="primary" size="md" onClick={() => navigate('/procurement')}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-[calc(100vh-100px)] w-full">
      {/* 1. Header with Breadcrumb, Status, and Action Controls */}
      <GoodsReceiptHeader
        receiptNumber={gr.receiptNumber}
        status={gr.status}
        receivedAt={gr.receivedAt}
        id={gr.id}
        submittingAction={submittingAction}
        onBack={() => navigate('/procurement')}
        onReject={() => setShowRejectModal(true)}
        onSettle={() => navigate(`/procurement/receipts/${id}/settle`)}
        onViewTransferReceipt={() => navigate(`/procurement/receipts/${id}/transfer-receipt`)}
      />

      {/* 2. Top Overview Cards: Linked PO, Warehouse & Inspection Notes */}
      <GoodsReceiptOverviewCards
        purchaseOrder={gr.purchaseOrder}
        warehouse={gr.warehouse}
        notes={gr.notes}
        evidenceUrl={gr.evidenceUrl}
        supplierName={supplierName}
        onNavigateToPo={() => gr.purchaseOrderId && navigate(`/procurement/orders/${gr.purchaseOrderId}`)}
      />

      {/* 3. Full-Width Line Items Table & Financial Summary Footer */}
      <GoodsReceiptItemsTable items={gr.items || []} />

      {/* 4. Goods Receipt Rejection Modal */}
      <GoodsReceiptRejectModal
        isOpen={showRejectModal}
        receiptNumber={gr.receiptNumber}
        rejectionReason={rejectionReason}
        submittingAction={submittingAction}
        onChangeReason={setRejectionReason}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason('');
        }}
        onConfirm={handleConfirmRejectGr}
      />
    </div>
  );
}
