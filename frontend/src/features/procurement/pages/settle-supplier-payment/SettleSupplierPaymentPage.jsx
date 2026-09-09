import React from 'react';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import useSettleSupplierPayment from './hooks/useSettleSupplierPayment';
import SettlePaymentHeader from './components/SettlePaymentHeader';
import VendorProfileCard from './components/VendorProfileCard';
import PaymentMethodSelectorCard from './components/PaymentMethodSelectorCard';
import SettlementItemsPreviewTable from './components/SettlementItemsPreviewTable';
import SettlementSummaryCard from './components/SettlementSummaryCard';

export default function SettleSupplierPaymentPage() {
  const {
    id,
    loading,
    gr,
    submitting,
    supplier,
    paymentCategory,
    paymentMethod,
    setPaymentMethod,
    selectedMethodOption,
    setSelectedMethodOption,
    referenceNumber,
    setReferenceNumber,
    paymentNotes,
    setPaymentNotes,
    evidenceFile,
    evidencePreview,
    handleEvidenceChange,
    handleRemoveEvidence,
    handleSelectCategory,
    includeVat,
    setIncludeVat,
    includeWithholding,
    setIncludeWithholding,
    shippingFee,
    setShippingFee,
    providers,
    items,
    goodsSubtotal,
    vatAmount,
    withholdingAmount,
    totalShipping,
    grandTotal,
    handleSettlePayment,
    navigate,
  } = useSettleSupplierPayment();

  if (loading) {
    return (
      <div className="p-6 min-h-[calc(100vh-100px)]">
        <Card className="p-12 text-center border border-border bg-card900">
          <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-semibold text-muted-foreground">Loading Vendor Payment Settlement details...</p>
        </Card>
      </div>
    );
  }

  if (!gr) {
    return (
      <div className="p-6 min-h-[calc(100vh-100px)] space-y-4">
        <button
          onClick={() => navigate('/procurement')}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
        >
          ← Back to Procurement
        </button>
        <Card className="p-12 text-center border border-border bg-card900 space-y-4">
          <div className="text-4xl">❌</div>
          <h3 className="text-xl font-bold text-foreground">Goods Receipt Not Found</h3>
          <p className="text-xs text-muted-foreground">Unable to locate the Goods Receipt for payment settlement.</p>
          <Button variant="primary" size="md" onClick={() => navigate('/procurement')}>
            Return to Procurement
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-[calc(100vh-100px)] w-full">
      {/* 1. Header & Breadcrumb Navigation */}
      <SettlePaymentHeader
        gr={gr}
        submitting={submitting}
        onCancel={() => navigate(`/procurement/receipts/${id}`)}
        onSubmit={handleSettlePayment}
      />

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Vendor Details & Payment Methods */}
        <div className="lg:col-span-2 space-y-6">
          {/* 2. Vendor / Supplier Profile & Registered Channels */}
          <VendorProfileCard supplier={supplier} />

          {/* 3. Company Payment Method Selector */}
          <PaymentMethodSelectorCard
            paymentCategory={paymentCategory}
            onSelectCategory={handleSelectCategory}
            paymentMethod={paymentMethod}
            onSelectMethod={setPaymentMethod}
            providers={providers}
            selectedMethodOption={selectedMethodOption}
            onChangeMethodOption={setSelectedMethodOption}
            evidenceFile={evidenceFile}
            evidencePreview={evidencePreview}
            onEvidenceChange={handleEvidenceChange}
            onRemoveEvidence={handleRemoveEvidence}
            referenceNumber={referenceNumber}
            onChangeReferenceNumber={setReferenceNumber}
            paymentNotes={paymentNotes}
            onChangePaymentNotes={setPaymentNotes}
          />

          {/* 4. Received Line Items Included in Settlement */}
          <SettlementItemsPreviewTable items={items} />
        </div>

        {/* Right 1 Column: Financial Summary Box & Grand Total */}
        <div className="lg:col-span-1 space-y-6">
          <SettlementSummaryCard
            includeVat={includeVat}
            onChangeIncludeVat={setIncludeVat}
            includeWithholding={includeWithholding}
            onChangeIncludeWithholding={setIncludeWithholding}
            shippingFee={shippingFee}
            onChangeShippingFee={setShippingFee}
            goodsSubtotal={goodsSubtotal}
            vatAmount={vatAmount}
            withholdingAmount={withholdingAmount}
            totalShipping={totalShipping}
            grandTotal={grandTotal}
            providers={providers}
            paymentMethod={paymentMethod}
            paymentCategory={paymentCategory}
            submitting={submitting}
            onSettlePayment={handleSettlePayment}
          />
        </div>
      </div>
    </div>
  );
}
