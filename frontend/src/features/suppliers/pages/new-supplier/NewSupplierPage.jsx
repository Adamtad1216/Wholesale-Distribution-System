import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupplierForm } from './hooks/useSupplierForm';
import SupplierFormHeader from './components/SupplierFormHeader';
import SupplierEntityTypeSection from './components/SupplierEntityTypeSection';
import SupplierContactsSection from './components/SupplierContactsSection';
import SupplierFinancialSection from './components/SupplierFinancialSection';
import SupplierAddressSection from './components/SupplierAddressSection';
import SupplierFormActions from './components/SupplierFormActions';

export default function NewSupplierPage() {
  const navigate = useNavigate();
  const {
    isEditing,
    loading,
    submitting,
    formData,
    setFormData,
    handleIndividualNameChange,
    handleAddContact,
    handleRemoveContact,
    handleUpdateContact,
    handleAddPayoutChannel,
    handleRemovePayoutChannel,
    handleUpdatePayoutChannel,
    handleSubmit,
  } = useSupplierForm();

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-bold text-sm">Loading supplier form...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 relative min-h-[calc(100vh-100px)] w-full">
      {/* Navigation & Header */}
      <SupplierFormHeader
        isEditing={isEditing}
        onCancel={() => navigate('/suppliers')}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Entity Type & Identity */}
        <SupplierEntityTypeSection
          formData={formData}
          onChangeFormData={setFormData}
          onIndividualNameChange={handleIndividualNameChange}
        />

        {/* Section 2: Primary & Dynamic Alternate Contact Persons */}
        <SupplierContactsSection
          formData={formData}
          onChangeFormData={setFormData}
          onAddContact={handleAddContact}
          onRemoveContact={handleRemoveContact}
          onUpdateContact={handleUpdateContact}
        />

        {/* Section 3: Financial & Multiple Payout Channels */}
        <SupplierFinancialSection
          formData={formData}
          onChangeFormData={setFormData}
          onAddPayoutChannel={handleAddPayoutChannel}
          onRemovePayoutChannel={handleRemovePayoutChannel}
          onUpdatePayoutChannel={handleUpdatePayoutChannel}
        />

        {/* Section 4: Physical Address & Location */}
        <SupplierAddressSection
          formData={formData}
          onChangeFormData={setFormData}
        />

        {/* Action Buttons Footer */}
        <SupplierFormActions
          isEditing={isEditing}
          submitting={submitting}
          onCancel={() => navigate('/suppliers')}
        />
      </form>
    </div>
  );
}
