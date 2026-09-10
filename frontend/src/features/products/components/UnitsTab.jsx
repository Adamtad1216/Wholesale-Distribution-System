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

export default function UnitsTab({
  units = [],
  loading = false,
  onRefresh,
  canCreate = false,
  canUpdate = false,
  canDelete = false,
}) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
  });

  const filteredUnits = units.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.abbreviation?.toLowerCase().includes(q)
    );
  });

  const handleOpenModal = (unit = null) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        name: unit.name || '',
        abbreviation: unit.abbreviation || '',
      });
    } else {
      setEditingUnit(null);
      setFormData({
        name: '',
        abbreviation: '',
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
        abbreviation: formData.abbreviation.trim(),
      };

      if (editingUnit) {
        await productsApi.updateUnit(editingUnit.id, payload);
        toast.success('Unit updated successfully');
      } else {
        await productsApi.createUnit(payload);
        toast.success('Unit created successfully');
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      toast.error(err?.message || 'Failed to save unit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productsApi.deleteUnit(deleteTarget.id);
      toast.success('Unit deleted successfully');
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete unit');
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
              placeholder="Search units or abbreviation..."
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
              Add Unit of Measure
            </Button>
          )}
        </div>
      </Card>

      {/* Units Table */}
      {loading ? (
        <div className="bg-card/60 border border-border rounded-lg p-12 text-center text-muted-foreground">
          <p className="text-sm">Loading measurement units...</p>
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="bg-card/60 border border-border rounded-lg p-12 text-center text-muted-foreground">
          <h4 className="text-base font-normal text-foreground">No Units Found</h4>
          <p className="text-xs mt-1">Configure measurement units (e.g. Piece, Box, Kilogram, Meter).</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit Name</TableHead>
              <TableHead>Abbreviation / Symbol</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUnits.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell>
                  <span className="font-normal text-foreground">{unit.name}</span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-muted800 text-blue-400 border border-blue-500/30">
                    {unit.abbreviation}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatDate(unit.createdAt)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => handleOpenModal(unit)}
                        title="Edit Unit"
                        className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                      >
                        <svg className="w-4 h-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(unit)}
                        title="Delete Unit"
                        className="p-1.5 rounded-lg text-black dark:text-white hover:bg-muted transition"
                      >
                        <svg className="w-4 h-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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

      {/* Create / Edit Unit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUnit ? 'Edit Unit of Measure' : 'Create Unit of Measure'}
        subtitle="Specify measurement unit name and abbreviation"
        icon="⚖️"
        maxWidth="max-w-md"
        scope="workspace"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Unit Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Kilogram, Box, Meter, Piece"
              className="w-full px-3 py-2 bg-muted800/80 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Abbreviation / Symbol <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.abbreviation}
              onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
              placeholder="e.g. kg, bx, m, pcs"
              className="w-full px-3 py-2 bg-muted800/80 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
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
              {editingUnit ? 'Save Changes' : 'Create Unit'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Unit of Measure"
        message={`Are you sure you want to delete unit "${deleteTarget?.name}" (${deleteTarget?.abbreviation})?`}
        submitting={deleting}
      />
    </div>
  );
}

