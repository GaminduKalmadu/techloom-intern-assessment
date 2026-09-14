'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import AdminGuard from '@/components/admin/AdminGuard';
import adminService from '@/services/adminService';
import {
  ShoppingBag,
  Filter,
  Search,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Calendar,
  User,
  ArrowUpDown,
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [orderStatus, setOrderStatus] = useState('ALL');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (orderStatus !== 'ALL') params.orderStatus = orderStatus;
      if (paymentStatus !== 'ALL') params.paymentStatus = paymentStatus;
      if (search.trim()) params.search = search.trim();

      const res = await adminService.getOrders(params);
      if (res?.success && res?.data) {
        setOrders(res.data.orders || []);
      } else {
        setError(res?.message || 'Failed to retrieve orders.');
      }
    } catch (err) {
      setError(err.message || 'Error loading orders list.');
    } finally {
      setLoading(false);
    }
  }, [orderStatus, paymentStatus, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOrderStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            CONFIRMED
          </span>
        );
      case 'RESERVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 text-blue-600" />
            RESERVED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            CANCELLED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3 text-rose-600" />
            FAILED
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-700">
            <Clock className="w-3 h-3 text-slate-500" />
            EXPIRED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const renderPaymentStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            SUCCESS
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <RotateCcw className="w-3 h-3 text-purple-600" />
            REFUNDED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            PENDING
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            FAILED
          </span>
        );
      case 'TIMEOUT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
            TIMEOUT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <AdminGuard>
      <main className="py-8 space-y-6">
        <PageContainer>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href="/admin" className="text-xs font-bold text-purple-600 hover:text-purple-700">
                  Dashboard
                </Link>
                <span className="text-xs text-slate-400">/</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Orders</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Customer Orders Monitoring
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Audited visibility into all customer orders, transactions, and status lifecycles.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              icon={RotateCcw}
              isLoading={loading}
              className="self-start sm:self-auto font-bold"
            >
              Refresh
            </Button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Filters Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Order Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Order Status:</span>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="RESERVED">RESERVED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>

              {/* Payment Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Payment Status:</span>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="ALL">All Payments</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REFUNDED">REFUNDED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="TIMEOUT">TIMEOUT</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Order ID..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading orders data...</div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="text-sm font-black text-slate-700">No Orders Found</h3>
                <p className="text-xs text-slate-400">Try adjusting your status filters or search term.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Order ID</th>
                      <th className="py-3.5 px-4 font-bold">Customer</th>
                      <th className="py-3.5 px-4 font-bold">Date</th>
                      <th className="py-3.5 px-4 font-bold text-right">Total</th>
                      <th className="py-3.5 px-4 font-bold">Order Status</th>
                      <th className="py-3.5 px-4 font-bold">Payment Status</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => {
                      const shortId = `#${order._id.slice(-6).toUpperCase()}`;
                      return (
                        <tr key={order._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-4">
                            <span className="font-mono font-black text-slate-900 block">{shortId}</span>
                            <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[120px]">
                              {order._id}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-bold text-slate-800 block">
                              {order.customer?.name || 'Customer'}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {order.customer?.email || 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-600">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-black text-slate-900 text-sm">
                            ${Number(order.total).toFixed(2)}
                          </td>
                          <td className="py-4 px-4">
                            {renderOrderStatusBadge(order.status)}
                          </td>
                          <td className="py-4 px-4">
                            {renderPaymentStatusBadge(order.paymentStatus)}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Link href={`/admin/orders/${order._id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs font-bold py-1 px-3 flex items-center gap-1 inline-flex"
                              >
                                <span>View Details</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              </Button>
                            </Link>
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
