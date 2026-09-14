'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import Loading, { Skeleton } from '@/components/common/Loading';
import AdminGuard from '@/components/admin/AdminGuard';
import productService from '@/services/productService';
import {
  Boxes,
  Package,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  Edit2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [prodRes, statsRes] = await Promise.all([
        productService.getProducts({ limit: 100 }),
        productService.getInventoryStats(),
      ]);

      setProducts(prodRes.data.products || []);
      setStats(statsRes.data.stats || null);
    } catch (err) {
      console.error('Failed to load inventory data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Filter products by search and status
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.categoryId?.name?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'in_stock') return p.availableStock > 10;
    if (statusFilter === 'low_stock') return p.availableStock > 0 && p.availableStock <= 10;
    if (statusFilter === 'out_of_stock') return p.availableStock <= 0;

    return true;
  });

  const getStatusBadge = (availableStock) => {
    if (availableStock <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
          <XCircle className="w-3.5 h-3.5" />
          Out of Stock
        </span>
      );
    }
    if (availableStock <= 10) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
          <AlertTriangle className="w-3.5 h-3.5" />
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
        <CheckCircle2 className="w-3.5 h-3.5" />
        In Stock
      </span>
    );
  };

  return (
    <AdminGuard>
      <main className="py-8 space-y-6">
        <PageContainer size="lg">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href="/admin" className="text-xs text-slate-400 hover:text-purple-600 transition-colors">
                  Admin Console
                </Link>
                <span className="text-xs text-slate-300">/</span>
                <span className="text-xs font-bold text-purple-700">Inventory</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Live Inventory & Stock Health
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchInventory}
                icon={RotateCcw}
                isLoading={loading}
              >
                Refresh
              </Button>
              <Link href="/admin/products">
                <Button variant="secondary" size="sm">
                  Manage Catalog
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Total Physical Units
              </span>
              <div className="font-mono text-2xl font-black text-slate-900">
                {loading ? <Skeleton className="h-8 w-16" /> : stats?.totalStock || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Across all catalog SKUs</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Reserved Stock
                </span>
                <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-bold">
                  Locked
                </span>
              </div>
              <div className="font-mono text-2xl font-black text-amber-600">
                {loading ? <Skeleton className="h-8 w-16" /> : stats?.totalReserved || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Active checkout holds</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Available to Sell
              </span>
              <div className="font-mono text-2xl font-black text-emerald-600">
                {loading ? <Skeleton className="h-8 w-16" /> : stats?.totalAvailable || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Stock - Reserved</p>
            </div>
          </div>

          {/* Controls: Search & Tabs */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="w-full md:w-80 relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by product name..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Items ({products.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('in_stock')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'in_stock'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                In Stock ({stats?.inStockCount || 0})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('low_stock')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'low_stock'
                    ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Low Stock ({stats?.lowStockCount || 0})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('out_of_stock')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'out_of_stock'
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Out of Stock ({stats?.outOfStockCount || 0})
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <p className="text-sm font-bold text-slate-700">No matching inventory records</p>
                <p className="text-xs text-slate-400">
                  Try clearing the search query or status filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                      <th className="py-3.5 pl-4">Product</th>
                      <th className="py-3.5 text-center">Total Stock</th>
                      <th className="py-3.5 text-center">Reserved Stock</th>
                      <th className="py-3.5 text-center">Available Stock</th>
                      <th className="py-3.5">Inventory Status</th>
                      <th className="py-3.5 text-right pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Product */}
                        <td className="py-3 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                              ) : (
                                <Package className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{p.name}</span>
                              <span className="text-[11px] text-slate-400">
                                {p.categoryId?.name || 'Uncategorized'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Total Stock */}
                        <td className="py-3 text-center font-mono font-bold text-slate-800">
                          {p.stockQuantity}
                        </td>

                        {/* Reserved Stock */}
                        <td className="py-3 text-center font-mono font-semibold text-amber-600">
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

                        {/* Status Badge */}
                        <td className="py-3">{getStatusBadge(p.availableStock)}</td>

                        {/* Action */}
                        <td className="py-3 pr-4 text-right">
                          <Link href={`/admin/products/${p._id}/edit`}>
                            <Button variant="outline" size="sm" icon={Edit2}>
                              Update Stock
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
