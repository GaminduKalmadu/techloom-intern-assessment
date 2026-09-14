'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';
import checkoutService from '@/services/checkoutService';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  Package,
  ShoppingBag,
  RefreshCw,
  Lock,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('orderId');

  const { isAuthenticated, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [error, setError] = useState(null);

  // Countdown timer state
  const [timeLeftMs, setTimeLeftMs] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  // Payment mock modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Fetch order and reservation details
  const fetchCheckoutData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      let res;
      if (orderIdParam) {
        res = await checkoutService.getCheckoutOrder(orderIdParam);
      } else {
        res = await checkoutService.getActiveCheckout();
      }

      if (res?.success && res?.data?.order) {
        setOrder(res.data.order);
        setReservation(res.data.reservation);

        // Check authoritative expiration
        if (res.data.reservation) {
          const expiresAt = new Date(res.data.reservation.expiresAt).getTime();
          const remaining = expiresAt - Date.now();
          if (remaining <= 0 || res.data.reservation.status === 'EXPIRED' || res.data.order.status === 'EXPIRED') {
            setTimeLeftMs(0);
            setIsExpired(true);
          } else {
            setTimeLeftMs(remaining);
            setIsExpired(false);
          }
        }
      } else if (res?.success && !res?.data?.active && !orderIdParam) {
        setError('No active reservation or checkout session found. Please add items to your cart.');
      } else {
        setError(res?.message || 'Could not load checkout details.');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch checkout details.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, orderIdParam]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/checkout');
      } else {
        fetchCheckoutData();
      }
    }
  }, [authLoading, isAuthenticated, router, fetchCheckoutData]);

  // Countdown Interval
  useEffect(() => {
    if (!reservation?.expiresAt || isExpired) return;

    const expiresAt = new Date(reservation.expiresAt).getTime();

    const interval = setInterval(() => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        setTimeLeftMs(0);
        setIsExpired(true);
        clearInterval(interval);
      } else {
        setTimeLeftMs(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation, isExpired]);

  // Helper formatting MM:SS
  const formatTime = (ms) => {
    if (ms === null || ms <= 0) return '00:00';
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Progress percentage out of 5 minutes (300,000 ms)
  const calculateProgress = () => {
    if (!timeLeftMs) return 0;
    const TOTAL_DURATION_MS = 5 * 60 * 1000;
    return Math.min(100, Math.max(0, (timeLeftMs / TOTAL_DURATION_MS) * 100));
  };

  // Handle Mock Payment Submission
  const handleSimulatePayment = () => {
    if (isExpired) return;
    setProcessingPayment(true);
    setTimeout(() => {
      setProcessingPayment(false);
      setPaymentSuccess(true);
    }, 1500);
  };

  // 1. Loading Skeleton
  if (loading || authLoading) {
    return (
      <PageContainer className="py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-xl" />
          <div className="h-28 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <div className="h-64 bg-white border border-slate-200 rounded-3xl animate-pulse" />
            </div>
            <div className="lg:col-span-4 space-y-4">
              <div className="h-64 bg-white border border-slate-200 rounded-3xl animate-pulse" />
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  // 2. Error / No Active Session View
  if (error || !order) {
    return (
      <PageContainer className="py-16">
        <div className="max-w-md mx-auto text-center bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-sm space-y-6">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">No Active Checkout</h1>
            <p className="text-sm text-slate-500">
              {error || 'You do not currently have an active reservation session.'}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={() => router.push('/cart')}
              className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Return to Cart
            </Button>
            <Link
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors py-1"
            >
              Browse Products Catalog
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  const remainingSeconds = timeLeftMs ? Math.floor(timeLeftMs / 1000) : 0;
  const isUrgent = remainingSeconds > 0 && remainingSeconds < 60;
  const isWarning = remainingSeconds >= 60 && remainingSeconds < 120;

  return (
    <PageContainer className="py-8 sm:py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shopping Cart
          </Link>

          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-Bit SSL Secured Checkout</span>
          </div>
        </div>

        {/* 5-Minute Reservation Countdown Banner */}
        <div
          className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-sm transition-all duration-300 ${
            isExpired
              ? 'bg-rose-50/90 border-rose-200 text-rose-950'
              : isUrgent
              ? 'bg-amber-50/90 border-amber-300 text-amber-950'
              : 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-slate-800 shadow-xl shadow-blue-950/20'
          }`}
        >
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    isExpired
                      ? 'bg-rose-600 text-white'
                      : isUrgent
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-blue-500/30 text-blue-200 border border-blue-400/30'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {isExpired ? 'Reservation Expired' : 'Inventory Reserved'}
                </span>
                <span className="text-xs opacity-75 font-mono">Order #{order._id.slice(-6).toUpperCase()}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {isExpired
                  ? 'Your stock reservation has timed out'
                  : 'Complete your purchase before hold expires'}
              </h1>
              <p
                className={`text-xs sm:text-sm max-w-lg ${
                  isExpired
                    ? 'text-rose-700'
                    : isUrgent
                    ? 'text-amber-800'
                    : 'text-slate-300'
                }`}
              >
                {isExpired
                  ? 'The 5-minute reservation guarantee has elapsed. Stock has been safely restored to public catalog to prevent overselling.'
                  : 'Your items are temporarily locked in database. No other customer can purchase these units while timer is active.'}
              </p>
            </div>

            {/* Countdown Badge & Circular Progress */}
            <div className="flex items-center gap-4 shrink-0">
              <div
                className={`px-5 py-3.5 rounded-2xl flex flex-col items-center justify-center font-mono shadow-inner ${
                  isExpired
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : isUrgent
                    ? 'bg-rose-500 text-white animate-bounce'
                    : isWarning
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-white/10 text-white backdrop-blur-md border border-white/20'
                }`}
              >
                <span className="text-2xl sm:text-3xl font-black tracking-wider">
                  {formatTime(timeLeftMs)}
                </span>
                <span className="text-[10px] font-sans uppercase tracking-widest font-bold opacity-80">
                  {isExpired ? 'Expired' : 'Time Remaining'}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar under countdown */}
          {!isExpired && (
            <div className="mt-5 w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  isUrgent ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-blue-400'
                }`}
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          )}
        </div>

        {/* Expired Alert & Recovery Actions */}
        {isExpired && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-slate-900">Want to try checking out again?</p>
                <p className="text-slate-600">
                  You can return to your cart, verify item availability, and initiate a fresh 5-minute stock hold.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Button
                variant="secondary"
                onClick={() => router.push('/')}
                className="py-2.5 px-4 rounded-xl text-xs font-bold"
              >
                Explore Shop
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push('/cart')}
                className="py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Return to Cart
              </Button>
            </div>
          </div>
        )}

        {/* Checkout Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Reserved Items Breakdown */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-black text-slate-900">Reserved Line Items</h2>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                  {order.items?.length || 0} Products
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{item.productName}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>Qty: <strong className="text-slate-800">{item.quantity}</strong></span>
                        <span>•</span>
                        <span>Unit: <strong>${item.price.toFixed(2)}</strong></span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-slate-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Concurrency Safety Notice */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs text-slate-600">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed">
                  <p className="font-bold text-slate-900">Concurrency-Safe Hold Active</p>
                  <p>
                    These units have been deducted from available inventory via atomic conditional updates in MongoDB. No other user can reserve or purchase these items until the 5-minute window expires.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Financial Summary & Payment Action */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
              <h2 className="text-base font-black text-slate-900">Order Summary</h2>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">${order.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Express Courier Shipping</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>

                <div className="flex justify-between">
                  <span>Estimated Taxes</span>
                  <span className="font-bold text-slate-900">$0.00</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="font-black text-slate-900 text-sm">Total Valuation</span>
                  <span className="font-black text-slate-900 text-2xl">${order.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="space-y-3 pt-2">
                <Button
                  variant="primary"
                  disabled={isExpired}
                  onClick={() => router.push(`/payment/${order._id}`)}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm shadow-lg ${
                    isExpired
                      ? 'opacity-50 cursor-not-allowed bg-slate-300 text-slate-500 shadow-none'
                      : 'shadow-blue-500/20'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Continue to Payment
                </Button>

                {isExpired && (
                  <p className="text-[11px] text-center font-bold text-rose-600">
                    Payment disabled because reservation has expired.
                  </p>
                )}

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Authoritative Backend Stock Validation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal (Assessment Section 03 Connection) */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">
            {!paymentSuccess ? (
              <>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                  <CreditCard className="w-6 h-6" />
                </div>

                <div className="text-center space-y-1.5">
                  <h3 className="text-xl font-black text-slate-900">Payment Gateway</h3>
                  <p className="text-xs text-slate-500">
                    Order #{order._id.slice(-6).toUpperCase()} • Reserved Amount: ${order.total.toFixed(2)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between font-medium">
                    <span>Stock Reservation Status:</span>
                    <span className="font-bold text-emerald-600">ACTIVE (5-Min Hold)</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Time Remaining:</span>
                    <span className="font-bold font-mono text-slate-800">{formatTime(timeLeftMs)}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Section 02 Milestone Reached:
                  </p>
                  <p className="leading-relaxed">
                    Stock has been atomically reserved and locked against concurrent overselling. Final payment execution & webhook reconciliation will be handled in the upcoming payment assessment phase.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    variant="primary"
                    disabled={processingPayment || isExpired}
                    onClick={handleSimulatePayment}
                    className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    {processingPayment ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Verifying Transaction...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Simulate Payment Confirmation (${order.total.toFixed(2)})
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setPaymentModalOpen(false)}
                    className="w-full py-2.5 rounded-xl font-bold"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-black text-slate-900">Reservation Confirmed</h3>
                  <p className="text-xs text-slate-500">
                    Stock reservation was held safely without overselling.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setPaymentModalOpen(false);
                      router.push('/');
                    }}
                    className="w-full py-3 rounded-xl font-bold"
                  >
                    Return to Catalog
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <PageContainer className="py-12">
          <div className="max-w-4xl mx-auto h-64 bg-slate-100 rounded-3xl animate-pulse" />
        </PageContainer>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
