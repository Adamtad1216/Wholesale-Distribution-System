import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { employeesApi } from '../../employeesApi';
import { usePermission } from '../../../../hooks/usePermission';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [formData, setFormData] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    status: 'ACTIVE',
  });

  const { can: canCreate } = usePermission('employees:create');
  const { can: canUpdate } = usePermission('employees:update');
  const { can: canDelete } = usePermission('employees:delete');

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeesApi.getEmployees({ search });
      const data = res?.data || res || [];
      setEmployees(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search]);

  const handleOpenModal = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        employeeCode: employee.employeeCode || '',
        firstName: employee.person?.firstName || employee.firstName || '',
        lastName: employee.person?.lastName || employee.lastName || '',
        email: employee.person?.email || employee.email || '',
        phone: employee.person?.phone || employee.phone || '',
        jobTitle: employee.jobSpecification?.title || employee.jobTitle || '',
        status: employee.status || 'ACTIVE',
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        employeeCode: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        status: 'ACTIVE',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await employeesApi.updateEmployee(editingEmployee.id, formData);
        toast.success('Employee updated successfully');
      } else {
        await employeesApi.createEmployee(formData);
        toast.success('Employee created successfully');
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err?.message || 'Failed to save employee');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await employeesApi.deleteEmployee(id);
      toast.success('Employee deleted successfully');
      fetchEmployees();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete employee');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 light:text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-sm text-slate-400">Manage workforce profiles, job specifications, and status</p>
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
            Add Employee
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
            placeholder="Search employees by code, name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none placeholder-slate-400"
          />
        </div>
      </Card>

      {/* Employees Table System */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading employees...</div>
      ) : employees.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">No employees found.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Employee Name</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-mono text-xs font-bold text-violet-400">
                  {emp.employeeCode || `EMP-${emp.id?.substring(0, 5)}`}
                </TableCell>
                <TableCell className="font-medium text-slate-100 light:text-slate-900">
                  {emp.person ? `${emp.person.firstName} ${emp.person.lastName}` : emp.firstName ? `${emp.firstName} ${emp.lastName}` : 'N/A'}
                </TableCell>
                <TableCell className="text-slate-300">
                  {emp.jobSpecification?.title || emp.jobTitle || 'Staff'}
                </TableCell>
                <TableCell className="text-slate-400">
                  {emp.person?.phone || emp.person?.email || emp.phone || emp.email || 'N/A'}
                </TableCell>
                <TableCell>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    emp.status === 'ACTIVE'
                      ? 'badge-slate'
                      : 'badge-module'
                  }`}>
                    {emp.status || 'ACTIVE'}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {canUpdate && (
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => handleOpenModal(emp)}
                    >
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="danger"
                      size="xs"
                      onClick={() => handleDelete(emp.id)}
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

      {/* Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 light:text-slate-900">
              {editingEmployee ? 'Edit Employee' : 'Add Employee'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Employee Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP-001"
                  value={formData.employeeCode}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Sales Representative"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
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
