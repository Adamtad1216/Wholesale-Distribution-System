import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { rolesApi } from '../rolesApi';
import { jobSpecificationsApi } from '../jobSpecificationsApi';
import { usePermission } from '../../../hooks/usePermission';

export function useRolesJobSpecs() {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation & View mode: 'LIST' | 'ROLE_FORM' | 'ROLE_DETAILS' | 'JOB_SPEC_FORM' | 'ASSIGN_USERS_VIEW'
  const [viewMode, setViewMode] = useState(() => {
    return location.state?.createJobSpec ? 'JOB_SPEC_FORM' : 'LIST';
  });
  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.createJobSpec ? 'JOB_SPECS' : 'ROLES';
  });

  const [roles, setRoles] = useState([]);
  const [jobSpecs, setJobSpecs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Role Detail View State
  const [selectedRoleForView, setSelectedRoleForView] = useState(null);

  // Role Form State
  const [editingRole, setEditingRole] = useState(null);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  // Job Specification Form State
  const [editingJobSpec, setEditingJobSpec] = useState(null);
  const [jobSpecFormData, setJobSpecFormData] = useState({
    title: '',
    code: '',
    department: '',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);

  // Permissions
  const { can: canCreateRole } = usePermission('roles:create');
  const { can: canUpdateRole } = usePermission('roles:update');
  const { can: canDeleteRole } = usePermission('roles:delete');

  const { can: canCreateJobSpec } = usePermission('jobSpecifications:create');
  const { can: canUpdateJobSpec } = usePermission('jobSpecifications:update');
  const { can: canDeleteJobSpec } = usePermission('jobSpecifications:delete');

  // Check router state on load
  useEffect(() => {
    if (location.state?.createJobSpec) {
      setViewMode('JOB_SPEC_FORM');
      setActiveTab('JOB_SPECS');
    }
  }, [location.state]);

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, jobSpecsRes] = await Promise.allSettled([
        rolesApi.getRoles(),
        jobSpecificationsApi.getJobSpecifications(),
      ]);

      if (rolesRes.status === 'fulfilled') {
        const data = rolesRes.value?.data || rolesRes.value || [];
        setRoles(Array.isArray(data) ? data : data.items || data.roles || []);
      }

      if (jobSpecsRes.status === 'fulfilled') {
        const data = jobSpecsRes.value?.data || jobSpecsRes.value || [];
        setJobSpecs(Array.isArray(data) ? data : data.items || data.jobSpecifications || []);
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch roles & job specifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'LIST') {
      fetchData();
    }
  }, [viewMode, fetchData]);

  // Back handler
  const handleBackToList = () => {
    if (location.state?.returnTo) {
      navigate(location.state.returnTo, {
        state: {
          autoOpenCreate: true,
          draftFormData: location.state?.draftFormData,
          isEditMode: location.state?.isEditMode,
          editingEmployeeId: location.state?.editingEmployeeId,
        },
      });
      return;
    }
    setViewMode('LIST');
    setEditingRole(null);
    setSelectedRoleForView(null);
    setEditingJobSpec(null);
  };

  // ═════════════════════════════════════════════════════════════════
  // ROLE HANDLERS
  // ═════════════════════════════════════════════════════════════════
  const handleViewRole = (role) => {
    setSelectedRoleForView(role);
    setViewMode('ROLE_DETAILS');
  };

  const handleOpenAssignUsers = (role) => {
    setSelectedRoleForView(role);
    setViewMode('ASSIGN_USERS_VIEW');
  };

  const handleOpenRoleForm = (role = null) => {
    if (role) {
      setEditingRole(role);
      setRoleFormData({
        name: role.name || '',
        code: role.code || '',
        description: role.description || '',
      });
    } else {
      setEditingRole(null);
      setRoleFormData({ name: '', code: '', description: '' });
    }
    setViewMode('ROLE_FORM');
  };

  const handleRoleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSubmitting(true);
    try {
      if (editingRole) {
        await rolesApi.updateRole(editingRole.id, roleFormData);
        toast.success('Security role updated successfully');
      } else {
        await rolesApi.createRole(roleFormData);
        toast.success('Security role created successfully');
      }
      handleBackToList();
    } catch (err) {
      toast.error(err?.message || 'Failed to save security role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this security role?')) return;
    try {
      await rolesApi.deleteRole(id);
      toast.success('Security role deleted successfully');
      fetchData();
      if (viewMode === 'ROLE_DETAILS') {
        handleBackToList();
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to delete role');
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // JOB SPECIFICATION HANDLERS
  // ═════════════════════════════════════════════════════════════════
  const handleOpenJobSpecForm = (spec = null) => {
    if (spec) {
      setEditingJobSpec(spec);
      setJobSpecFormData({
        title: spec.title || '',
        code: spec.code || '',
        department: spec.department || '',
        description: spec.description || '',
      });
    } else {
      setEditingJobSpec(null);
      setJobSpecFormData({ title: '', code: '', department: '', description: '' });
    }
    setViewMode('JOB_SPEC_FORM');
  };

  const handleJobSpecSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: jobSpecFormData.title.trim(),
        code: jobSpecFormData.code.trim() || undefined,
        department: jobSpecFormData.department.trim() || undefined,
        description: jobSpecFormData.description.trim() || undefined,
      };

      let createdRes = null;
      if (editingJobSpec) {
        createdRes = await jobSpecificationsApi.updateJobSpecification(editingJobSpec.id, payload);
        toast.success('Job specification updated successfully');
      } else {
        createdRes = await jobSpecificationsApi.createJobSpecification(payload);
        toast.success('Job specification created successfully');
      }

      const newlyCreatedId = createdRes?.data?.id || createdRes?.id;

      if (location.state?.returnTo) {
        navigate(location.state.returnTo, {
          state: {
            autoOpenCreate: true,
            newlyCreatedJobSpecId: newlyCreatedId,
            draftFormData: location.state?.draftFormData,
            isEditMode: location.state?.isEditMode,
            editingEmployeeId: location.state?.editingEmployeeId,
          },
        });
      } else {
        setActiveTab('JOB_SPECS');
        handleBackToList();
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to save job specification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJobSpecDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete job specification "${title || 'this item'}"?`)) return;
    try {
      await jobSpecificationsApi.deleteJobSpecification(id);
      toast.success('Job specification deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete job specification');
    }
  };

  return {
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    roles,
    jobSpecs,
    loading,
    selectedRoleForView,
    setSelectedRoleForView,
    editingRole,
    roleFormData,
    setRoleFormData,
    editingJobSpec,
    jobSpecFormData,
    setJobSpecFormData,
    submitting,
    canCreateRole,
    canUpdateRole,
    canDeleteRole,
    canCreateJobSpec,
    canUpdateJobSpec,
    canDeleteJobSpec,
    fetchData,
    handleBackToList,
    handleViewRole,
    handleOpenAssignUsers,
    handleOpenRoleForm,
    handleRoleSubmit,
    handleRoleDelete,
    handleOpenJobSpecForm,
    handleJobSpecSubmit,
    handleJobSpecDelete,
  };
}
