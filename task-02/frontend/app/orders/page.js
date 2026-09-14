'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';
import orderService from '@/services/orderService';
import {
  Package,
  ShoppingBag,
  Clock,
  Calendar,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Receipt,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function OrderHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await orderService.getMyOrders();
      if (res?.success && Array.isArray(res?.data?.orders)) {
        setOrders(res.data.orders);
      } else {
        setError(res?.message || 'Could not load your orders.');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch order history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/orders');
      } else {
        fetchOrders();
      }
    }
  }, [authLoading, isAuthenticated, router, fetchOrders]);

  // Order status badge helper
  const renderOrderStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            CONFIRMED
          </span>
        );
      case 'RESERVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            RESERVED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            FAILED
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-300">
            <Clock className="w-3 h-3 text-slate-500" />
            EXPIRED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Payment status badge helper
  const renderPaymentStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            PAID
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            PENDING
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            PAYMENT FAILED
          </span>
        );
      case 'TIMEOUT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" />
            TIMEOUT
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
            REFUNDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'CONFIRMED') return order.status === 'CONFIRMED';
    if (statusFilter === 'RESERVED') return order.status === 'RESERVED';
    if (statusFilter === 'FAILED') return order.status === 'FAILED' || order.status === 'EXPIRED';
    return true;
  });

  // Date formatter
  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    const date = new Date(isoStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || authLoading) {
    return (
      <PageContainer className="py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-10 w-48 bg-slate-200 rounded-xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-32 bg-white rounded-3xl border border-slate-200 animate-pulse" />
            <div className="h-32 bg-white rounded-3xl border border-slate-200 animate-pulse" />
            <div className="h-32 bg-white rounded-3xl border border-slate-200 animate-pulse" />
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-8 sm:py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600">
              <Package className="w-4 h-4" />
              Customer Orders
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Orders & History
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Review your previous purchases, transaction receipts, and reservation statuses.
            </p>
          </div>

          <Link href="/">
            <Button variant="outline" size="sm" className="font-bold flex items-center gap-1.5 self-start">
              <ShoppingBag className="w-3.5 h-3.5" />
              Browse Catalog
            </Button>
          </Link>
        </div>

        {/* Filter Tabs */}
        {orders.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-4 py-2 rounded-xl transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter('CONFIRMED')}
              className={`px-4 py-2 rounded-xl transition-all ${
                statusFilter === 'CONFIRMED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Confirmed ({orders.filter((o) => o.status === 'CONFIRMED').length})
            </button>
            <button
              onClick={() => setStatusFilter('RESERVED')}
              className={`px-4 py-2 rounded-xl transition-all ${
                statusFilter === 'RESERVED'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Pending / Reserved ({orders.filter((o) => o.status === 'RESERVED').length})
            </button>
            <button
              onClick={() => setStatusFilter('FAILED')}
              className={`px-4 py-2 rounded-xl transition-all ${
                statusFilter === 'FAILED'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Failed / Expired ({orders.filter((o) => o.status === 'FAILED' || o.status === 'EXPIRED').length})
            </button>
          </div>
        )}

        {/* Order Cards List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-5 shadow-sm max-w-lg mx-auto">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900">
                {statusFilter === 'ALL' ? 'No Orders Placed Yet' : 'No Matching Orders Found'}
              </h2>
              <p className="text-xs text-slate-500">
                {statusFilter === 'ALL'
                  ? 'When you check out items and complete payment, your orders will be listed here.'
                  : 'There are no orders that match the selected filter category.'}
              </p>
            </div>
            {statusFilter !== 'ALL' ? (
              <Button variant="outline" size="sm" onClick={() => setStatusFilter('ALL')}>
                Show All Orders
              </Button>
            ) : (
              <Button variant="primary" onClick={() => router.push('/')} className="font-bold">
                Start Shopping Now
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const orderNumber = `#${order._id.slice(-6).toUpperCase()}`;
              const totalItemsCount = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
              const primaryItem = order.items?.[0]?.productName || 'Catalog Product';
              const remainingCount = (order.items?.length || 1) - 1;

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all hover:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-5 group"
                >
                  {/* Left info column */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-base text-slate-900">
                        {orderNumber}
                      </span>
                      <span className="text-slate-300">•</span>
                      <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">{primaryItem}</span>
                      {remainingCount > 0 && (
                        <span className="text-slate-500"> + {remainingCount} more item{remainingCount === 1 ? '' : 's'}</span>
                      )}
                      <span className="text-slate-400 font-normal"> ({totalItemsCount} units total)</span>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {renderOrderStatusBadge(order.status)}
                      {renderPaymentStatusBadge(order.paymentStatus)}
                    </div>
                  </div>

                  {/* Right Price & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 gap-3">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Total Amount
                      </span>
                      <span className="text-lg sm:text-xl font-black font-mono text-slate-900">
                        ${Number(order.total).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.status === 'RESERVED' && order.paymentStatus === 'PENDING' && (
                        <Link href={`/payment/${order._id}`}>
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-xs font-bold"
                          >
                            Pay Now
                          </Button>
                        </Link>
                      )}
                      <Link href={`/orders/${order._id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-bold flex items-center gap-1 group-hover:border-slate-400 transition-colors"
                        >
                          <span>View Details</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
