import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { branchesApi } from '../../branchesApi';
import { usePermission } from '../../../../hooks/usePermission';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    status: 'ACTIVE',
  });

  const { can: canCreate } = usePermission('branches:create');
  const { can: canUpdate } = usePermission('branches:update');
  const { can: canDelete } = usePermission('branches:delete');

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await branchesApi.getBranches({ search });
      const data = res?.data || res || [];
      setBranches(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [search]);

  const handleOpenModal = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        code: branch.code || '',
        name: branch.name || '',
        address: branch.address || '',
        phone: branch.phone || '',
        status: branch.status || 'ACTIVE',
      });
    } else {
      setEditingBranch(null);
      setFormData({ code: '', name: '', address: '', phone: '', status: 'ACTIVE' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await branchesApi.updateBranch(editingBranch.id, formData);
        toast.success('Branch updated successfully');
      } else {
        await branchesApi.createBranch(formData);
        toast.success('Branch created successfully');
      }
      setIsModalOpen(false);
      fetchBranches();
    } catch (err) {
      toast.error(err?.message || 'Failed to save branch');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;
    try {
      await branchesApi.deleteBranch(id);
      toast.success('Branch deleted successfully');
      fetchBranches();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete branch');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 light:text-slate-900 tracking-tight">Branches & Warehouses</h1>
          <p className="text-sm text-slate-400">Manage regional branch offices and inventory hubs</p>
        </div>
        {canCreate && (
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add Branch
          </Button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <Card noPadding className="p-4 flex items-center gap-4">
        <div className="relative flex-1">
          <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search branches by code, name, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none placeholder-slate-400"
          />
        </div>
      </Card>

      {/* Branches Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading branches...</div>
      ) : branches.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">No branches found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((b) => (
            <Card
              key={b.id}
              hoverEffect
              className="flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold badge-indigo">
                    {b.code}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    b.status === 'ACTIVE'
                      ? 'badge-slate'
                      : 'badge-module'
                  }`}>
                    {b.status || 'ACTIVE'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 light:text-slate-900">{b.name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {b.address || 'No address specified'}
                </p>
                {b.phone && (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {b.phone}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-6 mt-4 border-t border-slate-800/80 light:border-slate-200">
                {canUpdate && (
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => handleOpenModal(b)}
                  >
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => handleDelete(b.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 light:text-slate-900">
              {editingBranch ? 'Edit Branch' : 'Add Branch'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Branch Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BR-ADDIS"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Addis Ababa Main Branch"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80 light:border-slate-200">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  Save
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
