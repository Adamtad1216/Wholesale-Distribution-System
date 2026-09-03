import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { usersApi } from '../usersApi';
import { rolesApi } from '../../roles-job-specifications/rolesApi';
import { usePermission } from '../../../hooks/usePermission';

export function useUserManager() {
  // Navigation View Modes: 'LIST' | 'FORM' | 'DETAILS'
  const [viewMode, setViewMode] = useState('LIST');

  // Data & Loading States
  const [users, setUsers] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Selected User State for Details
  const [selectedUserForView, setSelectedUserForView] = useState(null);

  // Form State
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    isActive: true,
    roleIds: [],
  });

  // Password Reset & Delete Targets for Modals
  const [resetUserTarget, setResetUserTarget] = useState(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);

  // Permissions
  const { can: canCreate } = usePermission('users:create');
  const { can: canUpdate } = usePermission('users:update');
  const { can: canDelete } = usePermission('users:delete');

  // Fetch Roles for Selection
  const fetchRoles = async () => {
    try {
      const res = await rolesApi.getRoles();
      const data = res?.data || res || [];
      setRolesList(Array.isArray(data) ? data : data.roles || []);
    } catch (err) {
      console.error('Failed to load system roles for assignment:', err);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.isActive = statusFilter === 'ACTIVE';
      if (roleFilter !== 'ALL') params.role = roleFilter;

      const res = await usersApi.getUsers(params);
      const data = res?.data || res || [];
      const userList = Array.isArray(data) ? data : data.users || data.items || [];
      setUsers(userList);
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (viewMode === 'LIST') {
      fetchUsers();
    }
  }, [search, statusFilter, roleFilter, viewMode]);

  // Open Form (Create or Edit)
  const handleOpenForm = (user = null) => {
    if (user) {
      setEditingUser(user);
      const activeRoleIds = user.userRoles && user.userRoles.length > 0
        ? user.userRoles.map((ur) => ur.roleId || ur.role?.id).filter(Boolean)
        : [];

      setFormData({
        username: user.username || '',
        firstName: user.person?.firstName || '',
        middleName: user.person?.middleName || '',
        lastName: user.person?.lastName || '',
        email: user.person?.email || user.email || '',
        phone: user.person?.phone || '',
        address: user.person?.address || '',
        password: '',
        isActive: user.isActive !== false && user.status !== 'INACTIVE',
        roleIds: activeRoleIds,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        isActive: true,
        roleIds: [],
      });
    }
    setViewMode('FORM');
  };

  // View User Full Details Blank Page (Fetches full user response from backend API)
  const handleViewDetail = async (user) => {
    try {
      const res = await usersApi.getUserById(user.id);
      const fullUserData = res?.data || res || user;
      setSelectedUserForView(fullUserData);
      setViewMode('DETAILS');
    } catch (err) {
      toast.error('Failed to load fresh user details');
      setSelectedUserForView(user);
      setViewMode('DETAILS');
    }
  };

  // Back to Directory
  const handleBackToList = () => {
    setViewMode('LIST');
    setEditingUser(null);
    setSelectedUserForView(null);
  };

  // Submit User Create / Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        const updatePayload = {
          username: formData.username,
          isActive: formData.isActive,
          roleIds: formData.roleIds,
          person: {
            firstName: formData.firstName,
            middleName: formData.middleName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
          },
        };
        await usersApi.updateUser(editingUser.id, updatePayload);
        toast.success('User account updated successfully');
      } else {
        await usersApi.createUser(formData);
        toast.success('New user account provisioned successfully');
      }
      handleBackToList();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save user account');
    } finally {
      setSubmitting(false);
    }
  };

  // Request Delete User
  const handleDeleteRequest = (id, username) => {
    setDeleteUserTarget({ id, username });
  };

  // Confirm Delete User Action
  const handleConfirmDelete = async () => {
    if (!deleteUserTarget) return;
    setSubmitting(true);
    try {
      await usersApi.deleteUser(deleteUserTarget.id);
      toast.success(`User account "@${deleteUserTarget.username}" deleted successfully`);
      setDeleteUserTarget(null);
      handleBackToList();
      fetchUsers();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset Password Handler
  const handleResetPasswordSubmit = async (userId, newPassword) => {
    try {
      await usersApi.resetPassword(userId, { newPassword });
      toast.success('User password reset successfully');
      setResetUserTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reset password');
    }
  };

  // Change User Status (ACTIVE, INACTIVE, SUSPENDED)
  const handleStatusChange = async (userId, isNowActive, newStatus) => {
    try {
      await usersApi.updateUser(userId, {
        isActive: isNowActive,
        status: newStatus,
        accountStatus: newStatus,
      });
      toast.success(`User status updated to ${newStatus}`);
      if (selectedUserForView) {
        setSelectedUserForView({
          ...selectedUserForView,
          isActive: isNowActive,
          status: newStatus,
          accountStatus: newStatus,
        });
      }
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update user status');
    }
  };

  return {
    viewMode,
    users,
    rolesList,
    loading,
    submitting,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    selectedUserForView,
    editingUser,
    formData,
    setFormData,
    resetUserTarget,
    setResetUserTarget,
    deleteUserTarget,
    setDeleteUserTarget,
    canCreate,
    canUpdate,
    canDelete,
    handleOpenForm,
    handleViewDetail,
    handleBackToList,
    handleSubmit,
    handleDeleteRequest,
    handleConfirmDelete,
    handleResetPasswordSubmit,
    handleStatusChange,
  };
}
