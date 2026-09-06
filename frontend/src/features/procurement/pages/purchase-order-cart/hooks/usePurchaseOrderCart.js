import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { procurementApi } from '../../../procurementApi';
import { toast } from 'react-hot-toast';

export default function usePurchaseOrderCart() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});

  const [defaultSupplier, setDefaultSupplier] = useState('');
  const [defaultWarehouse, setDefaultWarehouse] = useState('');

  useEffect(() => {
    const fetchCatalogData = async () => {
      try {
        setLoading(true);
        const [prodRes, supRes, whRes] = await Promise.all([
          procurementApi.getProducts({ limit: 200 }),
          procurementApi.getSuppliers(),
          procurementApi.getWarehouses(),
        ]);

        const prodList = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.products || []);
        const supList = Array.isArray(supRes.data) ? supRes.data : [];
        const whList = Array.isArray(whRes.data) ? whRes.data : [];

        setProducts(prodList);
        setSuppliers(supList);
        setWarehouses(whList);

        if (supList.length > 0) setDefaultSupplier(supList[0].id);
        if (whList.length > 0) setDefaultWarehouse(whList[0].id);

        const passedSelected = location.state?.selectedItems;
        if (passedSelected && Object.keys(passedSelected).length > 0) {
          setSelectedItems(passedSelected);
        } else {
          const initialSelected = {};
          prodList.forEach((p) => {
            const costPrice = Number(
              p.costPrice ||
              p.purchasePrice ||
              p.productPrices?.[0]?.wholesalePrice ||
              100
            );
            initialSelected[p.id] = {
              selected: false,
              quantity: 10,
              unitCost: costPrice,
            };
          });
          setSelectedItems(initialSelected);
        }
      } catch (err) {
        console.error('Failed to load cart reference data:', err);
        toast.error('Failed to load product catalog for cart');
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogData();
  }, [location.state]);

  const handlePoCreated = () => {
    navigate('/procurement');
  };

  return {
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
  };
}
