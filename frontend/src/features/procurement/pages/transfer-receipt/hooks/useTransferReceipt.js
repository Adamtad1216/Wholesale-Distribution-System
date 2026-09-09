import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { procurementApi } from '../../../procurementApi';
import { financeApi } from '../../../../finance/financeApi';
import { toast } from 'react-hot-toast';

export default function useTransferReceipt() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const navState = location.state || {};
  const queryReference = searchParams.get('reference') || searchParams.get('ref') || navState.reference;

  const [loading, setLoading] = useState(!navState.verificationData);
  const [reverifying, setReverifying] = useState(false);
  const [gr, setGr] = useState(navState.gr || null);
  const [verificationData, setVerificationData] = useState(navState.verificationData || null);
  const [transferDetails, setTransferDetails] = useState(navState.transferDetails || {});
  const [copied, setCopied] = useState(false);

  const reference =
    queryReference ||
    transferDetails.reference ||
    gr?.payment?.referenceNumber ||
    gr?.payment?.transactionRef ||
    '';

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);

        let currentGr = gr;
        if (!currentGr && id) {
          const res = await procurementApi.getGoodsReceipt(id);
          currentGr = res?.data || res;
          if (isMounted) setGr(currentGr);
        }

        const activeRef =
          queryReference ||
          currentGr?.payment?.referenceNumber ||
          currentGr?.payment?.transactionRef ||
          reference;

        if (activeRef && (!verificationData || activeRef !== verificationData?.reference)) {
          try {
            const vRes = await financeApi.verifyChapaTransfer(activeRef);
            const vData = vRes?.data?.data || vRes?.data || {};
            if (isMounted) setVerificationData(vData);
          } catch (vErr) {
            console.warn('Could not auto-verify transfer:', vErr.message);
          }
        }
      } catch (err) {
        console.error('Failed to load transfer receipt:', err);
        toast.error('Failed to load receipt details');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (!verificationData || !gr) {
      loadData();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [id, queryReference]);

  const handleReverify = async () => {
    const activeRef = reference || verificationData?.reference;
    if (!activeRef) {
      toast.error('No transfer reference available to verify');
      return;
    }

    try {
      setReverifying(true);
      const res = await financeApi.verifyChapaTransfer(activeRef);
      const data = res?.data?.data || res?.data || {};
      setVerificationData(data);
      toast.success('⚡ Gateway verification status updated!');
    } catch (err) {
      console.error('Re-verification failed:', err);
      toast.error(err.response?.data?.message || err.message || 'Verification check failed');
    } finally {
      setReverifying(false);
    }
  };

  const handleCopyRef = () => {
    const refToCopy = reference || verificationData?.reference || 'N/A';
    navigator.clipboard.writeText(refToCopy);
    setCopied(true);
    toast.success('Reference copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amt) => {
    const num = Number(amt) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const supplierObj = gr?.purchaseOrder?.supplier || {};
  const supplierName =
    supplierObj.organization?.name ||
    (supplierObj.person ? `${supplierObj.person.firstName} ${supplierObj.person.lastName || ''}`.trim() : null) ||
    navState.supplierName ||
    'Vendor Supplier';

  const payoutAccountName =
    transferDetails.accountName ||
    navState.targetAccountName ||
    supplierName;

  const payoutAccountNumber =
    transferDetails.accountNumber ||
    navState.targetAccountNumber ||
    supplierObj.payoutChannels?.[0]?.accountNumber ||
    '1000123456789';

  const bankName =
    transferDetails.bankName ||
    navState.bankName ||
    supplierObj.payoutChannels?.[0]?.bankName ||
    'Commercial Bank of Ethiopia (CBE)';

  const amount =
    transferDetails.amount ||
    navState.grandTotal ||
    gr?.payment?.amount ||
    0;

  const goodsSubtotal = navState.goodsSubtotal || (gr?.items || []).reduce((acc, item) => {
    const net = Number(item.receivedQuantity || 0) - Number(item.damagedQuantity || 0);
    const price = Number(item.unitCost || item.product?.costPrice || 0);
    return acc + net * price;
  }, 0);

  const vatAmount = navState.vatAmount !== undefined ? navState.vatAmount : (goodsSubtotal * 0.15);
  const withholdingAmount = navState.withholdingAmount !== undefined ? navState.withholdingAmount : 0;
  const shippingFee = navState.shippingFee !== undefined ? navState.shippingFee : 0;

  const isVerifiedSuccess =
    verificationData?.status === 'SUCCESS' ||
    verificationData?.status === 'success' ||
    verificationData?.data?.status === 'success' ||
    verificationData?.data?.status === 'COMPLETED';

  const statusLabel = isVerifiedSuccess ? 'VERIFIED & SETTLED' : (verificationData?.status || 'INITIATED');
  const verifyMessage = verificationData?.message || verificationData?.raw?.message || 'Transfer confirmed with payment gateway';
  const timestamp = verificationData?.verifiedAt || verificationData?.data?.verified_at || new Date().toISOString();
  const transactionId = verificationData?.data?.id || verificationData?.raw?.data?.id || verificationData?.reference || 'N/A';

  return {
    id,
    loading,
    reverifying,
    gr,
    copied,
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
  };
}
