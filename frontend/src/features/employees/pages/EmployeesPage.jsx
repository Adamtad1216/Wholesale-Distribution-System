import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { employeesApi } from '../employeesApi';
import { usePermission } from '../../../hooks/usePermission';
import Button from '../../../components/ui/Button';

// Sub-components
import EmployeeStats from '../components/EmployeeStats';
import EmployeeFilters from '../components/EmployeeFilters';
import EmployeeListTable from '../components/EmployeeListTable';
import EmployeeFormView from '../components/EmployeeFormView';
import EmployeeDetailView from '../components/EmployeeDetailView';

export default function EmployeesPage() {
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [jobSpecifications, setJobSpecifications] = useState([]);
  const [branches, setBranches] = useState([]);
  const [systemRoles, setSystemRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // View state: 'LIST' | 'CREATE' | 'EDIT' | 'DETAIL'
  const [viewMode, setViewMode] = useState('LIST');
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Permissions
  const { can: canCreate } = usePermission('employees:create');
  const { can: canUpdate } = usePermission('employees:update');
  const { can: canDelete } = usePermission('employees:delete');

  const getTodayFormatted = () => new Date().toISOString().split('T')[0];

  const initialFormState = {
    employeeCode: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    hireDate: getTodayFormatted(),
    department: '',
    jobSpecificationId: '',
    jobTitle: '',
    branchId: '',
    status: 'ACTIVE',
    needsUserAccount: false,
    username: '',
    password: '',
    roleId: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Employees List
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeesApi.getEmployees({ search });
      const data = res?.data || res || [];
      const list = Array.isArray(data) ? data : data.items || data.employees || [];
      
      const filteredList = statusFilter
        ? list.filter((e) => e.status === statusFilter)
        : list;

      setEmployees(filteredList);
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Job Specifications, Branches & Roles options
  const fetchOptions = async () => {
    try {
      const [jobSpecsRes, branchesRes, rolesRes] = await Promise.allSettled([
        employeesApi.getJobSpecifications(),
        employeesApi.getBranches(),
        employeesApi.getRoles(),
      ]);

      if (jobSpecsRes.status === 'fulfilled') {
        const data = jobSpecsRes.value?.data || jobSpecsRes.value || [];
        setJobSpecifications(Array.isArray(data) ? data : data.items || data.jobSpecifications || []);
      }

      if (branchesRes.status === 'fulfilled') {
        const data = branchesRes.value?.data || branchesRes.value || [];
        setBranches(Array.isArray(data) ? data : data.items || data.branches || []);
      }

      if (rolesRes.status === 'fulfilled') {
        const data = rolesRes.value?.data || rolesRes.value || [];
        setSystemRoles(Array.isArray(data) ? data : data.items || data.roles || []);
      }
    } catch (err) {
      console.warn('Could not load dropdown options:', err);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  // Handle return state from Job Specification creation
  useEffect(() => {
    if (location.state?.autoOpenCreate) {
      fetchOptions();
      if (location.state?.isEditMode) {
        setViewMode('EDIT');
      } else {
        setViewMode('CREATE');
      }

      if (location.state?.draftFormData) {
        setFormData({
          ...location.state.draftFormData,
          jobSpecificationId: location.state.newlyCreatedJobSpecId || location.state.draftFormData.jobSpecificationId,
        });
      } else if (location.state?.newlyCreatedJobSpecId) {
        setFormData((prev) => ({
          ...prev,
          jobSpecificationId: location.state.newlyCreatedJobSpecId,
        }));
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (viewMode === 'LIST') {
      fetchEmployees();
    }
  }, [search, statusFilter, viewMode]);

  // Calculated Stats
  const stats = useMemo(() => {
    const total = employees.length;
    const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;
    const inactiveCount = employees.filter((e) => e.status !== 'ACTIVE').length;
    const rolesCount = new Set(
      employees.map((e) => e.jobSpecification?.title || e.jobTitle || 'Staff').filter(Boolean)
    ).size;

    return {
      total,
      activeCount,
      inactiveCount,
      rolesCount,
    };
  }, [employees]);

  // Navigation Handlers
  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setFormData({
      ...initialFormState,
      jobSpecificationId: jobSpecifications.length > 0 ? jobSpecifications[0].id : '',
      roleId: systemRoles.length > 0 ? systemRoles[0].id : '',
    });
    setViewMode('CREATE');
  };

  const handleOpenEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      employeeCode: employee.employeeCode || '',
      firstName: employee.person?.firstName || employee.firstName || '',
      middleName: employee.person?.middleName || employee.middleName || '',
      lastName: employee.person?.lastName || employee.lastName || '',
      email: employee.person?.email || employee.email || '',
      phone: employee.person?.phone || employee.phone || '',
      address: employee.person?.address || employee.address || '',
      hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : getTodayFormatted(),
      department: employee.department || employee.jobSpecification?.department || '',
      jobSpecificationId: employee.jobSpecificationId || employee.jobSpecification?.id || '',
      jobTitle: employee.jobSpecification?.title || employee.jobTitle || '',
      branchId: employee.branchId || employee.branch?.id || '',
      status: employee.status || 'ACTIVE',
      needsUserAccount: Boolean(employee.person?.user || employee.user),
      username: employee.person?.user?.username || '',
      password: '',
      roleId: employee.person?.user?.userRoles?.[0]?.roleId || '',
    });
    setViewMode('EDIT');
  };

  const handleOpenDetail = (employee) => {
    setEditingEmployee(employee);
    setViewMode('DETAIL');
  };

  const handleBackToList = () => {
    setViewMode('LIST');
    setEditingEmployee(null);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let targetJobSpecId = formData.jobSpecificationId;

      // Auto-create or select Job Specification
      if (!targetJobSpecId) {
        if (jobSpecifications.length > 0) {
          targetJobSpecId = jobSpecifications[0].id;
        } else {
          const specTitle = formData.jobTitle.trim() || 'General Staff';
          const newSpecRes = await employeesApi.createJobSpecification({
            title: specTitle,
            department: formData.department.trim() || 'Operations',
          });
          const newSpec = newSpecRes?.data || newSpecRes;
          targetJobSpecId = newSpec.id;
          fetchOptions();
        }
      }

      if (editingEmployee) {
        // Update Payload
        const updatePayload = {
          firstName: formData.firstName.trim() || undefined,
          middleName: formData.middleName.trim() || undefined,
          lastName: formData.lastName.trim() || undefined,
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          address: formData.address.trim() || undefined,
          employeeCode: formData.employeeCode.trim() || undefined,
          hireDate: formData.hireDate || undefined,
          department: formData.department.trim() || undefined,
          jobSpecificationId: targetJobSpecId || undefined,
          branchId: formData.branchId || undefined,
          status: formData.status,
          needsUserAccount: formData.needsUserAccount,
          username: formData.needsUserAccount ? formData.username.trim() || undefined : undefined,
          password: formData.needsUserAccount && formData.password ? formData.password : undefined,
          roleId: formData.needsUserAccount ? formData.roleId || undefined : undefined,
        };

        await employeesApi.updateEmployee(editingEmployee.id, updatePayload);
        toast.success('Employee updated successfully');
      } else {
        // Create Payload
        const createPayload = {
          firstName: formData.firstName.trim(),
          middleName: formData.middleName.trim() || undefined,
          lastName: formData.lastName.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          address: formData.address.trim() || undefined,
          employeeCode: formData.employeeCode.trim() || undefined,
          hireDate: formData.hireDate || getTodayFormatted(),
          department: formData.department.trim() || undefined,
          jobSpecificationId: targetJobSpecId,
          branchId: formData.branchId || undefined,
          status: formData.status || 'ACTIVE',
          needsUserAccount: formData.needsUserAccount,
          username: formData.needsUserAccount ? formData.username.trim() || undefined : undefined,
          password: formData.needsUserAccount ? formData.password || undefined : undefined,
          roleId: formData.needsUserAccount ? formData.roleId || undefined : undefined,
        };

        await employeesApi.createEmployee(createPayload);
        toast.success('Employee created successfully');
      }

      handleBackToList();
    } catch (err) {
      toast.error(err?.message || 'Failed to save employee profile');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete employee "${name || 'this record'}"?`)) return;
    try {
      await employeesApi.deleteEmployee(id);
      toast.success('Employee deleted successfully');
      if (viewMode !== 'LIST') {
        handleBackToList();
      } else {
        fetchEmployees();
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to delete employee');
    }
  };

  // Helper getters
  const getEmployeeName = (emp) => {
    if (!emp) return '-';
    if (emp.person) return `${emp.person.firstName || ''} ${emp.person.middleName || ''} ${emp.person.lastName || ''}`.replace(/\s+/g, ' ').trim() || 'Unnamed';
    if (emp.firstName) return `${emp.firstName} ${emp.middleName || ''} ${emp.lastName || ''}`.replace(/\s+/g, ' ').trim();
    return 'Unnamed Staff';
  };

  const getEmployeeEmail = (emp) => {
    return emp?.person?.email || emp?.email || '-';
  };

  const getEmployeePhone = (emp) => {
    return emp?.person?.phone || emp?.phone || '-';
  };

  // ═════════════════════════════════════════════════════════════════
  // RENDER: CREATE / EDIT FULL PAGE VIEW
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'CREATE' || viewMode === 'EDIT') {
    return (
      <EmployeeFormView
        viewMode={viewMode}
        editingEmployee={editingEmployee}
        formData={formData}
        setFormData={setFormData}
        submitting={submitting}
        handleSubmit={handleSubmit}
        handleBackToList={handleBackToList}
        getEmployeeName={getEmployeeName}
        jobSpecifications={jobSpecifications}
        branches={branches}
        systemRoles={systemRoles}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER: VIEW EMPLOYEE DETAILS FULL PAGE VIEW
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'DETAIL' && editingEmployee) {
    return (
      <EmployeeDetailView
        selectedEmployee={editingEmployee}
        handleBackToList={handleBackToList}
        handleOpenEdit={handleOpenEdit}
        handleDelete={handleDelete}
        canUpdate={canUpdate}
        canDelete={canDelete}
        getEmployeeName={getEmployeeName}
        getEmployeeEmail={getEmployeeEmail}
        getEmployeePhone={getEmployeePhone}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER: DEFAULT EMPLOYEE DIRECTORY LIST
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Employee Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage workforce profiles, job specifications, and employment statuses.
          </p>
        </div>

        {canCreate && (
          <Button
            variant="primary"
            onClick={handleOpenCreate}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add Employee
          </Button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <EmployeeStats stats={stats} />

      {/* Filter and Search Bar */}
      <EmployeeFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        fetchEmployees={fetchEmployees}
      />

      {/* Employees Table */}
      <EmployeeListTable
        employees={employees}
        loading={loading}
        search={search}
        handleOpenDetail={handleOpenDetail}
        handleOpenEdit={handleOpenEdit}
        handleDelete={handleDelete}
        canUpdate={canUpdate}
        canDelete={canDelete}
        getEmployeeName={getEmployeeName}
        getEmployeeEmail={getEmployeeEmail}
        getEmployeePhone={getEmployeePhone}
      />
    </div>
  );
}
