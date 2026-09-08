import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Sliders,
  ArrowLeftRight,
  BookmarkCheck,
  RotateCw,
  Package,
  History,
} from 'lucide-react';

import { inventoryApi } from '../inventoryApi';
import { usePermission } from '../../../hooks/usePermission';
import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';

import InventoryStats from '../components/InventoryStats';
import StocksTab from '../components/stocks/StocksTab';
import StockFormModal from '../components/stocks/StockFormModal';

import AdjustmentsTab from '../components/adjustments/AdjustmentsTab';
import AdjustmentFormModal from '../components/adjustments/AdjustmentFormModal';
import AdjustmentApprovalModal from '../components/adjustments/AdjustmentApprovalModal';
import AdjustmentDetailModal from '../components/adjustments/AdjustmentDetailModal';

import TransfersTab from '../components/transfers/TransfersTab';
import TransferFormModal from '../components/transfers/TransferFormModal';
import TransferApprovalModal from '../components/transfers/TransferApprovalModal';
import TransferDetailModal from '../components/transfers/TransferDetailModal';

import ReservationsTab from '../components/reservations/ReservationsTab';
import ReservationFormModal from '../components/reservations/ReservationFormModal';
import ReleaseReservationModal from '../components/reservations/ReleaseReservationModal';

import StockMovementsTab from '../components/movements/StockMovementsTab';

