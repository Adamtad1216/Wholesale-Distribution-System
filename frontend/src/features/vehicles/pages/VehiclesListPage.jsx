import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Truck,
  Plus,
  Search,
  Filter,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wrench,
  Shield,
  Layers,
} from 'lucide-react';
import { vehiclesApi } from '../vehiclesApi';
import { usePermission } from '../../../hooks/usePermission';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import AssignDriverModal from '../components/AssignDriverModal';

export default function VehiclesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { can: canCreate } = usePermission('vehicles:create');
  const { can: canUpdate } = usePermission('vehicles:update');
  const { can: canDelete } = usePermission('vehicles:delete');
  const { can: canAssign } = usePermission('vehicles:assign');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('all');

  // Active modal targets
  const [assignModalVehicle, setAssignModalVehicle] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch vehicles
  const { data: vehiclesData, isLoading, error } = useQuery({
    queryKey: ['vehicles', statusFilter, typeFilter, assignedFilter],
    queryFn: async () => {
      const params = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.vehicleType = typeFilter;
      if (assignedFilter !== 'all') params.assigned = assignedFilter;
      const res = await vehiclesApi.list(params);
      return res.data?.data || res.data || [];
    },
  });

  const vehicles = Array.isArray(vehiclesData) ? vehiclesData : [];

  const deleteMutation = useMutation({
    mutationFn: (id) => vehiclesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle successfully archived');
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to archive vehicle');
    },
  });

  // Client-side search
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      const plate = (v.plateNumber || '').toLowerCase();
      const make = (v.make || '').toLowerCase();
      const model = (v.model || '').toLowerCase();
      const type = (v.vehicleType || '').toLowerCase();
      const driver = (v.assignedDriver?.name || '').toLowerCase();
      const driverCode = (v.assignedDriver?.employeeCode || '').toLowerCase();
      return (
        plate.includes(q) ||
        make.includes(q) ||
        model.includes(q) ||
        type.includes(q) ||
        driver.includes(q) ||
        driverCode.includes(q)
      );
    });
  }, [vehicles, search]);

  // Unique vehicle types for filter
  const vehicleTypes = useMemo(() => {
    const set = new Set();
    vehicles.forEach((v) => {
      if (v.vehicleType) set.add(v.vehicleType);
    });
    return Array.from(set).sort();
  }, [vehicles]);

  // Fleet summary metrics
  const stats = useMemo(() => {
    return {
      total: vehicles.length,
      active: vehicles.filter((v) => v.status === 'ACTIVE').length,
      assigned: vehicles.filter((v) => v.assignedDriverId).length,
      maintenance: vehicles.filter((v) => v.status === 'MAINTENANCE').length,
    };
  }, [vehicles]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            <span>Vehicles & Fleet</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Register transport fleet units and assign commercial drivers based on driver permissions and licenses.
          </p>
        </div>

        {canCreate && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/vehicles/new')}
          >
            Register Vehicle
          </Button>
        )}
      </div>

      {/* Fleet Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Fleet</span>
            <Truck className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">{stats.total}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Registered vehicles</p>
        </Card>

        <Card className="p-4 bg-card border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Active in Service</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-500 mt-2">{stats.active}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Ready for dispatch</p>
        </Card>

        <Card className="p-4 bg-card border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Assigned to Drivers</span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-500 mt-2">{stats.assigned}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">With dedicated driver</p>
        </Card>

        <Card className="p-4 bg-card border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">In Maintenance</span>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500 mt-2">{stats.maintenance}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Servicing & repairs</p>
        </Card>
      </div>

      {/* Filters & Search Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search plate, make, model, driver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {vehicleTypes.length > 0 && (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">All Types</option>
                {vehicleTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}

            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All Assignments</option>
              <option value="true">Assigned Only</option>
              <option value="false">Unassigned Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
          {error?.response?.data?.message || 'Failed to load fleet vehicles.'}
        </div>
      )}

      {/* Vehicles Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plate & Type</TableHead>
              <TableHead>Make & Model</TableHead>
              <TableHead>Payload Capacity</TableHead>
              <TableHead>Current Driver</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                  Loading vehicles catalog...
                </TableCell>
              </TableRow>
            ) : filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Truck className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <div className="text-xs font-bold text-foreground">No Vehicles Found</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {search || statusFilter ? 'Try adjusting your filters' : 'Register your first fleet vehicle to begin'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map((v) => (
                <TableRow key={v.id}>
                  {/* Plate & Type */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-xs text-foreground">
                          {v.plateNumber}
                        </div>
                        <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-muted text-muted-foreground mt-0.5">
                          {v.vehicleType}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Make & Model */}
                  <TableCell>
                    <div className="text-xs font-medium text-foreground">
                      {v.make || v.model ? `${v.make || ''} ${v.model || ''}`.trim() : '—'}
                    </div>
                    {v.year && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Year: {v.year}
                      </span>
                    )}
                  </TableCell>

                  {/* Payload Capacity */}
                  <TableCell>
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {v.capacity != null ? `${v.capacity.toLocaleString()} kg` : 'Standard'}
                    </span>
                  </TableCell>

                  {/* Assigned Driver */}
                  <TableCell>
                    {v.assignedDriver ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <div>
                          <div className="text-xs font-bold text-foreground">
                            {v.assignedDriver.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {v.assignedDriver.employeeCode} {v.assignedDriver.driverLicenseNumber ? `• ${v.assignedDriver.driverLicenseNumber}` : ''}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UserX className="w-3.5 h-3.5 text-amber-500" />
                        <span className="italic">Unassigned</span>
                      </div>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {v.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </span>
                    ) : v.status === 'MAINTENANCE' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Wrench className="w-3 h-3" />
                        Maintenance
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                        Inactive
                      </span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canAssign && (
                        <button
                          type="button"
                          title={v.assignedDriver ? 'Change Driver' : 'Assign Driver'}
                          onClick={() => setAssignModalVehicle(v)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{v.assignedDriver ? 'Reassign' : 'Assign'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        title="View Details"
                        onClick={() => navigate(`/vehicles/${v.id}`)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {canUpdate && (
                        <button
                          type="button"
                          title="Edit Vehicle"
                          onClick={() => navigate(`/vehicles/${v.id}/edit`)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          title="Archive Vehicle"
                          onClick={() => setDeleteTarget(v)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Assign Driver Modal */}
      {assignModalVehicle && (
        <AssignDriverModal
          isOpen={Boolean(assignModalVehicle)}
          vehicle={assignModalVehicle}
          onClose={() => setAssignModalVehicle(null)}
        />
      )}

      {/* Confirm Delete / Archive Modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          title="Archive Vehicle"
          message={`Are you sure you want to archive vehicle "${deleteTarget.plateNumber}"? This will unassign any active driver and remove it from active dispatch.`}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
