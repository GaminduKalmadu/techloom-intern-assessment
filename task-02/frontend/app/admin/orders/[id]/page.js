'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import AdminGuard from '@/components/admin/AdminGuard';
import adminService from '@/services/adminService';
import {
  ArrowLeft,
  Calendar,
  User,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Receipt,
  Copy,
  Check,
  Package,
} from 'lucide-react';

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id;

  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [refund, setRefund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getOrderById(orderId);
      if (res?.success && res?.data?.order) {
        setOrder(res.data.order);
        setPayment(res.data.payment);
        setReservation(res.data.reservation);
        setRefund(res.data.refund);
      } else {
        setError(res?.message || 'Order record not found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load admin order details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const copyId = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const renderOrderStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            CONFIRMED
          </span>
        );
      case 'RESERVED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            RESERVED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            CANCELLED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            FAILED
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            EXPIRED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const renderPaymentStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            SUCCESS (PAID)
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
            REFUNDED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            PENDING
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            FAILED
          </span>
        );
      case 'TIMEOUT':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            TIMEOUT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <AdminGuard>
        <PageContainer className="py-12">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-64 bg-white rounded-3xl border border-slate-200 animate-pulse" />
          </div>
        </PageContainer>
      </AdminGuard>
    );
  }

  if (error || !order) {
    return (
      <AdminGuard>
        <PageContainer className="py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">{error || 'Order Not Found'}</h2>
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">
              Back to Orders List
            </Button>
          </Link>
        </PageContainer>
      </AdminGuard>
    );
  }

  const shortId = `#${order._id.slice(-6).toUpperCase()}`;
  const transactionRef = payment?.transactionReference || order.transactionReference;
  const refundRef = refund?.refundReference || order.refundReference;

  return (
    <AdminGuard>
      <main className="py-8 space-y-8">
        <PageContainer>
          {/* Breadcrumb & ID */}
          <div className="flex items-center justify-between">
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders Management
            </Link>

            <span className="text-xs font-mono font-bold text-slate-400">
              Admin Audit View
            </span>
          </div>

          {/* Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                    Order {shortId}
                  </h1>
                  <button
                    type="button"
                    onClick={() => copyId(order._id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                    title="Copy full MongoDB ID"
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

              {/* Status Badges */}
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

            {/* Customer & Gateway References Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Customer Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Customer Profile</span>
                </div>
                <div className="font-bold text-slate-900 text-sm">{order.customer?.name || 'Anonymous Customer'}</div>
                <div className="text-slate-500 font-mono text-[11px]">{order.customer?.email || 'N/A'}</div>
              </div>

              {/* Payment Gateway Ref Box */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-700 font-bold uppercase tracking-wider text-[10px]">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Payment Reference</span>
                </div>
                <div className="font-mono font-black text-blue-950 truncate" title={transactionRef || 'None'}>
                  {transactionRef || 'No Transaction Ref'}
                </div>
                <div className="text-blue-600 text-[11px]">
                  Status: {payment?.status || order.paymentStatus}
                </div>
              </div>

              {/* Refund Audit Box */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                <div className="flex items-center gap-1.5 text-purple-700 font-bold uppercase tracking-wider text-[10px]">
                  <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                  <span>Refund Reference</span>
                </div>
                <div className="font-mono font-black text-purple-950 truncate" title={refundRef || 'None'}>
                  {refundRef || 'Not Refunded'}
                </div>
                <div className="text-purple-600 text-[11px]">
                  {refund ? `Refund: $${Number(refund.amount).toFixed(2)}` : 'No Refund Claim'}
                </div>
              </div>
            </div>
          </div>

          {/* Detail Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Line Items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
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
                        <th className="pb-3 font-bold">Product</th>
                        <th className="pb-3 text-right font-bold">Unit Price</th>
                        <th className="pb-3 text-center font-bold">Qty</th>
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
                                  Ref: {item.productId}
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
            </div>

            {/* Price Breakdown Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">
                  Financial Settlement
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ${Number(order.subtotal || order.total).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Shipping:</span>
                    <span className="font-mono font-bold text-emerald-600">FREE</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Estimated Tax:</span>
                    <span className="font-mono font-bold text-slate-900">$0.00</span>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm font-black text-slate-900">
                    <span>Total Valuation:</span>
                    <span className="text-xl font-black font-mono text-emerald-600">
                      ${Number(order.total).toFixed(2)}
                    </span>
                  </div>

                  {order.paymentStatus === 'REFUNDED' && (
                    <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold flex justify-between items-center">
                      <span>Total Refunded:</span>
                      <span className="font-mono text-purple-700">${Number(order.total).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </main>
    </AdminGuard>
  );
}
