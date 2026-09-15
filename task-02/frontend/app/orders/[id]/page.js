'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';
import orderService from '@/services/orderService';
import {
  ArrowLeft,
  Package,
  Calendar,
  CreditCard,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Receipt,
  ShoppingBag,
  ExternalLink,
  Ban,
  Info,
  Copy,
  Check,
  RotateCcw,
  RefreshCw,
  X,
  Sparkles,
} from 'lucide-react';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id;

  const { isAuthenticated, loading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [refund, setRefund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Cancellation modal & execution state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await orderService.getOrderById(orderId);
      if (res?.success && res?.data?.order) {
        setOrder(res.data.order);
        setPayment(res.data.payment);
        setReservation(res.data.reservation);
        setRefund(res.data.refund);
      } else {
        setError(res?.message || 'Could not find the requested order.');
      }
    } catch (err) {
      if (err.status === 403 || err.message?.includes('Forbidden')) {
        setError('Access Denied: You do not have authorization to view this order.');
      } else {
        setError(err.message || 'Failed to retrieve order details.');
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push(`/login?redirect=/orders/${orderId}`);
      } else {
        fetchOrder();
      }
    }
  }, [authLoading, isAuthenticated, orderId, router, fetchOrder]);

  const copyOrderId = () => {
    if (!order?._id) return;
    navigator.clipboard.writeText(order._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Cancellation action handler
  const handleConfirmCancel = async () => {
    if (!order?._id) return;
    try {
      setCancelling(true);
      setCancelError(null);

      const res = await orderService.cancelOrder(order._id);

      if (res?.success && res?.data) {
        setCancelSuccess(true);
        setOrder(res.data.order);
        setRefund({
          refundReference: res.data.refundReference,
          amount: res.data.refundAmount,
          status: 'SUCCESS',
        });
        setShowCancelModal(false);
      } else {
        setCancelError(res?.message || 'Failed to cancel order.');
      }
    } catch (err) {
      setCancelError(err.message || 'An error occurred while attempting to cancel this order.');
    } finally {
      setCancelling(false);
    }
  };

  // Status badge helpers matching assessment specs
  const renderOrderStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            CONFIRMED
          </span>
        );
      case 'RESERVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            RESERVED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            FAILED
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-300 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            EXPIRED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const renderPaymentStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            SUCCESS (PAID)
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            PENDING PAYMENT
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            FAILED
          </span>
        );
      case 'TIMEOUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            TIMEOUT
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-300 shadow-xs">
            <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
            REFUNDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    const date = new Date(isoStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading || authLoading) {
    return (
      <PageContainer className="py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-44 bg-white rounded-3xl border border-slate-200 animate-pulse" />
          <div className="h-64 bg-white rounded-3xl border border-slate-200 animate-pulse" />
        </div>
      </PageContainer>
    );
  }

  if (error || !order) {
    return (
      <PageContainer className="py-16">
        <div className="max-w-md mx-auto text-center bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-black text-slate-900">Order Unavailable</h1>
            <p className="text-xs text-slate-500">{error || 'This order could not be retrieved.'}</p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="primary"
              onClick={() => router.push('/orders')}
              className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" />
              Return to My Orders
            </Button>
            <Link
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-slate-800 py-1 transition-colors"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  const transactionRef = payment?.transactionReference || order.transactionReference;
  const activeRefundRef = refund?.refundReference || order.refundReference;
  const orderShortNumber = `#${order._id.slice(-6).toUpperCase()}`;

  // Assessment Eligibility: Only CONFIRMED + SUCCESS orders can be cancelled
  const isEligibleForCancellation = order.status === 'CONFIRMED' && order.paymentStatus === 'SUCCESS';
  const isCancelledAndRefunded = order.status === 'CANCELLED' && order.paymentStatus === 'REFUNDED';

  return (
    <PageContainer className="py-8 sm:py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders List
          </Link>

          <span className="text-xs font-mono font-bold text-slate-400">
            Internal ID: {order._id.slice(0, 10)}...
          </span>
        </div>

        {/* Live Cancellation / Refund Success Banner */}
        {(cancelSuccess || isCancelledAndRefunded) && (
          <div className="bg-gradient-to-r from-purple-50 via-emerald-50 to-blue-50 rounded-3xl p-6 border border-emerald-300 shadow-lg shadow-emerald-500/5 space-y-3 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Order Cancelled &bull; Refund Successful
                  </h2>
                  <p className="text-xs text-slate-600">
                    Your cancellation was authorized. The full purchase amount of <strong>${Number(order.total).toFixed(2)}</strong> has been refunded and items returned to stock.
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                REFUND COMPLETE
              </span>
            </div>

            {activeRefundRef && (
              <div className="p-3 bg-white/90 rounded-2xl border border-emerald-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-950 font-medium">
                  <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Refund Reference:</span>
                  <code className="font-mono font-black bg-emerald-100/70 px-2 py-0.5 rounded text-emerald-900">
                    {activeRefundRef}
                  </code>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  Order Status: CANCELLED &bull; Payment: REFUNDED
                </span>
              </div>
            )}
          </div>
        )}

        {/* Order Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                  Order {orderShortNumber}
                </h1>
                <button
                  type="button"
                  onClick={copyOrderId}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                  title="Copy full Order ID"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Placed on <strong>{formatDate(order.createdAt)}</strong></span>
                </div>
                <span>•</span>
                <span className="font-mono text-[11px] text-slate-400">ID: {order._id}</span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center sm:flex-col sm:items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Order:</span>
                {renderOrderStatusBadge(order.status)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Payment:</span>
                {renderPaymentStatusBadge(order.paymentStatus)}
              </div>
            </div>
          </div>

          {/* References & Gateway Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {transactionRef && (
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-blue-900 font-medium">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Payment Ref:</span>
                  <code className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-800">
                    {transactionRef}
                  </code>
                </div>
                <span className="text-[10px] text-blue-600 font-bold uppercase">Authorized</span>
              </div>
            )}

            {activeRefundRef && (
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-purple-900 font-medium">
                  <RotateCcw className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Refund Ref:</span>
                  <code className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-purple-200 text-purple-800">
                    {activeRefundRef}
                  </code>
                </div>
                <span className="text-[10px] text-purple-700 font-bold uppercase">Refunded</span>
              </div>
            )}
          </div>
        </div>

        {/* Two-Column Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Items Table + Cancellation Module */}
          <div className="lg:col-span-2 space-y-6">
            {/* Purchased Items Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-slate-700" />
                  <h2 className="text-base font-black text-slate-900">Purchased Items</h2>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {order.items?.length || 0} Line Item{order.items?.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="pb-3 font-bold">Product Name</th>
                      <th className="pb-3 text-right font-bold">Unit Price</th>
                      <th className="pb-3 text-center font-bold">Quantity</th>
                      <th className="pb-3 text-right font-bold">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items?.map((item, idx) => {
                      const unitPrice = Number(item.price || 0);
                      const qty = Number(item.quantity || 1);
                      const lineTotal = unitPrice * qty;

                      return (
                        <tr key={item._id || idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 pr-4">
                            <span className="font-bold text-slate-900 text-sm block">
                              {item.productName}
                            </span>
                            {item.productId && (
                              <span className="text-[10px] font-mono text-slate-400 block">
                                Ref: {item.productId.slice(-6)}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 text-right font-mono text-slate-700">
                            ${unitPrice.toFixed(2)}
                          </td>
                          <td className="py-3.5 text-center font-mono font-bold text-slate-800">
                            × {qty}
                          </td>
                          <td className="py-3.5 text-right font-mono font-black text-slate-900 text-sm">
                            ${lineTotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Interactive Order Cancellation & Refund Module */}
            {isEligibleForCancellation ? (
              <div className="bg-rose-50/50 rounded-3xl p-6 sm:p-7 border border-rose-200/80 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-rose-950 font-black text-sm">
                    <Ban className="w-4 h-4 text-rose-600" />
                    <span>Order Cancellation & Refund Option</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                    Eligible for Refund
                  </span>
                </div>

                <p className="text-xs text-rose-800 leading-relaxed">
                  As this order is confirmed and paid, you are eligible to cancel it before dispatch. Cancelling will immediately restore all purchased items back to available inventory and initiate a simulated refund for <strong>${Number(order.total).toFixed(2)}</strong>.
                </p>

                {cancelError && (
                  <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-xs text-rose-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{cancelError}</span>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="px-5 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Cancel Order & Request Refund</span>
                  </button>
                </div>
              </div>
            ) : isCancelledAndRefunded ? (
              <div className="bg-slate-50 rounded-3xl p-6 sm:p-7 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                    <RotateCcw className="w-4 h-4 text-purple-600" />
                    <span>Cancellation Record</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    Completed
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This order has been cancelled and refunded. The purchased inventory was returned to available stock and a refund of <strong>${Number(order.total).toFixed(2)}</strong> was generated.
                </p>
              </div>
            ) : null}
          </div>

          {/* Right Column: Valuation & Status */}
          <div className="space-y-6">
            {/* Price Summary Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">
                Payment Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ${Number(order.subtotal || order.total).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Standard Shipping:</span>
                  <span className="font-mono font-bold text-emerald-600">FREE</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Estimated Tax:</span>
                  <span className="font-mono font-bold text-slate-900">$0.00</span>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Order Total:</span>
                  <span className={`text-xl font-black font-mono ${isCancelledAndRefunded ? 'text-slate-400 line-through' : 'text-emerald-600'}`}>
                    ${Number(order.total).toFixed(2)}
                  </span>
                </div>

                {isCancelledAndRefunded && (
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex justify-between items-center font-bold">
                    <span>Refunded to Customer:</span>
                    <span className="font-mono text-purple-700">${Number(order.total).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Conditional Action: If Pending/Reserved, offer to complete payment */}
              {order.status === 'RESERVED' && order.paymentStatus === 'PENDING' && (
                <div className="pt-2">
                  <Link href={`/payment/${order._id}`}>
                    <Button
                      variant="primary"
                      className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
                    >
                      <CreditCard className="w-4 h-4" />
                      Complete Payment Now
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Customer Support Notice */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Need assistance with this order?</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Please retain your Order Number <strong>{orderShortNumber}</strong> and Transaction Reference for any customer support inquiries.
              </p>
              <div className="pt-1">
                <Link href="/">
                  <Button variant="outline" size="sm" className="w-full font-bold">
                    Return to Store
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog Modal */}
      {/* Assessment Requirement: "On click: show confirmation dialog. Example: 'Are you sure you want to cancel this order?'" */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200 relative">
            <button
              type="button"
              onClick={() => !cancelling && setShowCancelModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              disabled={cancelling}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Cancel Order & Refund</h3>
                <span className="text-xs text-slate-400 font-mono">Order {orderShortNumber}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p className="text-sm font-bold text-slate-800">
                Are you sure you want to cancel this order?
              </p>
              <p>
                This action will immediately cancel your order, return the purchased products back to available catalog inventory, and process a simulated refund of <strong className="text-emerald-700 font-mono font-black">${Number(order.total).toFixed(2)}</strong>.
              </p>

              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-[11px] text-rose-800 space-y-1">
                <div className="font-bold">Summary of refund:</div>
                <div className="flex justify-between">
                  <span>Refund Amount:</span>
                  <strong className="font-mono">${Number(order.total).toFixed(2)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Restored Units:</span>
                  <strong className="font-mono">{order.items?.reduce((s, i) => s + (i.quantity || 1), 0)} items</strong>
                </div>
              </div>
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-xs text-rose-900">
                {cancelError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl font-bold"
              >
                Keep Order
              </Button>

              <Button
                variant="primary"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 border-rose-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
              >
                {cancelling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    <span>Yes, Cancel Order</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
