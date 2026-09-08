import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Truck,
  ArrowLeft,
  Save,
  UserCheck,
  AlertCircle,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { vehiclesApi } from '../vehiclesApi';
import Button from '../../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';

const VEHICLE_TYPES = [
  { value: 'TRUCK', label: 'Commercial Heavy Truck' },
  { value: 'VAN', label: 'Delivery Cargo Van' },
  { value: 'PICKUP', label: 'Light Pickup Truck' },
  { value: 'LORRY', label: 'Medium Box Lorry' },
  { value: 'MOTORCYCLE', label: 'Express Motorcycle' },
  { value: 'OTHER', label: 'Other Fleet Unit' },
];

export default function VehicleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    plateNumber: '',
    vehicleType: 'TRUCK',
    make: '',
    model: '',
    year: '',
    capacity: '',
    status: 'ACTIVE',
    notes: '',
    assignedDriverId: '',
  });

  const [errors, setErrors] = useState({});

  // Fetch eligible drivers
  const { data: driversRes = [] } = useQuery({
    queryKey: ['eligible-drivers'],
    queryFn: async () => {
      const res = await vehiclesApi.getEligibleDrivers();
      return res.data?.data || res.data || [];
    },
  });
  const drivers = Array.isArray(driversRes) ? driversRes : [];

  // Fetch existing vehicle if editing
  const { data: existingVehicle, isLoading: isLoadingVehicle } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: async () => {
      const res = await vehiclesApi.getById(id);
      return res.data?.data || res.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingVehicle) {
      setFormData({
        plateNumber: existingVehicle.plateNumber || '',
        vehicleType: existingVehicle.vehicleType || 'TRUCK',
        make: existingVehicle.make || '',
        model: existingVehicle.model || '',
        year: existingVehicle.year != null ? String(existingVehicle.year) : '',
        capacity: existingVehicle.capacity != null ? String(existingVehicle.capacity) : '',
        status: existingVehicle.status || 'ACTIVE',
        notes: existingVehicle.notes || '',
        assignedDriverId: existingVehicle.assignedDriverId || '',
      });
    }
  }, [existingVehicle]);

  const createMutation = useMutation({
    mutationFn: (payload) => vehiclesApi.create(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle registered successfully');
      navigate('/vehicles');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to register vehicle');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => vehiclesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', id] });
      toast.success('Vehicle updated successfully');
      navigate('/vehicles');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update vehicle');
    },
  });

  const validate = () => {
    const errs = {};
    if (!formData.plateNumber.trim()) errs.plateNumber = 'Plate number is required';
    if (!formData.vehicleType) errs.vehicleType = 'Vehicle type is required';
    if (formData.capacity && (isNaN(Number(formData.capacity)) || Number(formData.capacity) < 0)) {
      errs.capacity = 'Capacity must be a positive number';
    }
    if (formData.year && (isNaN(Number(formData.year)) || Number(formData.year) < 1970 || Number(formData.year) > 2100)) {
      errs.year = 'Enter a valid year (1970 - 2100)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please resolve validation errors');
      return;
    }

    const payload = {
      plateNumber: formData.plateNumber.trim().toUpperCase(),
      vehicleType: formData.vehicleType,
      make: formData.make.trim() || null,
      model: formData.model.trim() || null,
      year: formData.year ? Number(formData.year) : null,
      capacity: formData.capacity ? Number(formData.capacity) : null,
      status: formData.status,
      notes: formData.notes.trim() || null,
      assignedDriverId: formData.assignedDriverId || null,
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/vehicles')}
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Truck className="w-6 h-6 text-primary" />
              <span>{isEdit ? 'Edit Fleet Vehicle' : 'Register New Vehicle'}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEdit
                ? 'Update fleet technical specifications and operational status.'
                : 'Register a transport unit into the logistics fleet and assign an authorized driver.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/vehicles')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            loading={isSaving}
            onClick={handleSubmit}
          >
            {isEdit ? 'Save Changes' : 'Register Vehicle'}
          </Button>
        </div>
      </div>

      {isLoadingVehicle && isEdit ? (
        <div className="p-12 text-center text-muted-foreground text-sm">
          Loading vehicle specifications...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Identification & Classification */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Vehicle Identification & Type</CardTitle>
                <CardDescription>
                  Enter primary registration plates and vehicular classification.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Plate Number */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Registration Plate Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ET-3-A10293 or 3-84920"
                  value={formData.plateNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() });
                    if (errors.plateNumber) setErrors({ ...errors, plateNumber: null });
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl bg-card border text-foreground text-sm font-mono font-bold focus:outline-none focus:ring-2 transition-all ${
                    errors.plateNumber
                      ? 'border-rose-500 focus:ring-rose-500/40'
                      : 'border-border focus:ring-primary/40'
                  }`}
                />
                {errors.plateNumber && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.plateNumber}</span>
                  </p>
                )}
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Vehicle Classification <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label} ({t.value})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* 2. Specifications & Capacity */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Make, Model & Payload Capacity</CardTitle>
                <CardDescription>
                  Specify payload weight limits and manufacturer specs.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
              {/* Make */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Make / Manufacturer
                </label>
                <input
                  type="text"
                  placeholder="e.g. Isuzu, Toyota"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Model
                </label>
                <input
                  type="text"
                  placeholder="e.g. Forward FSR, Hilux"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Year
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2023"
                  min="1970"
                  max="2100"
                  value={formData.year}
                  onChange={(e) => {
                    setFormData({ ...formData, year: e.target.value });
                    if (errors.year) setErrors({ ...errors, year: null });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {errors.year && <p className="text-xs text-rose-500 mt-1">{errors.year}</p>}
              </div>

              {/* Payload Capacity */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Max Payload (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="e.g. 5000"
                    value={formData.capacity}
                    onChange={(e) => {
                      setFormData({ ...formData, capacity: e.target.value });
                      if (errors.capacity) setErrors({ ...errors, capacity: null });
                    }}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                    kg
                  </span>
                </div>
                {errors.capacity && <p className="text-xs text-rose-500 mt-1">{errors.capacity}</p>}
              </div>
            </div>
          </Card>

          {/* 3. Driver Assignment & Operational Status */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Driver Assignment & Status</CardTitle>
                <CardDescription>
                  Assign an employee qualified with driver permissions or a commercial driver license.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Assigned Driver */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Assigned Driver</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
                </label>
                <select
                  value={formData.assignedDriverId}
                  onChange={(e) => setFormData({ ...formData, assignedDriverId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                >
                  <option value="">-- No Driver Assigned (Unassigned) --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.employeeCode}) {d.driverLicenseNumber ? `• Lic: ${d.driverLicenseNumber}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Only employees with driver permissions or a registered driver license are listed.</span>
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Fleet Operational Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-semibold"
                >
                  <option value="ACTIVE">🟢 Active (Available for Dispatch)</option>
                  <option value="MAINTENANCE">🟡 Maintenance (In Repair/Inspection)</option>
                  <option value="INACTIVE">⚪ Inactive (Decommissioned/Standby)</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-5">
              <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                Vehicle Notes & Maintenance Remarks
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Next safety inspection scheduled for next month. Regular oil service at 50,000 km."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </Card>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/vehicles')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              loading={isSaving}
            >
              {isEdit ? 'Save Changes' : 'Register Vehicle'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
