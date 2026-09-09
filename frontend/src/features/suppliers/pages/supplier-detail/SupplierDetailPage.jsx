import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../../components/ui/Button';
import { useSupplierDetail } from './hooks/useSupplierDetail';
import SupplierDetailHeader from './components/SupplierDetailHeader';
import SupplierDetailKPIs from './components/SupplierDetailKPIs';
import SupplierDetailTabs from './components/SupplierDetailTabs';
import SupplierOverviewTab from './components/SupplierOverviewTab';
import SupplierOrdersTab from './components/SupplierOrdersTab';

export default function SupplierDetailPage() {
  const navigate = useNavigate();
  const {
    id,
    supplier,
    loading,
    purchaseOrders,
    activeTab,
    setActiveTab,
    isIndividual,
    totalPoCount,
    totalPoValue,
    vendorPaymentChannels,
  } = useSupplierDetail();

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-bold text-sm">Loading supplier detail profile...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Supplier Not Found</h2>
        <Button variant="secondary" onClick={() => navigate('/suppliers')}>
          ← Back to Suppliers Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 relative min-h-[calc(100vh-100px)] w-full">
      {/* Navigation & Header */}
      <SupplierDetailHeader
        supplier={supplier}
        isIndividual={isIndividual}
        onBack={() => navigate('/suppliers')}
        onEdit={() => navigate(`/suppliers/${id}/edit`)}
        onCreatePo={() => navigate('/procurement')}
      />

      {/* KPI Cards Banner */}
      <SupplierDetailKPIs
        supplier={supplier}
        isIndividual={isIndividual}
        totalPoCount={totalPoCount}
        totalPoValue={totalPoValue}
      />

      {/* Detail Page Tabs */}
      <SupplierDetailTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalPoCount={totalPoCount}
      />

      {/* Tab Content */}
      {activeTab === 'OVERVIEW' && (
        <SupplierOverviewTab
          supplier={supplier}
          isIndividual={isIndividual}
          vendorPaymentChannels={vendorPaymentChannels}
        />
      )}

      {activeTab === 'ORDERS' && (
        <SupplierOrdersTab
          supplierName={supplier.name || supplier.companyName}
          purchaseOrders={purchaseOrders}
        />
      )}
    </div>
  );
}
