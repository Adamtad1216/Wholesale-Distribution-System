import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { procurementApi } from '../../../procurementApi';
import { toast } from 'react-hot-toast';

export default function useGoodsReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [gr, setGr] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchGrDetails = async () => {
    try {
      setLoading(true);
      const res = await procurementApi.getGoodsReceiptById(id);
      const data = res?.data || res;
      setGr(data);
    } catch (err) {
      console.error('Failed to load Goods Receipt details:', err);
      toast.error('Failed to load Goods Receipt details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchGrDetails();
  }, [id]);

  const handleConfirmRejectGr = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please enter a reason for rejecting this Goods Receipt');
      return;
    }

    try {
      setSubmittingAction(true);
      await procurementApi.rejectGoodsReceipt(id, { reason: rejectionReason.trim() });
      toast.error(`Goods Receipt ${gr?.receiptNumber || ''} rejected.`);
      setShowRejectModal(false);
      setRejectionReason('');
      fetchGrDetails();
    } catch (err) {
      console.error('Failed to reject Goods Receipt:', err);
      toast.error(err.response?.data?.message || 'Failed to reject Goods Receipt');
    } finally {
      setSubmittingAction(false);
    }
  };

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
    if (supplier.supplierCode) return supplier.supplierCode;
    return 'Supplier Vendor';
  };

  return {
    id,
    loading,
    gr,
    submittingAction,
    showRejectModal,
    setShowRejectModal,
    rejectionReason,
    setRejectionReason,
    handleConfirmRejectGr,
    supplierName: getSupplierName(gr?.purchaseOrder?.supplier),
    navigate,
  };
}
