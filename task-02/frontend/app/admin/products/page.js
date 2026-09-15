'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Loading, { Skeleton } from '@/components/common/Loading';
import AdminGuard from '@/components/admin/AdminGuard';
import productService from '@/services/productService';
import categoryService from '@/services/categoryService';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Power,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  Eye,
} from 'lucide-react';

export default function AdminProductsListPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.categoryId = selectedCategory;
      if (statusFilter) params.isActive = statusFilter;

      const [prodRes, catRes] = await Promise.all([
        productService.getProducts(params),
        categoryService.getCategories(),
      ]);

      setProducts(prodRes.data.products || []);
      setCategories(catRes.data.categories || []);
    } catch (err) {
      console.error('Failed to fetch products:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleToggleStatus = async (product) => {
    setActionLoadingId(product._id);
    try {
      const updatedStatus = !product.isActive;
      await productService.updateProduct(product._id, { isActive: updatedStatus });
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, isActive: updatedStatus } : p))
      );
      showToast(`Product "${product.name}" ${updatedStatus ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      showToast(`Failed: ${err.message}`, true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;

    setActionLoadingId(product._id);
    try {
      await productService.deleteProduct(product._id, true);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
      showToast(`Product "${product.name}" deleted.`);
    } catch (err) {
      // If active reservations prevent hard delete, offer soft deactivation
      showToast(`Error: ${err.message}`, true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <AdminGuard>
      <main className="py-8 space-y-6">
        <PageContainer size="lg">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href="/admin" className="text-xs text-slate-400 hover:text-purple-600 transition-colors">
                  Admin Console
                </Link>
                <span className="text-xs text-slate-300">/</span>
                <span className="text-xs font-bold text-purple-700">Products</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Product Catalog Management
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchProducts}
                icon={RotateCcw}
                isLoading={loading}
              >
                Refresh
              </Button>
              <Link href="/admin/products/new">
                <Button variant="primary" size="sm" icon={Plus}>
                  Add New Product
                </Button>
              </Link>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in ${
                toastMessage.isError
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {toastMessage.isError ? (
                <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              )}
              <span>{toastMessage.text}</span>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by title or description..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none"
              />
            </form>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-blue-600 font-medium"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-blue-600 font-medium"
              >
                <option value="">All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>

              <Button type="button" variant="secondary" size="sm" onClick={fetchProducts}>
                Filter
              </Button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-400">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No products found</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Try adjusting your search criteria or add a new product to your inventory.
                </p>
                <div className="pt-2">
                  <Link href="/admin/products/new">
                    <Button variant="primary" size="sm" icon={Plus}>
                      Add Product
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                      <th className="py-3.5 pl-4">Image</th>
                      <th className="py-3.5">Name</th>
                      <th className="py-3.5">Category</th>
                      <th className="py-3.5">Price</th>
                      <th className="py-3.5 text-center">Total Stock</th>
                      <th className="py-3.5 text-center">Reserved Stock</th>
                      <th className="py-3.5 text-center">Available Stock</th>
                      <th className="py-3.5">Status</th>
                      <th className="py-3.5 text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => {
                      const isActionBusy = actionLoadingId === p._id;

                      return (
                        <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                          {/* Image */}
                          <td className="py-3 pl-4">
                            <div className="h-11 w-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                          </td>

                          {/* Name */}
                          <td className="py-3 pr-3">
                            <div className="font-bold text-slate-900 line-clamp-1">{p.name}</div>
                            <div className="text-[11px] text-slate-400 line-clamp-1">
                              {p.description || 'No description'}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 text-slate-600 font-medium whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                              {p.categoryId?.name || 'Uncategorized'}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            ${p.price?.toFixed(2)}
                          </td>

                          {/* Total Stock */}
                          <td className="py-3 text-center font-mono font-bold text-slate-800">
                            {p.stockQuantity}
                          </td>

                          {/* Reserved Stock */}
                          <td className="py-3 text-center font-mono text-amber-600 font-semibold">
                            {p.reservedQuantity || 0}
                          </td>

                          {/* Available Stock */}
                          <td className="py-3 text-center">
                            <span
                              className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                                p.availableStock <= 0
                                  ? 'bg-rose-50 text-rose-700'
                                  : p.availableStock <= 10
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {p.availableStock}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 whitespace-nowrap">
                            {p.isActive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 pr-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit */}
                              <Link href={`/admin/products/${p._id}/edit`}>
                                <button
                                  type="button"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="Edit product"
                                  disabled={isActionBusy}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </Link>

                              {/* Toggle Active / Inactive */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(p)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  p.isActive
                                    ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={p.isActive ? 'Deactivate product' : 'Activate product'}
                                disabled={isActionBusy}
                              >
                                <Power className="w-4 h-4" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete product permanently"
                                disabled={isActionBusy}
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
          </div>
        </PageContainer>
      </main>
    </AdminGuard>
  );
}
