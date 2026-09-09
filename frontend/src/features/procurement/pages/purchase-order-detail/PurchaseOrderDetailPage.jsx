import React from 'react';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import Modal from '../../../../components/ui/Modal';
import usePurchaseOrderDetail from './hooks/usePurchaseOrderDetail';

export default function PurchaseOrderDetailPage() {
  const {
    po,
    loading,
    submittingAction,
    showRejectModal,
    setShowRejectModal,
    rejectionReason,
    setRejectionReason,
    handleApprovePo,
    handleConfirmReject,
    getSupplierName,
    getStatusBadge,
    navigate,
  } = usePurchaseOrderDetail();

  if (loading) {
    return (
      <div className="p-6 min-h-[calc(100vh-100px)]">
        <Card className="p-12 text-center border border-border bg-card900">
          <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-semibold text-muted-foreground">Loading purchase order details...</p>
        </Card>
      </div>
    );
  }

  if (!po) {
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
          <h3 className="text-xl font-bold text-foreground">Purchase Order Not Found</h3>
          <p className="text-xs text-muted-foreground">The requested purchase order could not be located in the database.</p>
          <Button variant="primary" size="md" onClick={() => navigate('/procurement')}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-[calc(100vh-100px)]">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <button
            onClick={() => navigate('/procurement')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 mb-2"
          >
            ← Back to Procurement Dashboard
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight font-mono">
              {po.poNumber}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadge(po.status)}`}>
              {po.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Created on {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : 'N/A'} • Reference ID: {po.id}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={() => navigate('/procurement')}>
            Back to List
          </Button>
          {po.status === 'PENDING' && (
            <>
              <Button variant="danger" size="md" disabled={submittingAction} onClick={() => setShowRejectModal(true)}>
                ❌ Reject PO
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={submittingAction}
                onClick={handleApprovePo}
                className="px-6 shadow-lg shadow-indigo-500/20"
              >
                {submittingAction ? 'Processing...' : '✅ Approve Purchase Order'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Vendor & Fulfillment Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Supplier Vendor Card */}
          <Card className="p-5 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <span>🏬</span> Supplier Vendor Information
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Vendor Name</span>
                <span className="font-bold text-foreground text-sm">{getSupplierName(po.supplier)}</span>
              </div>
              {po.supplier?.contactPerson && (
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Contact Person</span>
                  <span className="font-medium text-foreground">{po.supplier.contactPerson}</span>
                </div>
              )}
              {po.supplier?.email && (
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Email Address</span>
                  <span className="font-mono text-muted-foreground">{po.supplier.email}</span>
                </div>
              )}
              {po.supplier?.phone && (
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Phone Number</span>
                  <span className="font-mono text-muted-foreground">{po.supplier.phone}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Receiving Warehouse Card */}
          <Card className="p-5 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <span>🏭</span> Receiving Destination Warehouse
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Warehouse Name</span>
                <span className="font-bold text-foreground text-sm">{po.warehouse?.name || 'Main Warehouse'}</span>
              </div>
              {po.warehouse?.code && (
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Code</span>
                  <span className="font-mono text-foreground">{po.warehouse.code}</span>
                </div>
              )}
              {po.warehouse?.address && (
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Address</span>
                  <span className="text-muted-foreground">{po.warehouse.address}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Line Items & Totals */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <span>📦</span> Requested Purchase Order Items
              </h3>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                {(po.items || []).length} Line Items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted800/80 border-b border-border text-muted-foreground uppercase font-bold tracking-wider">
                    <th className="py-3.5 px-4">Product Name</th>
                    <th className="py-3.5 px-4 text-center">Quantity</th>
                    <th className="py-3.5 px-4 text-center">Unit Price (ETB)</th>
                    <th className="py-3.5 px-4 text-right pr-6">Subtotal (ETB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 font-medium">
                  {(po.items || []).map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-muted800/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground">
                          {item.product?.name || `Product #${item.productId?.slice(0, 8)}`}
                        </div>
                        {item.product?.sku && (
                          <div className="text-[11px] text-muted-foreground font-mono">
                            SKU: {item.product.sku}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        {item.quantity} Units
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        {Number(item.unitPrice || 0).toLocaleString()} ETB
                      </td>
                      <td className="py-3.5 px-4 text-right pr-6 font-mono font-bold text-emerald-400">
                        {Number(item.total || item.quantity * item.unitPrice).toLocaleString()} ETB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="p-5 bg-muted800/80 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground">
                Total calculated valuation for Purchase Order line items.
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Amount Due</span>
                <span className="text-2xl font-mono font-extrabold text-emerald-400">
                  {Number(po.total || 0).toLocaleString()} ETB
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason('');
        }}
        title={`Reject Purchase Order: ${po.poNumber}`}
        subtitle="Please specify a clear reason for rejecting this purchase order request."
        icon="❌"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">
              Rejection Reason *
            </label>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter details on why this purchase order is being rejected (e.g. invalid pricing, item out of stock, unauthorized vendor)..."
              style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}
              className="w-full p-3 border border-rose-500/30 rounded-xl text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              disabled={submittingAction || !rejectionReason.trim()}
              onClick={handleConfirmReject}
              className="px-6"
            >
              {submittingAction ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
