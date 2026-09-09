import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { suppliersApi } from '../../../suppliersApi';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await suppliersApi.getSuppliers();
      setSuppliers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
      toast.error('Failed to load suppliers data');
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Filter logic
  const filteredSuppliers = useMemo(() => {
    const query = search.toLowerCase();
    return suppliers.filter((s) => {
      const matchesSearch =
        !search ||
        s.name?.toLowerCase().includes(query) ||
        s.companyName?.toLowerCase().includes(query) ||
        s.supplierCode?.toLowerCase().includes(query) ||
        s.contactPerson?.toLowerCase().includes(query) ||
        s.tin?.includes(query);

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [suppliers, search, statusFilter]);

  // Metrics
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.status === 'ACTIVE').length;
  const totalSpentETB = suppliers.reduce((acc, s) => acc + (s.totalSpent || 0), 0);

  // Archive / Delete supplier
  const handleArchive = async (id) => {
    if (!window.confirm('Are you sure you want to archive this supplier?')) return;
    try {
      await suppliersApi.archiveSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      toast.success('Supplier archived successfully');
    } catch (err) {
      console.error('Archive error:', err);
      toast.error('Failed to archive supplier');
    }
  };

  return {
    suppliers,
    filteredSuppliers,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    totalSuppliers,
    activeSuppliers,
    totalSpentETB,
    fetchSuppliers,
    handleArchive,
  };
}
