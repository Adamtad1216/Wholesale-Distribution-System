import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { financeApi } from '../../../financeApi';

export function usePaymentOptions() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);

  // Modals state
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [providerForm, setProviderForm] = useState({ name: '', code: '', type: 'MANUAL' });

  const [showMethodModal, setShowMethodModal] = useState(false);
  const [selectedParentProvider, setSelectedParentProvider] = useState(null);
  const [editingMethod, setEditingMethod] = useState(null);
  const [methodForm, setMethodForm] = useState({ name: '', code: '', requiresProof: false });

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await financeApi.getProviders();
      const list = Array.isArray(res?.data?.data)
        ? res.data.data
        : (Array.isArray(res?.data) ? res.data : []);
      setProviders(list);
    } catch (err) {
      console.error('Failed to load payment providers:', err);
      toast.error('Failed to fetch payment providers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Provider Handlers
  const handleOpenCreateProvider = () => {
    setEditingProvider(null);
    setProviderForm({ name: '', code: '', type: 'MANUAL' });
    setShowProviderModal(true);
  };

  const handleOpenEditProvider = (provider) => {
    setEditingProvider(provider);
    setProviderForm({ name: provider.name, code: provider.code, type: provider.type || 'MANUAL' });
    setShowProviderModal(true);
  };

  const handleCloseProviderModal = () => {
    setShowProviderModal(false);
  };

  const handleSaveProvider = async (e) => {
    e.preventDefault();
    if (!providerForm.name.trim()) {
      toast.error('Provider name is required');
      return;
    }
    try {
      if (editingProvider) {
        await financeApi.updateProvider(editingProvider.id, providerForm);
        toast.success(`Updated ${providerForm.name} successfully`);
      } else {
        await financeApi.createProvider(providerForm);
        toast.success(`Created provider ${providerForm.name}`);
      }
      setShowProviderModal(false);
      fetchProviders();
    } catch (err) {
      console.error('Failed to save provider:', err);
      toast.error(err.response?.data?.message || 'Failed to save payment provider');
    }
  };

  const handleToggleProviderActive = async (provider) => {
    try {
      await financeApi.updateProvider(provider.id, { isActive: !provider.isActive });
      toast.success(`${provider.name} is now ${!provider.isActive ? 'Active' : 'Inactive'}`);
      fetchProviders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteProvider = async (provider) => {
    if (!window.confirm(`Are you sure you want to delete payment provider "${provider.name}"?`)) return;
    try {
      await financeApi.deleteProvider(provider.id);
      toast.success(`Provider "${provider.name}" deleted`);
      fetchProviders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete provider');
    }
  };

  // Method Option Handlers
  const handleOpenCreateMethod = (provider) => {
    setSelectedParentProvider(provider);
    setEditingMethod(null);
    setMethodForm({ name: '', code: '', requiresProof: false });
    setShowMethodModal(true);
  };

  const handleOpenEditMethod = (provider, method) => {
    setSelectedParentProvider(provider);
    setEditingMethod(method);
    setMethodForm({ name: method.name, code: method.code, requiresProof: Boolean(method.requiresProof) });
    setShowMethodModal(true);
  };

  const handleCloseMethodModal = () => {
    setShowMethodModal(false);
  };

  const handleSaveMethod = async (e) => {
    e.preventDefault();
    if (!methodForm.name.trim()) {
      toast.error('Method name is required');
      return;
    }
    try {
      if (editingMethod) {
        await financeApi.updateMethodOption(editingMethod.id, methodForm);
        toast.success(`Updated method ${methodForm.name}`);
      } else {
        await financeApi.createMethodOption(selectedParentProvider.id, methodForm);
        toast.success(`Created method ${methodForm.name}`);
      }
      setShowMethodModal(false);
      fetchProviders();
    } catch (err) {
      console.error('Failed to save method option:', err);
      toast.error(err.response?.data?.message || 'Failed to save method option');
    }
  };

  const handleToggleMethodActive = async (method) => {
    try {
      await financeApi.updateMethodOption(method.id, { isActive: !method.isActive });
      toast.success(`Method is now ${!method.isActive ? 'Active' : 'Inactive'}`);
      fetchProviders();
    } catch (err) {
      toast.error('Failed to update method status');
    }
  };

  const handleDeleteMethod = async (method) => {
    if (!window.confirm(`Delete method option "${method.name}"?`)) return;
    try {
      await financeApi.deleteMethodOption(method.id);
      toast.success(`Method "${method.name}" deleted`);
      fetchProviders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete method option');
    }
  };

  return {
    loading,
    providers,
    fetchProviders,

    // Provider modal & form
    showProviderModal,
    editingProvider,
    providerForm,
    setProviderForm,
    handleOpenCreateProvider,
    handleOpenEditProvider,
    handleCloseProviderModal,
    handleSaveProvider,
    handleToggleProviderActive,
    handleDeleteProvider,

    // Method modal & form
    showMethodModal,
    selectedParentProvider,
    editingMethod,
    methodForm,
    setMethodForm,
    handleOpenCreateMethod,
    handleOpenEditMethod,
    handleCloseMethodModal,
    handleSaveMethod,
    handleToggleMethodActive,
    handleDeleteMethod,
  };
}
