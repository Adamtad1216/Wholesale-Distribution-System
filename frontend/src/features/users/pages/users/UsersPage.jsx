import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { usersApi } from '../../usersApi';
import { usePermission } from '../../../../hooks/usePermission';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    roleId: '',
    status: 'ACTIVE',
  });

  const { can: canCreate } = usePermission('users:create');
  const { can: canUpdate } = usePermission('users:update');
  const { can: canDelete } = usePermission('users:delete');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await usersApi.getUsers({ search });
      const data = res?.data || res || [];
      setUsers(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        roleId: user.roleId || '',
        status: user.status || 'ACTIVE',
      });
    } else {
      setEditingUser(null);
      setFormData({ username: '', email: '', password: '', roleId: '', status: 'ACTIVE' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await usersApi.updateUser(editingUser.id, formData);
        toast.success('User updated successfully');
      } else {
        await usersApi.createUser(formData);
        toast.success('User created successfully');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err?.message || 'Failed to save user');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersApi.deleteUser(id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold  tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage system users, credentials, and account statuses</p>
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
            Add User
          </Button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <Card noPadding className="p-4 flex items-center gap-4 rounded-lg">
        <div className="relative flex-1">
          <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search users by name, username, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted800 border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-violet-500 placeholder:text-muted-foreground"
          />
        </div>
      </Card>

      {/* Users Table */}
      {loading ? (
        <Card className="p-12 text-center text-muted-foreground text-sm rounded-lg">Loading users...</Card>
      ) : users.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground text-sm rounded-lg">No users found.</Card>
      ) : (
        <Table containerClassName="rounded-lg">
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium  flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-xs">
                    {u.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  {u.username}
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold badge-indigo">
                    {u.role?.name || u.roleName || 'User'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    u.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {u.status || 'ACTIVE'}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {canUpdate && (
                    <Button
                      onClick={() => handleOpenModal(u)}
                      variant="secondary"
                      size="sm"
                    >
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      onClick={() => handleDelete(u.id)}
                      variant="danger"
                      size="sm"
                    >
                      Delete
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 backdrop-blur-sm p-4">
          <div className="bg-card900 border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold ">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 bg-muted800 border border-border rounded-xl  text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-muted800 border border-border rounded-xl  text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {editingUser ? 'Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-muted800 border border-border rounded-xl  text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
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
