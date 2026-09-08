import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Truck,
  ArrowLeft,
  Edit2,
  UserCheck,
  UserX,
  Calendar,
  Package,
  Wrench,
  CheckCircle2,
  ShieldAlert,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
} from 'lucide-react';
import { vehiclesApi } from '../vehiclesApi';
import { usePermission } from '../../../hooks/usePermission';
import Button from '../../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import AssignDriverModal from '../components/AssignDriverModal';

export default function VehicleDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { can: canUpdate } = usePermission('vehicles:update');
  const { can: canAssign } = usePermission('vehicles:assign');

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const { data: vehicle, isLoading, error } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: async () => {
      const res = await vehiclesApi.getById(id);
      return res.data?.data || res.data;
    },
  });

  const unassignMutation = useMutation({
    mutationFn: () => vehiclesApi.unassignDriver(id, { notes: 'Unassigned from vehicle detail page' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Driver unassigned successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to unassign driver');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center text-xs text-muted-foreground">
        Loading vehicle details and assignment history...
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate('/vehicles')} icon={<ArrowLeft className="w-4 h-4" />}>
          Back to Vehicles
        </Button>
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
          {error?.response?.data?.message || 'Vehicle not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
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
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-foreground font-mono tracking-tight">
                {vehicle.plateNumber}
              </h1>
              {vehicle.status === 'ACTIVE' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active
                </span>
              ) : vehicle.status === 'MAINTENANCE' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Wrench className="w-3.5 h-3.5" />
                  Maintenance
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {vehicle.make || vehicle.model ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() : 'Fleet Unit'} • {vehicle.vehicleType}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canAssign && (
            <Button
              variant="outline"
              icon={<UserCheck className="w-4 h-4" />}
              onClick={() => setIsAssignModalOpen(true)}
            >
              {vehicle.assignedDriver ? 'Change Driver' : 'Assign Driver'}
            </Button>
          )}

          {canUpdate && (
            <Button
              variant="primary"
              icon={<Edit2 className="w-4 h-4" />}
              onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
            >
              Edit Vehicle
            </Button>
          )}
        </div>
      </div>

      {/* Grid: Vehicle Specs + Current Driver Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Specs (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Fleet Specifications</CardTitle>
                <CardDescription>Technical registration parameters and capacity metrics</CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-xl bg-muted/20 border border-border">
                <span className="text-[11px] text-muted-foreground font-semibold block">Vehicle Type</span>
                <span className="text-sm font-bold text-foreground mt-0.5 block">{vehicle.vehicleType}</span>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border">
                <span className="text-[11px] text-muted-foreground font-semibold block">Manufacturer Make</span>
                <span className="text-sm font-bold text-foreground mt-0.5 block">{vehicle.make || '—'}</span>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border">
                <span className="text-[11px] text-muted-foreground font-semibold block">Model</span>
                <span className="text-sm font-bold text-foreground mt-0.5 block">{vehicle.model || '—'}</span>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border">
                <span className="text-[11px] text-muted-foreground font-semibold block">Manufacturing Year</span>
                <span className="text-sm font-bold font-mono text-foreground mt-0.5 block">{vehicle.year || '—'}</span>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border">
                <span className="text-[11px] text-muted-foreground font-semibold block">Max Payload Capacity</span>
                <span className="text-sm font-bold font-mono text-foreground mt-0.5 block">
                  {vehicle.capacity != null ? `${vehicle.capacity.toLocaleString()} kg` : 'Standard'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border">
                <span className="text-[11px] text-muted-foreground font-semibold block">Registered On</span>
                <span className="text-sm font-bold font-mono text-foreground mt-0.5 block">
                  {new Date(vehicle.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {vehicle.notes && (
              <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground">
                <span className="font-bold text-foreground block mb-0.5">Notes:</span>
                {vehicle.notes}
              </div>
            )}
          </Card>
        </div>

        {/* Current Assigned Driver Card (1 col) */}
        <div>
          <Card className="h-full flex flex-col justify-between">
            <div>
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span>Assigned Driver</span>
                  </CardTitle>
                  <CardDescription>Primary operator of this vehicle</CardDescription>
                </div>
              </CardHeader>

              {vehicle.assignedDriver ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm">
                      {vehicle.assignedDriver.firstName?.[0] || 'D'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">
                        {vehicle.assignedDriver.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {vehicle.assignedDriver.employeeCode}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    {vehicle.assignedDriver.driverLicenseNumber && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <span className="text-muted-foreground font-semibold">Driver License</span>
                        <span className="font-mono font-bold text-foreground">
                          {vehicle.assignedDriver.driverLicenseNumber}
                        </span>
                      </div>
                    )}

                    {vehicle.assignedDriver.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground p-1.5">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                        <span>{vehicle.assignedDriver.phone}</span>
                      </div>
                    )}

                    {vehicle.assignedDriver.email && (
                      <div className="flex items-center gap-2 text-muted-foreground p-1.5">
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        <span>{vehicle.assignedDriver.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-border rounded-xl">
                  <UserX className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <div className="text-xs font-bold text-foreground">No Driver Assigned</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    This vehicle is currently unassigned and in fleet pool.
                  </p>
                </div>
              )}
            </div>

            {canAssign && (
              <div className="pt-4 mt-4 border-t border-border flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsAssignModalOpen(true)}
                >
                  {vehicle.assignedDriver ? 'Change Driver' : 'Assign Driver'}
                </Button>
                {vehicle.assignedDriver && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    loading={unassignMutation.isPending}
                    onClick={() => unassignMutation.mutate()}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                  >
                    Unassign
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Driver Assignment History */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Driver Assignment History</span>
            </CardTitle>
            <CardDescription>Chronological log of driver allocations to this vehicle</CardDescription>
          </div>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Assigned On</TableHead>
              <TableHead>Unassigned On</TableHead>
              <TableHead>Assignment Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Authorized By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!vehicle.assignments || vehicle.assignments.length === 0) ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                  No historical assignments recorded for this vehicle.
                </TableCell>
              </TableRow>
            ) : (
              vehicle.assignments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="font-bold text-xs text-foreground">
                      {a.driver?.name || 'Driver'}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {a.driver?.employeeCode}
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-xs text-foreground">
                    {new Date(a.assignedAt).toLocaleString()}
                  </TableCell>

                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {a.unassignedAt ? new Date(a.unassignedAt).toLocaleString() : '— (Current)'}
                  </TableCell>

                  <TableCell>
                    {a.status === 'ACTIVE' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Active Driver
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                        {a.status}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {a.notes || '—'}
                  </TableCell>

                  <TableCell className="text-right text-xs font-medium text-foreground">
                    {a.assignedBy}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Recent Deliveries Done by This Vehicle */}
      {vehicle.recentDeliveries && vehicle.recentDeliveries.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <span>Recent Deliveries Fulfillments</span>
              </CardTitle>
              <CardDescription>Dispatch manifests executed by this transport unit</CardDescription>
            </div>
          </CardHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Delivery Number</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Destination Address</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicle.recentDeliveries.map((del) => (
                <TableRow key={del.id}>
                  <TableCell className="font-mono font-bold text-xs text-primary">
                    {del.deliveryNumber}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-foreground">
                    {new Date(del.scheduledDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {del.deliveryAddress}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border">
                      {del.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Assign Driver Modal */}
      {isAssignModalOpen && (
        <AssignDriverModal
          isOpen={isAssignModalOpen}
          vehicle={vehicle}
          onClose={() => setIsAssignModalOpen(false)}
        />
      )}
    </div>
  );
}
