import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { procurementApi } from '../../../procurementApi';
import { toast } from 'react-hot-toast';

export default function usePurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [po, setPo] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchPoDetails = async () => {
    try {
      setLoading(true);
      const res = await procurementApi.getPurchaseOrderById(id);
      const data = res?.data || res;
      setPo(data);
    } catch (err) {
      console.error('Failed to load purchase order details:', err);
      toast.error('Failed to load Purchase Order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchPoDetails();
  }, [id]);

  const handleApprovePo = async () => {
    try {
      setSubmittingAction(true);
      await procurementApi.approvePurchaseOrder(id);
      toast.success(`Purchase Order ${po?.poNumber || ''} approved successfully!`);
      fetchPoDetails();
    } catch (err) {
      console.error('Failed to approve PO:', err);
      toast.error(err.response?.data?.message || 'Failed to approve Purchase Order');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please enter a reason for rejecting this Purchase Order');
      return;
    }

    try {
      setSubmittingAction(true);
      await procurementApi.rejectPurchaseOrder(id, { reason: rejectionReason.trim() });
      toast.error(`Purchase Order ${po?.poNumber || ''} rejected.`);
      setShowRejectModal(false);
      setRejectionReason('');
      fetchPoDetails();
    } catch (err) {
      console.error('Failed to reject PO:', err);
      toast.error(err.response?.data?.message || 'Failed to reject Purchase Order');
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'RECEIVED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'COMPLETED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return {
    id,
    loading,
    po,
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
  };
}
