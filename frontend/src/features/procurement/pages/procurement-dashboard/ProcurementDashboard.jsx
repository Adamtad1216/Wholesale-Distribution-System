import React from 'react';
import RequisitionTab from '../../components/RequisitionTab';
import PoCartTab from '../../components/PoCartTab';
import PurchaseOrdersTab from '../../components/PurchaseOrdersTab';
import GoodsReceiptsTab from '../../components/GoodsReceiptsTab';
import OnDeliveryPoTab from '../../components/OnDeliveryPoTab';
import useProcurementDashboard from './hooks/useProcurementDashboard';

export default function ProcurementDashboard() {
  const {
    activeTab,
    setActiveTab,
    loadingCatalog,
    products,
    setProducts,
    categories,
    setCategories,
    suppliers,
    setSuppliers,
    warehouses,
    setWarehouses,
    selectedItems,
    setSelectedItems,
    defaultSupplier,
    setDefaultSupplier,
    defaultWarehouse,
    setDefaultWarehouse,
    metrics,
    tabs,
    refreshPoTrigger,
    handlePoCreated,
    navigate,
  } = useProcurementDashboard();

  return (
    <div className="p-6 space-y-6 relative min-h-[calc(100vh-100px)]">
      {/* Title & Stats Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold rounded-lg uppercase tracking-wider">
              Supply Chain & Inventory Replenishment
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mt-2">
            Procurement Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Provision Purchase Orders, manage PO Cart, approve supplier orders, and record Goods Receipts.
          </p>
        </div>
      </div>

      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-card900 border border-border rounded-2xl backdrop-blur-xl flex items-center gap-4 hover:border-indigo-500/30 transition">
          <div className="w-12 h-12 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-300 text-xl font-bold">
            📋
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total POs</div>
            <div className="text-2xl font-mono font-extrabold text-foreground mt-0.5">{metrics.totalPos}</div>
          </div>
        </div>

        <div className="p-4 bg-card900 border border-amber-500/30 rounded-2xl backdrop-blur-xl flex items-center gap-4 hover:border-amber-500/50 transition">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xl font-bold">
            ⌛
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">Pending POs</div>
            <div className="text-2xl font-mono font-extrabold text-amber-400 mt-0.5">{metrics.pendingPos}</div>
          </div>
        </div>

        <div className="p-4 bg-card900 border border-indigo-500/30 rounded-2xl backdrop-blur-xl flex items-center gap-4 hover:border-indigo-500/50 transition">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xl font-bold">
            ✅
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">Approved POs</div>
            <div className="text-2xl font-mono font-extrabold text-indigo-400 mt-0.5">{metrics.approvedPos}</div>
          </div>
        </div>

        <div className="p-4 bg-card900 border border-emerald-500/30 rounded-2xl backdrop-blur-xl flex items-center gap-4 hover:border-emerald-500/50 transition">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold">
            📦
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Pending Goods Receipts</div>
            <div className="text-2xl font-mono font-extrabold text-emerald-400 mt-0.5">{metrics.pendingGrs}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tab Controls */}
      <div className="flex items-center justify-between border-b border-border pb-1 overflow-x-auto gap-4">
        <div className="flex items-center gap-2">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  if (t.id === 'CART') {
                    navigate('/procurement/cart', { state: { selectedItems } });
                  } else {
                    setActiveTab(t.id);
                  }
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition border flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                    : 'bg-muted800/40 text-muted-foreground border-transparent hover:bg-muted800 hover:text-foreground'
                }`}
              >
                <span>{t.label}</span>
                {t.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-indigo-500 text-white rounded-full">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab View Rendering */}
      <div>
        {activeTab === 'REQUISITION' && (
          <RequisitionTab
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            products={products}
            setProducts={setProducts}
            categories={categories}
            setCategories={setCategories}
            suppliers={suppliers}
            setSuppliers={setSuppliers}
            warehouses={warehouses}
            setWarehouses={setWarehouses}
            defaultSupplier={defaultSupplier}
            setDefaultSupplier={setDefaultSupplier}
            defaultWarehouse={defaultWarehouse}
            setDefaultWarehouse={setDefaultWarehouse}
            loading={loadingCatalog}
            onPoCreated={handlePoCreated}
            onOpenCart={() => navigate('/procurement/cart', { state: { selectedItems } })}
          />
        )}

        {activeTab === 'CART' && (
          <PoCartTab
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            products={products}
            suppliers={suppliers}
            warehouses={warehouses}
            defaultSupplier={defaultSupplier}
            setDefaultSupplier={setDefaultSupplier}
            defaultWarehouse={defaultWarehouse}
            setDefaultWarehouse={setDefaultWarehouse}
            onPoCreated={handlePoCreated}
            onBrowseProducts={() => setActiveTab('REQUISITION')}
          />
        )}

        {activeTab === 'POS' && <PurchaseOrdersTab refreshTrigger={refreshPoTrigger} />}

        {activeTab === 'RECEIPTS' && <GoodsReceiptsTab />}
        {activeTab === 'ON_DELIVERY_PO' && <OnDeliveryPoTab refreshTrigger={refreshPoTrigger} />}
      </div>
    </div>
  );
}
