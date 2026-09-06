import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { procurementApi } from '../../../procurementApi';
import { toast } from 'react-hot-toast';

export default function useProcurementDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialTab = location.state?.activeTab || searchParams.get('tab') || 'REQUISITION';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [refreshPoTrigger, setRefreshPoTrigger] = useState(0);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state?.activeTab]);

  // Shared state for Requisition & PO Cart
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [selectedItems, setSelectedItems] = useState({});
  const [defaultSupplier, setDefaultSupplier] = useState('');
  const [defaultWarehouse, setDefaultWarehouse] = useState('');

  // Quick Metrics
  const [metrics, setMetrics] = useState({
    totalPos: 0,
    pendingPos: 0,
    approvedPos: 0,
    pendingGrs: 0,
  });

  // Load catalog reference data on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoadingCatalog(true);
        const [prodRes, catRes, supRes, whRes] = await Promise.all([
          procurementApi.getProducts({ limit: 200 }),
          procurementApi.getCategories(),
          procurementApi.getSuppliers(),
          procurementApi.getWarehouses(),
        ]);

        const prodList = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.products || []);
        const catList = Array.isArray(catRes.data) ? catRes.data : [];
        const supList = Array.isArray(supRes.data) ? supRes.data : [];
        const whList = Array.isArray(whRes.data) ? whRes.data : [];

        setProducts(prodList);
        setCategories(catList);
        setSuppliers(supList);
        setWarehouses(whList);

        if (supList.length > 0) setDefaultSupplier(supList[0].id);
        if (whList.length > 0) setDefaultWarehouse(whList[0].id);

        const initialSelected = {};
        prodList.forEach((p) => {
          const costPrice = Number(
            p.costPrice ||
            p.warehouseSellingPrices?.[0]?.wholesalePrice ||
            p.wholesalePrice ||
            100
          );
          initialSelected[p.id] = {
            selected: false,
            quantity: 10,
            unitCost: costPrice,
          };
        });
        setSelectedItems(initialSelected);
      } catch (err) {
        console.error('Failed to load catalog data:', err);
        toast.error('Failed to load product catalog');
      } finally {
        setLoadingCatalog(false);
      }
    };

    fetchCatalog();
  }, []);

  const fetchMetrics = async () => {
    try {
      const [poRes, grRes] = await Promise.allSettled([
        procurementApi.getPurchaseOrders({ limit: 100 }),
        procurementApi.getGoodsReceipts({ limit: 100 }),
      ]);

      const pos = poRes.status === 'fulfilled' ? (poRes.value?.data?.purchaseOrders || poRes.value?.data || poRes.value || []) : [];
      const grs = grRes.status === 'fulfilled' ? (grRes.value?.data?.receipts || grRes.value?.data || grRes.value || []) : [];

      const poList = Array.isArray(pos) ? pos : [];
      const grList = Array.isArray(grs) ? grs : [];

      setMetrics({
        totalPos: poList.length,
        pendingPos: poList.filter((p) => p.status === 'PENDING').length,
        approvedPos: poList.filter((p) => p.status === 'APPROVED').length,
        pendingGrs: grList.filter((g) => g.status === 'PENDING' || !g.status).length,
      });
    } catch (err) {
      console.error('Failed to fetch procurement metrics:', err);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [activeTab, refreshPoTrigger]);

  const cartCount = Object.values(selectedItems).filter((item) => item.selected).length;

  const tabs = [
    { id: 'REQUISITION', label: '🛍️ Requisition & Products' },
    {
      id: 'CART',
      label: `🛒 PO Cart ${cartCount > 0 ? `(${cartCount})` : ''}`,
      badge: cartCount > 0 ? cartCount : null,
    },
    { id: 'POS', label: `📋 Purchase Orders ${metrics.pendingPos > 0 ? `(${metrics.pendingPos})` : ''}` },
    { id: 'RECEIPTS', label: `📦 Goods Receipts ${metrics.pendingGrs > 0 ? `(${metrics.pendingGrs})` : ''}` },
    {
      id: 'ON_DELIVERY_PO',
      label: `🚚 On_Delivery PO ${metrics.approvedPos > 0 ? `(${metrics.approvedPos})` : ''}`,
      badge: metrics.approvedPos > 0 ? metrics.approvedPos : null,
    },
  ];

  const handlePoCreated = () => {
    setRefreshPoTrigger((prev) => prev + 1);
    setActiveTab('POS');
  };

  return {
    activeTab,
    setActiveTab,
    loadingCatalog,
    products,
    categories,
    suppliers,
    warehouses,
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
  };
}
