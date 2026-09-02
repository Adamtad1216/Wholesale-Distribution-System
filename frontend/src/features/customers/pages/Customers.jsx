import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { customersApi } from '../customersApi';
import { paymentsApi } from '../../payments/paymentsApi';
import { usePermission } from '../../../hooks/usePermission';
import Button from '../../../components/ui/Button';

// Sub-components
import CustomerStats from '../components/CustomerStats';
import CustomerFilters from '../components/CustomerFilters';
import CustomerListTable from '../components/CustomerListTable';
import CustomerFormView from '../components/CustomerFormView';
import CustomerDetailView from '../components/CustomerDetailView';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [paymentTerms, setPaymentTerms] = useState([]);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // View state: 'LIST' | 'CREATE' | 'EDIT' | 'DETAIL'
  const [viewMode, setViewMode] = useState('LIST');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Permissions
  const { can: canCreate } = usePermission('customers:create');
  const { can: canUpdate } = usePermission('customers:update');
  const { can: canDelete } = usePermission('customers:delete');

  // Form State
  const initialFormState = {
    customerType: 'ORGANIZATION', // 'ORGANIZATION' | 'PERSON'
    customerCode: '',
    creditLimit: 0,
    paymentTermsId: '',
    status: 'ACTIVE',
    // Person fields
    person: {
      firstName: '',
      middleName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
    },
    // Organization fields
    organization: {
      name: '',
      registrationNumber: '',
      taxNumber: '',
      phone: '',
      email: '',
      address: '',
      contacts: [
        {
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          position: '',
          isPrimary: true,
        },
      ],
    },
    // Login account (optional for creation)
    username: '',
    password: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Customers Data
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        customerType: customerTypeFilter || undefined,
        status: statusFilter || undefined,
      };
      const res = await customersApi.getCustomers(params);

      const list = Array.isArray(res?.data) ? res.data : (res?.data?.items || res?.customers || []);
      const metaData = res?.meta || { page, limit, total: list.length, totalPages: 1 };

      setCustomers(list);
      setMeta(metaData);
    } catch (err) {
      toast.error(err?.message || 'Failed to load customers list');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Payment Terms for form select
  const fetchPaymentTerms = async () => {
    try {
      const res = await paymentsApi.getPaymentTerms();
      const termsList = Array.isArray(res?.data) ? res.data : (res?.data?.items || []);
      setPaymentTerms(termsList);
    } catch (err) {
      setPaymentTerms([]);
    }
  };

  useEffect(() => {
    fetchPaymentTerms();
  }, []);

  useEffect(() => {
    if (viewMode === 'LIST') {
      fetchCustomers();
    }
  }, [page, limit, search, customerTypeFilter, statusFilter, viewMode]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = meta.total || customers.length;
    const orgCount = customers.filter(c => c.customerType === 'ORGANIZATION').length;
    const personCount = customers.filter(c => c.customerType === 'PERSON').length;
    const totalCreditAllocated = customers.reduce((sum, c) => sum + (Number(c.creditLimit) || 0), 0);

    return {
      total,
      orgCount,
      personCount,
      totalCreditAllocated,
    };
  }, [customers, meta.total]);

  // View Navigation Handlers
  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setFormData(initialFormState);
    setViewMode('CREATE');
  };

  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      customerType: customer.customerType,
      customerCode: customer.customerCode || '',
      creditLimit: Number(customer.creditLimit) || 0,
      paymentTermsId: customer.paymentTermsId || customer.paymentTerms?.id || '',
      status: customer.status || 'ACTIVE',
      person: {
        firstName: customer.person?.firstName || '',
        middleName: customer.person?.middleName || '',
        lastName: customer.person?.lastName || '',
        phone: customer.person?.phone || '',
        email: customer.person?.email || '',
        address: customer.person?.address || '',
      },
      organization: {
        name: customer.organization?.name || '',
        registrationNumber: customer.organization?.registrationNumber || '',
        taxNumber: customer.organization?.taxNumber || '',
        phone: customer.organization?.phone || '',
        email: customer.organization?.email || '',
        address: customer.organization?.address || '',
        contacts: customer.organization?.contacts?.length > 0
          ? customer.organization.contacts.map(c => ({
            firstName: c.person?.firstName || '',
            lastName: c.person?.lastName || '',
            phone: c.person?.phone || '',
            email: c.person?.email || '',
            position: c.position || '',
            isPrimary: c.isPrimary || false,
          }))
          : [{ firstName: '', lastName: '', phone: '', email: '', position: '', isPrimary: true }],
      },
      username: '',
      password: '',
    });
    setViewMode('EDIT');
  };

  const handleOpenDetail = (customer) => {
    setSelectedCustomer(customer);
    setViewMode('DETAIL');
  };

  const handleBackToList = () => {
    setViewMode('LIST');
    setSelectedCustomer(null);
  };

  // Delete Customer Handler
  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete customer "${name}"?`)) return;
    try {
      await customersApi.deleteCustomer(id);
      toast.success('Customer deleted successfully');
      if (viewMode !== 'LIST') {
        handleBackToList();
      } else {
        fetchCustomers();
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to delete customer');
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (viewMode === 'EDIT' && selectedCustomer) {
        // Update Payload
        const updatePayload = {
          creditLimit: Number(formData.creditLimit) || 0,
          paymentTermsId: formData.paymentTermsId || null,
          status: formData.status,
        };

        if (selectedCustomer.customerType === 'PERSON') {
          updatePayload.person = {
            firstName: formData.person.firstName,
            middleName: formData.person.middleName || undefined,
            lastName: formData.person.lastName,
            phone: formData.person.phone || undefined,
            email: formData.person.email || undefined,
            address: formData.person.address || undefined,
          };
        } else {
          updatePayload.organization = {
            name: formData.organization.name,
            registrationNumber: formData.organization.registrationNumber || undefined,
            taxNumber: formData.organization.taxNumber || undefined,
            phone: formData.organization.phone || undefined,
            email: formData.organization.email || undefined,
            address: formData.organization.address || undefined,
          };
        }

        await customersApi.updateCustomer(selectedCustomer.id, updatePayload);
        toast.success('Customer updated successfully');
      } else {
        // Create Payload
        let createPayload = {
          customerType: formData.customerType,
          customerCode: formData.customerCode.trim() || undefined,
          creditLimit: Number(formData.creditLimit) || 0,
          paymentTermsId: formData.paymentTermsId || undefined,
          status: formData.status,
        };

        if (formData.customerType === 'PERSON') {
          createPayload.person = {
            firstName: formData.person.firstName,
            middleName: formData.person.middleName || undefined,
            lastName: formData.person.lastName,
            phone: formData.person.phone || undefined,
            email: formData.person.email || undefined,
            address: formData.person.address || undefined,
          };
        } else {
          createPayload.organization = {
            name: formData.organization.name,
            registrationNumber: formData.organization.registrationNumber || undefined,
            taxNumber: formData.organization.taxNumber || undefined,
            phone: formData.organization.phone || undefined,
            email: formData.organization.email || undefined,
            address: formData.organization.address || undefined,
            contacts: formData.organization.contacts
              .filter(c => c.firstName.trim() || c.lastName.trim())
              .map(c => ({
                firstName: c.firstName,
                lastName: c.lastName,
                phone: c.phone || undefined,
                email: c.email || undefined,
                position: c.position || undefined,
                isPrimary: true,
              })),
          };
        }

        if (formData.username.trim() && formData.password.trim()) {
          createPayload.user = {
            username: formData.username.trim(),
            password: formData.password.trim(),
          };
        }

        await customersApi.createCustomer(createPayload);
        toast.success('Customer registered successfully');
      }

      handleBackToList();
    } catch (err) {
      toast.error(err?.message || `Failed to ${viewMode === 'EDIT' ? 'update' : 'create'} customer`);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper Functions
  const getCustomerDisplayName = (customer) => {
    if (!customer) return '-';
    if (customer.customerType === 'ORGANIZATION') {
      return customer.organization?.name || 'Unnamed Organization';
    }
    const p = customer.person;
    if (!p) return 'Unnamed Individual';
    return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');
  };

  const getCustomerEmail = (customer) => {
    if (customer?.customerType === 'ORGANIZATION') {
      return customer.organization?.email || customer.user?.email || '-';
    }
    return customer?.person?.email || customer?.user?.email || '-';
  };

  const getCustomerPhone = (customer) => {
    if (customer?.customerType === 'ORGANIZATION') {
      return customer.organization?.phone || '-';
    }
    return customer?.person?.phone || '-';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB', minimumFractionDigits: 0 }).format(amount || 0);
  };

  // ═════════════════════════════════════════════════════════════════
  // RENDER: CREATE / EDIT FULL PAGE VIEW
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'CREATE' || viewMode === 'EDIT') {
    return (
      <CustomerFormView
        viewMode={viewMode}
        selectedCustomer={selectedCustomer}
        formData={formData}
        setFormData={setFormData}
        submitting={submitting}
        paymentTerms={paymentTerms}
        handleSubmit={handleSubmit}
        handleBackToList={handleBackToList}
        getCustomerDisplayName={getCustomerDisplayName}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER: VIEW CUSTOMER DETAILS FULL PAGE VIEW
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'DETAIL' && selectedCustomer) {
    return (
      <CustomerDetailView
        selectedCustomer={selectedCustomer}
        handleBackToList={handleBackToList}
        handleOpenEdit={handleOpenEdit}
        handleDeleteCustomer={handleDeleteCustomer}
        canUpdate={canUpdate}
        canDelete={canDelete}
        getCustomerDisplayName={getCustomerDisplayName}
        getCustomerEmail={getCustomerEmail}
        getCustomerPhone={getCustomerPhone}
        formatCurrency={formatCurrency}
      />
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // RENDER: DEFAULT CUSTOMER DIRECTORY LIST
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Customer Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Directory of corporate organizations, retail partners, and individual customer accounts.
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
            Add Customer
          </Button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <CustomerStats stats={stats} formatCurrency={formatCurrency} />

      {/* Filter and Search Bar */}
      <CustomerFilters
        search={search}
        setSearch={setSearch}
        customerTypeFilter={customerTypeFilter}
        setCustomerTypeFilter={setCustomerTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        setPage={setPage}
        fetchCustomers={fetchCustomers}
      />

      {/* Customers Table */}
      <CustomerListTable
        customers={customers}
        loading={loading}
        meta={meta}
        page={page}
        limit={limit}
        setPage={setPage}
        setLimit={setLimit}
        handleOpenDetail={handleOpenDetail}
        handleOpenEdit={handleOpenEdit}
        handleDeleteCustomer={handleDeleteCustomer}
        canUpdate={canUpdate}
        canDelete={canDelete}
        search={search}
        customerTypeFilter={customerTypeFilter}
        statusFilter={statusFilter}
        getCustomerDisplayName={getCustomerDisplayName}
        getCustomerEmail={getCustomerEmail}
        getCustomerPhone={getCustomerPhone}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
