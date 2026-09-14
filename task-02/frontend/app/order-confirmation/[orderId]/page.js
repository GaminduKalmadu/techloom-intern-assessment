'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';
import orderService from '@/services/orderService';
import {
  CheckCircle2,
  Package,
  ShoppingBag,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Receipt,
  AlertCircle,
  FileText,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId;

  const { isAuthenticated, loading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await orderService.getOrderById(orderId);
      if (res?.success && res?.data?.order) {
        setOrder(res.data.order);
        setPayment(res.data.payment);
      } else {
        setError(res?.message || 'Unable to locate order confirmation.');
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve order confirmation details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push(`/login?redirect=/order-confirmation/${orderId}`);
      } else {
        fetchOrder();
      }
    }
  }, [authLoading, isAuthenticated, orderId, fetchOrder, router]);

  // Loading Skeleton
  if (loading || authLoading) {
    return (
      <PageContainer className="py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="h-44 bg-white/60 border border-slate-200 rounded-3xl p-8 shadow-sm animate-pulse" />
          <div className="h-64 bg-white/60 border border-slate-200 rounded-3xl p-8 shadow-sm animate-pulse" />
        </div>
      </PageContainer>
    );
  }

  // Error State
  if (error || !order) {
    return (
      <PageContainer className="py-16">
        <div className="max-w-md mx-auto text-center bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-black text-slate-900">Order Notice</h1>
            <p className="text-xs text-slate-500">{error || 'Order record not found or inaccessible.'}</p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="primary"
              onClick={() => router.push('/orders')}
              className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" />
              View My Orders
            </Button>
            <Link
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-slate-800 py-1 transition-colors"
            >
              Return to Catalog Home
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  const transactionRef = payment?.transactionReference || order.transactionReference || 'TXN_SIMULATED_SUCCESS';
  const orderNumber = order._id ? `#${order._id.slice(-6).toUpperCase()}` : '#ORD';

  return (
    <PageContainer className="py-8 sm:py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Success Header Hero */}
        <div className="bg-gradient-to-br from-emerald-50 via-white to-blue-50/40 rounded-3xl p-8 sm:p-10 border border-emerald-200/80 shadow-xl shadow-emerald-500/5 text-center relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl -z-0 pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 ring-8 ring-emerald-100 animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Payment Successful
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Order Confirmed & Paid
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Your payment was processed successfully. The reserved inventory has been officially deducted and your order is confirmed.
              </p>
            </div>

            {/* Quick Metadata Pill Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-2xl mx-auto text-left">
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Order Number
                </span>
                <span className="text-sm font-black font-mono text-slate-900">{orderNumber}</span>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Transaction Ref
                </span>
                <span className="text-xs font-black font-mono text-blue-700 truncate block" title={transactionRef}>
                  {transactionRef}
                </span>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Order Status
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {order.status}
                </span>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Payment Status
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-black text-blue-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Purchased Products Breakdown Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <Receipt className="w-5 h-5 text-slate-700" />
              <h2 className="text-base font-black text-slate-900">Purchased Products</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Line Items List */}
          <div className="divide-y divide-slate-100">
            {order.items?.map((item, index) => {
              const itemTotal = Number(item.price || 0) * Number(item.quantity || 1);
              return (
                <div key={item._id || index} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-black text-slate-900">{item.productName}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Qty: <strong>{item.quantity}</strong></span>
                      <span>•</span>
                      <span>Unit Price: <strong>${Number(item.price).toFixed(2)}</strong></span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 font-mono">
                      ${itemTotal.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Subtotal</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Valuation Summary */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Subtotal:</span>
              <span className="font-mono text-slate-900">${Number(order.subtotal || order.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Standard Shipping:</span>
              <span className="font-mono text-emerald-600 font-bold">FREE</span>
            </div>
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Estimated Tax (0%):</span>
              <span className="font-mono text-slate-900">$0.00</span>
            </div>
            <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center text-sm font-black text-slate-900">
              <span>Grand Total Paid:</span>
              <span className="text-xl font-black font-mono text-emerald-600">
                ${Number(order.total).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              variant="primary"
              onClick={() => router.push('/')}
              className="w-full sm:flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10"
            >
              <ShoppingBag className="w-4 h-4" />
              Continue Shopping
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/orders')}
              className="w-full sm:flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" />
              View My Orders
            </Button>
          </div>

          <div className="text-center">
            <Link
              href={`/orders/${order._id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <span>View detailed order receipt page</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
