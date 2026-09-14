'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import Loading, { Skeleton } from '@/components/common/Loading';
import AdminGuard from '@/components/admin/AdminGuard';
import productService from '@/services/productService';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  ArrowRight,
  Boxes,
  RotateCcw,
  TrendingUp,
  Tag,
  DollarSign,
  ExternalLink,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, productsRes] = await Promise.all([
        productService.getInventoryStats(),
        productService.getProducts({ limit: 6, sort: '-createdAt' }),
      ]);

      setStats(statsRes.data.stats);
      setRecentProducts(productsRes.data.products || []);
    } catch (err) {
      setError(err.message || 'Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <AdminGuard>
      <main className="py-8 space-y-8">
        <PageContainer>
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold uppercase tracking-wider">
                  Admin Console
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">Live Inventory Telemetry</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Product & Inventory Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDashboardData}
                icon={RotateCcw}
                isLoading={loading}
              >
                Refresh
              </Button>
              <Link href="/admin/products/new">
                <Button variant="primary" size="sm" icon={Plus}>
                  Add Product
                </Button>
              </Link>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* 4 REQUIRED DASHBOARD METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Total Products */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Products
                </span>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <div className="text-3xl font-black text-slate-900 tracking-tight">
                    {stats?.totalProducts || 0}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1">Catalog SKU entries</p>
              </div>
            </div>

            {/* 2. Active Products */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Active Products
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <div className="text-3xl font-black text-emerald-600 tracking-tight">
                    {stats?.activeProducts || 0}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {stats?.totalProducts
                    ? `${Math.round(((stats.activeProducts || 0) / stats.totalProducts) * 100)}% of total catalog`
                    : 'Visible to store'}
                </p>
              </div>
            </div>

            {/* 3. Low Stock */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Low Stock
                </span>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <div className="text-3xl font-black text-amber-600 tracking-tight">
                    {stats?.lowStockCount || 0}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1">Available units $\le$ 10</p>
              </div>
            </div>

            {/* 4. Out of Stock */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Out of Stock
                </span>
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <div className="text-3xl font-black text-rose-600 tracking-tight">
                    {stats?.outOfStockCount || 0}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1">0 available units</p>
              </div>
            </div>
          </div>

          {/* Secondary Quick Navigation / Inventory Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link
              href="/admin/products"
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Manage Products</h3>
                  <p className="text-xs text-slate-500">Edit, status toggle, pricing & catalog</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/admin/inventory"
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-purple-300 hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Inventory Status</h3>
                  <p className="text-xs text-slate-500">Total, reserved & available stock levels</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
            </Link>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Warehouse Valuation</h3>
                  <p className="text-xs text-slate-500">
                    {loading ? (
                      'Calculating...'
                    ) : (
                      <span className="font-mono font-bold text-slate-800">
                        ${stats?.totalValuation?.toLocaleString() || '0.00'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                Live
              </span>
            </div>
          </div>

          {/* Recent Products Table Preview */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Products</h2>
                <p className="text-xs text-slate-500">Latest catalog additions and inventory counts</p>
              </div>

              <Link href="/admin/products">
                <Button variant="ghost" size="sm" icon={ArrowRight}>
                  View All Products
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentProducts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No products found. Click &quot;Add Product&quot; to begin building your catalog.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                      <th className="pb-3 pl-2">Product</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Price</th>
                      <th className="pb-3">Stock (Total / Avail)</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right pr-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentProducts.map((product) => (
                      <tr key={product._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 pl-2 font-bold text-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <span className="truncate max-w-[220px]">{product.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-600">
                          {product.categoryId?.name || 'Uncategorized'}
                        </td>
                        <td className="py-3.5 font-mono font-bold text-slate-900">
                          ${product.price?.toFixed(2)}
                        </td>
                        <td className="py-3.5">
                          <span className="font-mono font-semibold text-slate-700">
                            {product.stockQuantity}
                          </span>{' '}
                          <span className="text-slate-400 font-mono">/</span>{' '}
                          <span
                            className={`font-mono font-bold ${
                              product.availableStock <= 0
                                ? 'text-rose-600'
                                : product.availableStock <= 10
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {product.availableStock}
                          </span>
                        </td>
                        <td className="py-3.5">
                          {product.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <Link href={`/admin/products/${product._id}/edit`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
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
