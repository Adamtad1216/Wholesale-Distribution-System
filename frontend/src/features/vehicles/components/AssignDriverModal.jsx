import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { UserCheck, ShieldAlert, Truck, X, AlertCircle } from 'lucide-react';
import { vehiclesApi } from '../vehiclesApi';
import Button from '../../../components/ui/Button';

export default function AssignDriverModal({ isOpen, onClose, vehicle }) {
  const queryClient = useQueryClient();
  const [selectedDriverId, setSelectedDriverId] = useState(vehicle?.assignedDriverId || '');
  const [notes, setNotes] = useState('');

  // Fetch eligible drivers
  const { data: driversRes, isLoading: isLoadingDrivers } = useQuery({
    queryKey: ['eligible-drivers'],
    queryFn: async () => {
      const res = await vehiclesApi.getEligibleDrivers();
      return res.data?.data || res.data || [];
    },
    enabled: isOpen,
  });

  const drivers = Array.isArray(driversRes) ? driversRes : [];

  const assignMutation = useMutation({
    mutationFn: (payload) => vehiclesApi.assignDriver(vehicle.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['eligible-drivers'] });
      toast.success('Driver successfully assigned to vehicle');
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to assign driver');
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (payload) => vehiclesApi.unassignDriver(vehicle.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ['eligible-drivers'] });
      toast.success('Driver unassigned from vehicle');
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to unassign driver');
    },
  });

  if (!isOpen || !vehicle) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDriverId) {
      toast.error('Please select an eligible driver');
      return;
    }
    assignMutation.mutate({ driverId: selectedDriverId, notes });
  };

  const handleUnassign = () => {
    unassignMutation.mutate({ notes });
  };

  const isSaving = assignMutation.isPending || unassignMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Assign Driver</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
                  {vehicle.plateNumber}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {vehicle.make ? `${vehicle.make} ${vehicle.model || ''}` : vehicle.vehicleType} • Assign an authorized commercial driver
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {vehicle.assignedDriver && (
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Currently Assigned
                </span>
                <span className="text-xs font-bold text-foreground">
                  {vehicle.assignedDriver.name}
                </span>
                <span className="text-[11px] text-muted-foreground ml-2 font-mono">
                  ({vehicle.assignedDriver.employeeCode})
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={unassignMutation.isPending}
                disabled={isSaving}
                onClick={handleUnassign}
                className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/30"
              >
                Unassign
              </Button>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
              Select Qualified Driver <span className="text-rose-500">*</span>
            </label>
            {isLoadingDrivers ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                Loading authorized drivers...
              </div>
            ) : drivers.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>No active employees with driver role or license found.</span>
              </div>
            ) : (
              <select
                required
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
              >
                <option value="">-- Choose Driver --</option>
                {drivers.map((d) => {
                  const hasOtherVehicle = d.currentVehicle && d.currentVehicle.id !== vehicle.id;
                  return (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.employeeCode}) {d.driverLicenseNumber ? `• Lic: ${d.driverLicenseNumber}` : ''}{' '}
                      {hasOtherVehicle ? `⚠️ Currently on ${d.currentVehicle.plateNumber}` : ''}
                    </option>
                  );
                })}
              </select>
            )}
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Only employees holding driver permissions or a registered commercial driver license appear in this selector.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
              Assignment Notes / Route Dispatch
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Assigned to North Addis Wholesale distribution route"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={assignMutation.isPending}
              disabled={isSaving || !selectedDriverId}
              icon={<UserCheck className="w-4 h-4" />}
            >
              Confirm Assignment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
