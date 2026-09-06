import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { employeesApi } from '../employeesApi';
import { usePermission } from '../../../hooks/usePermission';

const getTodayFormatted = () => new Date().toISOString().split('T')[0];

export const INITIAL_EMPLOYEE_FORM_STATE = {
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

export function useEmployees() {
  const location = useLocation();
  const currentUser = useSelector((state) => state.auth?.user);
  const currentRole = useSelector((state) => state.auth?.role);
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

  const [formData, setFormData] = useState(INITIAL_EMPLOYEE_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Employees List
  const fetchEmployees = useCallback(async () => {
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
  }, [search, statusFilter]);

  // Fetch Job Specifications, Branches & Roles options
  const fetchOptions = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

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
          jobSpecificationId:
            location.state.newlyCreatedJobSpecId ||
            location.state.draftFormData.jobSpecificationId,
        });
      } else if (location.state?.newlyCreatedJobSpecId) {
        setFormData((prev) => ({
          ...prev,
          jobSpecificationId: location.state.newlyCreatedJobSpecId,
        }));
      }
    }
  }, [location.state, fetchOptions]);

  useEffect(() => {
    if (viewMode === 'LIST') {
      fetchEmployees();
    }
  }, [viewMode, fetchEmployees]);

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
      ...INITIAL_EMPLOYEE_FORM_STATE,
      jobSpecificationId: jobSpecifications.length > 0 ? jobSpecifications[0].id : '',
      branchId: branches.length > 0 ? branches[0].id : '',
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
      hireDate: employee.hireDate
        ? new Date(employee.hireDate).toISOString().split('T')[0]
        : getTodayFormatted(),
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

  const handleOpenDetail = async (employee) => {
    setEditingEmployee(employee);
    setViewMode('DETAIL');
    try {
      const res = await employeesApi.getEmployeeById(employee.id);
      const fullData = res?.data || res;
      if (fullData) {
        setEditingEmployee(fullData);
      }
    } catch (err) {
      console.warn('Failed to fetch full employee details:', err);
    }
  };

  const handleBackToList = () => {
    setViewMode('LIST');
    setEditingEmployee(null);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!formData.branchId) {
      toast.error('Please select an assigned branch');
      return;
    }

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
        const isSelf = Boolean(
          currentUser &&
          (String(editingEmployee.person?.user?.id) === String(currentUser.id) ||
           String(editingEmployee.personId) === String(currentUser.personId || currentUser.person?.id))
        );
        const isSelfSuperAdmin = Boolean(
          isSelf &&
          (currentRole === 'SUPER_ADMIN' ||
           currentUser?.roles?.some((r) => r.name === 'SUPER_ADMIN' || r.code === 'SUPER_ADMIN' || r === 'SUPER_ADMIN'))
        );

        if (isSelfSuperAdmin) {
          if (formData.status === 'INACTIVE' || formData.status === 'SUSPENDED') {
            toast.error('A Super Admin cannot set their own employment status to inactive or suspended');
            setSubmitting(false);
            return;
          }
          if (!formData.needsUserAccount) {
            toast.error('A Super Admin cannot deactivate their own user account');
            setSubmitting(false);
            return;
          }
        }

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
          jobSpecificationIds: targetJobSpecId ? [targetJobSpecId] : undefined,
          branchId: formData.branchId || undefined,
          status: formData.status,
          needsUserAccount: formData.needsUserAccount,
          username: formData.needsUserAccount ? formData.username.trim() || undefined : undefined,
          password: formData.needsUserAccount && formData.password ? formData.password : undefined,
          roleId: formData.needsUserAccount ? formData.roleId || undefined : undefined,
          roleIds: formData.needsUserAccount && formData.roleId ? [formData.roleId] : undefined,
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
          jobSpecificationId: targetJobSpecId || undefined,
          jobSpecificationIds: targetJobSpecId ? [targetJobSpecId] : undefined,
          branchId: formData.branchId || undefined,
          status: formData.status || 'ACTIVE',
          needsUserAccount: formData.needsUserAccount,
          username: formData.needsUserAccount ? formData.username.trim() || undefined : undefined,
          password: formData.needsUserAccount ? formData.password || undefined : undefined,
          roleId: formData.needsUserAccount ? formData.roleId || undefined : undefined,
          roleIds: formData.needsUserAccount && formData.roleId ? [formData.roleId] : undefined,
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
    const targetEmp = employees.find((e) => e.id === id) || editingEmployee;
    const isSelf = Boolean(
      currentUser && targetEmp &&
      (String(targetEmp.person?.user?.id) === String(currentUser.id) ||
       String(targetEmp.personId) === String(currentUser.personId || currentUser.person?.id))
    );
    const isSelfSuperAdmin = Boolean(
      isSelf &&
      (currentRole === 'SUPER_ADMIN' ||
       currentUser?.roles?.some((r) => r.name === 'SUPER_ADMIN' || r.code === 'SUPER_ADMIN' || r === 'SUPER_ADMIN'))
    );

    if (isSelfSuperAdmin) {
      toast.error('A Super Admin cannot delete their own employee profile');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete employee "${name || 'this record'}"?`))
      return;
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
    if (emp.person)
      return (
        `${emp.person.firstName || ''} ${emp.person.middleName || ''} ${emp.person.lastName || ''}`
          .replace(/\s+/g, ' ')
          .trim() || 'Unnamed'
      );
    if (emp.firstName)
      return `${emp.firstName} ${emp.middleName || ''} ${emp.lastName || ''}`
        .replace(/\s+/g, ' ')
        .trim();
    return 'Unnamed Staff';
  };

  const getEmployeeEmail = (emp) => {
    return emp?.person?.email || emp?.email || '-';
  };

  const getEmployeePhone = (emp) => {
    return emp?.person?.phone || emp?.phone || '-';
  };

  const isSelfSuperAdminEmployee = (emp) => {
    if (!currentUser || !emp) return false;
    const isSuperAdmin = Boolean(
      currentRole === 'SUPER_ADMIN' ||
      currentUser?.roles?.some((r) => r.name === 'SUPER_ADMIN' || r.code === 'SUPER_ADMIN' || r === 'SUPER_ADMIN')
    );
    if (!isSuperAdmin) return false;

    return Boolean(
      (emp.person?.user?.id && String(emp.person.user.id) === String(currentUser.id)) ||
      (emp.personId && String(emp.personId) === String(currentUser.personId || currentUser.person?.id))
    );
  };

  return {
    employees,
    jobSpecifications,
    branches,
    systemRoles,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    editingEmployee,
    canCreate,
    canUpdate,
    canDelete,
    formData,
    setFormData,
    submitting,
    stats,
    fetchEmployees,
    fetchOptions,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleBackToList,
    handleSubmit,
    handleDelete,
    getEmployeeName,
    getEmployeeEmail,
    getEmployeePhone,
    isSelfSuperAdminEmployee,
  };
}
