import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { customersApi } from '../customersApi';
import { paymentsApi } from '../../payments/paymentsApi';
import { priceTiersApi } from '../../pricing/pricingApi';
import { usePermission } from '../../../hooks/usePermission';

export const INITIAL_CUSTOMER_FORM_STATE = {
  customerType: 'ORGANIZATION', // 'ORGANIZATION' | 'PERSON'
  customerCode: '',
  creditLimit: 0,
  paymentTermsId: '',
  priceTierId: '',
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

export function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [priceTiers, setPriceTiers] = useState([]);

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

  const [formData, setFormData] = useState(INITIAL_CUSTOMER_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Customers Data
  const fetchCustomers = useCallback(async () => {
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
  }, [page, limit, search, customerTypeFilter, statusFilter]);

  // Fetch Payment Terms for form select
  const fetchPaymentTerms = useCallback(async () => {
    try {
      const res = await paymentsApi.getPaymentTerms();
      const termsList = Array.isArray(res?.data) ? res.data : (res?.data?.items || []);
      setPaymentTerms(termsList);
    } catch (err) {
      setPaymentTerms([]);
    }
  }, []);

  // Fetch Price Tiers for form select
  const fetchPriceTiers = useCallback(async () => {
    try {
      const res = await priceTiersApi.list({ status: 'ACTIVE', limit: 100 });
      const tiersList = res.data?.data || res.data || [];
      setPriceTiers(Array.isArray(tiersList) ? tiersList : []);
    } catch (err) {
      setPriceTiers([]);
    }
  }, []);

  useEffect(() => {
    fetchPaymentTerms();
    fetchPriceTiers();
  }, [fetchPaymentTerms, fetchPriceTiers]);

  useEffect(() => {
    if (viewMode === 'LIST') {
      fetchCustomers();
    }
  }, [viewMode, fetchCustomers]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = meta.total || customers.length;
    const orgCount = customers.filter((c) => c.customerType === 'ORGANIZATION').length;
    const personCount = customers.filter((c) => c.customerType === 'PERSON').length;
    const totalCreditAllocated = customers.reduce(
      (sum, c) => sum + (Number(c.creditLimit) || 0),
      0
    );

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
    setFormData(INITIAL_CUSTOMER_FORM_STATE);
    setViewMode('CREATE');
  };

  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      customerType: customer.customerType,
      customerCode: customer.customerCode || '',
      creditLimit: Number(customer.creditLimit) || 0,
      paymentTermsId: customer.paymentTermsId || customer.paymentTerms?.id || '',
      priceTierId: customer.priceTierId || customer.priceTier?.id || '',
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
        contacts:
          customer.organization?.contacts?.length > 0
            ? customer.organization.contacts.map((c) => ({
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
    if (e && e.preventDefault) e.preventDefault();
    setSubmitting(true);

    try {
      if (viewMode === 'EDIT' && selectedCustomer) {
        // Update Payload
        const updatePayload = {
          creditLimit: Number(formData.creditLimit) || 0,
          paymentTermsId: formData.paymentTermsId || null,
          priceTierId: formData.priceTierId || null,
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
          priceTierId: formData.priceTierId || undefined,
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
              .filter((c) => c.firstName.trim() || c.lastName.trim())
              .map((c) => ({
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
      toast.error(
        err?.message || `Failed to ${viewMode === 'EDIT' ? 'update' : 'create'} customer`
      );
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  return {
    customers,
    meta,
    loading,
    paymentTerms,
    priceTiers,
    search,
    setSearch,
    customerTypeFilter,
    setCustomerTypeFilter,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    limit,
    setLimit,
    viewMode,
    setViewMode,
    selectedCustomer,
    canCreate,
    canUpdate,
    canDelete,
    formData,
    setFormData,
    submitting,
    stats,
    fetchCustomers,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleBackToList,
    handleDeleteCustomer,
    handleSubmit,
    getCustomerDisplayName,
    getCustomerEmail,
    getCustomerPhone,
    formatCurrency,
  };
}
