import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { rolesApi } from '../../rolesApi';
import { usePermission } from '../../../../hooks/usePermission';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  const { can: canCreate } = usePermission('roles:create');
  const { can: canUpdate } = usePermission('roles:update');
  const { can: canDelete } = usePermission('roles:delete');

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await rolesApi.getRoles();
      const data = res?.data || res || [];
      setRoles(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name || '',
        code: role.code || '',
        description: role.description || '',
      });
    } else {
      setEditingRole(null);
      setFormData({ name: '', code: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await rolesApi.updateRole(editingRole.id, formData);
        toast.success('Role updated successfully');
      } else {
        await rolesApi.createRole(formData);
        toast.success('Role created successfully');
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (err) {
      toast.error(err?.message || 'Failed to save role');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await rolesApi.deleteRole(id);
      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete role');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Role Management</h1>
          <p className="text-sm text-slate-400">Configure access levels and system roles</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => handleOpenModal()}
            variant="primary"
            size="md"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Create Role
          </Button>
        )}
      </div>

      {/* Roles Cards Grid */}
      {loading ? (
        <Card className="p-12 text-center text-slate-400 text-sm rounded-lg">Loading roles...</Card>
      ) : roles.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 text-sm rounded-lg">No roles found.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card
              key={role.id}
              hoverEffect
              className="flex flex-col justify-between rounded-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider badge-violet">
                    {role.code || role.name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {role.permissions?.length || 0} permissions
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{role.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {role.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-6 mt-4 border-t border-slate-800/80">
                {canUpdate && (
                  <Button
                    onClick={() => handleOpenModal(role)}
                    variant="secondary"
                    size="sm"
                  >
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button
                    onClick={() => handleDelete(role.id)}
                    variant="danger"
                    size="sm"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-md p-6 space-y-4 shadow-2xl main-panel">
            <h3 className="text-lg font-bold text-white">
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Role Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Role Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SALES_MANAGER"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 resize-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  variant="ghost"
                  size="sm"
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
          </div>
        </div>
      )}
    </div>
  );
}
