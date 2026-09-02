import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { rolesApi } from '../rolesApi';
import { jobSpecificationsApi } from '../jobSpecificationsApi';
import { usePermission } from '../../../hooks/usePermission';
import Button from '../../../components/ui/Button';

// Sub-components
import RolesPage from './roles/RolesPage';
import RoleFormView from './roles/RoleFormView';
import RoleDetailsView from './roles/RoleDetailsView';
import JobSpecificationsPage from './job-specifications/JobSpecificationsPage';
import JobSpecFormView from './job-specifications/JobSpecFormView';

export default function RolesJobSpecsMainPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation & View mode: 'LIST' | 'ROLE_FORM' | 'ROLE_DETAILS' | 'JOB_SPEC_FORM'
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
  const fetchData = async () => {
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
  };

  useEffect(() => {
    if (viewMode === 'LIST') {
      fetchData();
    }
  }, [viewMode]);

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
    e.preventDefault();
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
    e.preventDefault();
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

  // ═════════════════════════════════════════════════════════════════
  // RENDER FULL PAGE VIEW: ROLE DETAILS
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'ROLE_DETAILS') {
    return (
      <RoleDetailsView
        roleId={selectedRoleForView?.id}
        initialRole={selectedRoleForView}
        canUpdateRole={canUpdateRole}
        canDeleteRole={canDeleteRole}
        handleOpenRoleForm={handleOpenRoleForm}
        handleRoleDelete={handleRoleDelete}
        handleBackToList={handleBackToList}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER FULL PAGE VIEW: ROLE FORM
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'ROLE_FORM') {
    return (
      <RoleFormView
        editingRole={editingRole}
        roleFormData={roleFormData}
        setRoleFormData={setRoleFormData}
        submitting={submitting}
        handleSubmit={handleRoleSubmit}
        handleBackToList={handleBackToList}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER FULL PAGE VIEW: JOB SPEC FORM
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'JOB_SPEC_FORM') {
    return (
      <JobSpecFormView
        editingJobSpec={editingJobSpec}
        jobSpecFormData={jobSpecFormData}
        setJobSpecFormData={setJobSpecFormData}
        submitting={submitting}
        handleSubmit={handleJobSpecSubmit}
        handleBackToList={handleBackToList}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER DIRECTORY LIST VIEW (TABS CONTAINER)
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold  tracking-tight">Roles & Job Specifications</h1>
          <p className="text-sm text-muted-foreground">Configure system security roles and organizational job specifications</p>
        </div>

        <div className="flex items-center gap-3">
          {canCreateRole && (
            <Button
              onClick={() => handleOpenRoleForm()}
              variant="secondary"
              size="md"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Create Security Role
            </Button>
          )}

          <Button
            onClick={() => handleOpenJobSpecForm()}
            variant="primary"
            size="md"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Create Job Specification
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border space-x-6">
        <button
          onClick={() => setActiveTab('ROLES')}
          className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'ROLES'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          System Security Roles ({roles.length})
        </button>

        <button
          onClick={() => setActiveTab('JOB_SPECS')}
          className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'JOB_SPECS'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Job Specifications ({jobSpecs.length})
        </button>
      </div>

      {/* Tab Content View */}
      {activeTab === 'ROLES' ? (
        <RolesPage
          roles={roles}
          loading={loading}
          canUpdateRole={canUpdateRole}
          canDeleteRole={canDeleteRole}
          handleOpenRoleForm={handleOpenRoleForm}
          handleRoleDelete={handleRoleDelete}
          handleViewRole={handleViewRole}
        />
      ) : (
        <JobSpecificationsPage
          jobSpecs={jobSpecs}
          loading={loading}
          canUpdateJobSpec={canUpdateJobSpec}
          canDeleteJobSpec={canDeleteJobSpec}
          handleOpenJobSpecForm={handleOpenJobSpecForm}
          handleJobSpecDelete={handleJobSpecDelete}
        />
      )}
    </div>
  );
}
