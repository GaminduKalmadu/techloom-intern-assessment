'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';
import checkoutService from '@/services/checkoutService';
import paymentService from '@/services/paymentService';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Lock,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Info,
  XCircle,
  HelpCircle,
  Package,
} from 'lucide-react';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId;

  const { isAuthenticated, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [error, setError] = useState(null);

  // Card form state
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  // Payment process state: 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT'
  const [paymentState, setPaymentState] = useState('IDLE');
  const [paymentResult, setPaymentResult] = useState(null);

  // Reservation countdown timer
  const [timeLeftMs, setTimeLeftMs] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  // Fetch Order and linked Reservation
  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError(null);
      const res = await checkoutService.getCheckoutOrder(orderId);

      if (res?.success && res?.data?.order) {
        setOrder(res.data.order);
        setReservation(res.data.reservation);

        // Check if already paid
        if (res.data.order.status === 'CONFIRMED' || res.data.order.paymentStatus === 'SUCCESS') {
          setPaymentState('SUCCESS');
          setPaymentResult({
            status: 'SUCCESS',
            orderId: res.data.order._id,
            amount: res.data.order.total,
          });
          return;
        }

        // Check if failed or expired already
        if (res.data.order.status === 'FAILED') {
          setPaymentState('FAILED');
          return;
        }

        if (res.data.order.status === 'EXPIRED' || res.data.order.paymentStatus === 'TIMEOUT') {
          setPaymentState('TIMEOUT');
          setIsExpired(true);
          return;
        }

        // Calculate authoritative time remaining
        if (res.data.reservation?.expiresAt) {
          const expiresAt = new Date(res.data.reservation.expiresAt).getTime();
          const remaining = expiresAt - Date.now();
          if (remaining <= 0 || res.data.reservation.status === 'EXPIRED') {
            setTimeLeftMs(0);
            setIsExpired(true);
            setPaymentState('TIMEOUT');
          } else {
            setTimeLeftMs(remaining);
            setIsExpired(false);
          }
        }
      } else {
        setError(res?.message || 'Could not load order for payment.');
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve order details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push(`/login?redirect=/payment/${orderId}`);
      } else {
        fetchOrderDetails();
      }
    }
  }, [authLoading, isAuthenticated, router, orderId, fetchOrderDetails]);

  // Live Countdown Interval
  useEffect(() => {
    if (!reservation?.expiresAt || isExpired || paymentState === 'SUCCESS') return;

    const expiresAt = new Date(reservation.expiresAt).getTime();

    const interval = setInterval(() => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        setTimeLeftMs(0);
        setIsExpired(true);
        if (paymentState === 'IDLE') {
          setPaymentState('TIMEOUT');
        }
        clearInterval(interval);
      } else {
        setTimeLeftMs(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation, isExpired, paymentState]);

  // Helper formatting MM:SS
  const formatTime = (ms) => {
    if (ms === null || ms <= 0) return '00:00';
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Card input formatting
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      setExpiryDate(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setExpiryDate(raw);
    }
  };


  // Handle Payment Submission
  const handlePayNow = async (e) => {
    if (e) e.preventDefault();
    if (isExpired || paymentState === 'PROCESSING') return;

    try {
      setPaymentState('PROCESSING');
      setError(null);

      // Generate a unique idempotency key for this payment attempt
      const idempotencyKey = `idemp_${order._id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const payload = {
        orderId: order._id,
        idempotencyKey,
        cardNumber,
        cardholderName,
        expiryDate,
        cvv, // Sent to mock validator only, backend never stores CVV
      };

      const res = await paymentService.processPayment(payload);

      if (res?.data?.status === 'SUCCESS') {
        setPaymentState('SUCCESS');
        setPaymentResult(res.data);
        setTimeout(() => {
          router.push(`/order-confirmation/${order._id}`);
        }, 800);
      } else if (res?.data?.status === 'FAILED') {
        setPaymentState('FAILED');
        setPaymentResult(res.data);
      } else if (res?.data?.status === 'TIMEOUT') {
        setPaymentState('TIMEOUT');
        setIsExpired(true);
        setPaymentResult(res.data);
      } else if (res?.message?.includes('already been paid')) {
        setPaymentState('SUCCESS');
        setPaymentResult({
          status: 'SUCCESS',
          orderId: order._id,
          message: res.message,
        });
      } else {
        setPaymentState('FAILED');
        setError(res?.message || 'Payment processing failed');
      }
    } catch (err) {
      if (err.status === 409 || err.message?.includes('expired')) {
        setPaymentState('TIMEOUT');
        setIsExpired(true);
      } else {
        setPaymentState('FAILED');
        setError(err.message || 'Payment execution failed');
      }
    }
  };

  // 1. Loading Skeleton
  if (loading || authLoading) {
    return (
      <PageContainer className="py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
          <div className="h-64 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm animate-pulse" />
        </div>
      </PageContainer>
    );
  }

  // 2. Error / Not Found View
  if (error && !order) {
    return (
      <PageContainer className="py-16">
        <div className="max-w-md mx-auto text-center bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-black text-slate-900">Order Not Found</h1>
            <p className="text-xs text-slate-500">{error}</p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push('/cart')}
            className="w-full py-3 rounded-xl font-bold"
          >
            Return to Cart
          </Button>
        </div>
      </PageContainer>
    );
  }

  // ----------------------------------------------------
  // RESULT STATE: Payment Successful
  // ----------------------------------------------------
  if (paymentState === 'SUCCESS') {
    return (
      <PageContainer className="py-12">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl shadow-emerald-500/5 text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Payment Confirmed
            </span>
            <h1 className="text-2xl font-black text-slate-900">Thank You For Your Order!</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your mock payment has cleared. Inventory has been permanently deducted from stock and your order is confirmed.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Order Reference:</span>
              <strong className="font-mono text-slate-900">#{order._id.slice(-6).toUpperCase()}</strong>
            </div>
            {paymentResult?.transactionReference && (
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Ref:</span>
                <strong className="font-mono text-slate-900">{paymentResult.transactionReference}</strong>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Amount:</span>
              <strong className="text-emerald-600 font-black text-sm">${order.total.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Inventory Status:</span>
              <span className="text-slate-700 font-bold">Permanently Deducted</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="primary"
              onClick={() => router.push(`/order-confirmation/${order._id}`)}
              className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              View Order Confirmation
            </Button>
            <Button
              variant="outline"
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
              Continue Shopping Catalog
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  // ----------------------------------------------------
  // RESULT STATE: Payment Failed
  // ----------------------------------------------------
  if (paymentState === 'FAILED') {
    return (
      <PageContainer className="py-12">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-rose-200 shadow-xl shadow-rose-500/5 text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <XCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-800">
              Payment Declined
            </span>
            <h1 className="text-2xl font-black text-slate-900">Payment Was Not Completed</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your mock test card was declined (Rule: <code className="bg-slate-100 px-1 py-0.5 rounded">4000...0002</code>). As per system rules, reserved inventory has been safely released back to available catalog.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 text-xs text-rose-900 text-left space-y-1">
            <p className="font-bold">Inventory Released Safely:</p>
            <p className="leading-relaxed text-rose-800">
              Order status is marked <strong>FAILED</strong>. Reserved quantities were restored to available stock to prevent locking up inventory.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="primary"
              onClick={() => {
                setPaymentState('IDLE');
              }}
              className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Another Payment Card
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push('/cart')}
              className="w-full py-3 rounded-xl font-bold"
            >
              Return to Cart
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  // ----------------------------------------------------
  // RESULT STATE: Payment Timed Out
  // ----------------------------------------------------
  if (paymentState === 'TIMEOUT') {
    return (
      <PageContainer className="py-12">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-amber-200 shadow-xl shadow-amber-500/5 text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800">
              Reservation Timed Out
            </span>
            <h1 className="text-2xl font-black text-slate-900">Stock Hold Has Expired</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              The 5-minute reservation window has elapsed. As per concurrency rules, all reserved units were transactionally restored to available inventory.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 text-xs text-amber-900 text-left space-y-1">
            <p className="font-bold">Order & Stock Status:</p>
            <p className="leading-relaxed text-amber-800">
              Order status is marked <strong>EXPIRED</strong> and payment status is <strong>TIMEOUT</strong>. Please return to your shopping cart to re-verify stock and initiate a fresh reservation.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="primary"
              onClick={() => router.push('/cart')}
              className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Return to Cart & Re-Reserve
            </Button>
            <Link
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-slate-800 py-1 transition-colors"
            >
              Explore Public Catalog
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  // ----------------------------------------------------
  // ACTIVE PAYMENT FORM STATE (with Processing Overlay)
  // ----------------------------------------------------
  return (
    <PageContainer className="py-8 sm:py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Navigation & Trust Header */}
        <div className="flex items-center justify-between">
          <Link
            href={`/checkout?orderId=${order._id}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Checkout
          </Link>

          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-Bit SSL Encrypted Mock Gateway</span>
          </div>
        </div>

        {/* Order Summary & Expiration Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-slate-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-blue-300">
              Mock Payment Authorization
            </span>
            <h1 className="text-xl sm:text-2xl font-black">Order #{order._id.slice(-6).toUpperCase()}</h1>
            <p className="text-xs text-slate-300">
              Authorizing payment for <strong>{order.items?.length || 0} reserved items</strong>
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Amount Due */}
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Due</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">${order.total.toFixed(2)}</span>
            </div>

            {/* Countdown Badge */}
            <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center font-mono">
              <span className="text-xl font-black tracking-wider block">{formatTime(timeLeftMs)}</span>
              <span className="text-[9px] uppercase font-sans tracking-widest text-slate-300 font-bold">
                Remaining
              </span>
            </div>
          </div>
        </div>


        {/* Card Mockup Visual */}
        <div className="relative mx-auto max-w-sm rounded-3xl p-6 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl border border-slate-800 space-y-6">
          <div className="flex justify-between items-center">
            <div className="w-10 h-8 rounded-lg bg-amber-400/80 border border-amber-300 shadow-inner flex items-center justify-center">
              <div className="w-6 h-4 border-t border-b border-amber-600 opacity-60" />
            </div>
            <span className="font-black text-sm tracking-wider text-blue-400">VISA</span>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-widest text-slate-400">Card Number</span>
            <div className="font-mono text-lg tracking-widest font-black">
              {cardNumber || '•••• •••• •••• ••••'}
            </div>
          </div>

          <div className="flex justify-between items-end text-xs">
            <div>
              <span className="text-[8px] uppercase tracking-widest text-slate-400 block">Cardholder</span>
              <span className="font-bold truncate max-w-[150px] block">{cardholderName || 'JANE CUSTOMER'}</span>
            </div>
            <div>
              <span className="text-[8px] uppercase tracking-widest text-slate-400 block">Expires</span>
              <span className="font-mono font-bold">{expiryDate || 'MM/YY'}</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handlePayNow} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="space-y-4">
            {/* Cardholder Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Cardholder Name</label>
              <input
                type="text"
                required
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Full name as appears on card"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Card Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Card Number</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="4111 1111 1111 1111"
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              </div>
            </div>

            {/* Expiry Date & CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Expiry Date</label>
                <input
                  type="text"
                  required
                  value={expiryDate}
                  onChange={handleExpiryChange}
                  placeholder="MM/YY"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">CVV</label>
                  <span className="text-[10px] text-slate-400 font-medium">Never Saved</span>
                </div>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                  placeholder="123"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* PCI Security Guarantee Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs text-slate-500">
            <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>PCI DSS Compliant Mock Gateway:</strong> Sensitive CVV and card numbers are evaluated in-memory and <strong>never stored in the database</strong>.
            </p>
          </div>

          {/* Submit Action */}
          <div className="pt-2 space-y-3">
            <Button
              type="submit"
              variant="primary"
              disabled={paymentState === 'PROCESSING' || isExpired}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-base shadow-lg ${
                isExpired
                  ? 'opacity-50 cursor-not-allowed bg-slate-300 text-slate-500 shadow-none'
                  : 'shadow-blue-500/25'
              }`}
            >
              {paymentState === 'PROCESSING' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay Now (${order.total.toFixed(2)})
                </>
              )}
            </Button>

            {isExpired && (
              <p className="text-[11px] text-center font-bold text-rose-600">
                Reservation expired. Return to cart to reserve items again.
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Payment Processing Modal Overlay */}
      {paymentState === 'PROCESSING' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-slate-900">Authorizing Payment</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Contacting mock payment processor and updating concurrency-safe database holds...
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 font-mono">
              Order #{order._id.slice(-6).toUpperCase()} • ${order.total.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
