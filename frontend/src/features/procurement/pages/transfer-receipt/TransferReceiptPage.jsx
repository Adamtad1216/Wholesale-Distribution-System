import React from 'react';
import Card from '../../../../components/ui/Card';
import useTransferReceipt from './hooks/useTransferReceipt';
import TransferReceiptHeader from './components/TransferReceiptHeader';
import TransferVoucherHeader from './components/TransferVoucherHeader';
import TransferBeneficiaryDetails from './components/TransferBeneficiaryDetails';
import TransferSettlementBreakdown from './components/TransferSettlementBreakdown';
import TransferReceiptFooter from './components/TransferReceiptFooter';

export default function TransferReceiptPage() {
  const {
    id,
    loading,
    reverifying,
    gr,
    reference,
    amount,
    statusLabel,
    verifyMessage,
    timestamp,
    transactionId,
    supplierName,
    payoutAccountName,
    payoutAccountNumber,
    bankName,
    goodsSubtotal,
    vatAmount,
    withholdingAmount,
    shippingFee,
    formatCurrency,
    handleReverify,
    handleCopyRef,
    handlePrint,
    navigate,
  } = useTransferReceipt();

  if (loading) {
    return (
      <div className="p-6 min-h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="p-10 text-center border border-slate-200 bg-white text-slate-900 rounded-3xl max-w-md w-full shadow-2xl">
          <div className="inline-block w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <h3 className="text-base font-extrabold text-slate-900">Retrieving Transfer Receipt...</h3>
          <p className="text-xs text-slate-500 mt-1">Confirming verified payout details with Chapa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 min-h-[calc(100vh-100px)] w-full max-w-5xl mx-auto space-y-6">
      {/* 1. Top Actions Bar (Hidden on Print) */}
      <TransferReceiptHeader
        id={id}
        reverifying={reverifying}
        onNavigateBack={() => navigate(id ? `/procurement/receipts/${id}` : '/procurement')}
        onReverify={handleReverify}
        onPrint={handlePrint}
      />

      {/* 2. Printable Official Receipt Voucher Card */}
      <div id="printable-transfer-receipt" className="space-y-6">
        <div className="rounded-3xl border border-slate-200/90 bg-white text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden relative print:border-black print:shadow-none print:bg-white print:text-black">
          <TransferVoucherHeader
            statusLabel={statusLabel}
            reference={reference}
            onCopyRef={handleCopyRef}
            amount={amount}
            timestamp={timestamp}
            formatCurrency={formatCurrency}
          />

          <TransferBeneficiaryDetails
            supplierName={supplierName}
            payoutAccountName={payoutAccountName}
            bankName={bankName}
            payoutAccountNumber={payoutAccountNumber}
            statusLabel={statusLabel}
            verifyMessage={verifyMessage}
            transactionId={transactionId}
            timestamp={timestamp}
          />

          <TransferSettlementBreakdown
            gr={gr}
            id={id}
            goodsSubtotal={goodsSubtotal}
            vatAmount={vatAmount}
            withholdingAmount={withholdingAmount}
            shippingFee={shippingFee}
            amount={amount}
            formatCurrency={formatCurrency}
          />
        </div>

        {/* 3. Bottom Navigation Controls (Hidden on Print) */}
        <TransferReceiptFooter
          id={id}
          onNavigateDashboard={() => navigate('/procurement')}
          onNavigateGr={() => navigate(`/procurement/receipts/${id}`)}
        />
      </div>
    </div>
  );
}
