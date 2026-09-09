import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import { usePaymentOptions } from './hooks/usePaymentOptions';
import PaymentOptionsHeader from './components/PaymentOptionsHeader';
import ProviderCard from './components/ProviderCard';
import ProviderModal from './components/ProviderModal';
import MethodModal from './components/MethodModal';

export default function PaymentOptionsPage() {
  const navigate = useNavigate();
  const {
    loading,
    providers,
    showProviderModal,
    editingProvider,
    providerForm,
    setProviderForm,
    handleOpenCreateProvider,
    handleOpenEditProvider,
    handleCloseProviderModal,
    handleSaveProvider,
    handleToggleProviderActive,
    handleDeleteProvider,
    showMethodModal,
    selectedParentProvider,
    editingMethod,
    methodForm,
    setMethodForm,
    handleOpenCreateMethod,
    handleOpenEditMethod,
    handleCloseMethodModal,
    handleSaveMethod,
    handleToggleMethodActive,
    handleDeleteMethod,
  } = usePaymentOptions();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-12 min-h-[calc(100vh-100px)]">
      {/* Top Header & Navigation */}
      <PaymentOptionsHeader
        providerCount={providers.length}
        onBack={() => navigate('/finance')}
        onAddProvider={handleOpenCreateProvider}
      />

      {/* Main Providers Container */}
      {loading ? (
        <Card className="p-12 text-center border border-border bg-card900">
          <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-semibold text-muted-foreground">Loading Payment Providers & Options...</p>
        </Card>
      ) : providers.length === 0 ? (
        <Card className="p-12 text-center border border-border bg-card900 space-y-4">
          <div className="text-4xl">💳</div>
          <h3 className="text-xl font-bold text-foreground">No Payment Providers Found</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            You haven't configured any payment providers yet. Click below to add your first payment institution or gateway.
          </p>
          <Button variant="primary" size="md" onClick={handleOpenCreateProvider}>
            Add First Payment Provider
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onToggleActive={handleToggleProviderActive}
              onEdit={handleOpenEditProvider}
              onDelete={handleDeleteProvider}
              onAddMethod={handleOpenCreateMethod}
              onToggleMethodActive={handleToggleMethodActive}
              onEditMethod={handleOpenEditMethod}
              onDeleteMethod={handleDeleteMethod}
            />
          ))}
        </div>
      )}

      {/* Provider Modal */}
      <ProviderModal
        isOpen={showProviderModal}
        editingProvider={editingProvider}
        form={providerForm}
        onChangeForm={setProviderForm}
        onClose={handleCloseProviderModal}
        onSubmit={handleSaveProvider}
      />

      {/* Method Option Modal */}
      <MethodModal
        isOpen={showMethodModal}
        editingMethod={editingMethod}
        parentProvider={selectedParentProvider}
        form={methodForm}
        onChangeForm={setMethodForm}
        onClose={handleCloseMethodModal}
        onSubmit={handleSaveMethod}
      />
    </div>
  );
}
