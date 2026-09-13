import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  CreditCard,
  ExternalLink,
  HelpCircle,
  Info,
  Loader2,
  Lock,
  LockKeyhole,
  Package,
  Printer,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import * as orderService from '../services/orderService';
import * as paymentService from '../services/paymentService';

// Detect Card Brand from card number prefix
const detectCardBrand = (number = '') => {
  const clean = number.replace(/\D/g, '');
  if (/^4/.test(clean)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
  if (/^3[47]/.test(clean)) return 'amex';
  if (/^(6011|65|64[4-9])/.test(clean)) return 'discover';
  return 'generic';
};

// High-fidelity Brand SVG Logos
const BrandIcon = ({ brand, className = 'h-6' }) => {
  switch (brand) {
    case 'visa':
      return (
        <svg viewBox="0 0 48 16" className={className} fill="none">
          <path
            d="M19.12 1.13L13.1 14.86h-3.9L5.3 4.2C5.07 3.32 4.88 3.01 4.2 2.65C3.12 2.07 1.48 1.54 0 1.22L0.1 0.77h6.63c0.88 0 1.66 0.58 1.85 1.6l1.63 8.7L14.2 0.77h4.92zm11.3 9.4c0-2.3-3.18-2.43-3.16-3.46c0-0.31 0.3-0.64 1.25-0.76c0.47-0.06 1.76-0.12 3.23 0.55l0.58-2.7C31.54 3.8 30.13 3.5 28.37 3.5c-3.07 0-5.23 1.63-5.25 3.96c-0.02 1.73 1.54 2.69 2.72 3.27c1.22 0.59 1.63 0.98 1.63 1.51c0 0.81-0.98 1.18-1.89 1.18c-1.6 0-2.52-0.24-3.87-0.83l-0.55 2.56c0.79 0.36 2.25 0.68 3.77 0.7c3.27 0 5.4-1.61 5.44-4.12zm9.88 4.33h3.81L40.7 0.77h-3.53c-0.78 0-1.4 0.45-1.68 1.12L29.9 14.86h4.1l0.82-2.27h5l0.46 2.27zm-4.32-4.52l2.06-5.65l1.19 5.65h-3.25zM24.7 0.77l-3.22 14.09h-3.93L20.77 0.77h3.93z"
            fill="#00579F"
          />
        </svg>
      );
    case 'mastercard':
      return (
        <svg viewBox="0 0 36 24" className={className} fill="none">
          <circle cx="13" cy="12" r="10" fill="#EB001B" />
          <circle cx="23" cy="12" r="10" fill="#F79E1B" fillOpacity="0.9" />
        </svg>
      );
    case 'amex':
      return (
        <svg viewBox="0 0 36 24" className={className} fill="none">
          <rect width="36" height="24" rx="4" fill="#006FCF" />
          <path
            d="M6 17l1.5-3.5h2L11 17h2.5l-3-7H8l-3 7h1zm2-4.5l.5-1.5.5 1.5H8zm6 4.5h2v-5l2 5h2l2-5v5h2v-7h-3l-2 5-2-5h-3v7zm11 0h5v-1.5h-3v-1.2h2.5v-1.5H25v-1.3h3V10h-5v7z"
            fill="#FFFFFF"
          />
        </svg>
      );
    case 'discover':
      return (
        <svg viewBox="0 0 36 24" className={className} fill="none">
          <rect width="36" height="24" rx="4" fill="#FF6000" />
          <circle cx="18" cy="12" r="5" fill="#FFFFFF" />
        </svg>
      );
    default:
      return <CreditCard className="w-5 h-5 text-slate-400" />;
  }
};

const Payment = () => {
  const { orderId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  // Order & state
  const [order, setOrder] = useState(state?.order || null);
  const [loading, setLoading] = useState(!state?.order);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState('');

  // Payment method tabs
  const [activeTab, setActiveTab] = useState('card'); // 'card' | 'wallet' | 'counter'

  // Card form fields
  const [cardholderName, setCardholderName] = useState('Alex Mercer');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [postalCode, setPostalCode] = useState('94103');
  const [touched, setTouched] = useState({});

  // Developer / Sandbox simulation helpers drawer state
  const [showSandboxBar, setShowSandboxBar] = useState(false);

  // Reservation countdown timer
  const [remaining, setRemaining] = useState(() =>
    state?.order?.reservationExpiresAt
      ? Math.max(0, Math.ceil((new Date(state.order.reservationExpiresAt) - Date.now()) / 1000))
      : 600
  );
  const timeoutDispatched = useRef(false);

  // Deterministic Idempotency Key stored in sessionStorage per order
  const idempotencyKey = useMemo(() => {
    const storageKey = `pos_payment_idempotency_${orderId}`;
    let value = sessionStorage.getItem(storageKey);
    if (!value) {
      value = globalThis.crypto?.randomUUID?.() || `key_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(storageKey, value);
    }
    return value;
  }, [orderId]);

  // Load / refresh order
  const refreshOrder = useCallback(async () => {
    try {
      const response = await orderService.getOrderById(orderId);
      if (response && response.data) {
        setOrder(response.data);
        return response.data;
      }
    } catch (err) {
      setApiError(err.message || 'Unable to load order details.');
    }
    return null;
  }, [orderId]);

  useEffect(() => {
    refreshOrder().finally(() => setLoading(false));
  }, [refreshOrder]);

  // Live timer tick
  useEffect(() => {
    if (!order?.reservationExpiresAt || order.status !== 'RESERVED') return undefined;

    const tick = () => {
      const diff = Math.max(0, Math.ceil((new Date(order.reservationExpiresAt) - Date.now()) / 1000));
      setRemaining(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [order]);

  // Core Payment Execution
  const executePayment = useCallback(
    async (outcomeOverride) => {
      if (processing || result) return;
      setProcessing(true);
      setApiError('');

      try {
        // Natural outcome determination:
        // 1. If explicit override (e.g. TIMEOUT from countdown or sandbox decline): use it
        // 2. If card ends in "0002" (Standard Stripe test decline): FAILED
        // 3. Normal valid card: SUCCESS
        let outcome = outcomeOverride;
        if (!outcome) {
          const rawDigits = cardNumber.replace(/\D/g, '');
          if (rawDigits.endsWith('0002')) {
            outcome = 'FAILED';
          } else {
            outcome = 'SUCCESS';
          }
        }

        const response = await paymentService.processPayment(
          {
            orderId,
            paymentMethod: activeTab === 'card' ? 'CARD' : activeTab === 'wallet' ? 'DIGITAL_WALLET' : 'CASH',
            simulationOutcome: outcome,
          },
          idempotencyKey
        );

        setResult(response);
        if (response.order) {
          setOrder(response.order);
        }
      } catch (err) {
        if (err.code === 'PAYMENT_ALREADY_PROCESSED') {
          await refreshOrder();
        }
        setApiError(err.message || 'Payment could not be completed. Please review your order status.');
      } finally {
        setProcessing(false);
      }
    },
    [activeTab, cardNumber, idempotencyKey, orderId, processing, refreshOrder, result]
  );

  // Natural reservation expiration trigger when timer reaches 0
  useEffect(() => {
    if (
      order?.status === 'RESERVED' &&
      order.reservationExpiresAt &&
      remaining === 0 &&
      new Date(order.reservationExpiresAt) <= new Date() &&
      !loading &&
      !result &&
      !timeoutDispatched.current
    ) {
      timeoutDispatched.current = true;
      executePayment('TIMEOUT');
    }
  }, [executePayment, loading, order?.reservationExpiresAt, order?.status, remaining, result]);

  // Card brand detection
  const detectedBrand = useMemo(() => detectCardBrand(cardNumber), [cardNumber]);

  // Input formatters
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setExpiry(val);
  };

  const handleCvcChange = (e) => {
    const maxLen = detectedBrand === 'amex' ? 4 : 3;
    setCvc(e.target.value.replace(/\D/g, '').slice(0, maxLen));
  };

  // Form Validation checks
  const cleanDigits = cardNumber.replace(/\D/g, '');
  const isCardNumberValid = cleanDigits.length === 16 || (detectedBrand === 'amex' && cleanDigits.length === 15);
  const isExpiryValid = /^(0[1-9]|1[0-2])\/(\d{2})$/.test(expiry);
  const isCvcValid = cvc.length >= (detectedBrand === 'amex' ? 4 : 3);
  const isNameValid = cardholderName.trim().length >= 2;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, number: true, expiry: true, cvc: true });

    if (!isNameValid || !isCardNumberValid || !isExpiryValid || !isCvcValid) {
      return;
    }

    executePayment();
  };

  // Sandbox Quick Fill Helpers (for reviewers/testers without user-facing SUCCESS/FAILED radio buttons)
  const quickFillSuccessCard = () => {
    setCardholderName('Alex Mercer');
    setCardNumber('4242 4242 4242 4242');
    setExpiry('12/28');
    setCvc('123');
    setTouched({});
    setApiError('');
  };

  const quickFillDeclineCard = () => {
    setCardholderName('Jane Doe (Declined)');
    setCardNumber('4000 0000 0000 0002');
    setExpiry('10/27');
    setCvc('999');
    setTouched({});
    setApiError('');
  };

  const quickSimulateTimeout = () => {
    if (timeoutDispatched.current) return;
    timeoutDispatched.current = true;
    executePayment('TIMEOUT');
  };

  // ----------------------------------------------------
  // Loading & Error Fallbacks
  // ----------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#635BFF]" />
        <p className="text-sm font-semibold text-slate-500">Connecting to secure checkout gateway...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Order Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">We couldn't retrieve the reservation for this order.</p>
        <Link
          to="/orders"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Orders
        </Link>
      </div>
    );
  }

  // ----------------------------------------------------
  // RESULT VIEW: SUCCESS, FAILED, or TIMEOUT
  // ----------------------------------------------------
  if (result) {
    const isSuccess = result.paymentStatus === 'SUCCESS';
    const isTimeout = result.paymentStatus === 'TIMEOUT';
    const isFailed = result.paymentStatus === 'FAILED';

    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden print-area">
          {/* Status Header */}
          <div
            className={`p-8 text-center border-b ${
              isSuccess
                ? 'bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-white border-emerald-100'
                : isTimeout
                ? 'bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white border-amber-100'
                : 'bg-gradient-to-b from-rose-500/10 via-rose-500/5 to-white border-rose-100'
            }`}
          >
            <div
              className={`w-18 h-18 mx-auto rounded-full flex items-center justify-center text-white shadow-lg animate-bounce-in mb-4 ${
                isSuccess
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/30'
                  : isTimeout
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/30'
                  : 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-500/30'
              }`}
            >
              {isSuccess ? (
                <Check className="w-9 h-9 stroke-[2.5]" />
              ) : isTimeout ? (
                <Clock3 className="w-9 h-9 stroke-[2.5]" />
              ) : (
                <X className="w-9 h-9 stroke-[2.5]" />
              )}
            </div>

            <span
              className={`inline-block text-[11px] font-black tracking-widest uppercase px-3 py-1 rounded-full mb-2 ${
                isSuccess
                  ? 'bg-emerald-100 text-emerald-800'
                  : isTimeout
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {isSuccess ? 'Payment Approved' : isTimeout ? 'Reservation Expired' : 'Payment Declined'}
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isSuccess
                ? 'Payment Successful!'
                : isTimeout
                ? 'Checkout Session Expired'
                : 'Payment Could Not Be Completed'}
            </h1>

            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
              {isSuccess
                ? 'Thank you for your purchase. Your transaction has been confirmed and order inventory finalized.'
                : isTimeout
                ? 'The reservation hold on your items expired. Your reserved stock has been safely returned to inventory.'
                : 'The simulated card transaction was declined. Your reserved items have been safely released back to inventory.'}
            </p>
          </div>

          {/* Receipt Breakdown */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400">Total Amount</p>
                <p className="text-3xl font-black text-slate-900 mt-0.5">
                  ${Number(result.amount || order.totalAmount).toFixed(2)}{' '}
                  <span className="text-xs font-semibold text-slate-400">USD</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase font-bold text-slate-400">Order Number</p>
                <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">{order.orderNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Transaction ID</span>
                <span className="font-mono font-bold text-slate-800 break-all mt-0.5 block">
                  {result.transactionId || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Payment Method</span>
                <span className="font-bold text-slate-800 mt-0.5 block capitalize">
                  {result.payment?.paymentMethod || 'Credit / Debit Card'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Inventory Status</span>
                <span
                  className={`font-bold mt-0.5 block ${
                    isSuccess ? 'text-emerald-700' : 'text-slate-700'
                  }`}
                >
                  {isSuccess ? 'Stock Deducted (Permanent)' : 'Stock Released (Returned)'}
                </span>
              </div>
            </div>

            {/* Items table */}
            {order.items && order.items.length > 0 && (
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                  <span>Purchased Items</span>
                  <span>Subtotal</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-400">
                          Qty: {item.quantity} × ${Number(item.price).toFixed(2)}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-slate-800">
                        ${Number(item.subtotal || item.quantity * item.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 no-print">
              {isSuccess && (
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4 text-slate-500" /> Print Receipt
                </button>
              )}

              {isFailed && (
                <button
                  onClick={() => {
                    setResult(null);
                    setCardNumber('');
                    setApiError('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5349e4] text-white font-semibold text-sm transition-colors flex items-center gap-2 shadow-md shadow-[#635BFF]/20"
                >
                  <RotateCcw className="w-4 h-4" /> Try Another Card
                </button>
              )}

              <Link
                to="/orders"
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                View Order History
              </Link>

              <Link
                to={isSuccess ? '/inventory' : '/cart'}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors text-white ${
                  isSuccess ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {isSuccess ? 'New POS Sale' : 'Return to Cart'}
              </Link>
            </div>
          </div>

          {/* Secure footer stamp */}
          <div className="bg-slate-50/80 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Certified PCI-DSS Level 1 Gateway
            </span>
            <span>Ref: {order._id.substring(0, 8)}...</span>
          </div>
        </div>
      </div>
    );
  }

  // Formatting minutes:seconds
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');
  const isUrgent = remaining < 120; // under 2 minutes

  // ----------------------------------------------------
  // MAIN CHECKOUT VIEW
  // ----------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 pb-20">
      {/* Top Bar: Back & Security badge */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#635BFF] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Checkout
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-subtle">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-bit SSL Encrypted • Stripe & PayHere Standard</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ==================================================== */}
        {/* LEFT COLUMN: Payment Method Tabs & Form (7 cols)     */}
        {/* ==================================================== */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            {/* Payment Method Tabs (Stripe / PayHere Style) */}
            <div className="border-b border-slate-100 p-2 bg-slate-50/50">
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/60 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('card')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'card'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-[#635BFF]" />
                  <span>Credit / Debit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('wallet')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'wallet'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Digital Wallet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('counter')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'counter'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Counter / POS Cash</span>
                </button>
              </div>
            </div>

            {/* TAB 1: CARD CHECKOUT */}
            {activeTab === 'card' && (
              <div className="p-6 sm:p-8 space-y-6">
                {/* Visual Card Mockup (Dynamic Interactive Preview) */}
                <div className="w-full max-w-sm mx-auto aspect-[1.586/1] rounded-2xl p-5 sm:p-6 text-white relative shadow-xl shadow-indigo-950/20 bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900 border border-indigo-500/20 flex flex-col justify-between overflow-hidden">
                  {/* Holographic light reflection sheen */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 pointer-events-none" />

                  {/* Card Top: Chip & Brand */}
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      {/* Realistic EMV Gold Chip */}
                      <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-0.5 shadow-inner flex items-center justify-center border border-amber-300">
                        <div className="w-full h-full border border-amber-600/30 rounded-sm grid grid-cols-3 gap-0.5 opacity-60">
                          <div className="border-r border-amber-700/30" />
                          <div className="border-r border-amber-700/30" />
                        </div>
                      </div>

                      {/* Contactless symbol */}
                      <svg className="w-5 h-5 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M8.5 10a4 4 0 0 1 0 4" strokeWidth="2" strokeLinecap="round" />
                        <path d="M12 7a8 8 0 0 1 0 10" strokeWidth="2" strokeLinecap="round" />
                        <path d="M15.5 4a12 12 0 0 1 0 16" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                      <BrandIcon brand={detectedBrand} className="h-6 w-auto" />
                    </div>
                  </div>

                  {/* Card Center: Spaced Card Number */}
                  <div className="relative z-10 my-auto">
                    <p className="font-mono text-lg sm:text-xl font-medium tracking-[0.22em] text-white/95 text-shadow">
                      {cardNumber ? (
                        cardNumber
                      ) : (
                        <span className="text-white/40">•••• •••• •••• ••••</span>
                      )}
                    </p>
                  </div>

                  {/* Card Bottom: Holder Name & Expiry */}
                  <div className="flex items-end justify-between text-xs tracking-wider relative z-10 pt-1">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-white/50 block">Cardholder</span>
                      <span className="font-semibold text-white/90 uppercase tracking-widest block truncate max-w-[170px]">
                        {cardholderName || 'YOUR NAME'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-white/50 block">Expires</span>
                      <span className="font-mono font-semibold text-white/90 block">
                        {expiry || 'MM/YY'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Secure Form Inputs */}
                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                  {/* Cardholder Name */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex justify-between">
                      <span>Cardholder Name</span>
                    </label>
                    <input
                      type="text"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                      placeholder="Alex Mercer"
                      className={`mt-1.5 w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-all ${
                        touched.name && !isNameValid
                          ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                          : 'border-slate-200 bg-white focus:border-[#635BFF] focus:ring-4 focus:ring-[#635BFF]/10'
                      }`}
                    />
                    {touched.name && !isNameValid && (
                      <span className="text-[11px] font-semibold text-rose-600 mt-1 block">
                        Please provide cardholder full name.
                      </span>
                    )}
                  </div>

                  {/* Card Number Input with Brand detection on right */}
                  <div>
                    <label className="text-xs font-bold text-slate-700">Card Number</label>
                    <div className="relative mt-1.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        onBlur={() => setTouched((p) => ({ ...p, number: true }))}
                        placeholder="4242  4242  4242  4242"
                        className={`w-full rounded-xl border px-4 py-3 pr-14 text-sm font-mono tracking-wider outline-none transition-all ${
                          touched.number && !isCardNumberValid
                            ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                            : 'border-slate-200 bg-white focus:border-[#635BFF] focus:ring-4 focus:ring-[#635BFF]/10'
                        }`}
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <BrandIcon brand={detectedBrand} className="h-5 w-auto" />
                      </div>
                    </div>
                    {touched.number && !isCardNumberValid && (
                      <span className="text-[11px] font-semibold text-rose-600 mt-1 block">
                        Enter a valid 16-digit card number.
                      </span>
                    )}
                  </div>

                  {/* Expiry & CVC Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Expiration</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={expiry}
                        onChange={handleExpiryChange}
                        onBlur={() => setTouched((p) => ({ ...p, expiry: true }))}
                        placeholder="MM / YY"
                        className={`mt-1.5 w-full rounded-xl border px-3.5 py-3 text-sm font-mono text-center outline-none transition-all ${
                          touched.expiry && !isExpiryValid
                            ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                            : 'border-slate-200 bg-white focus:border-[#635BFF] focus:ring-4 focus:ring-[#635BFF]/10'
                        }`}
                      />
                      {touched.expiry && !isExpiryValid && (
                        <span className="text-[11px] font-semibold text-rose-600 mt-1 block">
                          Valid MM/YY required.
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>CVC / CVV</span>
                        <Lock className="w-3 h-3 text-slate-400" />
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        value={cvc}
                        onChange={handleCvcChange}
                        onBlur={() => setTouched((p) => ({ ...p, cvc: true }))}
                        placeholder={detectedBrand === 'amex' ? '1234' : '123'}
                        className={`mt-1.5 w-full rounded-xl border px-3.5 py-3 text-sm font-mono text-center outline-none transition-all ${
                          touched.cvc && !isCvcValid
                            ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                            : 'border-slate-200 bg-white focus:border-[#635BFF] focus:ring-4 focus:ring-[#635BFF]/10'
                        }`}
                      />
                      {touched.cvc && !isCvcValid && (
                        <span className="text-[11px] font-semibold text-rose-600 mt-1 block">
                          3-4 digits.
                        </span>
                      )}
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-xs font-bold text-slate-700">Postal / ZIP</label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
                        placeholder="94103"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-mono text-center outline-none bg-white focus:border-[#635BFF] focus:ring-4 focus:ring-[#635BFF]/10"
                      />
                    </div>
                  </div>

                  {/* API or Network Error notification if any */}
                  {apiError && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{apiError}</span>
                    </div>
                  )}

                  {/* Primary Pay Button */}
                  <button
                    type="submit"
                    disabled={processing || remaining <= 0 || order.status !== 'RESERVED'}
                    className="mt-4 w-full rounded-xl bg-[#635BFF] hover:bg-[#5349e4] disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 font-bold text-base flex justify-center items-center gap-2 shadow-lg shadow-[#635BFF]/25 transition-all duration-200 active:scale-[0.99]"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Authorizing payment...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Pay ${order.totalAmount?.toFixed(2)} USD</span>
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Payments processed securely via encrypted tokenization.
                  </p>
                </form>
              </div>
            )}

            {/* TAB 2: DIGITAL WALLET */}
            {activeTab === 'wallet' && (
              <div className="p-8 text-center space-y-6">
                <div className="max-w-sm mx-auto space-y-3">
                  <button
                    type="button"
                    onClick={() => executePayment('SUCCESS')}
                    disabled={processing || remaining <= 0}
                    className="w-full py-3.5 rounded-xl bg-black text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    <span className="text-base font-semibold"> Pay</span> with Apple Pay
                  </button>

                  <button
                    type="button"
                    onClick={() => executePayment('SUCCESS')}
                    disabled={processing || remaining <= 0}
                    className="w-full py-3.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <span className="font-black text-[#4285F4]">G</span>
                    <span className="font-black text-[#EA4335]">o</span>
                    <span className="font-black text-[#FBBC05]">o</span>
                    <span className="font-black text-[#4285F4]">g</span>
                    <span className="font-black text-[#34A853]">l</span>
                    <span className="font-black text-[#EA4335]">e</span> Pay
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-36 h-36 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-4">
                      <QrCode className="w-16 h-16 text-slate-700 mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Scan PayHere QR
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                      Scan with your mobile banking app (Genie, FriMi, or PayHere Wallet)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: COUNTER CASH POS */}
            {activeTab === 'counter' && (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Building2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Over-the-Counter Cash Checkout</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Cash collected directly at the physical register. Confirm transaction to finalize inventory deduction.
                </p>

                <div className="pt-4 max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => executePayment('SUCCESS')}
                    disabled={processing || remaining <= 0}
                    className="w-full rounded-xl bg-slate-900 text-white py-3.5 font-bold text-sm hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Confirm Cash Collected (${order.totalAmount?.toFixed(2)})</span>
                  </button>
                </div>
              </div>
            )}

            {/* Trust and Compliance Footer Stamps */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> PCI-DSS Level 1
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Lock className="w-3.5 h-3.5 text-blue-600" /> Verified by Visa
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Mastercard ID Check
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Techloom POS Gateway</span>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* RIGHT COLUMN: Live Reservation & Order Summary (5 cols)*/}
        {/* ==================================================== */}
        <div className="lg:col-span-5 space-y-5">
          {/* Reservation Countdown Clock Card */}
          <div
            className={`rounded-3xl p-6 text-white shadow-lg transition-all duration-300 ${
              isUrgent
                ? 'bg-gradient-to-br from-amber-600 via-rose-600 to-rose-700 shadow-rose-600/20'
                : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 shadow-indigo-950/20'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-white/70 block">
                  Inventory Hold Guarantee
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-mono text-4xl font-black tracking-tight text-white">
                    {minutes}:{seconds}
                  </span>
                  <span className="text-xs font-semibold text-white/75 uppercase">Remaining</span>
                </div>
              </div>

              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  isUrgent ? 'bg-white/20 text-white animate-pulse' : 'bg-white/10 text-emerald-400'
                }`}
              >
                <Clock3 className="w-6 h-6" />
              </div>
            </div>

            <p className="mt-3 text-xs text-white/80 leading-relaxed">
              Your selected items are locked in our warehouse for this session. If payment is not completed before
              the countdown expires, items are automatically released to prevent inventory shortage.
            </p>
          </div>

          {/* Order Summary Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Order Summary</h3>
                  <p className="text-[11px] text-slate-400 font-mono">#{order.orderNumber}</p>
                </div>
              </div>
              <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                RESERVED
              </span>
            </div>

            {/* Items list */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {order.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <div className="pr-3">
                    <p className="font-semibold text-slate-800 line-clamp-1">{item.name}</p>
                    <p className="text-slate-400 text-[11px]">
                      {item.quantity} × ${Number(item.price).toFixed(2)}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-slate-900 shrink-0">
                    ${Number(item.subtotal || item.quantity * item.price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono font-medium">${order.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax / Service</span>
                <span className="font-mono font-medium">$0.00</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Due</span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  ${order.totalAmount?.toFixed(2)}{' '}
                  <span className="text-xs font-semibold text-slate-400">USD</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* DISCREET SANDBOX TEST HELPER (Collapsed by default)   */}
      {/* Kept separate so customer never sees raw radios!    */}
      {/* ==================================================== */}
      <div className="mt-12 pt-6 border-t border-slate-200">
        <div className="max-w-xl mx-auto text-center">
          <button
            type="button"
            onClick={() => setShowSandboxBar((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
          >
            <span>🛠️ Sandbox Test Cards (Stripe / PayHere Simulator)</span>
            {showSandboxBar ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showSandboxBar && (
            <div className="mt-3 p-4 bg-slate-100/80 border border-slate-200 rounded-2xl text-left space-y-3 text-xs animate-in fade-in">
              <p className="text-slate-600 font-medium">
                Use standard sandbox cards to test realistic outcomes without exposing simulation buttons to customers:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={quickFillSuccessCard}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 text-emerald-700 font-semibold shadow-subtle flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fill Passing Card (4242...)</span>
                </button>

                <button
                  type="button"
                  onClick={quickFillDeclineCard}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-rose-400 text-rose-700 font-semibold shadow-subtle flex items-center gap-1.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-rose-600" />
                  <span>Fill Declined Card (...0002)</span>
                </button>

                <button
                  type="button"
                  onClick={quickSimulateTimeout}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-amber-400 text-amber-700 font-semibold shadow-subtle flex items-center gap-1.5 transition-colors"
                >
                  <Clock3 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Trigger Reservation Timeout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payment;
