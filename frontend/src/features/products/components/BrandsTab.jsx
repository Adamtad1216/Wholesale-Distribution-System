import React, { useState } from 'react';
import Card from '../../../components/ui/Card';
import Table, {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';
import { toast } from 'react-hot-toast';
import { productsApi } from '../productsApi';

export default function BrandsTab({
  brands = [],
  loading = false,
  onRefresh,
  canCreate = false,
  canUpdate = false,
  canDelete = false,
}) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
  });

  const filteredBrands = brands.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.name?.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q)
    );
  });

  const handleOpenModal = (brand = null) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name || '',
        description: brand.description || '',
        status: brand.status || 'ACTIVE',
      });
    } else {
      setEditingBrand(null);
      setFormData({
        name: '',
        description: '',
        status: 'ACTIVE',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
      };

      if (editingBrand) {
        await productsApi.updateBrand(editingBrand.id, payload);
        toast.success('Brand updated successfully');
      } else {
        await productsApi.createBrand(payload);
        toast.success('Brand created successfully');
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      toast.error(err?.message || 'Failed to save brand');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productsApi.deleteBrand(deleteTarget.id);
      toast.success('Brand deleted successfully');
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete brand');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Top action row */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brands..."
              className="w-full pl-3 pr-4 py-2 bg-muted800/80 border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {canCreate && (
            <Button
              variant="primary"
              size="md"
              onClick={() => handleOpenModal()}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Add Brand
            </Button>
          )}
        </div>
      </Card>

      {/* Brands Table */}
      {loading ? (
        <div className="bg-card/60 border border-border rounded-lg p-12 text-center text-muted-foreground">
          <p className="text-sm">Loading brands...</p>
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="bg-card/60 border border-border rounded-lg p-12 text-center text-muted-foreground">
          <h4 className="text-base font-semibold text-foreground">No Brands Found</h4>
          <p className="text-xs mt-1">Add manufacturer or supplier brands to the catalog.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBrands.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell>
                  <span className="font-semibold text-foreground">{brand.name}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {brand.description || '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      brand.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-700/20 text-slate-400 border border-slate-700/40'
                    }`}
                  >
                    {brand.status || 'ACTIVE'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatDate(brand.createdAt)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => handleOpenModal(brand)}
                        title="Edit Brand"
                        className="p-1.5 text-muted-foreground hover:text-blue-500 rounded-md hover:bg-muted800 transition"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(brand)}
                        title="Delete Brand"
                        className="p-1.5 text-muted-foreground hover:text-rose-400 rounded-md hover:bg-muted800 transition"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create / Edit Brand Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBrand ? 'Edit Brand' : 'Create Brand'}
        subtitle="Manage brand identity and information"
        icon="🏷️"
        maxWidth="max-w-md"
        scope="workspace"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Brand Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Bosch, DeWalt, Makita"
              className="w-full px-3 py-2 bg-muted800/80 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-muted800/80 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the brand or manufacturer..."
              className="w-full px-3 py-2 bg-muted800/80 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              disabled={submitting}
            >
              {editingBrand ? 'Save Changes' : 'Create Brand'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Brand"
        message={`Are you sure you want to delete brand "${deleteTarget?.name}"? Products linked to this brand may need updating.`}
        submitting={deleting}
      />
    </div>
  );
}
