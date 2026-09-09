import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Loader2, FileCheck, ShieldAlert } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { financeApi } from '../../../finance/financeApi';

export default function Receipt() {
  const [searchParams] = useSearchParams();
  const txRef = searchParams.get('tx_ref');
  const transferRef = searchParams.get('transfer_ref');
  const isManual = searchParams.get('manual') === 'true';
  const navigate = useNavigate();

  useEffect(() => {
    if (transferRef) {
      navigate(`/procurement/transfer-receipt?reference=${encodeURIComponent(transferRef)}`, { replace: true });
    }
  }, [transferRef, navigate]);

  // Initial state: if manual parameter is passed, default immediately to PROCESSING state
  const [status, setStatus] = useState(isManual ? 'PROCESSING' : 'VERIFYING'); // VERIFYING, SUCCESS, PROCESSING, FAILED
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    if (transferRef) return;
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

        const normStatus = data?.status?.toUpperCase();
        if (normStatus === 'SUCCESS' || normStatus === 'SUCCESSFUL') {
          setStatus('SUCCESS');
        } else if (normStatus === 'PENDING' || normStatus === 'PROCESSING' || ['MANUAL', 'BANK_TRANSFER'].includes(data?.provider?.toUpperCase())) {
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
    amt !== null && amt !== undefined
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(amt)
      : null;
  const formatCurrency = formatAmount;

  return (
    <div className="w-full flex items-center justify-center py-8 px-4">
      <div className="bg-white text-slate-900 max-w-xl w-full min-h-[500px] flex flex-col justify-center p-8 sm:p-10 text-center border border-slate-200/90 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden">
        {/* Top Emerald/Indigo Accent Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600" />

        {status === 'VERIFYING' && (
          <div className="flex flex-col items-center py-8 animate-fade-in my-auto">
            <Loader2 className="w-14 h-14 text-indigo-600 animate-spin mb-4" />
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Verifying Payment...</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">Please wait while we confirm your transaction with Chapa.</p>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="flex flex-col items-center animate-fade-in my-auto">
            <div className="w-18 h-18 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Payment Successful!</h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
              Your transaction reference <span className="font-mono text-sm font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-lg inline-block my-0.5">{txRef}</span> has been confirmed.
            </p>
            {paymentData?.amount && (
              <p className="text-4xl sm:text-5xl font-black text-emerald-700 mt-3 tracking-tight font-mono">
                {formatAmount(paymentData.amount)}
              </p>
            )}

            {/* Summary Details Card */}
            <div className="w-full mt-6 p-5 rounded-2xl border border-slate-200 bg-slate-50/80 text-left space-y-3 shadow-2xs">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Transaction Reference</span>
                <span className="font-mono font-extrabold text-slate-900 text-sm">{txRef}</span>
              </div>
              {paymentData?.provider && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Gateway Provider</span>
                  <span className="font-extrabold uppercase text-slate-900 text-xs">{paymentData.provider}</span>
                </div>
              )}
              {paymentData?.currency && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Currency</span>
                  <span className="font-extrabold text-slate-900 text-xs">{paymentData.currency}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/80">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Payment Status</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700" /> Confirmed & Settled
                </span>
              </div>
            </div>

            <div className="mt-8 flex gap-3.5 w-full">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                onClick={() => navigate('/finance')}
              >
                View Invoices & Orders
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                onClick={() => navigate('/')}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}

        {status === 'PROCESSING' && (
          <div className="flex flex-col items-center animate-fade-in my-auto">
            <div className="w-18 h-18 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center mb-4 shadow-sm">
              <Clock className="w-10 h-10 text-blue-600 animate-pulse" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Payment Submitted for Verification</h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Payment reference <span className="font-mono text-sm font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg inline-block my-0.5">{txRef}</span> has been logged.
            </p>

            {/* Summary Card */}
            <div className="w-full mt-6 p-5 rounded-2xl border border-blue-200 bg-blue-50/50 text-left space-y-3 shadow-2xs">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Transaction Reference</span>
                <span className="font-mono font-extrabold text-slate-900 text-sm">{txRef}</span>
              </div>
              {paymentData?.amount && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Transfer Amount</span>
                  <span className="font-extrabold text-indigo-700 text-sm font-mono">{formatAmount(paymentData.amount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs pt-1 border-t border-blue-200/80">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Status</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
                  <FileCheck className="w-3.5 h-3.5 text-blue-700" /> Under Review
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">
              This payment requires verification. A finance team member will review your deposit details shortly.
            </p>

            <div className="mt-8 w-full">
              <Button
                variant="primary"
                size="lg"
                className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                onClick={() => navigate('/finance')}
              >
                View Finance Dashboard
              </Button>
            </div>
          </div>
        )}

        {status === 'FAILED' && (
          <div className="flex flex-col items-center animate-fade-in my-auto">
            <div className="w-18 h-18 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center mb-4 shadow-sm">
              <XCircle className="w-10 h-10 text-rose-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Payment Verification Failed</h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 font-medium">We could not verify your online gateway payment session.</p>
            <div className="mt-8 w-full">
              <Button
                variant="primary"
                size="lg"
                className="w-full text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white"
                onClick={() => navigate('/finance')}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
