import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  Package,
  AlertTriangle,
  DollarSign,
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Edit2,
  Trash2,
  PackagePlus,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Layers,
  CheckCircle2,
  X,
  ShoppingCart,
} from 'lucide-react';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { SkeletonCard, SkeletonTable } from '../components/common/Loader';
import ErrorAlert from '../components/common/ErrorAlert';
import ProductModal from '../components/inventory/ProductModal';
import StockAdjustModal from '../components/inventory/StockAdjustModal';
import DeleteConfirmModal from '../components/inventory/DeleteConfirmModal';
import * as productService from '../services/productService';
import { useCart } from '../context/CartContext';

const Inventory = () => {
  const { addToCart, promptAddToCart } = useCart();
  // State: Data
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    availableStock: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    inventoryValue: 0,
    categories: [],
  });

  // State: Pagination & Filters
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all'); // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // State: Loading & Error
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // State: Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);

  const [modalLoading, setModalLoading] = useState(false);

  // Show temporary toast notification
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Inventory Stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await productService.getProductStats(10);
      if (res && res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch product stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Product Catalog
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        category: category !== 'all' ? category : undefined,
        status: status !== 'all' ? status : undefined,
        sortBy,
        sortOrder,
      };

      const res = await productService.getProducts(params);
      if (res && res.success) {
        setProducts(res.data || []);
        if (res.meta) {
          setPagination((prev) => ({
            ...prev,
            total: res.meta.total,
            totalPages: res.meta.totalPages,
          }));
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load inventory products');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, category, status, sortBy, sortOrder]);

  // Initial Load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle Product Create or Update
  const handleSaveProduct = async (formData) => {
    try {
      setModalLoading(true);
      if (editingProduct) {
        await productService.updateProduct(editingProduct._id, formData);
        showToast(`Successfully updated "${formData.name}"`);
      } else {
        await productService.createProduct(formData);
        showToast(`Successfully created "${formData.name}"`);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
      fetchStats();
    } catch (err) {
      alert(err.message || 'Failed to save product');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Quick Stock Adjust
  const handleAdjustStock = async (productId, delta) => {
    try {
      setModalLoading(true);
      const res = await productService.adjustProductStock(productId, delta);
      showToast(res.message || 'Stock level updated');
      setIsStockModalOpen(false);
      setStockProduct(null);
      fetchProducts();
      fetchStats();
    } catch (err) {
      alert(err.message || 'Failed to adjust stock');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Product Delete
  const handleDeleteProduct = async (productId) => {
    try {
      setModalLoading(true);
      await productService.deleteProduct(productId);
      showToast('Product removed from catalog');
      setIsDeleteModalOpen(false);
      setDeletingProduct(null);
      fetchProducts();
      fetchStats();
    } catch (err) {
      alert(err.message || 'Failed to delete product');
    } finally {
      setModalLoading(false);
    }
  };

  // Seed Demo Catalog
  const handleSeedProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.seedSampleProducts(true);
      showToast(res.message || 'Sample products seeded successfully');
      fetchProducts();
      fetchStats();
    } catch (err) {
      alert(err.message || 'Failed to seed demo catalog');
    } finally {
      setLoading(false);
    }
  };

  // Stock status badge helper
  const renderStockBadge = (stockQuantity) => {
    if (stockQuantity === 0) {
      return (
        <Badge variant="danger" dot size="sm">
          Out of Stock
        </Badge>
      );
    }
    if (stockQuantity <= 10) {
      return (
        <Badge variant="warning" dot size="sm">
          Low Stock ({stockQuantity})
        </Badge>
      );
    }
    return (
      <Badge variant="success" dot size="sm">
        In Stock ({stockQuantity})
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Inventory & Catalog Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time stock monitoring, price configuration, and POS product controls
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="md"
            variant="outline"
            onClick={() => {
              fetchProducts();
              fetchStats();
            }}
            icon={RefreshCw}
            className="bg-white"
          >
            Refresh
          </Button>

          <Button
            size="md"
            variant="primary"
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            icon={Plus}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Error state if API fails */}
      {error && (
        <ErrorAlert
          title="Inventory API Error"
          message={error}
          onRetry={fetchProducts}
        />
      )}

      {/* 4 Dashboard Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            {/* 1. Total Products */}
            <Card hover className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Products
                </span>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <Boxes className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  {stats.totalProducts} <span className="text-xs font-normal text-slate-500">SKUs</span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>Across {stats.categories?.length || 0} active categories</span>
                </p>
              </div>
            </Card>

            {/* 2. Available Stock */}
            <Card hover className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Available Stock
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  {stats.availableStock.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Physical inventory ready for checkout
                </p>
              </div>
            </Card>

            {/* 3. Low Stock Items */}
            <Card
              hover
              className={`p-5 cursor-pointer transition-all ${
                status === 'low_stock' ? 'ring-2 ring-amber-500 bg-amber-50/20' : ''
              }`}
              onClick={() => setStatus(status === 'low_stock' ? 'all' : 'low_stock')}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Low Stock Items
                </span>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-amber-600 tracking-tight">
                  {stats.lowStockItems}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    {stats.outOfStockItems > 0 && `(${stats.outOfStockItems} out of stock)`}
                  </span>
                </div>
                <p className="text-xs text-amber-700/80 mt-1.5 font-medium">
                  {stats.lowStockItems > 0
                    ? 'Threshold &le; 10 units • Click to filter'
                    : 'All products sufficiently stocked'}
                </p>
              </div>
            </Card>

            {/* 4. Inventory Value */}
            <Card hover className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Inventory Value
                </span>
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  ${stats.inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Total retail asset valuation
                </p>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Main Table Card with Toolbar */}
      <Card>
        {/* Toolbar: Search, Category, Status, Sort */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col gap-4">
          {/* Top Toolbar Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU, category..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter + Sort */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Category Dropdown */}
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium cursor-pointer"
              >
                <option value="all">All Categories</option>
                {stats.categories?.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Sort selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="bg-transparent border-0 focus:outline-none text-xs text-slate-700 font-medium cursor-pointer"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="stockQuantity-asc">Stock: Low to High</option>
                  <option value="stockQuantity-desc">Stock: High to Low</option>
                </select>
              </div>

              {/* Optional Demo Seeding trigger */}
              {products.length === 0 && !loading && (
                <Button
                  size="sm"
                  variant="outline"
                  icon={Sparkles}
                  onClick={handleSeedProducts}
                  className="text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                >
                  Seed Demo Catalog
                </Button>
              )}
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            {[
              { id: 'all', label: 'All Products', count: stats.totalProducts },
              {
                id: 'in_stock',
                label: 'In Stock',
                count: Math.max(0, stats.totalProducts - stats.lowStockItems - stats.outOfStockItems),
              },
              { id: 'low_stock', label: 'Low Stock (&le; 10)', count: stats.lowStockItems },
              { id: 'out_of_stock', label: 'Out of Stock', count: stats.outOfStockItems },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatus(tab.id);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  status === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    status === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <CardBody className="p-0">
          {loading ? (
            <SkeletonTable rows={6} className="border-0 shadow-none" />
          ) : products.length === 0 ? (
            <div className="py-16 text-center space-y-4 px-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Boxes className="w-7 h-7" />
              </div>
              <div className="max-w-sm mx-auto space-y-1">
                <h4 className="text-base font-bold text-slate-800">No products found</h4>
                <p className="text-xs text-slate-500">
                  {search || category !== 'all' || status !== 'all'
                    ? 'No items matched your current filter criteria. Try resetting filters.'
                    : 'Your inventory catalog is currently empty.'}
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <Button
                  size="sm"
                  variant="primary"
                  icon={Plus}
                  onClick={() => {
                    setEditingProduct(null);
                    setIsProductModalOpen(true);
                  }}
                >
                  Add First Product
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={Sparkles}
                  onClick={handleSeedProducts}
                >
                  Load 10 Sample Items
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Product & Details</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Unit Price</th>
                    <th className="px-5 py-3.5">Stock Level</th>
                    <th className="px-5 py-3.5">SKU Valuation</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((item) => {
                    const skuValuation = (item.price * item.stockQuantity).toFixed(2);
                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Product Name, Image & SKU */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <p className="font-bold text-slate-900 truncate">{item.name}</p>
                              {item.description ? (
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {item.description}
                                </p>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ID: {item._id.slice(-6).toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-3.5">
                          <Badge variant="neutral" size="xs">
                            {item.category}
                          </Badge>
                        </td>

                        {/* Price */}
                        <td className="px-5 py-3.5 font-bold text-slate-900 text-sm">
                          ${item.price?.toFixed(2)}
                        </td>

                        {/* Stock & Status Badge */}
                        <td className="px-5 py-3.5">
                          {renderStockBadge(item.stockQuantity)}
                        </td>

                        {/* Valuation */}
                        <td className="px-5 py-3.5 text-slate-700 font-semibold font-mono">
                          ${Number(skuValuation).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        {/* Row Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                            {/* Add to Cart Button */}
                            <button
                              type="button"
                              title={item.stockQuantity > 0 ? "Add to Cart" : "Out of stock"}
                              disabled={item.stockQuantity <= 0}
                              onClick={() => promptAddToCart(item)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>

                            {/* Quick Restock Button */}
                            <button
                              type="button"
                              title="Adjust stock quantity"
                              onClick={() => {
                                setStockProduct(item);
                                setIsStockModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            >
                              <PackagePlus className="w-4 h-4" />
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              title="Edit product"
                              onClick={() => {
                                setEditingProduct(item);
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              title="Delete product"
                              onClick={() => {
                                setDeletingProduct(item);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>

        {/* Pagination Controls */}
        {products.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>
                Showing{' '}
                <span className="font-semibold text-slate-800">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-800">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-semibold text-slate-800">{pagination.total}</span> products
              </span>

              <span className="text-slate-300">|</span>

              <label className="flex items-center gap-1.5">
                <span>Rows:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => {
                    setPagination((p) => ({
                      ...p,
                      limit: parseInt(e.target.value, 10),
                      page: 1,
                    }));
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>

            {/* Next / Prev buttons */}
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                icon={ChevronLeft}
                className="px-2.5"
              >
                Previous
              </Button>

              <span className="px-3 py-1 font-semibold text-slate-800">
                {pagination.page} / {pagination.totalPages}
              </span>

              <Button
                size="sm"
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-2.5"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Product Add / Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSaveProduct}
        initialData={editingProduct}
        isLoading={modalLoading}
      />

      {/* Quick Stock Restock Modal */}
      <StockAdjustModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setStockProduct(null);
        }}
        onSubmit={handleAdjustStock}
        product={stockProduct}
        isLoading={modalLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingProduct(null);
        }}
        onConfirm={handleDeleteProduct}
        product={deletingProduct}
        isLoading={modalLoading}
      />
    </div>
  );
};

export default Inventory;
