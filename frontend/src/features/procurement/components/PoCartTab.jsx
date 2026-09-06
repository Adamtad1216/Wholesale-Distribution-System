import React from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { procurementApi } from '../procurementApi';
import { toast } from 'react-hot-toast';

export default function PoCartTab({
  selectedItems,
  setSelectedItems,
  products,
  suppliers,
  warehouses,
  defaultSupplier,
  setDefaultSupplier,
  defaultWarehouse,
  setDefaultWarehouse,
  onPoCreated,
  onBrowseProducts,
}) {
  const [submitting, setSubmitting] = React.useState(false);

  // Extract selected product objects
  const cartEntries = Object.entries(selectedItems).filter(([, item]) => item.selected);

  // Map entries with full product details
  const cartProducts = cartEntries.map(([productId, itemState]) => {
    const fullProduct = products.find((p) => p.id === productId) || {};
    return {
      productId,
      ...itemState,
      product: fullProduct,
    };
  });

  // Calculate totals
  const totalItems = cartProducts.length;
  const totalUnits = cartProducts.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
  const totalOrderValue = cartProducts.reduce(
    (acc, item) => acc + Number(item.quantity || 0) * Number(item.unitCost || 0),
    0
  );

  // Handle quantity change
  const handleQuantityChange = (productId, newQty) => {
    const qty = Math.max(1, parseInt(newQty) || 1);
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: qty,
      },
    }));
  };

  // Handle unit cost change
  const handleUnitCostChange = (productId, newCost) => {
    const cost = Math.max(0, parseFloat(newCost) || 0);
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        unitCost: cost,
      },
    }));
  };

  // Remove item from cart
  const handleRemoveItem = (productId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selected: false,
      },
    }));
    toast.success('Item removed from PO Cart');
  };

  // Clear entire cart
  const handleClearCart = () => {
    const resetMap = { ...selectedItems };
    Object.keys(resetMap).forEach((k) => {
      resetMap[k].selected = false;
    });
    setSelectedItems(resetMap);
    toast.success('PO Cart cleared');
  };

  // Submit Purchase Order
  const handleCreatePurchaseOrder = async () => {
    if (cartProducts.length === 0) {
      toast.error('Your PO Cart is empty');
      return;
    }

    if (!defaultSupplier) {
      toast.error('Please select a Target Supplier Vendor');
      return;
    }

    if (!defaultWarehouse) {
      toast.error('Please select a Receiving Destination Warehouse');
      return;
    }

    try {
      setSubmitting(true);
      const itemsPayload = cartProducts.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitCost || 0),
        discount: 0,
        tax: 0,
        total: Number(item.quantity || 1) * Number(item.unitCost || 0),
      }));

      const poPayload = {
        supplierId: defaultSupplier,
        warehouseId: defaultWarehouse,
        items: itemsPayload,
        subtotal: totalOrderValue,
        discount: 0,
        tax: 0,
        total: totalOrderValue,
      };

      await procurementApi.createPurchaseOrder(poPayload);
      toast.success('Purchase Order created successfully in PENDING status!');

      // Clear cart after successful order creation
      const resetMap = { ...selectedItems };
      Object.keys(resetMap).forEach((k) => {
        resetMap[k].selected = false;
      });
      setSelectedItems(resetMap);

      if (onPoCreated) onPoCreated();
    } catch (err) {
      console.error('Failed to create purchase order:', err);
      toast.error(err.response?.data?.message || 'Failed to create Purchase Order');
    } finally {
      setSubmitting(false);
    }
  };

  if (totalItems === 0) {
    return (
      <Card className="p-12 text-center border border-border bg-card900 backdrop-blur-xl rounded-2xl space-y-4">
        <div className="text-5xl">🛒</div>
        <h3 className="text-xl font-bold text-foreground">Your PO Cart is Empty</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          No products are currently selected for purchase order generation. Select products from the Requisition catalog to add them to your cart.
        </p>
        <div>
          <Button variant="primary" size="md" onClick={onBrowseProducts} className="px-6 shadow-lg shadow-indigo-500/20">
            🛍️ Browse & Select Products
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info & Configuration Card */}
      <Card className="p-5 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>🛒</span> Purchase Order Cart
            </h3>
            <p className="text-xs text-muted-foreground">
              Review selected products, adjust quantities/prices, assign vendor and warehouse before submitting.
            </p>
          </div>
          <Button variant="danger" size="xs" onClick={handleClearCart}>
            🗑️ Clear Cart
          </Button>
        </div>

        {/* Global Supplier & Destination Warehouse Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>🏬</span> Target Supplier Vendor *
            </label>
            <select
              value={defaultSupplier}
              onChange={(e) => setDefaultSupplier(e.target.value)}
              style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="" className="bg-[#0f172a] text-slate-100">Select Supplier Vendor...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#0f172a] text-slate-100">
                  {s.name || s.companyName} {s.contactPerson ? `(${s.contactPerson})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>🏭</span> Destination Warehouse *
            </label>
            <select
              value={defaultWarehouse}
              onChange={(e) => setDefaultWarehouse(e.target.value)}
              style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="" className="bg-[#0f172a] text-slate-100">Select Destination Warehouse...</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id} className="bg-[#0f172a] text-slate-100">
                  {w.name} ({w.code || 'MAIN'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Cart Items Table */}
      <Card className="border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted800/80 border-b border-border text-muted-foreground uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4">Product Details</th>
                <th className="py-3.5 px-4 text-center">Available Stock</th>
                <th className="py-3.5 px-4 text-center w-36">Order Quantity</th>
                <th className="py-3.5 px-4 text-center w-40">Unit Cost (ETB)</th>
                <th className="py-3.5 px-4 text-right">Subtotal (ETB)</th>
                <th className="py-3.5 px-4 text-center w-16">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 font-medium">
              {cartProducts.map(({ productId, quantity, unitCost, product }) => {
                const subtotal = Number(quantity || 0) * Number(unitCost || 0);
                const stockQty = product?.warehouseStocks?.[0]?.availableQuantity ?? product?.stockQuantity ?? 0;

                return (
                  <tr key={productId} className="hover:bg-muted800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground">{product.name || 'Selected Product'}</div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>SKU: {product.sku || 'N/A'}</span>
                        {product.category?.name && (
                          <span className="px-1.5 py-0.5 bg-slate-500/10 text-slate-400 rounded text-[10px] border border-slate-500/20">
                            {product.category.name}
                          </span>
                        )}
                        {product.unit?.abbreviation && (
                          <span className="px-1.5 py-0.5 bg-slate-500/10 text-slate-400 rounded text-[10px] border border-slate-500/20">
                            /{product.unit.abbreviation}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] border ${
                          stockQty <= 0
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {stockQty} {product.unit?.abbreviation || 'Units'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(productId, Number(quantity) - 1)}
                          className="w-7 h-7 rounded-lg bg-muted800 border border-border text-foreground font-bold hover:bg-muted700"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => handleQuantityChange(productId, e.target.value)}
                          className="w-16 px-2 py-1 bg-muted800 border border-border rounded-lg text-center font-bold text-foreground focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(productId, Number(quantity) + 1)}
                          className="w-7 h-7 rounded-lg bg-muted800 border border-border text-foreground font-bold hover:bg-muted700"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={unitCost}
                        onChange={(e) => handleUnitCostChange(productId, e.target.value)}
                        className="w-28 px-2.5 py-1.5 bg-muted800 border border-border rounded-lg text-center font-mono font-bold text-foreground focus:outline-none focus:border-indigo-500"
                      />
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {subtotal.toLocaleString()} ETB
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(productId)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PO Cart Summary & Checkout Footer */}
        <div className="p-5 bg-muted800/80 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="grid grid-cols-3 gap-6 text-center sm:text-left">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Selected Line Items</span>
              <span className="text-sm font-bold text-indigo-400">{totalItems} Products</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total Quantity</span>
              <span className="text-sm font-bold text-foreground">{totalUnits} Units</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total PO Value</span>
              <span className="text-base font-mono font-extrabold text-emerald-400">
                {totalOrderValue.toLocaleString()} ETB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button variant="secondary" size="md" onClick={onBrowseProducts}>
              ➕ Add More Items
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={submitting || totalItems === 0}
              onClick={handleCreatePurchaseOrder}
              className="px-6 shadow-lg shadow-indigo-500/20 flex-1 md:flex-none"
            >
              {submitting ? 'Submitting PO...' : '🛍️ Create Purchase Order (Pending)'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
