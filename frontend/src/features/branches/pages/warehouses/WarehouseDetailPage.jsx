import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Building2,
  MapPin,
  User,
  RefreshCw,
  Edit3,
  Package,
  XCircle,
  ExternalLink,
  Boxes,
  Search,
} from 'lucide-react';

import { branchesApi } from '../../branchesApi';
import { inventoryApi } from '../../../inventory/inventoryApi';
import { usePermission } from '../../../../hooks/usePermission';
import Button from '../../../../components/ui/Button';
import WarehouseFormModal from '../../components/WarehouseFormModal';

export default function WarehouseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [stockSearch, setStockSearch] = useState('');

  // Lookup data for editing
  const [branches, setBranches] = useState([]);
  const [regions, setRegions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { can: canUpdate } = usePermission(['branches:update', 'ADMIN']);

  const fetchWarehouseData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await branchesApi.getWarehouseById(id);
      const data = res?.data || res;
      setWarehouse(data);
    } catch (err) {
      toast.error(err?.message || 'Failed to load warehouse facility details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchWarehouseStocks = useCallback(async () => {
    if (!id) return;
    setLoadingStocks(true);
    try {
      const res = await inventoryApi.getStocks({ warehouseId: id, limit: 100 });
      const data = res?.data || res;
      const list = Array.isArray(data) ? data : data.stocks || data.items || [];
      setStocks(list);
    } catch (err) {
      console.error('Failed to load warehouse stocks', err);
    } finally {
      setLoadingStocks(false);
    }
  }, [id]);

  const fetchLookupData = useCallback(async () => {
    try {
      const [brRes, regRes, empRes] = await Promise.allSettled([
        branchesApi.getBranches({ limit: 100 }),
        branchesApi.getRegions({ limit: 100 }),
        branchesApi.getEligibleWarehouseManagers(),
      ]);

      if (brRes.status === 'fulfilled') {
        const d = brRes.value?.data || brRes.value || [];
        setBranches(Array.isArray(d) ? d : d.branches || d.items || []);
      }
      if (regRes.status === 'fulfilled') {
        const d = regRes.value?.data || regRes.value || [];
        setRegions(Array.isArray(d) ? d : d.regions || d.items || []);
      }
      if (empRes.status === 'fulfilled') {
        const d = empRes.value?.data || empRes.value || [];
        setEmployees(Array.isArray(d) ? d : d.employees || d.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch lookup data for warehouse edit', err);
    }
  }, []);

  useEffect(() => {
    fetchWarehouseData();
    fetchWarehouseStocks();
    fetchLookupData();
  }, [fetchWarehouseData, fetchWarehouseStocks, fetchLookupData]);

  const handleSaveWarehouse = async (data) => {
    if (!warehouse?.id) return;
    setSubmitting(true);
    try {
      await branchesApi.updateWarehouse(warehouse.id, data);
      toast.success('Warehouse facility updated successfully');
      setIsEditModalOpen(false);
      fetchWarehouseData();
    } catch (err) {
      toast.error(err?.message || 'Failed to update warehouse details');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStocks = useMemo(() => {
    if (!stockSearch.trim()) return stocks;
    const q = stockSearch.toLowerCase().trim();
    return stocks.filter((s) => {
      const pName = s.product?.name?.toLowerCase() || '';
      const sku = s.product?.sku?.toLowerCase() || '';
      return pName.includes(q) || sku.includes(q);
    });
  }, [stocks, stockSearch]);

  const totalStockQuantity = useMemo(() => {
    return stocks.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  }, [stocks]);

  const totalAvailableQuantity = useMemo(() => {
    return stocks.reduce((sum, s) => sum + (Number(s.availableQuantity) || 0), 0);
  }, [stocks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 rounded-full absolute" />
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-normal text-foreground">Loading Facility Profile</p>
            <p className="text-xs text-muted-foreground mt-0.5">Fetching warehouse specifications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4 my-12">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-normal text-foreground">Warehouse Facility Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The requested warehouse record does not exist or has been archived.
        </p>
        <Button variant="outline" onClick={() => navigate('/branches')}>
          Back to Facilities & Branches
        </Button>
      </div>
    );
  }

  const managerPerson = warehouse.manager?.person;
  const managerName = managerPerson
    ? `${managerPerson.firstName || ''} ${managerPerson.lastName || ''}`.trim()
    : warehouse.manager?.name || null;

  const creatorName = warehouse.createdBy?.person
    ? `${warehouse.createdBy.person.firstName || ''} ${warehouse.createdBy.person.lastName || ''}`.trim()
    : null;

  const updaterName = warehouse.updatedBy?.person
    ? `${warehouse.updatedBy.person.firstName || ''} ${warehouse.updatedBy.person.lastName || ''}`.trim()
    : null;

  return (
    <div className="space-y-6 w-full min-w-0 animate-in fade-in duration-200">
      {/* Top Header / Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/branches')}
            className="p-2 rounded-xl bg-card border border-border hover:bg-muted text-black dark:text-white transition"
            title="Back to Facilities & Branches"
          >
            <ArrowLeft className="w-4 h-4 text-black dark:text-white" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-normal px-2.5 py-0.5 rounded-md bg-muted text-foreground border border-border">
                {warehouse.code || 'WH-CODE'}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-normal border ${
                  warehouse.status === 'ACTIVE'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-slate-100 dark:bg-muted text-muted-foreground border-border'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    warehouse.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-muted-foreground'
                  }`}
                />
                {warehouse.status || 'ACTIVE'}
              </span>
              {warehouse.branch && (
                <span className="text-xs text-muted-foreground font-normal">
                  Branch: <strong className="text-foreground font-normal">{warehouse.branch.name}</strong>
                </span>
              )}
            </div>
            <h1 className="text-2xl font-normal text-foreground tracking-tight mt-1">
              {warehouse.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchWarehouseData();
              fetchWarehouseStocks();
            }}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </Button>

          {canUpdate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Warehouse</span>
            </Button>
          )}
        </div>
      </div>

      {/* Facility Highlights / Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Branch & Company */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-normal uppercase tracking-wider text-muted-foreground block truncate">
                Parent Branch
              </span>
              <p className="text-base font-normal text-foreground truncate">
                {warehouse.branch?.name || 'Unassigned'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {warehouse.branch?.company?.name || 'Enterprise'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Manager / Custodian */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-normal uppercase tracking-wider text-muted-foreground block truncate">
                Warehouse Manager
              </span>
              <p className="text-base font-normal text-foreground truncate">
                {managerName || 'Unassigned'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {managerPerson?.phone || managerPerson?.email || 'Facility Custodian'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Region */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-normal uppercase tracking-wider text-muted-foreground block truncate">
                Territory / Region
              </span>
              <p className="text-base font-normal text-foreground truncate">
                {warehouse.region?.name || 'Central'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {warehouse.city || 'Regional Depot'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Stored Stock Items */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-normal uppercase tracking-wider text-muted-foreground block truncate">
                Stock SKUs Stored
              </span>
              <p className="text-base font-normal text-foreground tracking-tight">
                {stocks.length} <span className="text-xs text-muted-foreground font-normal">Products</span>
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {totalStockQuantity.toLocaleString()} units on hand
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Two Detailed Spec Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Panel 1: Physical Facility Location */}
        <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-slate-50/60 dark:bg-muted800/30">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-normal text-foreground">Facility Physical Location</h3>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-xs text-muted-foreground font-normal block mb-1">Administrative Region</span>
              <p className="font-normal text-foreground">
                {warehouse.region?.name ? `${warehouse.region.name}${warehouse.region.code ? ` (${warehouse.region.code})` : ''}` : '—'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-normal block mb-1">City / Municipality</span>
              <p className="font-normal text-foreground">{warehouse.city || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-normal block mb-1">Sub-City</span>
              <p className="font-normal text-foreground">{warehouse.subCity || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-normal block mb-1">Woreda / Kebele</span>
              <p className="font-normal text-foreground">
                {[warehouse.woreda ? `Woreda ${warehouse.woreda}` : null, warehouse.kebele ? `Kebele ${warehouse.kebele}` : null]
                  .filter(Boolean)
                  .join(' • ') || '—'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-normal block mb-1">House Number</span>
              <p className="font-normal text-foreground">{warehouse.houseNumber || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-normal block mb-1">Location / Landmark Note</span>
              <p className="font-normal text-foreground">{warehouse.location || '—'}</p>
            </div>
          </div>
        </div>

        {/* Panel 2: Custody & Operational Management */}
        <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-slate-50/60 dark:bg-muted800/30">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-normal text-foreground">Custodian & Management</h3>
          </div>

          <div className="p-5 space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground font-normal block mb-1">Warehouse Custodian</span>
                <p className="font-normal text-foreground text-sm">{managerName || 'Unassigned'}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-normal block mb-1">Contact Phone</span>
                <p className="font-normal text-foreground">{managerPerson?.phone || '—'}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-normal block mb-1">Corporate Email</span>
                <p className="font-normal text-foreground">{managerPerson?.email || '—'}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-normal block mb-1">Operational Mandate</span>
                <p className="font-normal text-emerald-700 dark:text-emerald-400">Inventory & Inbound Operations</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground leading-relaxed">
              The assigned warehouse manager oversees inventory receiving, staging, pick-pack-ship operations, stock count reconciliations, and bin allocations at this facility.
            </div>
          </div>
        </div>
      </div>

      {/* Live Stored Inventory & Stock Table */}
      <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-border bg-slate-50/60 dark:bg-muted800/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-normal text-foreground">Current Stock in Warehouse</h3>
              <p className="text-xs text-muted-foreground font-normal">
                {stocks.length} distinct products recorded in this facility
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                placeholder="Filter stock by SKU or name..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/inventory')}
              className="text-xs whitespace-nowrap"
            >
              Inventory Hub →
            </Button>
          </div>
        </div>

        {loadingStocks ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading stock balances...
          </div>
        ) : filteredStocks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-normal bg-muted/20">
                  <th className="px-4 py-2.5">Product / SKU</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5 text-right">On Hand</th>
                  <th className="px-4 py-2.5 text-right">Available</th>
                  <th className="px-4 py-2.5 text-right">Reserved</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredStocks.map((s) => {
                  const prod = s.product;
                  const qty = Number(s.quantity) || 0;
                  const avail = Number(s.availableQuantity) || 0;
                  const res = Number(s.reservedQuantity) || 0;
                  const min = Number(s.minimumStock) || 0;

                  return (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="font-normal text-foreground">
                          {prod?.name || 'Unnamed Product'}
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {prod?.sku || 'SKU-N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {prod?.category?.name || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-foreground">
                        {qty.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-emerald-700 dark:text-emerald-400 font-medium">
                        {avail.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">
                        {res > 0 ? res.toLocaleString() : '0'}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {qty <= 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                            Out of Stock
                          </span>
                        ) : qty <= min ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/inventory/stocks/${s.id}`)}
                          className="p-1 rounded-md text-black dark:text-white hover:bg-muted transition"
                          title="View Stock Ledger"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-black dark:text-white" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-muted-foreground space-y-2">
            <Package className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
            <p>No inventory records found for this facility.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/inventory')}
              className="mt-2 text-xs"
            >
              Transfer or Receive Stock
            </Button>
          </div>
        )}
      </div>

      {/* Audit Footprint Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-4 gap-2 font-normal">
        <div className="flex items-center gap-4">
          {creatorName && (
            <span>
              Created by: <strong className="text-foreground font-normal">{creatorName}</strong>
            </span>
          )}
          {updaterName && (
            <span>
              Updated by: <strong className="text-foreground font-normal">{updaterName}</strong>
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Created: {warehouse.createdAt ? new Date(warehouse.createdAt).toLocaleDateString() : 'N/A'}</span>
          <span>Last Updated: {warehouse.updatedAt ? new Date(warehouse.updatedAt).toLocaleString() : 'N/A'}</span>
        </div>
      </div>

      {/* Edit Warehouse Modal */}
      <WarehouseFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveWarehouse}
        warehouse={warehouse}
        branches={branches}
        regions={regions}
        employees={employees}
        submitting={submitting}
      />
    </div>
  );
}
