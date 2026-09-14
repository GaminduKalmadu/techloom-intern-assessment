'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import Loading, { Skeleton } from '@/components/common/Loading';
import AdminGuard from '@/components/admin/AdminGuard';
import adminService from '@/services/adminService';
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
  DollarSign,
  ExternalLink,
  ShoppingBag,
  CreditCard,
  Layers,
  Clock,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getDashboardMetrics();
      if (res?.success && res?.data) {
        setMetrics(res.data.metrics);
        setRecentOrders(res.data.recentOrders || []);
      } else {
        setError(res?.message || 'Failed to load telemetry metrics.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminGuard>
      <main className="py-8 space-y-8">
        <PageContainer>
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold uppercase tracking-wider">
                  Operational Telemetry
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">Real-Time Store Metrics</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Admin Operational Dashboard
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
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold mt-6">
              {error}
            </div>
          )}

          {/* 8 REQUIRED DASHBOARD METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
            {/* 1. Total Products */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Products
                </span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <div className="text-3xl font-black text-slate-900">
                    {metrics?.totalProducts ?? 0}
                  </div>
                )}
                <span className="text-[11px] font-medium text-slate-400 mt-1 block">
                  Catalog item definitions
                </span>
              </div>
            </div>

            {/* 2. Available Inventory */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Available Inventory
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Boxes className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <div className="text-3xl font-black text-emerald-600 font-mono">
                    {metrics?.availableInventory ?? 0}
                  </div>
                )}
                <span className="text-[11px] font-medium text-slate-400 mt-1 block">
                  Unreserved stock ready to sell
                </span>
              </div>
            </div>

            {/* 3. Reserved Inventory */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Reserved Inventory
                </span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <div className="text-3xl font-black text-blue-600 font-mono">
                    {metrics?.reservedInventory ?? 0}
                  </div>
                )}
                <span className="text-[11px] font-medium text-slate-400 mt-1 block">
                  Active 5-minute checkout holds
                </span>
              </div>
            </div>

            {/* 4. Total Orders */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Orders
                </span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <div className="text-3xl font-black text-slate-900 font-mono">
                    {metrics?.totalOrders ?? 0}
                  </div>
                )}
                <span className="text-[11px] font-medium text-slate-400 mt-1 block">
                  All customer checkouts
                </span>
              </div>
            </div>

            {/* 5. Confirmed Orders */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Confirmed Orders
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <div className="text-3xl font-black text-emerald-700 font-mono">
                    {metrics?.confirmedOrders ?? 0}
                  </div>
                )}
                <span className="text-[11px] font-medium text-slate-400 mt-1 block">
                  Paid & fulfilled transactions
                </span>
              </div>
            </div>

            {/* 6. Failed Orders */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Failed Orders
                </span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <div className="text-3xl font-black text-rose-600 font-mono">
                    {metrics?.failedOrders ?? 0}
                  </div>
                )}
                <span className="text-[11px] font-medium text-slate-400 mt-1 block">
                  Declined, expired, or cancelled
                </span>
              </div>
            </div>

            {/* 7. Total Revenue */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Net Revenue
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <Skeleton className="h-9 w-28" />
                ) : (
                  <div className="text-3xl font-black text-emerald-600 font-mono">
                    ${Number(metrics?.revenue || 0).toFixed(2)}
                  </div>
                )}
                <span className="text-[11px] font-medium text-slate-400 mt-1 block">
                  Settled from confirmed sales
                </span>
              </div>
            </div>

            {/* 8. Refunded Amount */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Refunded Amount
                </span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <RotateCcw className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <Skeleton className="h-9 w-28" />
                ) : (
                  <div className="text-3xl font-black text-purple-700 font-mono">
                    ${Number(metrics?.refundedAmount || 0).toFixed(2)}
                  </div>
                )}
                <span className="text-[11px] font-medium text-slate-400 mt-1 block">
                  Simulated customer refunds
                </span>
              </div>
            </div>
          </div>

          {/* Quick Module Navigation Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            <Link
              href="/admin/orders"
              className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:shadow-md hover:border-purple-300 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Orders Monitoring</h3>
                  <p className="text-xs text-slate-500">Filter, search & inspect customer orders</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </Link>

            <Link
              href="/admin/payments"
              className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Payments Ledger</h3>
                  <p className="text-xs text-slate-500">View transaction references & statuses</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </Link>

            <Link
              href="/admin/refunds"
              className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:shadow-md hover:border-purple-300 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Refunds Audit</h3>
                  <p className="text-xs text-slate-500">Track cancellation refund references</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </Link>
          </div>

          {/* Recent Orders Telemetry Preview */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4 pt-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">Recent Customer Orders</h2>
                <p className="text-xs text-slate-500">Live feed of newest incoming store orders</p>
              </div>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm" className="text-purple-600 font-bold text-xs flex items-center gap-1">
                  <span>View All Orders</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3 py-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No orders placed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="pb-3 font-bold">Order ID</th>
                      <th className="pb-3 font-bold">Customer</th>
                      <th className="pb-3 font-bold">Date</th>
                      <th className="pb-3 font-bold">Status</th>
                      <th className="pb-3 font-bold text-right">Total</th>
                      <th className="pb-3 text-right font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentOrders.map((o) => (
                      <tr key={o._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 font-mono font-bold text-slate-900">
                          #{o._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3">
                          <span className="font-bold text-slate-800 block">{o.userId?.name || 'Customer'}</span>
                          <span className="text-[11px] text-slate-400 block">{o.userId?.email || 'N/A'}</span>
                        </td>
                        <td className="py-3 text-slate-500">{formatDate(o.createdAt)}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            o.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.status === 'RESERVED'
                              ? 'bg-blue-100 text-blue-800'
                              : o.status === 'CANCELLED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono font-black text-slate-900">
                          ${Number(o.total).toFixed(2)}
                        </td>
                        <td className="py-3 text-right">
                          <Link href={`/admin/orders/${o._id}`}>
                            <Button variant="outline" size="sm" className="text-[11px] font-bold py-1 px-2.5">
                              Details
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
