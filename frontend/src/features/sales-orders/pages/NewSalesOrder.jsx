import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { salesOrdersApi } from '../salesOrdersApi';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import api from '../../../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ShoppingCart,
  Search,
  MapPin,
  Package,
  Minus,
  Plus,
  Trash2,
  Eye,
  Tag,
  Box,
  FileText,
  Calendar,
  Warehouse,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowRight,
  Receipt,
  Sparkles,
  Star,
  X,
  Users,
  User,
  UserPlus,
  UserCheck,
  Building2,
  Building,
  Mail,
  Phone,
  Truck,
  Map as MapIcon,
  Layers,
} from 'lucide-react';

import ProductImage from '../../../components/sales-orders/ProductImage';
import StockBadge from '../../../components/sales-orders/StockBadge';
import ProductCard from '../../../components/sales-orders/ProductCard';
import CartItemRow from '../../../components/sales-orders/CartItemRow';
import ProductDetailModal from '../../../components/sales-orders/ProductDetailModal';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapRecenter({ center, zoom = 15 }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

function MapClickHandler({ onSelect }) {
  const map = useMap();
  useEffect(() => {
    const handler = (e) => onSelect(e.latlng.lat, e.latlng.lng);
    map.on('click', handler);
    return () => map.off('click', handler);
  }, [map, onSelect]);
  return null;
}

function QuotationPreview({
  preview,
  productsData,
  onSubmitOrder,
  isSubmitting = false,
  onUpdatePreview,
  isUpdating = false,
}) {
  if (!preview) return null;

  const getProduct = (productId) => productsData?.find((p) => p.id === productId);

  return (
    <Card id="quotation-preview" className="scroll-mt-6 overflow-hidden border border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Quotation Preview</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                <Sparkles className="w-3 h-3" />
                Calculated
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Official prices with price tiers, volume discounts, and taxes calculated
            </p>
          </div>
        </div>

        {preview.priceTier && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-muted/70 border border-border text-xs self-start sm:self-auto">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500/20 shrink-0" />
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">Price Tier</span>
              <span className="font-bold text-foreground">
                {preview.priceTier.name || 'Tier Pricing'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-background/50">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-muted/60 border-b border-border text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-3 text-right">Qty</th>
              <th className="py-3 px-3 text-right">Unit Price</th>
              <th className="py-3 px-3 text-right">Discount</th>
              <th className="py-3 px-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-sm">
            {preview.items?.length > 0 ? (
              preview.items.map((item, idx) => {
                const product = getProduct(item.productId);
                const unitAbbr = product?.unit?.abbreviation || product?.unit?.name || '';
                return (
                  <tr
                    key={idx}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-border/60">
                          {product ? (
                            <ProductImage product={product} size="sm" className="!w-10 !h-10" />
                          ) : (
                            <div className="w-10 h-10 bg-muted flex items-center justify-center">
                              <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">
                            {item.productName || product?.name || 'Product'}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {item.sku || product?.sku || 'SKU'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-foreground">
                      {item.quantity}
                      {unitAbbr && <span className="text-xs text-muted-foreground ml-1 font-normal">{unitAbbr}</span>}
                    </td>
                    <td className="py-3 px-3 text-right text-muted-foreground">
                      {Number(item.unitPrice || 0).toLocaleString('en', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {Number(item.discount || 0) > 0 ? (
                        <span className="font-medium text-rose-500 inline-flex items-center gap-1 justify-end">
                          <Tag className="w-3 h-3" />
                          -{Number(item.discount).toLocaleString('en', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-foreground">
                      {Number(item.finalAmount ?? item.total ?? item.subtotal ?? 0).toLocaleString('en', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                  No items in preview
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Quota Warnings (if any) */}
      {preview.quotaWarnings?.length > 0 && (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
          {preview.quotaWarnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{w.message || 'Quota limit may be affected'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Summary Totals & Final Submission Actions */}
      <div className="mt-6 pt-5 border-t border-border/70 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1.5 text-xs text-muted-foreground max-w-md">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Quotation verified and ready for submission</span>
          </div>
          <p>
            Please review the calculated discounts, taxes, and final payable amount. Once submitted, your order will be placed immediately.
          </p>
        </div>

        <div className="w-full lg:w-96 space-y-2.5">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span className="text-foreground font-semibold">
              {Number(preview.subtotal || 0).toLocaleString('en', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {Number(preview.discount || 0) > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 text-rose-500 font-medium">
                <Tag className="w-3.5 h-3.5" />
                Total Discount
              </span>
              <span className="text-rose-500 font-bold">
                -{Number(preview.discount).toLocaleString('en', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Estimated Tax</span>
            <span className="text-foreground font-semibold">
              {Number(preview.tax || 0).toLocaleString('en', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Grand Total Row */}
          <div className="pt-2 border-t border-border/80 flex items-baseline justify-between">
            <span className="text-sm font-bold text-foreground">Grand Total</span>
            <span className="text-2xl font-black text-primary tracking-tight">
              {Number(preview.total || 0).toLocaleString('en', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Action Buttons in Quotation Card */}
          <div className="pt-3 flex items-center gap-3">
            {onUpdatePreview && (
              <Button
                type="button"
                variant="outline"
                onClick={onUpdatePreview}
                loading={isUpdating}
                disabled={isSubmitting || isUpdating}
                icon={<Eye className="w-4 h-4" />}
                className="flex-1"
              >
                Refresh
              </Button>
            )}
            {onSubmitOrder && (
              <Button
                type="button"
                variant="default"
                onClick={onSubmitOrder}
                loading={isSubmitting}
                disabled={isSubmitting || isUpdating}
                icon={<ArrowRight className="w-4 h-4" />}
                className="flex-1"
              >
                Submit Order
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function NewSalesOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, role, customer } = useSelector((state) => state.auth);
  const isCustomer = role === 'CUSTOMER' || !!customer;
  const isSalesRepOrStaff = !isCustomer;

  // Customer selection/creation state (for sales reps / staff)
  const [customerMode, setCustomerMode] = useState('EXISTING'); // 'EXISTING' | 'NEW'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const customerDebounceRef = useRef(null);
  const customerSearchContainerRef = useRef(null);

  // Inline new customer form state
  const [newCustomerType, setNewCustomerType] = useState('PERSON'); // 'PERSON' | 'ORGANIZATION'
  const [newPerson, setNewPerson] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
  });
  const [newOrg, setNewOrg] = useState({
    name: '',
    registrationNumber: '',
    taxNumber: '',
    phone: '',
    email: '',
    address: '',
    contactFirstName: '',
    contactMiddleName: '',
    contactLastName: '',
    contactPhone: '',
    contactEmail: '',
  });

  const [warehouseId, setWarehouseId] = useState('');
  const [items, setItems] = useState([]);
  const [requiredDate, setRequiredDate] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState('DELIVERY'); // 'DELIVERY' | 'SELF_PICKUP'
  const [pickupPersonName, setPickupPersonName] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [pickupVehiclePlate, setPickupVehiclePlate] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [deliveryLat, setDeliveryLat] = useState('');
  const [deliveryLng, setDeliveryLng] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [preview, setPreview] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([9.02, 38.75]);
  const [mapLayer, setMapLayer] = useState('street'); // 'street' | 'satellite'
  const searchDebounceRef = useRef(null);
  const searchContainerRef = useRef(null);

  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Debounced customer lookup
  const handleCustomerSearch = (query = '') => {
    setCustomerSearchInput(query);
    if (customerDebounceRef.current) clearTimeout(customerDebounceRef.current);
    customerDebounceRef.current = setTimeout(async () => {
      setCustomerSearchLoading(true);
      try {
        const res = await salesOrdersApi.searchCustomers({
          search: query?.trim() ? query.trim() : undefined,
          limit: 10,
        });
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.items)
          ? res.data.items
          : Array.isArray(res)
          ? res
          : [];
        setCustomerSearchResults(list);
      } catch (err) {
        console.error('Customer search error:', err);
        setCustomerSearchResults([]);
      } finally {
        setCustomerSearchLoading(false);
      }
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (customerDebounceRef.current) clearTimeout(customerDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClickOutsideCustomer(event) {
      if (
        customerSearchContainerRef.current &&
        !customerSearchContainerRef.current.contains(event.target)
      ) {
        setCustomerSearchResults([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutsideCustomer);
    return () => document.removeEventListener('mousedown', handleClickOutsideCustomer);
  }, []);

  const getCustomerDisplayName = (c) => {
    if (!c) return '';
    if (c.customerType === 'PERSON' && c.person) {
      return [c.person.firstName, c.person.middleName, c.person.lastName].filter(Boolean).join(' ');
    }
    if (c.customerType === 'ORGANIZATION' && c.organization) {
      return c.organization.name;
    }
    return c.customerCode || 'Customer';
  };

  const getCustomerPhone = (c) => {
    if (!c) return '';
    if (c.customerType === 'PERSON' && c.person) return c.person.phone || '';
    if (c.customerType === 'ORGANIZATION' && c.organization) return c.organization.phone || '';
    return '';
  };

  const getCustomerEmail = (c) => {
    if (!c) return '';
    if (c.customerType === 'PERSON' && c.person) return c.person.email || '';
    if (c.customerType === 'ORGANIZATION' && c.organization) return c.organization.email || '';
    return '';
  };

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/warehouses', { params: { limit: 100, status: 'ACTIVE' } });
      const list = res.data?.data || res.data || [];
      return Array.isArray(list) ? list : [];
    },
  });

  // Auto-select first active warehouse by default if not set
  useEffect(() => {
    if (!warehouseId && warehousesData && warehousesData.length > 0) {
      setWarehouseId(warehousesData[0].id);
    }
  }, [warehousesData, warehouseId]);

  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ['products', warehouseId],
    queryFn: async () => {
      const params = { limit: 200, status: 'ACTIVE' };
      if (warehouseId) params.warehouseId = warehouseId;
      const res = await api.get('/catalog/products', { params });
      console.log('[Products API] raw response:', res);
      return res.data?.data || res.data || [];
    },
    enabled: !!warehouseId,
  });

  if (productsError) {
    console.error('[Products API] error:', productsError);
  }

  const filteredProducts = useMemo(() => {
    if (!productsData) return [];
    if (!productSearch) return productsData;
    const q = productSearch.toLowerCase();
    return productsData.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.brand?.name?.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q),
    );
  }, [productsData, productSearch]);

  const previewMutation = useMutation({
    mutationFn: salesOrdersApi.preview,
    onSuccess: (res) => {
      setPreview(res?.data || res);
      toast.success('Quotation preview updated');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to preview quotation');
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) =>
      isSalesRepOrStaff
        ? salesOrdersApi.createSalesRepOrder(payload)
        : salesOrdersApi.create(payload),
    onSuccess: (res) => {
      const order = res?.data || res;
      toast.success(`Sales order ${order.orderNumber || ''} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
      setPreview(null);
      setItems([]);
      setWarehouseId('');
      setRequiredDate('');
      setFulfillmentType('DELIVERY');
      setPickupPersonName('');
      setPickupPhone('');
      setPickupVehiclePlate('');
      setPickupNotes('');
      setDeliveryLat('');
      setDeliveryLng('');
      setDeliveryAddress('');
      setSearchQuery('');
      setSearchResults([]);
      setMapCenter([9.02, 38.75]);
      setSelectedCustomer(null);
      setCustomerSearchInput('');
      setNewPerson({ firstName: '', middleName: '', lastName: '', phone: '', email: '', address: '' });
      setNewOrg({
        name: '',
        registrationNumber: '',
        taxNumber: '',
        phone: '',
        email: '',
        address: '',
        contactFirstName: '',
        contactMiddleName: '',
        contactLastName: '',
        contactPhone: '',
        contactEmail: '',
      });
      if (order?.id) {
        navigate(`/sales-orders/${order.id}`);
      } else {
        navigate('/sales-orders');
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create sales order');
    },
  });

  const getCartQty = (productId) => {
    const found = items.find((i) => i.productId === productId);
    return found ? found.quantity : 0;
  };

  const addToCart = (product, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: qty };
        return updated;
      }
      return [...prev, { productId: product.id, quantity: qty }];
    });
    setPreview(null);
  };

  const quickAddToCart = (product) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...prev, { productId: product.id, quantity: 1 }];
    });
    setPreview(null);
  };

  const updateCartQty = (productId, qty) => {
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)));
    setPreview(null);
  };

  const removeFromCart = (productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    setPreview(null);
  };

  const handleMapSelect = (lat, lng) => {
    setDeliveryLat(String(lat));
    setDeliveryLng(String(lng));
    setDeliveryAddress('');
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
          { headers: { 'Accept-Language': 'en' } },
        );
        const data = await res.json();
        setSearchResults(data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const selectSearchResult = (result) => {
    const lat = Number(result.lat);
    const lon = Number(result.lon);
    setDeliveryLat(String(lat));
    setDeliveryLng(String(lon));
    setDeliveryAddress(result.display_name);
    setSearchQuery(result.display_name);
    setSearchResults([]);
    setMapCenter([lat, lon]);
  };

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchResults([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePreview = (e) => {
    e.preventDefault();
    if (!warehouseId) {
      toast.error('Please select a warehouse first');
      return;
    }
    const filteredItems = items
      .filter((item) => item.productId && item.quantity > 0)
      .map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
      }));

    if (filteredItems.length === 0) {
      toast.error('Add at least one product');
      return;
    }

    if (isSalesRepOrStaff) {
      if (customerMode === 'EXISTING' && !selectedCustomer) {
        toast.error('Please select an existing customer');
        return;
      }
      if (customerMode === 'NEW') {
        if (newCustomerType === 'PERSON') {
          if (!newPerson.firstName.trim() || !newPerson.lastName.trim()) {
            toast.error('Please enter customer first and last name');
            return;
          }
        } else {
          if (!newOrg.name.trim()) {
            toast.error('Please enter company / organization name');
            return;
          }
        }
      }
    }

    const payload = {
      warehouseId,
      items: filteredItems,
    };

    if (isSalesRepOrStaff && customerMode === 'EXISTING' && selectedCustomer?.id) {
      payload.customerId = selectedCustomer.id;
    }

    previewMutation.mutate(payload);
  };

  useEffect(() => {
    if (preview) {
      setTimeout(() => {
        const el = document.getElementById('quotation-preview');
        if (el) {
          const mainContainer = el.closest('main');
          if (mainContainer) {
            const elRect = el.getBoundingClientRect();
            const containerRect = mainContainer.getBoundingClientRect();
            const targetScrollTop = mainContainer.scrollTop + (elRect.top - containerRect.top) - 24;
            mainContainer.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: 'smooth',
            });
          }
        }
      }, 100);
    }
  }, [preview]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!preview) {
      toast.error('Please preview the quotation first');
      return;
    }
    const baseItems = preview.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    if (baseItems.length === 0) {
      toast.error('No items to submit');
      return;
    }

    const payload = {
      warehouseId,
      requiredDate: requiredDate || undefined,
      fulfillmentType,
      pickupPersonName: fulfillmentType === 'SELF_PICKUP' && pickupPersonName?.trim() ? pickupPersonName.trim() : undefined,
      pickupPhone: fulfillmentType === 'SELF_PICKUP' && pickupPhone?.trim() ? pickupPhone.trim() : undefined,
      pickupVehiclePlate: fulfillmentType === 'SELF_PICKUP' && pickupVehiclePlate?.trim() ? pickupVehiclePlate.trim() : undefined,
      pickupNotes: fulfillmentType === 'SELF_PICKUP' && pickupNotes?.trim() ? pickupNotes.trim() : undefined,
      deliveryLocation:
        fulfillmentType === 'DELIVERY' && (deliveryLat || deliveryLng)
          ? {
              latitude: Number(deliveryLat) || 0,
              longitude: Number(deliveryLng) || 0,
              addressText: deliveryAddress || undefined,
            }
          : undefined,
      items: baseItems,
    };

    if (isSalesRepOrStaff) {
      if (customerMode === 'EXISTING') {
        if (!selectedCustomer) {
          toast.error('Please select an existing customer');
          return;
        }
        payload.customerId = selectedCustomer.id;
      } else {
        if (newCustomerType === 'PERSON') {
          if (!newPerson.firstName.trim() || !newPerson.lastName.trim()) {
            toast.error('First name and last name are required for new customer');
            return;
          }
          payload.newCustomer = {
            customerType: 'PERSON',
            person: {
              firstName: newPerson.firstName.trim(),
              middleName: newPerson.middleName?.trim() || undefined,
              lastName: newPerson.lastName.trim(),
              phone: newPerson.phone?.trim() || undefined,
              email: newPerson.email?.trim() || undefined,
              address: newPerson.address?.trim() || undefined,
            },
          };
        } else {
          if (!newOrg.name.trim()) {
            toast.error('Organization name is required');
            return;
          }
          const contacts =
            newOrg.contactFirstName?.trim() && newOrg.contactLastName?.trim()
              ? [
                  {
                    firstName: newOrg.contactFirstName.trim(),
                    middleName: newOrg.contactMiddleName?.trim() || undefined,
                    lastName: newOrg.contactLastName.trim(),
                    phone: newOrg.contactPhone?.trim() || undefined,
                    email: newOrg.contactEmail?.trim() || undefined,
                    isPrimary: true,
                  },
                ]
              : undefined;

          payload.newCustomer = {
            customerType: 'ORGANIZATION',
            organization: {
              name: newOrg.name.trim(),
              registrationNumber: newOrg.registrationNumber?.trim() || undefined,
              taxNumber: newOrg.taxNumber?.trim() || undefined,
              phone: newOrg.phone?.trim() || undefined,
              email: newOrg.email?.trim() || undefined,
              address: newOrg.address?.trim() || undefined,
              contacts,
            },
          };
        }
      }
    }

    createMutation.mutate(payload);
  };

  const isLoading = previewMutation.isPending || createMutation.isPending;
  const markerPosition =
    deliveryLat && deliveryLng ? [Number(deliveryLat), Number(deliveryLng)] : null;

  const cartItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">New Sales Order</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-[52px]">
            {isSalesRepOrStaff
              ? 'Select or register a customer, choose products, set delivery location, and submit order.'
              : 'Select products, set delivery location, and preview your quotation.'}
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
            <ShoppingCart className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {items.length} item{items.length > 1 ? 's' : ''} · {cartItemCount} units
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Customer Information (for Sales Representatives & Admin staff) */}
        {isSalesRepOrStaff && (
          <Card className="relative z-30 overflow-visible">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/12 border border-indigo-500/25 flex items-center justify-center shadow-md shadow-indigo-500/10">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Customer Information</h2>
                  <p className="text-xs text-muted-foreground">
                    Assign this sales order to an existing customer or register a new customer
                  </p>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center p-1 bg-muted/80 border border-border rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode('EXISTING');
                    setPreview(null);
                    handleCustomerSearch('');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    customerMode === 'EXISTING'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Existing Customer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode('NEW');
                    setPreview(null);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    customerMode === 'NEW'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  New Customer
                </button>
              </div>
            </div>

            {customerMode === 'EXISTING' ? (
              <div>
                {selectedCustomer ? (
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-inner">
                        {selectedCustomer.customerType === 'ORGANIZATION' ? (
                          <Building2 className="w-6 h-6" />
                        ) : (
                          <User className="w-6 h-6" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold text-foreground">
                            {getCustomerDisplayName(selectedCustomer)}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/15 text-primary border border-primary/25 font-mono">
                            {selectedCustomer.customerCode}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                            {selectedCustomer.customerType}
                          </span>
                          {selectedCustomer.paymentTerms && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {selectedCustomer.paymentTerms.name}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {getCustomerPhone(selectedCustomer) && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-primary" />
                              {getCustomerPhone(selectedCustomer)}
                            </span>
                          )}
                          {getCustomerEmail(selectedCustomer) && (
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-primary" />
                              {getCustomerEmail(selectedCustomer)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setPreview(null);
                        handleCustomerSearch('');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground transition-colors self-start sm:self-center"
                    >
                      Change Customer
                    </button>
                  </div>
                ) : (
                  <div className="relative max-w-xl z-50" ref={customerSearchContainerRef}>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Search & Select Customer <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={customerSearchInput}
                        onFocus={() => {
                          handleCustomerSearch(customerSearchInput);
                        }}
                        onChange={(e) => handleCustomerSearch(e.target.value)}
                        placeholder="Search by customer name, code, phone, or email..."
                        className="w-full bg-muted border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                      />
                      {customerSearchLoading && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      )}
                      {customerSearchInput && !customerSearchLoading && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerSearchInput('');
                            setCustomerSearchResults([]);
                          }}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Results Dropdown */}
                    {customerSearchResults.length > 0 && (
                      <div
                        className="absolute top-full left-0 right-0 z-[99999] mt-2 w-full bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
                        style={{ backgroundColor: 'var(--color-card, #ffffff)' }}
                      >
                        <div
                          className="px-4 py-2.5 bg-muted border-b border-border text-[11px] text-muted-foreground font-semibold flex items-center justify-between"
                          style={{ backgroundColor: 'var(--color-background, #f1f5f9)' }}
                        >
                          <span>Customers Found ({customerSearchResults.length})</span>
                          <span>Click to select</span>
                        </div>
                        <div
                          className="max-h-64 overflow-y-auto divide-y divide-border"
                          style={{ backgroundColor: 'var(--color-card, #ffffff)' }}
                        >
                          {customerSearchResults.map((cust) => (
                            <button
                              key={cust.id}
                              type="button"
                              onClick={() => {
                                setSelectedCustomer(cust);
                                setCustomerSearchResults([]);
                                setCustomerSearchInput('');
                                setPreview(null);
                              }}
                              className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 text-xs text-foreground bg-card hover:bg-muted/70 transition-colors group"
                              style={{ backgroundColor: 'var(--color-card, #ffffff)' }}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/25 transition-colors text-primary">
                                  {cust.customerType === 'ORGANIZATION' ? (
                                    <Building2 className="w-4 h-4" />
                                  ) : (
                                    <User className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground text-xs group-hover:text-primary transition-colors truncate">
                                      {getCustomerDisplayName(cust)}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                                      {cust.customerCode}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                                    {getCustomerPhone(cust) || getCustomerEmail(cust) || 'No contact provided'}
                                  </div>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
                                Select
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {customerSearchInput.trim().length >= 1 && !customerSearchLoading && customerSearchResults.length === 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        No customer found matching "{customerSearchInput}". You can click "New Customer" above to register them directly.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Inline New Customer Form */
              <div className="space-y-6">
                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2">
                    Customer Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                    <button
                      type="button"
                      onClick={() => setNewCustomerType('PERSON')}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        newCustomerType === 'PERSON'
                          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                          : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        newCustomerType === 'PERSON' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Individual / Person</div>
                        <div className="text-[11px] text-muted-foreground">Retail buyer or individual</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewCustomerType('ORGANIZATION')}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        newCustomerType === 'ORGANIZATION'
                          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                          : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        newCustomerType === 'ORGANIZATION' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Company / Organization</div>
                        <div className="text-[11px] text-muted-foreground">Business or wholesale entity</div>
                      </div>
                    </button>
                  </div>
                </div>

                {newCustomerType === 'PERSON' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">
                        First Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={newPerson.firstName}
                        onChange={(e) => setNewPerson({ ...newPerson, firstName: e.target.value })}
                        placeholder="e.g. Abebe"
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        value={newPerson.middleName}
                        onChange={(e) => setNewPerson({ ...newPerson, middleName: e.target.value })}
                        placeholder="e.g. Kebede"
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">
                        Last Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={newPerson.lastName}
                        onChange={(e) => setNewPerson({ ...newPerson, lastName: e.target.value })}
                        placeholder="e.g. Tadesse"
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={newPerson.phone}
                        onChange={(e) => setNewPerson({ ...newPerson, phone: e.target.value })}
                        placeholder="e.g. +251 911 000000"
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={newPerson.email}
                        onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
                        placeholder="e.g. customer@example.com"
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">
                        Billing / Contact Address
                      </label>
                      <input
                        type="text"
                        value={newPerson.address}
                        onChange={(e) => setNewPerson({ ...newPerson, address: e.target.value })}
                        placeholder="e.g. Bole Subcity, Woreda 03"
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                          Company / Organization Name <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={newOrg.name}
                          onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                          placeholder="e.g. Acme Wholesale Ltd."
                          className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                          Registration Number
                        </label>
                        <input
                          type="text"
                          value={newOrg.registrationNumber}
                          onChange={(e) => setNewOrg({ ...newOrg, registrationNumber: e.target.value })}
                          placeholder="e.g. REG-12345"
                          className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                          Tax Identification Number (TIN)
                        </label>
                        <input
                          type="text"
                          value={newOrg.taxNumber}
                          onChange={(e) => setNewOrg({ ...newOrg, taxNumber: e.target.value })}
                          placeholder="e.g. TIN-987654"
                          className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                          Organization Phone
                        </label>
                        <input
                          type="tel"
                          value={newOrg.phone}
                          onChange={(e) => setNewOrg({ ...newOrg, phone: e.target.value })}
                          placeholder="e.g. +251 116 000000"
                          className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                          Organization Email
                        </label>
                        <input
                          type="email"
                          value={newOrg.email}
                          onChange={(e) => setNewOrg({ ...newOrg, email: e.target.value })}
                          placeholder="e.g. info@acme.com"
                          className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                          Headquarters Address
                        </label>
                        <input
                          type="text"
                          value={newOrg.address}
                          onChange={(e) => setNewOrg({ ...newOrg, address: e.target.value })}
                          placeholder="e.g. Kirkos, Addis Ababa"
                          className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>

                    {/* Primary Contact Person within Organization */}
                    <div className="pt-3 border-t border-border/70">
                      <div className="text-xs font-semibold text-foreground mb-2">
                        Primary Contact Person (Optional)
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={newOrg.contactFirstName}
                          onChange={(e) => setNewOrg({ ...newOrg, contactFirstName: e.target.value })}
                          placeholder="Contact First Name"
                          className="bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <input
                          type="text"
                          value={newOrg.contactLastName}
                          onChange={(e) => setNewOrg({ ...newOrg, contactLastName: e.target.value })}
                          placeholder="Contact Last Name"
                          className="bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <input
                          type="tel"
                          value={newOrg.contactPhone}
                          onChange={(e) => setNewOrg({ ...newOrg, contactPhone: e.target.value })}
                          placeholder="Contact Direct Phone"
                          className="bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Inline Customer Notice */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                  <span>
                    A customer record with an auto-generated customer code will be created immediately upon order submission. No login credentials will be generated for this customer.
                  </span>
                </div>
              </div>
            )}
          </Card>
        )}
        <Card className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/12 border border-cyan-500/20 flex items-center justify-center">
              <Warehouse className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Warehouse & Fulfillment</h2>
              <p className="text-xs text-muted-foreground">Select warehouse and choose fulfillment method</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Warehouse <span className="text-rose-400">*</span>
              </label>
              <select
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  setItems([]);
                  setPreview(null);
                }}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                required
              >
                <option value="">Select warehouse</option>
                {warehousesData?.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.branch?.name || wh.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />
                Required Date
              </label>
              <input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Fulfillment Method Selector */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-foreground mb-2">
              Fulfillment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              <button
                type="button"
                onClick={() => setFulfillmentType('DELIVERY')}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  fulfillmentType === 'DELIVERY'
                    ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                    : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    fulfillmentType === 'DELIVERY'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Standard Delivery</div>
                  <div className="text-[11px] text-muted-foreground">Fleet dispatch to pinned address</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFulfillmentType('SELF_PICKUP');
                  setDeliveryLat('');
                  setDeliveryLng('');
                  setDeliveryAddress('');
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  fulfillmentType === 'SELF_PICKUP'
                    ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                    : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    fulfillmentType === 'SELF_PICKUP'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Warehouse className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Self-Pickup at Warehouse</div>
                  <div className="text-[11px] text-muted-foreground">Direct collection from warehouse dock</div>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional: Self-Pickup details */}
          {fulfillmentType === 'SELF_PICKUP' && (
            <div className="space-y-4 pt-1">
              <div className="border border-border/70 rounded-xl p-4 bg-muted/20 space-y-4">
                <div className="text-xs font-semibold text-foreground">
                  Pickup & Collector Information (Optional)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Authorized Collector Name
                    </label>
                    <input
                      type="text"
                      value={pickupPersonName}
                      onChange={(e) => setPickupPersonName(e.target.value)}
                      placeholder="e.g. Dawit Haile"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Collector Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={pickupPhone}
                      onChange={(e) => setPickupPhone(e.target.value)}
                      placeholder="e.g. +251 911 000000"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Vehicle Plate Number
                    </label>
                    <input
                      type="text"
                      value={pickupVehiclePlate}
                      onChange={(e) => setPickupVehiclePlate(e.target.value)}
                      placeholder="e.g. 3-B12345 AA"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Pickup Instructions / Remarks
                  </label>
                  <input
                    type="text"
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                    placeholder="e.g. Bringing light truck for collection around 2:00 PM"
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Conditional: Standard Delivery Map */}
          {fulfillmentType === 'DELIVERY' && (
            <>

          <div className="mb-4" ref={searchContainerRef}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-foreground">
                <MapPin className="w-3.5 h-3.5 inline mr-1 text-primary" />
                Search Delivery Location
              </label>
              {deliveryAddress && (
                <span className="text-[11px] text-emerald-400 font-medium truncate max-w-xs">
                  Pinned: {deliveryAddress}
                </span>
              )}
            </div>

            <div className="relative max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl pl-9 pr-14 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                  placeholder="Search address, city, landmark, or street..."
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchLoading && (
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-1" />
                  )}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Recommendations dropdown floating over the map */}
              {searchResults.length > 0 && (
                <div className="absolute z-[1002] mt-1.5 w-full max-w-md bg-card/95 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-2xl shadow-black/70 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-2 bg-muted/80 border-b border-border flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                    <span>Locations found ({searchResults.length})</span>
                    <button
                      type="button"
                      onClick={() => setSearchResults([])}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                      title="Dismiss recommendations"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-border/60">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectSearchResult(result)}
                        className="w-full text-left px-3.5 py-2.5 flex items-start gap-3 text-xs text-foreground hover:bg-primary/15 transition-colors group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary/25 transition-colors">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                            {result.display_name}
                          </p>
                          <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">
                            {Number(result.lat).toFixed(4)}, {Number(result.lon).toFixed(4)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground mt-1.5">
              Search for an address or click anywhere directly on the map below to pinpoint delivery location.
            </p>
          </div>

          <div className="h-[500px] w-full rounded-xl overflow-hidden border border-border shadow-inner relative">
            {/* Map Layer Switcher (Street Map vs Satellite Imagery) */}
            <div className="absolute top-3 right-3 z-[1000] flex items-center bg-card/90 backdrop-blur-md rounded-xl p-1 border border-border/80 shadow-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setMapLayer('street')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                  mapLayer === 'street'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Street Map</span>
              </button>
              <button
                type="button"
                onClick={() => setMapLayer('satellite')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                  mapLayer === 'satellite'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Satellite</span>
              </button>
            </div>

            <MapContainer
              center={mapCenter}
              zoom={13}
              className="h-full w-full"
              style={{ background: '#0b1120' }}
            >
              {mapLayer === 'satellite' ? (
                <TileLayer
                  key="satellite-layer"
                  attribution='Tiles &copy; Google Maps'
                  url="https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                  subdomains={['0', '1', '2', '3']}
                  maxZoom={20}
                />
              ) : (
                <TileLayer
                  key="street-layer"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
              )}
              {markerPosition && (
                <Marker position={markerPosition}>
                  <Popup>
                    <div className="text-xs">
                      <div className="font-semibold">Delivery Location</div>
                      {deliveryLat && <div>Lat: {Number(deliveryLat).toFixed(5)}</div>}
                      {deliveryLng && <div>Lng: {Number(deliveryLng).toFixed(5)}</div>}
                      {deliveryAddress && (
                        <div className="mt-1 text-muted-foreground max-w-[200px]">{deliveryAddress}</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}
              <MapClickHandler onSelect={handleMapSelect} />
              <MapRecenter center={mapCenter} />
            </MapContainer>
          </div>

          {markerPosition && (
            <div className="mt-3 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-emerald-300 font-medium">
                  Location Selected
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {deliveryAddress || `${Number(deliveryLat).toFixed(5)}, ${Number(deliveryLng).toFixed(5)}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeliveryLat('');
                  setDeliveryLng('');
                  setDeliveryAddress('');
                  setSearchQuery('');
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </>
      )}
    </Card>

        {warehouseId && (
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-border/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shadow-md shadow-primary/10">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Products Catalog</h2>
                  <p className="text-xs text-muted-foreground">
                    {filteredProducts.length} of {productsData?.length || 0} products available in selected warehouse
                  </p>
                </div>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-72 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl pl-9 pr-8 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                  placeholder="Filter by name, SKU, brand, category..."
                />
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => setProductSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {productsLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
                <p className="text-xs text-muted-foreground font-medium">Loading products catalog...</p>
              </div>
            ) : productsError ? (
              <div className="flex flex-col items-center justify-center py-16 text-rose-400 bg-rose-500/5 rounded-2xl border border-rose-500/20">
                <AlertTriangle className="w-10 h-10 mb-3 text-rose-500" />
                <p className="text-sm font-bold">Failed to load products</p>
                <p className="text-xs text-muted-foreground mt-1">{productsError?.message || 'Unknown error'}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
                <Package className="w-12 h-12 mb-3 text-muted-foreground/60" />
                <p className="text-sm font-semibold text-foreground">No products found</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your search query or selecting another warehouse</p>
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => setProductSearch('')}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    warehouseId={warehouseId}
                    onViewDetail={setSelectedProduct}
                    onQuickAdd={quickAddToCart}
                    onUpdateQty={updateCartQty}
                    onRemove={removeFromCart}
                    cartQty={getCartQty(product.id)}
                  />
                ))}
              </div>
            )}
          </Card>
        )}

        {items.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Your Order</h2>
                  <p className="text-xs text-muted-foreground">
                    {items.length} item{items.length > 1 ? 's' : ''} selected
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setItems([]);
                  setPreview(null);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item) => {
                const product = productsData?.find((p) => p.id === item.productId);
                return (
                  <CartItemRow
                    key={item.productId}
                    item={item}
                    product={product}
                    onQuantityChange={(qty) => updateCartQty(item.productId, qty)}
                    onRemove={() => removeFromCart(item.productId)}
                  />
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">
                  {cartItemCount} total unit{cartItemCount > 1 ? 's' : ''}
                </span>
                <span>across {items.length} item{items.length > 1 ? 's' : ''} selected</span>
              </div>
              <div className="flex items-center gap-1.5 text-primary font-medium">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Price tiers, volume discounts, and taxes calculated in Preview Quotation</span>
              </div>
            </div>
          </Card>
        )}

        {/* When quotation has NOT yet been previewed, show primary Preview Quotation button */}
        {items.length > 0 && !preview && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="button"
              variant="default"
              onClick={handlePreview}
              loading={previewMutation.isPending}
              disabled={isLoading || !warehouseId || items.length === 0}
              icon={<Eye className="w-4 h-4" />}
            >
              Preview Quotation
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5" />
              Preview official quotation with price tiers, discounts, and taxes before submitting
            </div>
          </div>
        )}

        {/* Quotation Preview with integrated submission and refresh actions */}
        {preview && (
          <QuotationPreview
            preview={preview}
            productsData={productsData}
            onSubmitOrder={handleSubmit}
            isSubmitting={createMutation.isPending}
            onUpdatePreview={handlePreview}
            isUpdating={previewMutation.isPending}
          />
        )}
      </form>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          warehouseId={warehouseId}
          onClose={() => setSelectedProduct(null)}
          onAdd={addToCart}
          cartQty={getCartQty(selectedProduct.id)}
          unitAbbr={selectedProduct.unit?.abbreviation || selectedProduct.unit?.name || 'unit'}
        />
      )}
    </div>
  );
}