export default function InventoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Active Tab from query param or default to 'stocks'
  const activeTab = searchParams.get('tab') || 'stocks';
  const setActiveTab = (tab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  // Main Data States
  const [stocks, setStocks] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [reservations, setReservations] = useState([]);

  // Lookups
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);

  // Loading and Submitting
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [destWarehouseFilter, setDestWarehouseFilter] = useState('');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [adjustmentStatusFilter, setAdjustmentStatusFilter] = useState('');
  const [transferReasonFilter, setTransferReasonFilter] = useState('');
  const [transferStatusFilter, setTransferStatusFilter] = useState('');
  const [reservationStatusFilter, setReservationStatusFilter] = useState('');

  // Modals States
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [approvalAdjustment, setApprovalAdjustment] = useState(null);
  const [detailAdjustment, setDetailAdjustment] = useState(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [approvalTransfer, setApprovalTransfer] = useState(null);
  const [detailTransfer, setDetailTransfer] = useState(null);
  const [prefillTransferData, setPrefillTransferData] = useState({ sourceWarehouseId: '', productId: '' });

  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [releasingReservation, setReleasingReservation] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'stock' | 'adjustment' | 'transfer' | 'reservation', item: object }

  // Permissions
  const { can: canReadStock } = usePermission('inventory:stock:read');
  const { can: canCreateStock } = usePermission('inventory:stock:create');
  const { can: canUpdateStock } = usePermission('inventory:stock:update');
  const { can: canDeleteStock } = usePermission('inventory:stock:delete');

  const { can: canReadAdjustments } = usePermission('inventory:adjustments:read');
  const { can: canCreateAdjustments } = usePermission('inventory:adjustments:create');
  const { can: canApproveAdjustments } = usePermission('inventory:adjustments:approve');
  const { can: canDeleteAdjustments } = usePermission('inventory:adjustments:delete');

  const { can: canReadTransfers } = usePermission('inventory:transfers:read');
  const { can: canCreateTransfers } = usePermission('inventory:transfers:create');
  const { can: canApproveTransfers } = usePermission('inventory:transfers:approve');
  const { can: canDeleteTransfers } = usePermission('inventory:transfers:delete');

  const { can: canReadReservations } = usePermission('inventory:reservations:read');
  const { can: canCreateReservations } = usePermission('inventory:reservations:create');
  const { can: canReleaseReservations } = usePermission('inventory:reservations:release');
  const { can: canDeleteReservations } = usePermission('inventory:reservations:delete');

  // Fetch Lookups
  const fetchLookups = useCallback(async () => {
    try {
      const [wRes, pRes, soRes] = await Promise.allSettled([
        inventoryApi.getWarehouses({ limit: 100 }),
        inventoryApi.getProducts({ limit: 200 }),
        inventoryApi.getSalesOrders({ limit: 100 }),
      ]);

      if (wRes.status === 'fulfilled') {
        const d = wRes.value?.data || wRes.value || [];
        setWarehouses(Array.isArray(d) ? d : d.warehouses || d.items || []);
      }
      if (pRes.status === 'fulfilled') {
        const d = pRes.value?.data || pRes.value || [];
        setProducts(Array.isArray(d) ? d : d.products || d.items || []);
      }
      if (soRes.status === 'fulfilled') {
        const d = soRes.value?.data || soRes.value || [];
        setSalesOrders(Array.isArray(d) ? d : d.orders || d.items || []);
      }
    } catch {
      // Non-blocking lookup
    }
  }, []);

  // Fetch Tab Data
  const fetchData = useCallback(async () => {
    try {
      const params = { limit: 100 };

      const [stocksRes, adjRes, trRes, resRes] = await Promise.allSettled([
        canReadStock ? inventoryApi.getStocks(params) : Promise.resolve({ data: [] }),
        canReadAdjustments ? inventoryApi.getAdjustments(params) : Promise.resolve({ data: [] }),
        canReadTransfers ? inventoryApi.getTransfers(params) : Promise.resolve({ data: [] }),
        canReadReservations ? inventoryApi.getReservations(params) : Promise.resolve({ data: [] }),
      ]);

      if (stocksRes.status === 'fulfilled') {
        const d = stocksRes.value?.data || stocksRes.value || [];
        setStocks(Array.isArray(d) ? d : d.stocks || []);
      }
      if (adjRes.status === 'fulfilled') {
        const d = adjRes.value?.data || adjRes.value || [];
        setAdjustments(Array.isArray(d) ? d : d.adjustments || []);
      }
      if (trRes.status === 'fulfilled') {
        const d = trRes.value?.data || trRes.value || [];
        setTransfers(Array.isArray(d) ? d : d.transfers || []);
      }
      if (resRes.status === 'fulfilled') {
        const d = resRes.value?.data || resRes.value || [];
        setReservations(Array.isArray(d) ? d : d.reservations || []);
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canReadStock, canReadAdjustments, canReadTransfers, canReadReservations]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLookups();
    fetchData();
  }, [fetchLookups, fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  // ── Calculated KPI Metrics ────────────────────────────────
  const stats = useMemo(() => {
    const totalItems = stocks.length;
    const totalQuantity = stocks.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
    const lowStockCount = stocks.filter((s) => {
      const avail = Number(s.availableQuantity) || 0;
      const reorder = Number(s.reorderLevel) || 0;
      return avail <= reorder;
    }).length;

    const pendingAdjustmentsCount = adjustments.filter((a) => a.status === 'PENDING').length;
    const pendingTransfersCount = transfers.filter((t) => t.status === 'PENDING').length;
    const activeReservationsCount = reservations.filter((r) => r.status === 'RESERVED').length;
    const transfersCount = transfers.length;

    return {
      totalItems,
      totalQuantity,
      lowStockCount,
      pendingAdjustmentsCount,
      pendingTransfersCount,
      activeReservationsCount,
      transfersCount,
    };
  }, [stocks, adjustments, reservations, transfers]);

  // ── Stock Handlers ────────────────────────────────────────
  const handleStockSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (editingStock) {
        await inventoryApi.updateStock(editingStock.id, {
          quantity: data.quantity,
          minimumStock: data.minimumStock,
          reorderLevel: data.reorderLevel,
        });
        toast.success('Stock thresholds updated');
      } else {
        await inventoryApi.createStock(data);
        toast.success('Stock item created');
      }
      setIsStockModalOpen(false);
      setEditingStock(null);
      fetchData();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      toast.error(err?.message || 'Failed to save stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Adjustment Handlers ───────────────────────────────────
  const handleAdjustmentSubmit = async (payload) => {
    setIsSubmitting(true);
    try {
      await inventoryApi.createAdjustment(payload);
      toast.success('Stock adjustment submitted for manager review');
      setIsAdjustmentModalOpen(false);
      fetchData();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      toast.error(err?.message || 'Failed to submit adjustment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveAdjustment = async (id) => {
    setIsSubmitting(true);
    try {
      await inventoryApi.approveAdjustment(id, { status: 'APPROVED' });
      toast.success('Stock adjustment approved and applied to inventory');
      setApprovalAdjustment(null);
      fetchData();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      toast.error(err?.message || 'Failed to approve adjustment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectAdjustment = async (id) => {
    setIsSubmitting(true);
    try {
      await inventoryApi.approveAdjustment(id, { status: 'REJECTED' });
      toast.success('Stock adjustment rejected');
      setApprovalAdjustment(null);
      fetchData();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      toast.error(err?.message || 'Failed to reject adjustment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Transfer Handlers ─────────────────────────────────────
  const handleTransferSubmit = async (payload) => {
    setIsSubmitting(true);
    try {
      await inventoryApi.createTransfer(payload);
      toast.success('Stock transfer requested and queued for manager review');
      setIsTransferModalOpen(false);
      fetchData();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      toast.error(err?.message || 'Failed to dispatch transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveTransfer = async (id, notes) => {
    setIsSubmitting(true);
    try {
      await inventoryApi.approveTransfer(id, { action: 'APPROVE', notes });
      toast.success('Stock transfer authorized and executed');
      setApprovalTransfer(null);
      fetchData();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      toast.error(err?.message || 'Failed to approve transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectTransfer = async (id, notes) => {
    setIsSubmitting(true);
    try {
      await inventoryApi.approveTransfer(id, { action: 'REJECT', notes });
      toast.success('Stock transfer rejected and source reservation released');
      setApprovalTransfer(null);
      fetchData();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      toast.error(err?.message || 'Failed to reject transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reservation Handlers ──────────────────────────────────
  const handleReservationSubmit = async (payload) => {
    setIsSubmitting(true);
    try {
      await inventoryApi.createReservation(payload);
      toast.success('Stock reserved for order');
      setIsReservationModalOpen(false);
      fetchData();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      toast.error(err?.message || 'Failed to create reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseReservation = async (id, quantity) => {
    setIsSubmitting(true);
    try {
      await inventoryApi.releaseReservation(id, quantity ? { quantity } : {});
      toast.success('Stock reservation released');
      setReleasingReservation(null);
      fetchData();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      toast.error(err?.message || 'Failed to release reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete Confirmation Handler ───────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, item } = deleteTarget;
    setIsSubmitting(true);
    try {
      if (type === 'stock') {
        await inventoryApi.deleteStock(item.id);
        toast.success('Stock record archived');
      } else if (type === 'adjustment') {
        await inventoryApi.deleteAdjustment(item.id);
        toast.success('Adjustment record deleted');
      } else if (type === 'transfer') {
        await inventoryApi.deleteTransfer(item.id);
        toast.success('Transfer reversed and stock restored');
      } else if (type === 'reservation') {
        await inventoryApi.deleteReservation(item.id);
        toast.success('Reservation deleted');
      }
      setDeleteTarget(null);
      fetchData();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      toast.error(err?.message || `Failed to delete ${type}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Filtered Data Slices ──────────────────────────────────
  const filteredStocks = useMemo(() => {
    return stocks.filter((s) => {
      const matchesWarehouse = !warehouseFilter || s.warehouseId === warehouseFilter || s.warehouse?.id === warehouseFilter;
      const matchesSearch =
        !search ||
        s.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.product?.sku?.toLowerCase().includes(search.toLowerCase());
      const matchesLowStock = !lowStockOnly || (Number(s.availableQuantity) <= Number(s.reorderLevel));
      return matchesWarehouse && matchesSearch && matchesLowStock;
    });
  }, [stocks, warehouseFilter, search, lowStockOnly]);

  const filteredAdjustments = useMemo(() => {
    return adjustments.filter((a) => {
      const matchesWarehouse = !warehouseFilter || a.warehouseId === warehouseFilter || a.warehouse?.id === warehouseFilter;
      const matchesStatus = !adjustmentStatusFilter || a.status === adjustmentStatusFilter;
      const matchesSearch = !search || a.reason?.toLowerCase().includes(search.toLowerCase());
      return matchesWarehouse && matchesStatus && matchesSearch;
    });
  }, [adjustments, warehouseFilter, adjustmentStatusFilter, search]);

  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const matchesSource = !warehouseFilter || t.fromWarehouseId === warehouseFilter || t.fromWarehouse?.id === warehouseFilter;
      const matchesDest = !destWarehouseFilter || t.toWarehouseId === destWarehouseFilter || t.toWarehouse?.id === destWarehouseFilter;
      const matchesReason = !transferReasonFilter || t.transferReason === transferReasonFilter;
      const matchesStatus = !transferStatusFilter || t.status === transferStatusFilter;
      const matchesSearch =
        !search ||
        t.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.product?.sku?.toLowerCase().includes(search.toLowerCase()) ||
        t.remark?.toLowerCase().includes(search.toLowerCase());
      return matchesSource && matchesDest && matchesReason && matchesStatus && matchesSearch;
    });
  }, [transfers, warehouseFilter, destWarehouseFilter, transferReasonFilter, transferStatusFilter, search]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const matchesWarehouse = !warehouseFilter || r.warehouseId === warehouseFilter || r.warehouse?.id === warehouseFilter;
      const matchesStatus = !reservationStatusFilter || r.status === reservationStatusFilter;
      const matchesSearch =
        !search ||
        r.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.salesOrder?.orderNumber?.toLowerCase().includes(search.toLowerCase());
      return matchesWarehouse && matchesStatus && matchesSearch;
    });
  }, [reservations, warehouseFilter, reservationStatusFilter, search]);

  // Tab definitions
  const tabs = [
    {
      id: 'stocks',
      label: 'Warehouse Stocks',
      icon: <Package className="w-4 h-4" />,
      badge: stats.lowStockCount > 0 ? `${stats.lowStockCount} Low` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      visible: canReadStock,
    },
    {
      id: 'adjustments',
      label: 'Stock Adjustments',
      icon: <Sliders className="w-4 h-4" />,
      badge: stats.pendingAdjustmentsCount > 0 ? `${stats.pendingAdjustmentsCount} Pending` : null,
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      visible: canReadAdjustments,
    },
    {
      id: 'transfers',
      label: 'Inter-Warehouse Transfers',
      icon: <ArrowLeftRight className="w-4 h-4" />,
      badge: stats.pendingTransfersCount > 0 ? `${stats.pendingTransfersCount} Pending` : (stats.transfersCount > 0 ? `${stats.transfersCount}` : null),
      badgeColor: stats.pendingTransfersCount > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      visible: canReadTransfers,
    },
    {
      id: 'reservations',
      label: 'Stock Reservations',
      icon: <BookmarkCheck className="w-4 h-4" />,
      badge: stats.activeReservationsCount > 0 ? `${stats.activeReservationsCount} Reserved` : null,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      visible: canReadReservations,
    },
  ].filter((t) => t.visible);

  // Auto-switch to first available tab if current activeTab is not permitted
  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((t) => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/10 border border-violet-500/20 text-violet-400">
              Module 07 • Inventory Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <span>Inventory Management Console</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Real-time warehouse stock visibility, inter-facility movement dispatching, count audit reconciliations, and order allocation reservations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted800 text-muted-foreground hover:text-foreground transition flex items-center gap-2 text-xs font-semibold"
            title="Refresh inventory data"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-violet-400' : ''}`} />
            <span className="hidden sm:inline">Sync Data</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Strip */}
      <InventoryStats
        stats={stats}
        onSelectTab={setActiveTab}
        onFilterLowStock={() => {
          setActiveTab('stocks');
          setLowStockOnly(true);
        }}
      />

      {/* Tab Navigation Navigation Bar */}
      <div className="border-b border-border/80 flex items-center gap-2 overflow-x-auto pb-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition shrink-0 cursor-pointer ${isActive
                  ? 'border-violet-500 text-violet-400 bg-violet-500/[0.04]'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${tab.badgeColor}`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panes */}
      <div className="min-h-[400px]">
        {activeTab === 'stocks' && (
          <StocksTab
            stocks={filteredStocks}
            warehouses={warehouses}
            loading={loading}
            selectedWarehouseId={warehouseFilter}
            onWarehouseChange={setWarehouseFilter}
            search={search}
            onSearchChange={setSearch}
            lowStockOnly={lowStockOnly}
            onLowStockToggle={() => setLowStockOnly((prev) => !prev)}
            onOpenCreateModal={() => {
              setEditingStock(null);
              setIsStockModalOpen(true);
            }}
            onOpenEditModal={(stock) => {
              setEditingStock(stock);
              setIsStockModalOpen(true);
            }}
            onDeleteStock={(stock) =>
              setDeleteTarget({
                type: 'stock',
                item: stock,
                message: `Are you sure you want to archive stock for "${stock.product?.name}" in "${stock.warehouse?.name}"?`,
              })
            }
            onQuickTransfer={(stock) => {
              setPrefillTransferData({
                sourceWarehouseId: stock.warehouseId || stock.warehouse?.id,
                productId: stock.productId || stock.product?.id,
              });
              setIsTransferModalOpen(true);
            }}
            onQuickAdjust={(stock) => {
              setWarehouseFilter(stock.warehouseId || stock.warehouse?.id || '');
              setIsAdjustmentModalOpen(true);
            }}
            canCreate={canCreateStock}
            canUpdate={canUpdateStock}
            canDelete={canDeleteStock}
          />
        )}

        {activeTab === 'adjustments' && (
          <AdjustmentsTab
            adjustments={filteredAdjustments}
            warehouses={warehouses}
            loading={loading}
            selectedWarehouseId={warehouseFilter}
            onWarehouseChange={setWarehouseFilter}
            statusFilter={adjustmentStatusFilter}
            onStatusFilterChange={setAdjustmentStatusFilter}
            search={search}
            onSearchChange={setSearch}
            onOpenCreateModal={() => setIsAdjustmentModalOpen(true)}
            onOpenApprovalModal={(adj) => setApprovalAdjustment(adj)}
            onOpenDetailModal={(adj) => navigate(`/inventory/adjustments/${adj.id}`)}
            onDeleteAdjustment={(adj) =>
              setDeleteTarget({
                type: 'adjustment',
                item: adj,
                message: `Delete pending audit adjustment #${adj.id?.slice(0, 8)}?`,
              })
            }
            canCreate={canCreateAdjustments}
            canApprove={canApproveAdjustments}
            canDelete={canDeleteAdjustments}
          />
        )}

        {activeTab === 'transfers' && (
          <TransfersTab
            transfers={filteredTransfers}
            warehouses={warehouses}
            loading={loading}
            selectedSourceId={warehouseFilter}
            onSourceChange={setWarehouseFilter}
            selectedDestId={destWarehouseFilter}
            onDestChange={setDestWarehouseFilter}
            reasonFilter={transferReasonFilter}
            onReasonFilterChange={setTransferReasonFilter}
            statusFilter={transferStatusFilter}
            onStatusFilterChange={setTransferStatusFilter}
            search={search}
            onSearchChange={setSearch}
            onOpenCreateModal={() => {
              setPrefillTransferData({ sourceWarehouseId: '', productId: '' });
              setIsTransferModalOpen(true);
            }}
            onOpenApprovalModal={(tr) => setApprovalTransfer(tr)}
            onOpenDetailModal={(tr) => navigate(`/inventory/transfers/${tr.id}`)}
            onDeleteTransfer={(tr) =>
              setDeleteTarget({
                type: 'transfer',
                item: tr,
                message: tr.status === 'PENDING'
                  ? `Cancel pending transfer of ${tr.quantity} units of ${tr.product?.name}? Source warehouse reserved stock will be released.`
                  : `Reverse transfer of ${tr.quantity} units of ${tr.product?.name} from "${tr.fromWarehouse?.name}" to "${tr.toWarehouse?.name}"? Stock will be credited back to the source facility.`,
              })
            }
            canCreate={canCreateTransfers}
            canApprove={canApproveTransfers}
            canDelete={canDeleteTransfers}
          />
        )}

        {activeTab === 'reservations' && (
          <ReservationsTab
            reservations={filteredReservations}
            warehouses={warehouses}
            loading={loading}
            selectedWarehouseId={warehouseFilter}
            onWarehouseChange={setWarehouseFilter}
            statusFilter={reservationStatusFilter}
            onStatusFilterChange={setReservationStatusFilter}
            search={search}
            onSearchChange={setSearch}
            onOpenCreateModal={() => setIsReservationModalOpen(true)}
            onOpenReleaseModal={(res) => setReleasingReservation(res)}
            onOpenDetailModal={(res) => navigate(`/inventory/reservations/${res.id}`)}
            onDeleteReservation={(res) =>
              setDeleteTarget({
                type: 'reservation',
                item: res,
                message: `Delete reservation for order #${res.salesOrder?.orderNumber || res.salesOrderId?.slice(0, 8)}?`,
              })
            }
            canCreate={canCreateReservations}
            canRelease={canReleaseReservations}
            canDelete={canDeleteReservations}
          />
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────── */}
      {/* Stock Form Modal */}
      <StockFormModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setEditingStock(null);
        }}
        onSubmit={handleStockSubmit}
        initialData={editingStock}
        warehouses={warehouses}
        products={products}
        stocks={stocks}
        isSubmitting={isSubmitting}
      />

      {/* Adjustment Form Modal */}
      <AdjustmentFormModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSubmit={handleAdjustmentSubmit}
        warehouses={warehouses}
        products={products}
        stocks={stocks}
        prefillWarehouseId={warehouseFilter}
        isSubmitting={isSubmitting}
      />

      {/* Adjustment Approval Modal */}
      <AdjustmentApprovalModal
        isOpen={Boolean(approvalAdjustment)}
        onClose={() => setApprovalAdjustment(null)}
        adjustment={approvalAdjustment}
        onApprove={handleApproveAdjustment}
        onReject={handleRejectAdjustment}
        isProcessing={isSubmitting}
      />

      {/* Adjustment Detail Modal */}
      <AdjustmentDetailModal
        isOpen={Boolean(detailAdjustment)}
        onClose={() => setDetailAdjustment(null)}
        adjustment={detailAdjustment}
      />

      {/* Transfer Form Modal */}
      <TransferFormModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSubmit={handleTransferSubmit}
        warehouses={warehouses}
        products={products}
        stocks={stocks}
        prefillSourceWarehouseId={prefillTransferData.sourceWarehouseId}
        prefillProductId={prefillTransferData.productId}
        isSubmitting={isSubmitting}
      />

      {/* Transfer Detail Modal */}
      <TransferDetailModal
        isOpen={Boolean(detailTransfer)}
        onClose={() => setDetailTransfer(null)}
        transfer={detailTransfer}
        canApprove={canApproveTransfers}
        onOpenApprovalModal={(tr) => {
          setDetailTransfer(null);
          setApprovalTransfer(tr);
        }}
      />

      {/* Transfer Approval Modal */}
      <TransferApprovalModal
        isOpen={Boolean(approvalTransfer)}
        onClose={() => setApprovalTransfer(null)}
        transfer={approvalTransfer}
        onApprove={handleApproveTransfer}
        onReject={handleRejectTransfer}
        isProcessing={isSubmitting}
      />

      {/* Reservation Form Modal */}
      <ReservationFormModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        onSubmit={handleReservationSubmit}
        warehouses={warehouses}
        products={products}
        salesOrders={salesOrders}
        stocks={stocks}
        isSubmitting={isSubmitting}
      />

      {/* Release Reservation Modal */}
      <ReleaseReservationModal
        isOpen={Boolean(releasingReservation)}
        onClose={() => setReleasingReservation(null)}
        reservation={releasingReservation}
        onRelease={handleReleaseReservation}
        isSubmitting={isSubmitting}
      />

      {/* Confirm Delete / Archive Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Confirm Delete ${deleteTarget?.type || 'Record'}`}
        message={deleteTarget?.message || 'Are you sure you want to perform this deletion?'}
        isDeleting={isSubmitting}
      />
    </div>
  );
}
