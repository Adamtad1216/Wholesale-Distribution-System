import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { suppliersApi } from '../../../suppliersApi';
import { procurementApi } from '../../../../procurement/procurementApi';

export function useSupplierDetail() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  const fetchSupplierDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [supRes, poRes] = await Promise.allSettled([
        suppliersApi.getSupplierById(id),
        procurementApi.getPurchaseOrders({ limit: 100 }),
      ]);

      const supData =
        supRes.status === 'fulfilled'
          ? supRes.value?.data || supRes.value
          : null;

      setSupplier(supData);

      // Filter POs belonging to this supplier
      const allPos =
        poRes.status === 'fulfilled'
          ? poRes.value?.data?.purchaseOrders || poRes.value?.data || poRes.value || []
          : [];
      const supplierPos = Array.isArray(allPos)
        ? allPos.filter((po) => po.supplierId === id || po.supplier?.id === id || po.supplier?.name === supData?.name)
        : [];
      setPurchaseOrders(supplierPos);
    } catch (err) {
      console.error('Failed to load supplier detail:', err);
      toast.error('Failed to load supplier details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSupplierDetails();
  }, [fetchSupplierDetails]);

  const isIndividual = Boolean(supplier?.supplierType === 'INDIVIDUAL' || supplier?.person);
  const totalPoCount = purchaseOrders.length;
  const totalPoValue = useMemo(() => {
    return purchaseOrders.reduce((acc, po) => acc + Number(po.total || 0), 0);
  }, [purchaseOrders]);

  const vendorPaymentChannels = useMemo(() => {
    const sup = supplier;
    if (!sup) return [];

    if (Array.isArray(sup.paymentChannels) && sup.paymentChannels.length > 0) {
      return sup.paymentChannels;
    }
    if (Array.isArray(sup.payoutChannels) && sup.payoutChannels.length > 0) {
      return sup.payoutChannels.map((c, idx) => ({
        id: c.id || `payout-${idx}`,
        icon: c.channelType === 'CHAPA' ? '⚡' : c.channelType === 'TELEBIRR' ? '📱' : '🏦',
        title: c.bankName || (c.channelType === 'BANK' ? 'Bank Transfer' : c.channelType || 'Payout Account'),
        badge: c.isPrimary ? 'Primary Account' : (c.channelType || 'Registered'),
        badgeStyle: c.isPrimary ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400',
        account: `Acc: ${c.accountNumber}`,
        subtitle: c.accountName ? `Holder: ${c.accountName}` : `Payee: ${sup.name || sup.companyName || 'Vendor'}`
      }));
    }
    if (Array.isArray(sup.paymentMethods) && sup.paymentMethods.length > 0) {
      return sup.paymentMethods.map((pm, idx) => ({
        id: pm.id || `pm-${idx}`,
        icon: pm.icon || '💳',
        title: pm.name || pm.title || 'Payment Channel',
        badge: pm.type || 'Registered',
        badgeStyle: 'bg-indigo-500/20 text-indigo-400',
        account: pm.accountNumber || pm.account || pm.details || 'Available',
        subtitle: pm.bankName || pm.description || 'Vendor Preferred Channel'
      }));
    }

    const channels = [];
    if (sup.bankAccount || sup.cbeAccount || sup.accountNumber || sup.bankName) {
      channels.push({
        id: 'bank',
        icon: '🏦',
        title: sup.bankName ? `Bank Transfer (${sup.bankName})` : 'Bank Transfer (CBE)',
        badge: 'Primary Account',
        badgeStyle: 'bg-emerald-500/20 text-emerald-400',
        account: `Acc: ${sup.bankAccount || sup.cbeAccount || sup.accountNumber}`,
        subtitle: `Payee: ${sup.name || sup.companyName || 'Vendor'}`
      });
    }

    if (sup.chapaRef || sup.chapaAccount || sup.onlinePayoutRef) {
      channels.push({
        id: 'chapa',
        icon: '⚡',
        title: 'Chapa Payout Gateway',
        badge: 'Online Payout',
        badgeStyle: 'bg-indigo-500/20 text-indigo-400',
        account: `Ref: ${sup.chapaRef || sup.chapaAccount || sup.onlinePayoutRef}`,
        subtitle: 'Instant Outbound Settlement'
      });
    }

    const phoneNum = sup.telebirrNumber || sup.mobileMoney || sup.phone || sup.contactPhone;
    if (phoneNum) {
      channels.push({
        id: 'mobile',
        icon: '📱',
        title: 'Telebirr / Mobile Wallet',
        badge: 'Mobile Wallet',
        badgeStyle: 'bg-amber-500/20 text-amber-400',
        account: `Mobile: ${phoneNum}`,
        subtitle: 'Direct Wallet Transfer'
      });
    }

    return channels;
  }, [supplier]);

  return {
    id,
    supplier,
    loading,
    purchaseOrders,
    activeTab,
    setActiveTab,
    isIndividual,
    totalPoCount,
    totalPoValue,
    vendorPaymentChannels,
    refetch: fetchSupplierDetails,
  };
}
