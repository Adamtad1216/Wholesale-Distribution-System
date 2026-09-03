import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { salesOrdersApi } from '../salesOrdersApi';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import api from '../../../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const initialItem = { productId: '', quantity: 1 };

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function NewSalesOrder() {
  const queryClient = useQueryClient();
  const [warehouseId, setWarehouseId] = useState('');
  const [items, setItems] = useState([{ ...initialItem }]);
  const [requiredDate, setRequiredDate] = useState('');
  const [deliveryLat, setDeliveryLat] = useState('');
  const [deliveryLng, setDeliveryLng] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [preview, setPreview] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([9.02, 38.75]);
  const searchDebounceRef = useRef(null);

  const { data: warehousesData, isLoading: warehousesLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/warehouses', { params: { limit: 100, status: 'ACTIVE' } });
      return res.data?.data || res.data || [];
    },
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', warehouseId],
    queryFn: async () => {
      const params = { limit: 200, status: 'ACTIVE' };
      if (warehouseId) params.warehouseId = warehouseId;
      const res = await api.get('/products', { params });
      return res.data?.data || res.data || [];
    },
    enabled: !!warehouseId,
  });

  const previewMutation = useMutation({
    mutationFn: salesOrdersApi.preview,
    onSuccess: (res) => {
      setPreview(res?.data || res);
      toast.success('Quotation preview updated');
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to preview quotation');
    },
  });

  const createMutation = useMutation({
    mutationFn: salesOrdersApi.create,
    onSuccess: (res) => {
      const order = res?.data || res;
      toast.success(`Sales order ${order.orderNumber} created successfully!`);
      queryClient.invalidateQueries(['salesOrders']);
      setPreview(null);
      setItems([{ ...initialItem }]);
      setWarehouseId('');
      setRequiredDate('');
      setDeliveryLat('');
      setDeliveryLng('');
      setDeliveryAddress('');
      setSearchQuery('');
      setSearchResults([]);
      setMapCenter([9.02, 38.75]);
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to create sales order');
    },
  });

  const handleAddItem = () => {
    setItems((prev) => [...prev, { ...initialItem }]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
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

  const handlePreview = (e) => {
    e.preventDefault();
    const payload = {
      warehouseId,
      items: items
        .filter((item) => item.productId && item.quantity > 0)
        .map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
        })),
    };
    if (payload.items.length === 0) {
      toast.error('Add at least one product');
      return;
    }
    previewMutation.mutate(payload);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!preview) {
      toast.error('Please preview the quotation first');
      return;
    }
    const payload = {
      warehouseId,
      requiredDate: requiredDate || undefined,
      deliveryLocation:
        deliveryLat || deliveryLng
          ? {
              latitude: Number(deliveryLat) || 0,
              longitude: Number(deliveryLng) || 0,
              addressText: deliveryAddress || undefined,
            }
          : undefined,
      items: preview.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };
    createMutation.mutate(payload);
  };

  const isLoading = previewMutation.isPending || createMutation.isPending;
  const markerPosition =
    deliveryLat && deliveryLng
      ? [Number(deliveryLat), Number(deliveryLng)]
      : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 light:text-slate-900">
          Request Sales Order
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Select products and delivery details to get a quotation preview.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold text-slate-100 light:text-slate-900 mb-4">
            Warehouse & Delivery
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Warehouse <span className="text-rose-400">*</span>
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Required Date
              </label>
              <input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Search Delivery Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Search address or place..."
                />
                {searchLoading && (
                  <div className="absolute right-3 top-2.5 text-xs text-slate-400">
                    Searching...
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div className="absolute z-[1000] mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-auto">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectSearchResult(result)}
                        className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 border-b border-slate-800 last:border-b-0"
                      >
                        {result.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Search for an address or click on the map to set the delivery location.
              </p>
            </div>
            <div className="md:col-span-2">
              <div className="h-80 w-full rounded-lg overflow-hidden border border-slate-700">
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  className="h-full w-full"
                  whenCreated={(map) => {
                    map.setView(mapCenter, 13);
                  }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {markerPosition && (
                    <Marker position={markerPosition}>
                      <Popup>
                        <div className="text-xs">
                          <div className="font-semibold">Delivery Location</div>
                          {deliveryLat && <div>Lat: {deliveryLat}</div>}
                          {deliveryLng && <div>Lng: {deliveryLng}</div>}
                          {deliveryAddress && <div className="mt-1 text-slate-600">{deliveryAddress}</div>}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  <MapClickHandler onSelect={handleMapSelect} />
                </MapContainer>
              </div>
              {markerPosition && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="text-xs text-slate-400">
                    Selected: {deliveryLat && `Lat ${deliveryLat}`} {deliveryLng && `Lng ${deliveryLng}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryLat('');
                      setDeliveryLng('');
                      setDeliveryAddress('');
                      setSearchQuery('');
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-100 light:text-slate-900">
              Products
            </h2>
            <Button type="button" variant="ghost" size="sm" onClick={handleAddItem}>
              + Add Product
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-3 items-end"
              >
                <div className="col-span-6">
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Product <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  >
                    <option value="">Select product</option>
                    {productsData?.map((product) => {
                      const stock = product.warehouseStocks?.[0];
                      const available = stock ? Number(stock.availableQuantity) : null;
                      const stockLabel = available !== null ? ` — Stock: ${available}` : '';
                      return (
                        <option key={product.id} value={product.id}>
                          {product.name} {product.sku ? `(${product.sku})` : ''}{stockLabel}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Qty <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div className="col-span-3 flex justify-end">
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handlePreview}
            loading={previewMutation.isPending}
            disabled={isLoading || !warehouseId || items.length === 0}
          >
            Preview Quotation
          </Button>
          <Button
            type="submit"
            loading={createMutation.isPending}
            disabled={isLoading || !preview}
          >
            Submit Order
          </Button>
        </div>
      </form>

      {preview && (
        <Card className="border-violet-500/30">
          <h2 className="text-lg font-semibold text-slate-100 light:text-slate-900 mb-4">
            Quotation Preview
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-700 text-xs uppercase text-slate-400">
                  <th className="pb-3 pr-4">Product</th>
                  <th className="pb-3 pr-4">SKU</th>
                  <th className="pb-3 pr-4 text-right">Qty</th>
                  <th className="pb-3 pr-4 text-right">Unit Price</th>
                  <th className="pb-3 pr-4 text-right">Subtotal</th>
                  <th className="pb-3 pr-4 text-right">Discount</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {preview.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 pr-4">{item.productName || item.productId}</td>
                    <td className="py-3 pr-4 text-slate-400">{item.sku || '-'}</td>
                    <td className="py-3 pr-4 text-right">{item.quantity}</td>
                    <td className="py-3 pr-4 text-right">
                      {Number(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {Number(item.subtotal).toFixed(2)}
                    </td>
                    <td className="py-3 pr-4 text-right text-rose-400">
                      {Number(item.discount).toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-semibold text-violet-300">
                      {Number(item.finalAmount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col items-end gap-1 text-sm">
            <div className="flex justify-between w-full max-w-xs text-slate-400">
              <span>Subtotal</span>
              <span className="text-slate-200">{Number(preview.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-full max-w-xs text-slate-400">
              <span>Discount</span>
              <span className="text-rose-400">-{Number(preview.discount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-full max-w-xs text-slate-400">
              <span>Tax</span>
              <span className="text-slate-200">{Number(preview.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-full max-w-xs text-base font-bold text-violet-300 pt-2 border-t border-slate-700">
              <span>Total</span>
              <span>{Number(preview.total).toFixed(2)}</span>
            </div>
          </div>

          {preview.quotaWarnings?.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300">
              {preview.quotaWarnings.map((w, i) => (
                <div key={i}>⚠️ {w.message || 'Quota limit may be affected'}</div>
              ))}
            </div>
          )}

          {preview.priceTier && (
            <div className="mt-3 text-xs text-slate-400">
              Applied Price Tier: <span className="text-violet-300">{preview.priceTier.name}</span>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
