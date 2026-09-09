import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { financeApi } from '../../financeApi';
import { customersApi } from '../../../customers/customersApi';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import Button from '../../../../components/ui/Button';
import Modal from '../../../../components/ui/Modal';
import { Plus, UserCheck } from 'lucide-react';
import CustomerTagSelect from '../credit-tab/CustomerTagSelect';

export default function PaymentTermsTab() {
  const queryClient = useQueryClient();
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'delete' | null
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [formData, setFormData] = useState({ name: '', days: 0, description: '' });

  // Assign Payment Term Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState(new Set());
  const [assignPaymentTermsId, setAssignPaymentTermsId] = useState('');

  // Fetch Payment Terms
  const { data: response, isLoading } = useQuery({
    queryKey: ['paymentTerms'],
    queryFn: () => financeApi.getPaymentTerms().catch(() => ({ data: [] })),
  });

  // Fetch Customers list for assignment modal
  const { data: customersResponse, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers-list-for-terms'],
    queryFn: () => customersApi.getCustomers(),
    enabled: isAssignModalOpen,
  });

  const terms = response?.data || [];

  // Derive flat customers array
  const customersList = useMemo(() => {
    const raw = customersResponse?.data;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.data?.customers)) return raw.data.customers;
    if (Array.isArray(raw.data?.items)) return raw.data.items;
    if (Array.isArray(raw.customers)) return raw.customers;
    if (Array.isArray(raw.items)) return raw.items;
    return [];
  }, [customersResponse]);

  const handleOpenCreate = () => {
    setSelectedTerm(null);
    setFormData({ name: '', days: 0, description: '' });
    setModalMode('create');
  };

  const handleOpenEdit = (term) => {
    setSelectedTerm(term);
    setFormData({ name: term.name, days: term.days, description: term.description || '' });
    setModalMode('edit');
  };

  const handleOpenDelete = (term) => {
    setSelectedTerm(term);
    setModalMode('delete');
  };

  const handleOpenAssign = () => {
    setSelectedCustomerIds(new Set());
    setAssignPaymentTermsId(terms.length > 0 ? terms[0].id : '');
    setIsAssignModalOpen(true);
  };

  const handleClose = () => {
    setModalMode(null);
    setSelectedTerm(null);
  };

  const createMutation = useMutation({
    mutationFn: (data) => financeApi.createPaymentTerm(data),
    onSuccess: () => {
      toast.success('Payment term created successfully!');
      queryClient.invalidateQueries({ queryKey: ['paymentTerms'] });
      handleClose();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to create payment term');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => financeApi.updatePaymentTerm(selectedTerm.id, data),
    onSuccess: () => {
      toast.success('Payment term updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['paymentTerms'] });
      handleClose();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update payment term');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => financeApi.deletePaymentTerm(id),
    onSuccess: () => {
      toast.success('Payment term deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['paymentTerms'] });
      handleClose();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to delete payment term');
    }
  });

  const assignMutation = useMutation({
    mutationFn: async ({ customerIds, paymentTermsId }) => {
      return Promise.all(
        customerIds.map((id) => customersApi.updateCustomer(id, { paymentTermsId }))
      );
    },
    onSuccess: () => {
      toast.success('Payment term assigned to selected customer(s) successfully!');
      queryClient.invalidateQueries({ queryKey: ['customers-list-for-terms'] });
      setIsAssignModalOpen(false);
      setSelectedCustomerIds(new Set());
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to assign payment term');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || formData.days < 0) {
      toast.error('Name and valid days (>= 0) are required.');
      return;
    }
    
    if (modalMode === 'create') {
      createMutation.mutate(formData);
    } else if (modalMode === 'edit') {
      updateMutation.mutate(formData);
    }
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (selectedCustomerIds.size === 0) {
      toast.error('Please select at least one customer.');
      return;
    }
    if (!assignPaymentTermsId) {
      toast.error('Please select a payment term.');
      return;
    }

    assignMutation.mutate({
      customerIds: Array.from(selectedCustomerIds),
      paymentTermsId: assignPaymentTermsId,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Payment Terms</h2>
          <p className="text-sm text-muted-foreground">Configure payment grace periods and assign them to customers.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenAssign}
            icon={<UserCheck className="w-4 h-4 text-indigo-400" />}
            className="border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-xl"
          >
            Assign Payment Term
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<Plus className="w-4 h-4" />}
            className="rounded-xl"
          >
            Create Payment Term
          </Button>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={handleClose}
        title={modalMode === 'edit' ? "Edit Payment Term" : "New Payment Term"}
        subtitle={modalMode === 'edit' ? "Update payment grace period details." : "Create a new payment grace period."}
        maxWidth="max-w-xl"
        footer={
          <>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" form="term-form" variant="primary" isLoading={createMutation.isPending || updateMutation.isPending}>
              {modalMode === 'edit' ? 'Save Changes' : 'Save Term'}
            </Button>
          </>
        }
      >
        <form id="term-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Name *</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Net 30"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Days *</label>
              <input
                type="number"
                min="0"
                className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500"
                placeholder="30"
                value={formData.days}
                onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              className="w-full bg-slate-950 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500 min-h-[80px]"
              placeholder="Optional description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Assign Payment Term Modal with Tag Search Select */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Payment Term to Customers"
        subtitle="Search recipients and assign their default credit settlement term."
        icon={<UserCheck className="w-5 h-5 text-indigo-400" />}
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="assign-term-form"
              variant="primary"
              isLoading={assignMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Assign Term
            </Button>
          </>
        }
      >
        <form id="assign-term-form" onSubmit={handleAssignSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Select Customers <span className="text-rose-400">*</span>
            </label>
            {isLoadingCustomers ? (
              <div className="text-xs text-muted-foreground py-2">Loading customers list...</div>
            ) : (
              <CustomerTagSelect
                customers={customersList}
                selectedIds={selectedCustomerIds}
                onAdd={(id) => setSelectedCustomerIds((prev) => { const n = new Set(prev); n.add(id); return n; })}
                onRemove={(id) => setSelectedCustomerIds((prev) => { const n = new Set(prev); n.delete(id); return n; })}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Payment Term <span className="text-rose-400">*</span></label>
            <select
              className="w-full bg-slate-950 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500 cursor-pointer"
              value={assignPaymentTermsId}
              onChange={(e) => setAssignPaymentTermsId(e.target.value)}
              required
            >
              <option value="">-- Select Payment Term --</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.days} Days)
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={modalMode === 'delete'}
        onClose={handleClose}
        title="Delete Payment Term"
        subtitle="Are you sure you want to delete this payment term?"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={() => deleteMutation.mutate(selectedTerm?.id)}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          This action will archive <span className="font-semibold text-foreground">{selectedTerm?.name}</span>. It will no longer be available for new customers, but existing records will remain unaffected.
        </p>
      </Modal>

      <div className="card p-0 overflow-hidden border-border/40">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan="5" className="text-center text-muted-foreground py-8">
                  Loading payment terms...
                </TableCell>
              </TableRow>
            ) : terms.length === 0 ? (
              <TableRow>
                <TableCell colSpan="5" className="text-center text-muted-foreground py-8">
                  No payment terms configured yet.
                </TableCell>
              </TableRow>
            ) : (
              terms.map((term) => (
                <TableRow key={term.id}>
                  <TableCell className="font-semibold text-foreground">{term.name}</TableCell>
                  <TableCell className="text-indigo-400 font-medium">{term.days} Days</TableCell>
                  <TableCell className="text-muted-foreground max-w-md truncate">
                    {term.description || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(term.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        onClick={() => handleOpenEdit(term)}
                        variant="secondary"
                        size="sm"
                        className="rounded-xl text-xs font-bold"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleOpenDelete(term)}
                        variant="danger"
                        size="sm"
                        className="rounded-xl text-xs font-bold"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
