import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Loader2, FileCheck, ShieldAlert } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { financeApi } from '../../../finance/financeApi';

export default function Receipt() {
  const [searchParams] = useSearchParams();
  const txRef = searchParams.get('tx_ref');
  const isManual = searchParams.get('manual') === 'true';
  const navigate = useNavigate();

  // Initial state: if manual parameter is passed, default immediately to PROCESSING state
  const [status, setStatus] = useState(isManual ? 'PROCESSING' : 'VERIFYING'); // VERIFYING, SUCCESS, PROCESSING, FAILED
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    if (!txRef) {
      setStatus('FAILED');
      return;
    }

    // Manual bank transfer payments bypass automatic online gateway verification
    if (isManual) {
      setStatus('PROCESSING');
      financeApi.verifyPayment(txRef)
        .then((res) => setPaymentData(res.data))
        .catch(() => {});
      return;
    }

    const verify = async () => {
      try {
        const response = await financeApi.verifyPayment(txRef);
        const data = response.data;
        setPaymentData(data);

        if (data?.status === 'SUCCESS' || data?.status === 'SUCCESSFUL') {
          setStatus('SUCCESS');
        } else if (data?.status === 'PENDING' || data?.status === 'PROCESSING' || ['MANUAL', 'BANK_TRANSFER'].includes(data?.provider?.toUpperCase())) {
          setStatus('PROCESSING');
        } else {
          setStatus('FAILED');
        }
      } catch (error) {
        console.error('Verification error:', error);
        // Fallback for offline or manual reference checks to avoid false verification failures
        setStatus('PROCESSING');
      }
    };

    verify();
  }, [txRef, isManual]);

  const formatAmount = (amt) =>
    amt ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(amt) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="card max-w-md w-full p-8 text-center border-border/40 space-y-6 shadow-2xl backdrop-blur-xl">

        {status === 'VERIFYING' && (
          <div className="flex flex-col items-center animate-fade-in">
            <Loader2 className="w-16 h-16 text-indigo-400 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-foreground">Verifying Payment...</h2>
            <p className="text-muted-foreground mt-2">Please wait while we confirm your payment details.</p>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="flex flex-col items-center animate-fade-in">
            <CheckCircle className="w-20 h-20 text-emerald-500 mb-4" />
            <h2 className="text-3xl font-bold text-foreground">Payment Successful!</h2>
            <p className="text-muted-foreground mt-3">
              Your transaction <span className="font-mono text-sm bg-muted px-2 py-1 rounded text-foreground">{txRef}</span> has been processed successfully.
            </p>
            {paymentData?.amount && (
              <p className="text-xl font-bold text-emerald-400 mt-2">
                {formatAmount(paymentData.amount)}
              </p>
            )}
            <div className="mt-8 flex gap-4 w-full">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/finance')}>
                View Invoices
              </Button>
            </div>
          </div>
        )}

        {status === 'PROCESSING' && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center mb-4">
              <Clock className="w-10 h-10 text-blue-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Payment Submitted for Approval</h2>
            <p className="text-muted-foreground text-sm mt-3">
              Your payment reference <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-foreground">{txRef}</span> and transfer evidence have been submitted.
            </p>

            {/* Summary Card */}
            <div className="w-full mt-5 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-left space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">Transaction Reference</span>
                <span className="font-mono font-bold text-foreground">{txRef}</span>
              </div>
              {paymentData?.amount && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Amount</span>
                  <span className="font-bold text-indigo-400">{formatAmount(paymentData.amount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">Status</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <FileCheck className="w-3 h-3" /> Submitted for Approval
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              This payment method requires human verification. A finance team member will review your deposit slip and approve your payment manually.
            </p>

            <div className="mt-6 w-full">
              <Button variant="primary" className="w-full" onClick={() => navigate('/finance')}>
                View Invoices & Orders
              </Button>
            </div>
          </div>
        )}

        {status === 'FAILED' && (
          <div className="flex flex-col items-center animate-fade-in">
            <XCircle className="w-20 h-20 text-red-500 mb-4" />
            <h2 className="text-3xl font-bold text-foreground">Payment Verification Failed</h2>
            <p className="text-muted-foreground mt-3">We could not verify your online gateway payment session.</p>
            <div className="mt-8 w-full">
              <Button variant="primary" className="w-full" onClick={() => navigate('/finance')}>
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
