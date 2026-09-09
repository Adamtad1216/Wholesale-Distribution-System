import React from 'react';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
import PoCartTab from '../../components/PoCartTab';
import usePurchaseOrderCart from './hooks/usePurchaseOrderCart';

export default function PurchaseOrderCartPage() {
  const {
    loading,
    products,
    suppliers,
    warehouses,
    selectedItems,
    setSelectedItems,
    defaultSupplier,
    setDefaultSupplier,
    defaultWarehouse,
    setDefaultWarehouse,
    handlePoCreated,
    navigate,
  } = usePurchaseOrderCart();

  return (
    <div className="p-6 space-y-6 min-h-[calc(100vh-100px)]">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <button
            onClick={() => navigate('/procurement')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 mb-2"
          >
            ← Back to Procurement Dashboard
          </button>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            🛒 Purchase Order Cart & Checkout
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Review requisition line items, select target vendor & destination warehouse, and place Purchase Orders.
          </p>
        </div>

        <Button variant="secondary" size="md" onClick={() => navigate('/procurement')}>
          Cancel & Return
        </Button>
      </div>

      {/* Full Page Cart Content */}
      {loading ? (
        <Card className="p-12 text-center border border-border bg-card900">
          <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-semibold text-muted-foreground">Loading cart items...</p>
        </Card>
      ) : (
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
          onBrowseProducts={() => navigate('/procurement')}
        />
      )}
    </div>
  );
}
