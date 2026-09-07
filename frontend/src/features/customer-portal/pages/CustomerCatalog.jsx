import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Filter, ShoppingBag, ArrowRight, Check, Package, Sparkles, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

export default function CustomerCatalog() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('wholesale_catalog_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch warehouses for warehouse selector
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/warehouses', { params: { limit: 50, status: 'ACTIVE' } });
      const list = res.data?.data || res.data || [];
      return Array.isArray(list) ? list : [];
    },
  });

  // Set default warehouse if none selected
  React.useEffect(() => {
    if (!selectedWarehouse && warehousesData && warehousesData.length > 0) {
      setSelectedWarehouse(warehousesData[0].id);
    }
  }, [warehousesData, selectedWarehouse]);

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['catalogProducts', selectedWarehouse],
    queryFn: async () => {
      const params = { limit: 200, status: 'ACTIVE' };
      if (selectedWarehouse) params.warehouseId = selectedWarehouse;
      const res = await api.get('/catalog/products', { params });
      const list = res.data?.data || res.data || [];
      return Array.isArray(list) ? list : [];
    },
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['catalogCategories'],
    queryFn: async () => {
      const res = await api.get('/catalog/categories', { params: { limit: 100 } });
      const list = res.data?.data || res.data || [];
      return Array.isArray(list) ? list : [];
    },
  });

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    if (!productsData) return [];
    return productsData.filter((product) => {
      const matchesCategory =
        selectedCategory === 'ALL' ||
        product.categoryId === selectedCategory ||
        product.category?.name === selectedCategory;

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        product.name?.toLowerCase().includes(q) ||
        product.sku?.toLowerCase().includes(q) ||
        product.brand?.name?.toLowerCase().includes(q) ||
        product.category?.name?.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [productsData, selectedCategory, search]);

  const updateCartItem = (product, delta) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      let updated;
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          updated = prev.filter((item) => item.productId !== product.id);
        } else {
          updated = prev.map((item) =>
            item.productId === product.id ? { ...item, quantity: newQty } : item
          );
        }
      } else if (delta > 0) {
        updated = [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            unit: product.unit?.name || 'Pcs',
            unitPrice: product.basePrice || product.productPrices?.[0]?.price || 0,
            quantity: delta,
          },
        ];
      } else {
        updated = prev;
      }
      try {
        localStorage.setItem('wholesale_catalog_cart', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const getProductCartQty = (productId) => {
    const item = cart.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleProceedToQuotation = () => {
    if (cart.length === 0) {
      toast.error('Please select at least one item');
      return;
    }
    // Navigate to new sales order with pre-filled items and warehouse
    navigate('/sales-orders/new', {
      state: {
        prefilledItems: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
        prefilledWarehouseId: selectedWarehouse,
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              B2B Wholesale Catalog
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Wholesale Products Showroom
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Explore wholesale inventory across distribution hubs. Select products and quantities to generate instant price quotations with tiered commercial discounts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {warehousesData && warehousesData.length > 0 && (
              <div className="flex items-center gap-2 bg-background border border-border px-3 py-2 rounded-xl text-xs font-medium text-foreground shadow-sm">
                <span className="text-muted-foreground">Fulfillment Hub:</span>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer"
                >
                  {warehousesData.map((w) => (
                    <option key={w.id} value={w.id} className="bg-card text-foreground">
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search wholesale products by name, SKU, brand..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition"
            >
              Clear Search
            </button>
          )}
        </div>

        {/* Category Chips */}
        {categoriesData && categoriesData.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === 'ALL'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              All Categories
            </button>
            {categoriesData.map((cat) => {
              const isActive = selectedCategory === cat.id || selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Grid */}
      {productsLoading ? (
        <div className="py-24 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm">Loading wholesale catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-4">
          <Package className="w-12 h-12 text-muted-foreground/50" />
          <div>
            <h3 className="text-base font-bold text-foreground">No products found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search keywords or switching product categories.
            </p>
          </div>
          {(search || selectedCategory !== 'ALL') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch('');
                setSelectedCategory('ALL');
              }}
            >
              Reset Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const inCartQty = getProductCartQty(product.id);
            const price = product.basePrice || product.productPrices?.[0]?.price || 0;
            const unitName = product.unit?.name || 'Pcs';

            return (
              <div
                key={product.id}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200"
              >
                <div>
                  {/* Image / Thumbnail placeholder */}
                  <div className="relative aspect-video rounded-xl bg-secondary flex items-center justify-center overflow-hidden mb-4 border border-border/60">
                    <Package className="w-10 h-10 text-muted-foreground/60 group-hover:scale-110 transition-transform duration-300" />
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      In Stock
                    </span>
                  </div>

                  {/* Brand & Category */}
                  <div className="flex items-center gap-2 mb-1.5">
                    {product.category?.name && (
                      <span className="text-[11px] font-medium text-muted-foreground truncate">
                        {product.category.name}
                      </span>
                    )}
                    {product.brand?.name && (
                      <>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="text-[11px] font-medium text-muted-foreground truncate">
                          {product.brand.name}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Name & SKU */}
                  <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-[11px] font-mono text-muted-foreground mb-3">
                    SKU: {product.sku || 'N/A'}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/80">
                  {/* Price & Unit */}
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Unit Wholesale:</span>
                      <div className="text-base font-extrabold text-foreground font-mono">
                        {Number(price).toLocaleString('en', { minimumFractionDigits: 2 })} ETB
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-secondary text-[11px] font-medium text-secondary-foreground border border-border">
                      {unitName}
                    </span>
                  </div>

                  {/* Add to Order Controls */}
                  {inCartQty > 0 ? (
                    <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-xl p-1">
                      <button
                        onClick={() => updateCartItem(product, -1)}
                        className="w-8 h-8 rounded-lg bg-card hover:bg-secondary text-foreground font-bold text-sm flex items-center justify-center transition border border-border"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-primary font-mono">
                        {inCartQty} in order
                      </span>
                      <button
                        onClick={() => updateCartItem(product, 1)}
                        className="w-8 h-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm flex items-center justify-center transition"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateCartItem(product, 1)}
                      className="w-full text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      + Add to Order
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Checkout / Order Bar when items in cart */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-6 right-6 left-6 md:left-72 z-30 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="max-w-4xl mx-auto rounded-2xl bg-card border-2 border-primary/40 shadow-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {totalCartItems} {totalCartItems === 1 ? 'item' : 'items'} selected
                </p>
                <p className="text-xs text-muted-foreground">
                  Ready to calculate VAT, discounts, and place sales order
                </p>
              </div>
            </div>

            <Button
              onClick={handleProceedToQuotation}
              className="font-bold text-xs flex items-center gap-2 whitespace-nowrap shadow-md"
            >
              Create Sales Order
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
