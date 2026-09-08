import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { productsApi } from '../productsApi';
import { usePermission } from '../../../hooks/usePermission';
import Button from '../../../components/ui/Button';
import ConfirmDeleteModal from '../../../components/ui/ConfirmDeleteModal';

// Subcomponents
import ProductStats from '../components/ProductStats';
import ProductFilters from '../components/ProductFilters';
import ProductListTable from '../components/ProductListTable';
import ProductGrid from '../components/ProductGrid';
import ImagePreviewModal from '../components/ImagePreviewModal';
import ProductDetailModal from '../components/ProductDetailModal';

export default function ProductsPage() {
  // View switcher & Lightbox state
  const [viewMode, setViewMode] = useState('TABLE');
  const [lightboxProduct, setLightboxProduct] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Products Data & Pagination
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Reference lookups
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Search & Filters for Products
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const navigate = useNavigate();

  // Product Modals
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);

  const [deleteTargetProduct, setDeleteTargetProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  // Permissions
  const { can: canCreateProduct } = usePermission('products:create');
  const { can: canUpdateProduct } = usePermission('products:update');
  const { can: canDeleteProduct } = usePermission('products:delete');

  const { can: canCreateCategory } = usePermission('categories:create');
  const { can: canUpdateCategory } = usePermission('categories:update');
  const { can: canDeleteCategory } = usePermission('categories:delete');

  const { can: canCreateBrand } = usePermission('brands:create');
  const { can: canUpdateBrand } = usePermission('brands:update');
  const { can: canDeleteBrand } = usePermission('brands:delete');

  const { can: canCreateUnit } = usePermission('units:create');
  const { can: canUpdateUnit } = usePermission('units:update');
  const { can: canDeleteUnit } = usePermission('units:delete');

  // Fetch Reference Data (Categories, Brands, Units, Warehouses)
  const fetchReferenceData = async () => {
    try {
      const [catRes, brandRes, unitRes, whRes] = await Promise.allSettled([
        productsApi.getCategories({ limit: 100 }),
        productsApi.getBrands({ limit: 100 }),
        productsApi.getUnits({ limit: 100 }),
        productsApi.getWarehouses({ limit: 100 }),
      ]);

      if (catRes.status === 'fulfilled') {
        const raw = catRes.value;
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : raw?.data?.items || raw?.categories || [];
        setCategories(list);
      }
      if (brandRes.status === 'fulfilled') {
        const raw = brandRes.value;
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : raw?.data?.items || raw?.brands || [];
        setBrands(list);
      }
      if (unitRes.status === 'fulfilled') {
        const raw = unitRes.value;
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : raw?.data?.items || raw?.units || [];
        setUnits(list);
      }
      if (whRes.status === 'fulfilled') {
        const raw = whRes.value;
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : raw?.data?.items || raw?.warehouses || [];
        setWarehouses(list);
      }
    } catch {
      // Non-blocking fallback
    }
  };

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
      };

      const res = await productsApi.getProducts(params);
      const list = Array.isArray(res?.data) ? res.data : res?.data?.items || [];
      const metaData = res?.meta || { page, limit, total: list.length, totalPages: 1 };

      setProducts(list);
      setMeta(metaData);
    } catch (err) {
      toast.error(err?.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, categoryId, brandId]);

  useEffect(() => {
    fetchReferenceData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Product CRUD Handlers
  const handleOpenCreateModal = () => {
    navigate('/products/new');
  };

  const handleOpenEditModal = (product) => {
    navigate(`/products/${product.id}/edit`);
  };

  const handleOpenDetailModal = (product) => {
    if (!product?.id) return;
    navigate(`/products/${product.id}`);
  };

  const handleDeleteProductConfirm = async () => {
    if (!deleteTargetProduct) return;
    setDeletingProduct(true);
    try {
      await productsApi.deleteProduct(deleteTargetProduct.id);
      toast.success('Product deleted successfully');
      setDeleteTargetProduct(null);
      fetchProducts();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete product');
    } finally {
      setDeletingProduct(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategoryId('');
    setBrandId('');
    setPage(1);
  };

  const activeProductsCount = products.filter((p) => p.status === 'ACTIVE').length;

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Product Catalog
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage master products inventory and catalog pricing
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canCreateProduct && (
            <Button
              onClick={handleOpenCreateModal}
              variant="primary"
              size="md"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Catalog Content */}
      <div className="space-y-5">
        {/* Stats Bar */}
        <ProductStats
          totalProducts={meta.total || products.length}
          activeProducts={activeProductsCount}
          totalCategories={categories.length}
          totalBrands={brands.length}
          loading={loading}
        />

        {/* Search & Filters */}
        <div className="relative z-30">
          <ProductFilters
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            categoryId={categoryId}
            onCategoryChange={(val) => {
              setCategoryId(val);
              setPage(1);
            }}
            brandId={brandId}
            onBrandChange={(val) => {
              setBrandId(val);
              setPage(1);
            }}
            categories={categories}
            brands={brands}
            onReset={handleResetFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {/* Products View: Table or Visual Card Grid */}
        {viewMode === 'TABLE' ? (
          <ProductListTable
            products={products}
            loading={loading}
            page={page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={limit}
            onPageChange={setPage}
            onViewProduct={handleOpenDetailModal}
            onEditProduct={handleOpenEditModal}
            onDeleteProduct={(p) => setDeleteTargetProduct(p)}
            onPreviewImage={(prod, idx) => {
              setLightboxProduct(prod);
              setLightboxIndex(idx || 0);
            }}
            canUpdate={canUpdateProduct}
            canDelete={canDeleteProduct}
          />
        ) : (
          <ProductGrid
            products={products}
            loading={loading}
            page={page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={limit}
            onPageChange={setPage}
            onViewProduct={handleOpenDetailModal}
            onEditProduct={handleOpenEditModal}
            onDeleteProduct={(p) => setDeleteTargetProduct(p)}
            onPreviewImage={(prod, idx) => {
              setLightboxProduct(prod);
              setLightboxIndex(idx || 0);
            }}
            canUpdate={canUpdateProduct}
            canDelete={canDeleteProduct}
          />
        )}
      </div>


      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        product={selectedProductForDetail}
        onEdit={handleOpenEditModal}
        canUpdate={canUpdateProduct}
        totalWarehouses={warehouses.length}
      />

      {/* Confirm Delete Product Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTargetProduct)}
        onClose={() => setDeleteTargetProduct(null)}
        onConfirm={handleDeleteProductConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTargetProduct?.name}" (SKU: ${deleteTargetProduct?.sku || 'N/A'}) from the catalog? This action cannot be undone.`}
        submitting={deletingProduct}
      />

      {/* Lightbox Image Preview Modal */}
      <ImagePreviewModal
        isOpen={Boolean(lightboxProduct)}
        onClose={() => setLightboxProduct(null)}
        images={
          lightboxProduct?.images && lightboxProduct.images.length > 0
            ? lightboxProduct.images
            : lightboxProduct?.imageUrl
            ? [lightboxProduct.imageUrl]
            : lightboxProduct?.image
            ? [lightboxProduct.image]
            : []
        }
        initialIndex={lightboxIndex}
        productName={lightboxProduct?.name || 'Product'}
      />
    </div>
  );
}
