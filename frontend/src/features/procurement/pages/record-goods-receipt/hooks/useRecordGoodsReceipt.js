import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { procurementApi } from '../../../procurementApi';
import { documentsApi } from '../../../../documents/documentsApi';
import { toast } from 'react-hot-toast';

export default function useRecordGoodsReceipt() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const targetPoId = location.state?.selectedPoId || searchParams.get('poId') || '';

  const [loadingPos, setLoadingPos] = useState(true);
  const [approvedPos, setApprovedPos] = useState([]);
  const [selectedPoForGr, setSelectedPoForGr] = useState(targetPoId);
  const [loadingPoDetails, setLoadingPoDetails] = useState(false);
  const [documentTypes, setDocumentTypes] = useState([]);

  // Form state
  const [grFormItems, setGrFormItems] = useState([]);
  const [evidenceCategory, setEvidenceCategory] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState('');
  const [grNotes, setGrNotes] = useState('');
  const [submittingGr, setSubmittingGr] = useState(false);

  const handleDeselectPo = () => {
    setSelectedPoForGr('');
    setGrFormItems([]);
    setApprovedPos([]);
    navigate('/procurement', { state: { activeTab: 'ON_DELIVERY_PO' } });
  };

  const fetchDocumentTypes = async () => {
    try {
      const res = await documentsApi.getDocumentTypes();
      const list = res?.data || res || [];
      if (Array.isArray(list)) {
        setDocumentTypes(list);
        if (list.length > 0) {
          setEvidenceCategory(list[0].code || list[0].id || '');
        }
      }
    } catch (err) {
      console.error('Failed to fetch document types:', err);
    }
  };

  const handlePoSelectionChange = async (poId) => {
    if (!poId) {
      handleDeselectPo();
      return;
    }

    setSelectedPoForGr(poId);
    try {
      setLoadingPos(true);
      setLoadingPoDetails(true);
      const res = await procurementApi.getPurchaseOrderById(poId);
      const poData = res.data || res;
      setApprovedPos([poData]);

      const items = (poData.items || []).map((item) => ({
        productId: item.productId,
        productName: item.product?.name || `Product #${item.productId?.slice(0, 6)}`,
        productSku: item.product?.sku || '',
        orderedQuantity: item.quantity,
        receivedQuantity: item.quantity,
        damagedQuantity: 0,
        unitCost: item.unitPrice || 0,
        remarks: '',
      }));
      setGrFormItems(items);
    } catch (err) {
      console.error('Failed to fetch PO details:', err);
      toast.error('Failed to load Purchase Order line items');
    } finally {
      setLoadingPos(false);
      setLoadingPoDetails(false);
    }
  };

  useEffect(() => {
    fetchDocumentTypes();
    if (targetPoId) {
      handlePoSelectionChange(targetPoId);
    } else {
      // If no purchase order was targeted, return to On_Delivery Purchase Orders tab
      navigate('/procurement', { state: { activeTab: 'ON_DELIVERY_PO' }, replace: true });
    }
  }, [targetPoId]);

  const handleItemUpdate = (index, field, value) => {
    const updated = [...grFormItems];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setGrFormItems(updated);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEvidenceFile(file);
      setEvidencePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setEvidenceFile(null);
    setEvidencePreview('');
  };

  const handleSubmitGoodsReceipt = async (e) => {
    e.preventDefault();
    if (!selectedPoForGr) {
      toast.error('Please select an Approved Purchase Order');
      return;
    }

    if (grFormItems.length === 0) {
      toast.error('No items found in selected Purchase Order');
      return;
    }

    try {
      setSubmittingGr(true);

      let evidenceUrl = null;
      if (evidenceFile) {
        try {
          const formData = new FormData();
          formData.append('file', evidenceFile);
          const uploadRes = await procurementApi.uploadEvidence(formData);
          evidenceUrl = uploadRes?.data?.fileUrl || uploadRes?.data?.url || uploadRes?.fileUrl;
        } catch (uploadErr) {
          console.warn('File upload fallback:', uploadErr);
          evidenceUrl = evidencePreview;
        }
      }

      const selectedPoObj = approvedPos.find((po) => po.id === selectedPoForGr);

      const payload = {
        purchaseOrderId: selectedPoForGr,
        warehouseId: selectedPoObj?.warehouseId,
        items: grFormItems.map((item) => ({
          productId: item.productId,
          orderedQuantity: Number(item.orderedQuantity),
          receivedQuantity: Number(item.receivedQuantity),
          damagedQuantity: Number(item.damagedQuantity || 0),
          unitCost: Number(item.unitCost || 0),
          remarks: item.remarks || '',
        })),
        evidenceUrl,
        evidenceCategory,
        notes: grNotes,
      };

      await procurementApi.createGoodsReceipt(payload);
      toast.success('Goods Receipt recorded successfully in PENDING status!');
      navigate('/procurement');
    } catch (err) {
      console.error('Failed to create Goods Receipt:', err);
      toast.error(err.response?.data?.message || 'Failed to record Goods Receipt');
    } finally {
      setSubmittingGr(false);
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
    loadingPos,
    approvedPos,
    selectedPoForGr,
    loadingPoDetails,
    documentTypes,
    grFormItems,
    evidenceCategory,
    setEvidenceCategory,
    evidenceFile,
    evidencePreview,
    grNotes,
    setGrNotes,
    submittingGr,
    handlePoSelectionChange,
    handleDeselectPo,
    handleItemUpdate,
    handleFileChange,
    handleRemoveFile,
    handleSubmitGoodsReceipt,
    getSupplierName,
    navigate,
  };
}
