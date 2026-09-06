import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { financeApi } from '../../financeApi';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
import { usePermission } from '../../../../hooks/usePermission';
import {
  ArrowLeft,
  CreditCard,
  FileText,
  Clock,
  XCircle,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ShieldX,
  Download,
  Eye,
  Image as ImageIcon
} from 'lucide-react';

const STATUS_STYLE = {
  SUCCESSFUL:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  PENDING:     'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  PROCESSING:  'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  FAILED:      'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  APPROVED:    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  REJECTED:    'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const formatDate = (dt) =>
  dt ? new Date(dt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

function DetailField({ label, value, valueClass = '' }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
      <p className={`text-sm font-semibold text-foreground ${valueClass}`}>{value || '—'}</p>
    </div>
  );
}

export default function PaymentDetail({ paymentId, onBack }) {
  const queryClient = useQueryClient();
  const { can: canApprove } = usePermission(['payments:update', 'payment:view_all']);

  // Approval state
  const [paymentType, setPaymentType] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState(null);

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['payment-history', paymentId],
    queryFn: () => financeApi.getPaymentHistory(paymentId),
    enabled: !!paymentId,
  });

  const p = response?.data;
  const maxPaymentAmount = p ? Number(p.amount || 0) : 0;

  const handleCustomAmountChange = (e) => {
    const val = e.target.value;
    const numVal = parseFloat(val);

    if (!isNaN(numVal) && numVal >= maxPaymentAmount && maxPaymentAmount > 0) {
      // Auto-switch to FULL payment if entered amount equals or exceeds issued total
      setPaymentType('FULL');
      setCustomAmount('');
      return;
    }

    setCustomAmount(val);
  };

  const handleSelectFull = () => {
    setPaymentType((prev) => (prev === 'FULL' ? null : 'FULL'));
    setCustomAmount('');
  };

  const handleSelectPartial = () => {
    setPaymentType((prev) => {
      const next = prev === 'PARTIAL' ? null : 'PARTIAL';
      if (next === 'PARTIAL' && !customAmount) {
        setCustomAmount(maxPaymentAmount ? String(maxPaymentAmount) : '');
      }
      return next;
    });
  };

  const handleAction = async (approved) => {
    if (approved && !paymentType) {
      setActionResult({ success: false, message: 'Please select payment coverage (Fully Paid or Partially Paid) to approve.' });
      return;
    }

    if (!approved && !rejectionReason.trim()) {
      setActionResult({ success: false, message: 'Please provide a reason for rejection.' });
      return;
    }

    if (approved && paymentType === 'PARTIAL') {
      const parsedAmt = parseFloat(customAmount);
      if (isNaN(parsedAmt) || parsedAmt <= 0) {
        setActionResult({ success: false, message: 'Approved partial amount must be greater than 0 ETB.' });
        return;
      }
      if (parsedAmt > maxPaymentAmount) {
        setActionResult({ success: false, message: `Approved partial amount cannot exceed the payment amount of ${formatCurrency(maxPaymentAmount)}.` });
        return;
      }
    }

    setActionLoading(true);
    setActionResult(null);
    try {
      const res = await financeApi.approvePayment(paymentId, {
        approved,
        paymentType: paymentType || undefined,
        customAmount: paymentType === 'PARTIAL' ? parseFloat(customAmount) : undefined,
        rejectionReason: rejectionReason || undefined,
      });
      setActionResult({ success: true, message: res.data?.message || 'Action completed.' });
      queryClient.invalidateQueries({ queryKey: ['payments-pending'] });
      queryClient.invalidateQueries({ queryKey: ['payments-list'] });
      queryClient.invalidateQueries({ queryKey: ['payment-history', paymentId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    } catch (err) {
      setActionResult({ success: false, message: err?.response?.data?.message || 'Action failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
        <Card className="p-12 text-center border border-border bg-card900">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Loading payment details...
          </div>
        </Card>
      </div>
    );
  }

  if (isError || !p) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <Card className="p-12 text-center border border-border bg-card900">
          <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-medium">Failed to load payment details.</p>
        </Card>
      </div>
    );
  }

  const isPending = p.status === 'PENDING' || p.status === 'PROCESSING';

  // Construct proofs list, fallback to transaction reference receipt file if list empty
  const proofsList = (p.proofs && p.proofs.length > 0)
    ? p.proofs
    : [
        {
          id: `default-proof-${p.id}`,
          fileName: `Payment_Slip_${p.transactionRef}.pdf`,
          fileUrl: p.attempts?.[0]?.responseData?.fileUrl || `#`,
          createdAt: p.createdAt,
          status: p.status
        }
      ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl border border-border bg-card900 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h2 className="text-lg font-bold text-foreground">Payment Detail</h2>
            <p className="text-xs text-muted-foreground font-mono">{p.transactionRef}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] uppercase font-bold tracking-wider ${STATUS_STYLE[p.status] || STATUS_STYLE['PENDING']}`}>
          {p.status}
        </span>
      </div>

      {/* Side-by-Side Grid: Left (Payment Info) & Right (Approval Action) */}
      <div className={`grid grid-cols-1 ${isPending ? 'lg:grid-cols-2' : ''} gap-6`}>
        {/* Left: Payment Information */}
        <Card className="p-6 border border-border bg-card900 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" /> Payment Information
            </h3>
            <div className="grid grid-cols-2 gap-5">
              <DetailField label="Amount" value={formatCurrency(p.amount)} valueClass="text-indigo-400 text-base" />
              <DetailField label="Currency" value={p.currency} />
              <DetailField label="Provider" value={p.provider} />
              <DetailField label="Method" value={p.method?.replace(/_/g, ' ')} />
              <DetailField label="Order" value={p.salesOrder?.orderNumber} />
              <DetailField label="Initiated By" value={p.processedBy?.username} />
              <DetailField label="Initiated At" value={formatDate(p.createdAt)} />
              <DetailField label="Paid At" value={formatDate(p.paidAt)} />
            </div>
          </div>
        </Card>

        {/* Right: Approval Action Panel (Only if Pending and user has permission) */}
        {isPending && canApprove && (
          <Card className="p-6 border border-yellow-500/30 bg-yellow-400/5 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-yellow-400" />
                Approval Action
              </h3>

              {actionResult && (
                <div className={`mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  actionResult.success
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {actionResult.success
                    ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 flex-shrink-0" />}
                  {actionResult.message}
                </div>
              )}

              {/* Payment Type Radio Buttons */}
              <div className="mb-5">
                <p className="text-xs text-muted-foreground font-medium mb-3">
                  Payment Coverage <span className="text-muted-foreground font-normal">(Required for Approval)</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <label
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelectFull();
                    }}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      paymentType === 'FULL'
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-border group-hover:border-indigo-400'
                    }`}>
                      {paymentType === 'FULL' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Fully Paid</p>
                      <p className="text-xs text-muted-foreground">Settle entire invoice balance ({formatCurrency(p.amount)})</p>
                    </div>
                  </label>

                  <label
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelectPartial();
                    }}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      paymentType === 'PARTIAL'
                        ? 'border-amber-500 bg-amber-500'
                        : 'border-border group-hover:border-amber-400'
                    }`}>
                      {paymentType === 'PARTIAL' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Partially Paid</p>
                      <p className="text-xs text-muted-foreground">Approve partial amount toward balance</p>
                    </div>
                  </label>
                </div>

                {/* Partial Payment Amount Input */}
                {paymentType === 'PARTIAL' && (
                  <div className="mt-4 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2 animate-fade-in">
                    <label className="text-xs font-bold text-amber-400 block">
                      Enter Approved Paid Amount (ETB)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      max={maxPaymentAmount}
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      placeholder={`Enter amount (Max ${formatCurrency(maxPaymentAmount)})`}
                      className="w-full bg-muted border border-amber-500/40 rounded-xl px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:border-amber-400 transition-colors"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Entering an amount equal to full value ({formatCurrency(maxPaymentAmount)}) will automatically switch selection to Fully Paid.
                    </p>
                  </div>
                )}
              </div>

              {/* Rejection Reason (Only shown when NO approval coverage checkbox is selected) */}
              {paymentType === null && (
                <div className="mb-5 animate-fade-in">
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
                    Rejection Reason <span className="text-rose-400">(required if rejecting)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this payment is being rejected..."
                    className="w-full bg-muted800 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleAction(true)}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                {actionLoading ? 'Processing...' : 'Approve Payment'}
              </button>
              <button
                onClick={() => handleAction(false)}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors disabled:opacity-50"
              >
                <ShieldX className="w-4 h-4" />
                {actionLoading ? 'Processing...' : 'Reject Payment'}
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* Attached Proofs / Files */}
      <Card className="p-6 border border-border bg-card900 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            Attached Proofs / Files
          </h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {proofsList.length} File(s)
          </span>
        </div>

        <div className="space-y-4">
          {proofsList.map((proof) => {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
            const isImg = proof.fileUrl?.match(/\.(jpeg|jpg|png|webp|gif)/i) || proof.fileName?.match(/\.(jpeg|jpg|png|webp|gif)/i);
            const directUrl = proof.fileUrl && proof.fileUrl !== '#' ? proof.fileUrl : '#';
            const isRealProof = proof.id && !proof.id.toString().startsWith('default-proof-');
            
            const viewUrl = isRealProof
              ? `${apiBase}/payments/proof/${proof.id}/file`
              : directUrl;
            
            const downloadUrl = isRealProof
              ? `${apiBase}/payments/proof/${proof.id}/file?download=true`
              : (directUrl !== '#' && directUrl.includes('res.cloudinary.com') ? directUrl.replace('/upload/', '/upload/fl_attachment/') : directUrl);

            return (
              <div key={proof.id} className="p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/30 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                      {isImg ? <ImageIcon className="w-5 h-5 text-indigo-400" /> : <FileText className="w-5 h-5 text-indigo-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{proof.fileName || `Deposit_Slip_${p.transactionRef}.pdf`}</p>
                      <p className="text-xs text-muted-foreground">Uploaded: {formatDate(proof.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${STATUS_STYLE[proof.status] || STATUS_STYLE['PENDING']}`}>
                      {proof.status || 'PENDING'}
                    </span>

                    {/* View File Button */}
                    <a
                      href={viewUrl !== '#' ? viewUrl : undefined}
                      onClick={(e) => {
                        if (viewUrl === '#') {
                          e.preventDefault();
                          toast(`Viewing deposit file record: ${proof.fileName}`, { icon: '📄' });
                        }
                      }}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted800 hover:bg-muted border border-border text-foreground transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" /> View
                    </a>

                    {/* Download File Button */}
                    <a
                      href={downloadUrl}
                      download={proof.fileName || `Deposit_Slip_${p.transactionRef}.pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                </div>

                {/* Inline Image Preview */}
                {viewUrl !== '#' && isImg && (
                  <div className="mt-3 p-2 rounded-lg border border-border/40 bg-black/40 flex justify-center overflow-hidden">
                    <img
                      src={viewUrl}
                      alt="Receipt Proof"
                      className="max-h-64 object-contain rounded-md hover:scale-105 transition-transform duration-200"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Audit Trail */}
      <Card className="p-6 border border-border bg-card900 backdrop-blur-xl">
        <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" /> Audit Trail
        </h3>
        {!p.auditLogs || p.auditLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No audit events recorded.</p>
        ) : (
          <ol className="relative border-l border-border/40 space-y-4 pl-5">
            {p.auditLogs.map((log) => (
              <li key={log.id} className="relative">
                <div className="absolute -left-[22px] w-3 h-3 rounded-full bg-indigo-500/60 border-2 border-indigo-500/20 top-1" />
                <p className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{log.action.replace(/_/g, ' ')}</p>
                {(log.oldStatus || log.newStatus) && (
                  <p className="text-xs text-muted-foreground">
                    {log.oldStatus && <span className="text-rose-400">{log.oldStatus}</span>}
                    {log.oldStatus && log.newStatus && ' → '}
                    {log.newStatus && <span className="text-emerald-400">{log.newStatus}</span>}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
