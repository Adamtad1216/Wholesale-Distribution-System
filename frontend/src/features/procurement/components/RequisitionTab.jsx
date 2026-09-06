import React, { useState } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { procurementApi } from '../procurementApi';
import { toast } from 'react-hot-toast';

export default function RequisitionTab({
  selectedItems: propSelectedItems,
  setSelectedItems: propSetSelectedItems,
  products: propProducts,
  categories: propCategories,
  suppliers: propSuppliers,
  warehouses: propWarehouses,
  defaultSupplier: propDefaultSupplier,
  setDefaultSupplier: propSetDefaultSupplier,
  defaultWarehouse: propDefaultWarehouse,
  setDefaultWarehouse: propSetDefaultWarehouse,
  loading: propLoading,
  onPoCreated,
  onOpenCart,
}) {
  // Local fallback state if props aren't supplied
  const [localProducts] = useState([]);
  const [localCategories] = useState([]);
  const [localSuppliers] = useState([]);
  const [localWarehouses] = useState([]);
  const [localSelectedItems, setLocalSelectedItems] = useState({});
  const [localDefaultSupplier, setLocalDefaultSupplier] = useState('');
  const [localDefaultWarehouse, setLocalDefaultWarehouse] = useState('');

  const products = propProducts || localProducts;
  const categories = propCategories || localCategories;
  const suppliers = propSuppliers || localSuppliers;
  const warehouses = propWarehouses || localWarehouses;

  const selectedItems = propSelectedItems || localSelectedItems;
  const setSelectedItems = propSetSelectedItems || setLocalSelectedItems;

  const defaultSupplier = propDefaultSupplier !== undefined ? propDefaultSupplier : localDefaultSupplier;
  const setDefaultSupplier = propSetDefaultSupplier || setLocalDefaultSupplier;

  const defaultWarehouse = propDefaultWarehouse !== undefined ? propDefaultWarehouse : localDefaultWarehouse;
  const setDefaultWarehouse = propSetDefaultWarehouse || setLocalDefaultWarehouse;

  const loading = propLoading || false;

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);

  // ── Filtered Products ──────────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());

    const matchesCat =
      selectedCategory === 'ALL' ||
      p.category?.id === selectedCategory ||
      p.categoryId === selectedCategory;

    const currentQty =
      p.warehouseStocks?.[0]?.availableQuantity ??
      p.stockQuantity ??
      p.quantity ??
      0;
    const reorder = p.reorderPoint || 20;
    const matchesStock =
      stockFilter === 'ALL' ||
      (stockFilter === 'LOW' && currentQty > 0 && currentQty <= reorder) ||
      (stockFilter === 'OUT' && currentQty <= 0);

    return matchesSearch && matchesCat && matchesStock;
  });

  // ── Row helpers ────────────────────────────────────────────────────────────
  const handleToggleSelect = (id) => {
    setSelectedItems((prev) => {
      const existing = prev[id] || {};
      const prod = products.find((p) => p.id === id);
      const defaultCost = Number(
        prod?.costPrice ||
        prod?.warehouseSellingPrices?.[0]?.wholesalePrice ||
        prod?.wholesalePrice ||
        100
      );

      return {
        ...prev,
        [id]: {
          quantity: existing.quantity || 10,
          unitCost: existing.unitCost !== undefined ? existing.unitCost : defaultCost,
          selected: !existing.selected,
        },
      };
    });
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectedItems((prev) => {
      const updated = { ...prev };
      filteredProducts.forEach((p) => {
        const existing = updated[p.id] || {};
        const defaultCost = Number(
          p.costPrice ||
          p.warehouseSellingPrices?.[0]?.wholesalePrice ||
          p.wholesalePrice ||
          100
        );
        updated[p.id] = {
          quantity: existing.quantity || 10,
          unitCost: existing.unitCost !== undefined ? existing.unitCost : defaultCost,
          selected: checked,
        };
      });
      return updated;
    });
  };

  const handleItemChange = (id, field, value) =>
    setSelectedItems((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { selected: true, quantity: 10, unitCost: 0 }),
        [field]: value,
      },
    }));

  // ── Totals ─────────────────────────────────────────────────────────────────
  const selectedList = Object.entries(selectedItems).filter(([, item]) => item.selected);
  const totalItemsCount = selectedList.length;
  const totalOrderValue = selectedList.reduce(
    (acc, [, item]) => acc + Number(item.quantity || 0) * Number(item.unitCost || 0),
    0
  );

  // ── Create Purchase Order ─────────────────────────────────────────────────
  const handleCreatePurchaseOrder = async () => {
    if (selectedList.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    if (!defaultSupplier) {
      toast.error('Please select a Supplier Vendor');
      return;
    }
    if (!defaultWarehouse) {
      toast.error('Please select a Destination Warehouse');
      return;
    }

    try {
      setSubmitting(true);
      const itemsPayload = selectedList.map(([productId, item]) => ({
        productId,
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitCost || 0),
        discount: 0,
        tax: 0,
        total: Number(item.quantity || 1) * Number(item.unitCost || 0),
      }));

      await procurementApi.createPurchaseOrder({
        supplierId: defaultSupplier,
        warehouseId: defaultWarehouse,
        items: itemsPayload,
        subtotal: totalOrderValue,
        discount: 0,
        tax: 0,
        total: totalOrderValue,
      });

      toast.success('Purchase Order created — status: PENDING');

      // Clear selections
      const reset = { ...selectedItems };
      Object.keys(reset).forEach((k) => {
        reset[k].selected = false;
      });
      setSelectedItems(reset);

      if (onPoCreated) onPoCreated();
    } catch (err) {
      console.error('Failed to create purchase order:', err);
      toast.error(err.response?.data?.message || 'Failed to create Purchase Order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Search & Filter Toolbar ──────────────────────────────── */}
      <Card className="p-5 border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-3 text-muted-foreground text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-muted800 border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}
              className="px-3.5 py-2.5 border border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL" className="bg-[#0f172a] text-slate-100">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0f172a] text-slate-100">{c.name}</option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}
              className="px-3.5 py-2.5 border border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL" className="bg-[#0f172a] text-slate-100">All Stock Levels</option>
              <option value="LOW" className="bg-[#0f172a] text-slate-100">⚠️ Low Stock Only</option>
              <option value="OUT" className="bg-[#0f172a] text-slate-100">❌ Out of Stock Only</option>
            </select>
          </div>
        </div>

        {/* Global Supplier & Warehouse Assignment */}
        <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1.5">
              🏬 Target Supplier Vendor
            </label>
            <select
              value={defaultSupplier}
              onChange={(e) => setDefaultSupplier(e.target.value)}
              style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}
              className="w-full px-3.5 py-2 border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
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
            <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1.5">
              🏭 Receiving Destination Warehouse
            </label>
            <select
              value={defaultWarehouse}
              onChange={(e) => setDefaultWarehouse(e.target.value)}
              style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}
              className="w-full px-3.5 py-2 border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
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

      {/* ── Product Selection Table ───────────────────────────────── */}
      <Card className="border border-border bg-card900 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted800/80 border-b border-border text-muted-foreground uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4 text-center w-12">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      filteredProducts.length > 0 &&
                      filteredProducts.every((p) => selectedItems[p.id]?.selected)
                    }
                    className="rounded border-border text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Product Details</th>
                <th className="py-3.5 px-4 text-center">Current Stock</th>
                <th className="py-3.5 px-4 text-center w-36">Purchase Qty</th>
                <th className="py-3.5 px-4 text-center w-40">Est. Unit Cost (ETB)</th>
                <th className="py-3.5 px-4 text-right pr-6">Subtotal (ETB)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/50 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading product catalog...</p>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No products match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedItems[p.id]?.selected || false;
                  const itemData = selectedItems[p.id] || {
                    quantity: 10,
                    unitCost: Number(
                      p.costPrice ||
                      p.warehouseSellingPrices?.[0]?.wholesalePrice ||
                      p.wholesalePrice ||
                      100
                    ),
                  };
                  const subtotal = Number(itemData.quantity || 0) * Number(itemData.unitCost || 0);

                  const stockQty = p.warehouseStocks?.[0]?.availableQuantity ?? p.stockQuantity ?? 0;
                  const reorder = p.reorderPoint || 20;
                  const stockColor =
                    stockQty <= 0
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : stockQty <= reorder
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

                  return (
                    <tr
                      key={p.id}
                      className={`transition hover:bg-muted800/30 ${isSelected ? 'bg-indigo-600/10' : ''}`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(p.id)}
                          className="rounded border-border text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>SKU: {p.sku || 'N/A'}</span>
                          {p.category?.name && (
                            <span className="px-1.5 py-0.5 bg-slate-500/10 text-slate-400 rounded text-[10px] border border-slate-500/20">
                              {p.category.name}
                            </span>
                          )}
                          {p.unit?.abbreviation && (
                            <span className="px-1.5 py-0.5 bg-slate-500/10 text-slate-400 rounded text-[10px] border border-slate-500/20">
                              /{p.unit.abbreviation}
                            </span>
                          )}
                          {p.brand?.name && (
                            <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] border border-indigo-500/20">
                              {p.brand.name}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${stockColor}`}>
                          {stockQty} {p.unit?.abbreviation || 'Units'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min="1"
                          value={itemData.quantity}
                          onChange={(e) =>
                            handleItemChange(p.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="w-24 px-2.5 py-1.5 bg-muted800 border border-border rounded-lg text-center font-bold text-foreground focus:outline-none focus:border-indigo-500"
                        />
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={itemData.unitCost}
                          onChange={(e) =>
                            handleItemChange(p.id, 'unitCost', parseFloat(e.target.value) || 0)
                          }
                          className="w-28 px-2.5 py-1.5 bg-muted800 border border-border rounded-lg text-center font-mono font-bold text-foreground focus:outline-none focus:border-indigo-500"
                        />
                      </td>

                      <td className="py-3.5 px-4 text-right pr-6 font-mono font-bold text-foreground">
                        {subtotal.toLocaleString()} ETB
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Selection Summary Footer */}
        <div className="p-4 bg-muted800/80 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-muted-foreground uppercase font-bold">Selected:</span>{' '}
              <span className="text-sm font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                {totalItemsCount} Products
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase font-bold">Est. Total:</span>{' '}
              <span className="text-sm font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                {totalOrderValue.toLocaleString()} ETB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onOpenCart && totalItemsCount > 0 && (
              <Button variant="secondary" size="md" onClick={onOpenCart}>
                🛒 Review in PO Cart ({totalItemsCount})
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              disabled={submitting || totalItemsCount === 0}
              onClick={handleCreatePurchaseOrder}
              className="px-6 shadow-lg shadow-indigo-500/20"
            >
              {submitting ? 'Creating Purchase Order...' : '🛍️ Quick Generate PO (Pending)'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
