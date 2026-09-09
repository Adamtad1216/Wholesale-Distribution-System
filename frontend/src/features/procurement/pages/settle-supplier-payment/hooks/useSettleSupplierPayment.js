import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { procurementApi } from '../../../procurementApi';
import { suppliersApi } from '../../../../suppliers/suppliersApi';
import { financeApi } from '../../../../finance/financeApi';
import { toast } from 'react-hot-toast';

export default function useSettleSupplierPayment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [gr, setGr] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Payment State
  const [paymentCategory, setPaymentCategory] = useState('ONLINE'); // 'ONLINE' | 'MANUAL'
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [selectedMethodOption, setSelectedMethodOption] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Evidence / Proof Upload
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState(null);

  // Tax & Fee Adjustments
  const [includeVat, setIncludeVat] = useState(true);
  const [includeWithholding, setIncludeWithholding] = useState(false);
  const [shippingFee, setShippingFee] = useState(0);

  // Dynamic Payment Providers from DB
  const [providers, setProviders] = useState([]);

  const handleEvidenceChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEvidenceFile(file);
    setEvidencePreview(URL.createObjectURL(file));
  };

  const handleRemoveEvidence = () => {
    setEvidenceFile(null);
    setEvidencePreview(null);
  };

  const fetchGrDetails = async () => {
    try {
      setLoading(true);
      const [grRes, provRes] = await Promise.all([
        procurementApi.getGoodsReceiptById(id),
        procurementApi.getPaymentProviders().catch(() => ({ data: [] })),
      ]);

      const data = grRes?.data || grRes;
      const supplierId = data?.purchaseOrder?.supplierId || data?.purchaseOrder?.supplier?.id;
      if (supplierId) {
        try {
          const supRes = await suppliersApi.getSupplierById(supplierId);
          if (supRes?.data && data?.purchaseOrder) {
            data.purchaseOrder.supplier = {
              ...data.purchaseOrder.supplier,
              ...supRes.data,
            };
          }
        } catch (supErr) {
          console.warn('Could not fetch supplier details:', supErr);
        }
      }

      setGr(data);

      const provList = Array.isArray(provRes?.data?.data)
        ? provRes.data.data
        : (Array.isArray(provRes?.data) ? provRes.data : []);
      setProviders(provList);
    } catch (err) {
      console.error('Failed to fetch receipt details for payment settlement:', err);
      toast.error('Failed to load Goods Receipt for settlement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchGrDetails();
  }, [id]);

  const getSupplier = () => gr?.purchaseOrder?.supplier || {};

  const getSupplierName = (supplier) => {
    if (!supplier) return 'N/A';
    if (typeof supplier === 'string') return supplier;
    if (supplier.name) return supplier.name;
    if (supplier.companyName) return supplier.companyName;
    if (supplier.organization?.name) return supplier.organization.name;
    if (supplier.person) {
      const fullName = `${supplier.person.firstName || ''} ${supplier.person.lastName || ''}`.trim();
      if (fullName) return fullName;
    }
    if (supplier.contactPerson) return supplier.contactPerson;
    return 'Supplier Vendor';
  };

  // Financial Calculations
  const items = gr?.items || [];
  const goodsSubtotal = items.reduce((acc, item) => {
    const netAccepted = Number(item.receivedQuantity || 0) - Number(item.damagedQuantity || 0);
    const unitPrice = Number(item.unitCost || item.product?.costPrice || 0);
    return acc + netAccepted * unitPrice;
  }, 0);

  const vatAmount = includeVat ? goodsSubtotal * 0.15 : 0;
  const withholdingAmount = includeWithholding ? goodsSubtotal * 0.02 : 0;
  const totalShipping = Number(shippingFee) || 0;
  const grandTotal = goodsSubtotal + vatAmount - withholdingAmount + totalShipping;

  const handleSelectCategory = (cat) => {
    setPaymentCategory(cat);
    const matchedProv = providers.find(
      (p) => p.type?.toUpperCase() === cat && p.isActive !== false
    );
    setPaymentMethod(matchedProv?.code || matchedProv?.id || (cat === 'ONLINE' ? 'BANK_TRANSFER' : 'CASH'));
  };

  const handleSettlePayment = async () => {
    try {
      setSubmitting(true);

      const supplierObj = gr?.purchaseOrder?.supplier || {};
      const payoutChannels = supplierObj.payoutChannels || [];
      const primaryChannel = payoutChannels.find((c) => c.isPrimary) || payoutChannels[0] || {};

      const rawAccount = primaryChannel.accountNumber || '1000123456789';
      const targetAccountNumber = rawAccount.replace(/\D/g, '') || '1000123456789';

      let targetAccountName = primaryChannel.accountName || getSupplierName(supplierObj);

      let chapaBankId = '128'; // CBE Bank ID in Chapa
      const bankNameLower = (primaryChannel.bankName || primaryChannel.channelType || '').toLowerCase();
      if (bankNameLower.includes('telebirr')) chapaBankId = '855';
      else if (bankNameLower.includes('awash')) chapaBankId = '656';
      else if (bankNameLower.includes('coop')) chapaBankId = '836';
      else if (bankNameLower.includes('abay')) chapaBankId = '130';
      else if (primaryChannel.bankCode && !isNaN(primaryChannel.bankCode)) chapaBankId = String(primaryChannel.bankCode);

      let txReference = referenceNumber || `TR-SUPPLIER-${Date.now()}`;

      let verificationData = null;

      // 1. Call Standalone Direct Chapa Transfer API if Online Payment
      if (paymentCategory === 'ONLINE') {
        try {
          const transferRes = await financeApi.initiateChapaTransfer({
            accountName: targetAccountName,
            accountNumber: targetAccountNumber,
            amount: grandTotal,
            bankCode: chapaBankId,
            currency: 'ETB',
            reference: txReference,
          });

          const resData = transferRes?.data;
          const transferResult = resData?.data || resData;

          if (transferResult?.status === 'FAILED' || transferResult?.status === 'failed') {
            toast.error(`Chapa Transfer Failed: ${transferResult.message || 'Transfer rejected'}`);
            setSubmitting(false);
            return;
          }

          txReference = transferResult?.reference || txReference;

          // 2. Immediately call verify API to verify transfer
          try {
            const verifyRes = await financeApi.verifyChapaTransfer(txReference);
            verificationData = verifyRes?.data?.data || verifyRes?.data;
          } catch (verifyErr) {
            console.warn('Direct verify call warning:', verifyErr);
          }
        } catch (chapaErr) {
          console.error('Chapa direct transfer call error:', chapaErr);
          const errMsg = chapaErr.response?.data?.message || chapaErr.message || 'Chapa payout request failed';
          toast.error(`Chapa API Error: ${errMsg}`);
          setSubmitting(false);
          return;
        }
      }

      // 3. Approve Goods Receipt & save payment record
      const paymentPayload = {
        amount: grandTotal,
        goodsSubtotal,
        vatAmount,
        withholdingAmount,
        shippingFee: totalShipping,
        paymentCategory,
        paymentMethod,
        selectedMethodOption,
        referenceNumber: txReference,
        alreadyInitiated: paymentCategory === 'ONLINE',
        notes: paymentNotes,
      };

      await procurementApi.approveGoodsReceipt(id, paymentPayload);

      toast.success(`Goods Receipt ${gr?.receiptNumber || id} marked PAID!`);

      // 4. Display the verified response as a receipt in one page
      if (paymentCategory === 'ONLINE') {
        navigate(`/procurement/receipts/${id}/transfer-receipt?reference=${encodeURIComponent(txReference)}`, {
          state: {
            verificationData,
            transferDetails: {
              accountName: targetAccountName,
              accountNumber: targetAccountNumber,
              bankName: primaryChannel.bankName || primaryChannel.channelType || 'Commercial Bank of Ethiopia (CBE)',
              amount: grandTotal,
              reference: txReference,
            },
            grandTotal,
            goodsSubtotal,
            vatAmount,
            withholdingAmount,
            shippingFee: totalShipping,
            gr,
            supplierName: getSupplierName(supplierObj),
          },
        });
      } else {
        navigate(`/procurement/receipts/${id}`);
      }
    } catch (err) {
      console.error('Failed to settle supplier payment:', err);
      toast.error(err.response?.data?.message || 'Failed to settle payment');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    id,
    loading,
    gr,
    submitting,
    supplier: getSupplier(),
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
  };
}
