import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Receipt,
  Clock,
  Package,
  Layers,
  ShoppingBag,
  ExternalLink,
  Printer,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import * as orderService from '../services/orderService';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import ErrorAlert from '../components/common/ErrorAlert';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, userId, refreshCart } = useCart();

  // Customer / Checkout Form State
  const [customerName, setCustomerName] = useState('Alex Mercer');
  const [customerEmail, setCustomerEmail] = useState('alex.mercer@example.com');
  const [customerPhone, setCustomerPhone] = useState('+1 (555) 234-5678');
  const [paymentMethod, setPaymentMethod] = useState('pos_cash'); // 'pos_cash' | 'credit_card' | 'digital_wallet'
  const [orderNotes, setOrderNotes] = useState('');

  // UI Flow State
  const [placingOrder, setPlacingOrder] = useState(false);
  const [payingOrder, setPayingOrder] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);

  // Reservation Countdown Timer (15 minutes = 900 seconds)
  const [secondsRemaining, setSecondsRemaining] = useState(900);

  useEffect(() => {
    let timer = null;
    if (createdOrder && createdOrder.status === 'RESERVED' && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [createdOrder, secondsRemaining]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const items = cart?.items || [];
  const rawSubtotal = cart?.subtotal || 0;
  const estimatedTax = Math.round(rawSubtotal * 0.08 * 100) / 100;
  const totalAmount = Math.round((rawSubtotal + estimatedTax) * 100) / 100;

  // 1. Submit Order Creation (POST /api/orders/create)
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!items || items.length === 0) {
      setCheckoutError('Cannot place an order with an empty cart.');
      return;
    }

    try {
      setPlacingOrder(true);
      setCheckoutError(null);

      // Business logic triggered via backend:
      // 1. Validate cart
      // 2. Check product availability
      // 3. Calculate total
      // 4. Create order (RESERVED)
      const res = await orderService.createOrder({
        userId,
        fromCart: true,
        notes: `${customerName} (${customerEmail}) - ${orderNotes}`.trim(),
      });

      if (res && res.success && res.data) {
        await refreshCart(); // Cart has been converted to active order
        navigate(`/payment/${res.data._id}`, { state: { order: res.data } });
      } else {
        throw new Error(res?.message || 'Failed to create order');
      }
    } catch (err) {
      console.error('Order creation error:', err);
      setCheckoutError(
        err.message || 'Unable to place order. Some items may have insufficient inventory.'
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // 2. Pay Order (Transition RESERVED -> PAID)
  const handlePayOrder = async () => {
    if (!createdOrder) return;
    navigate(`/payment/${createdOrder._id}`, { state: { order: createdOrder } });
  };

  // 3. Cancel Order (Transition RESERVED -> CANCELLED, releases inventory)
  const handleCancelOrder = async () => {
    if (!createdOrder) return;
    try {
      setCancellingOrder(true);
      setCheckoutError(null);
      const res = await orderService.cancelOrder(createdOrder._id, 'Customer cancelled at checkout');
      if (res && res.success && res.data) {
        setCreatedOrder(res.data);
      }
    } catch (err) {
      setCheckoutError(err.message || 'Cancellation failed');
    } finally {
      setCancellingOrder(false);
    }
  };

  // ----------------------------------------------------
  // VIEW: Order Confirmation Screen (Success / Reserved / Paid)
  // ----------------------------------------------------
  if (createdOrder) {
    const isPaid = createdOrder.status === 'PAID';
    const isReserved = createdOrder.status === 'RESERVED';
    const isCancelled = createdOrder.status === 'CANCELLED';
    const isExpired = createdOrder.status === 'EXPIRED' || secondsRemaining === 0;

    return (
      <div className="max-w-3xl mx-auto py-6 pb-16 space-y-6">
        {/* Status Card */}
        <div
          className={`rounded-2xl border p-6 sm:p-8 text-center transition-all ${
            isPaid
              ? 'bg-emerald-50/70 border-emerald-200'
              : isCancelled
              ? 'bg-slate-50 border-slate-200'
              : isExpired
              ? 'bg-rose-50/70 border-rose-200'
              : 'bg-gradient-to-br from-amber-50/80 to-blue-50/50 border-amber-200'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              isPaid
                ? 'bg-emerald-600 text-white'
                : isCancelled
                ? 'bg-slate-600 text-white'
                : isExpired
                ? 'bg-rose-600 text-white'
                : 'bg-amber-500 text-white shadow-md shadow-amber-500/20 animate-pulse'
            }`}
          >
            {isPaid ? (
              <CheckCircle2 className="w-9 h-9" />
            ) : isCancelled ? (
              <AlertTriangle className="w-9 h-9" />
            ) : (
              <Clock className="w-9 h-9" />
            )}
          </div>

          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
              Order Status:
            </span>
            <Badge
              variant={
                isPaid ? 'success' : isCancelled ? 'neutral' : isExpired ? 'danger' : 'warning'
              }
              size="md"
            >
              {createdOrder.status}
            </Badge>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isPaid
              ? 'Order Paid & Confirmed!'
              : isCancelled
              ? 'Order Cancelled'
              : isExpired
              ? 'Reservation Expired'
              : 'Order Created & Inventory Reserved!'}
          </h2>

          <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
            {isPaid
              ? 'Stock has been permanently booked. The order receipt is ready below.'
              : isCancelled
              ? 'Inventory reservations have been released back to available stock.'
              : isExpired
              ? 'The 15-minute stock hold has elapsed and items were released.'
              : 'Products in this order are temporarily held in inventory. Complete payment before the reservation expires.'}
          </p>

          {/* 15-Minute Reservation Countdown */}
          {isReserved && !isExpired && (
            <div className="mt-5 inline-flex items-center gap-3 bg-white/90 backdrop-blur px-5 py-2.5 rounded-xl border border-amber-200/80 shadow-xs">
              <Clock className="w-4 h-4 text-amber-600" />
              <div className="text-left">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Stock Reserved For
                </span>
                <span className="text-lg font-mono font-black text-amber-600">
                  {formatTimer(secondsRemaining)}
                </span>
              </div>
            </div>
          )}
        </div>

        {checkoutError && <ErrorAlert title="Notice" message={checkoutError} />}

        {/* Order Receipt Details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Invoice: {createdOrder.orderNumber}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {new Date(createdOrder.createdAt).toLocaleString()}
            </span>
          </div>

          {/* Items Breakdown */}
          <div className="p-5 sm:p-6 divide-y divide-slate-100">
            <div className="pb-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ordered Items
              </span>
              {createdOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                      {item.quantity}x
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400">${item.price?.toFixed(2)} each</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">${item.subtotal?.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${createdOrder.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Method</span>
                <span className="font-medium capitalize text-slate-800">
                  {paymentMethod.replace('_', ' ')}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-base font-bold text-slate-900">Total Charged</span>
                <span className="text-2xl font-black text-blue-600">
                  ${createdOrder.totalAmount?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-5 bg-slate-50/60 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-slate-600"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print Receipt
              </Button>
              <Link to="/orders">
                <Button variant="ghost" size="sm" className="text-slate-600">
                  View All Orders &rarr;
                </Button>
              </Link>
            </div>

            {isReserved && !isExpired && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelOrder}
                  disabled={cancellingOrder || payingOrder}
                  className="text-rose-600 hover:bg-rose-50 border-rose-200"
                >
                  {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePayOrder}
                  disabled={payingOrder || cancellingOrder}
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  {payingOrder ? 'Processing...' : 'Complete Payment'}
                </Button>
              </div>
            )}

            {isPaid && (
              <Link to="/cart">
                <Button variant="primary" size="sm">
                  Start New Order
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW: Standard Checkout Page
  // ----------------------------------------------------
  return (
    <div className="space-y-8 pb-16">
      {/* Header & Back Link */}
      <div>
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Shopping Cart
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Checkout</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Verify product availability, customer info, and place your order.
        </p>
      </div>

      {checkoutError && <ErrorAlert title="Order Error" message={checkoutError} />}

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Your cart has no items</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Please add items to your shopping cart before proceeding to checkout.
          </p>
          <Link to="/cart">
            <Button variant="primary" size="sm">
              Return to Cart
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Customer Info & Payment Options */}
          <div className="lg:col-span-7 space-y-6">
            {/* Customer Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  1. Customer Details
                </span>
                <span className="text-[11px] text-slate-400">Walk-in or Registered Customer</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Order Notes / Memo (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Priority packing, register lane 02, customer pickup note..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  2. Payment Method
                </span>
                <span className="text-[11px] text-slate-400">Select payment channel</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Cash POS */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pos_cash')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === 'pos_cash'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Banknote
                    className={`w-5 h-5 mb-2 ${
                      paymentMethod === 'pos_cash' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">POS Cash</p>
                    <p className="text-[10px] text-slate-400">Cash register settlement</p>
                  </div>
                </button>

                {/* Credit / Debit Card */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === 'credit_card'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <CreditCard
                    className={`w-5 h-5 mb-2 ${
                      paymentMethod === 'credit_card' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Card Terminal</p>
                    <p className="text-[10px] text-slate-400">Visa, Master, Amex</p>
                  </div>
                </button>

                {/* Digital / Contactless */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('digital_wallet')}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === 'digital_wallet'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Smartphone
                    className={`w-5 h-5 mb-2 ${
                      paymentMethod === 'digital_wallet' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Digital Wallet</p>
                    <p className="text-[10px] text-slate-400">Apple Pay, Google Pay</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Inventory Reservation Guarantee Banner */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <span className="font-bold block">15-Minute Atomic Stock Reservation:</span>
                When you click Place Order, the system validates available warehouse stock and
                automatically locks the items under status <strong>RESERVED</strong> for 15 minutes
                to prevent competing checkouts.
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Order Summary, Total Amount & Available Stock */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Order Summary</h2>
                <span className="text-xs font-semibold text-slate-500">
                  {cart?.totalItems || 0} items
                </span>
              </div>

              {/* Items List with Live Available Stock */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => {
                  const product = item.productId || {};
                  const isPopulated = typeof product === 'object' && product !== null;
                  const productName = isPopulated ? product.name : 'Product Item';
                  const availableStock = isPopulated ? product.stockQuantity : 99;
                  const unitPrice = item.price || (isPopulated ? product.price : 0) || 0;
                  const hasStock = availableStock >= item.quantity;

                  return (
                    <div
                      key={item._id || item.productId}
                      className="flex items-center justify-between gap-3 text-xs p-2 rounded-xl bg-slate-50/70 border border-slate-100"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 truncate">{productName}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span>Qty: {item.quantity}</span>
                          <span>&bull;</span>
                          <span>${unitPrice.toFixed(2)}</span>
                          <span>&bull;</span>
                          {/* Live Available Stock Indicator */}
                          <span
                            className={`font-semibold flex items-center gap-1 ${
                              hasStock ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                hasStock ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            {availableStock} in stock
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-bold text-slate-900 shrink-0">
                        ${(unitPrice * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Calculation */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">${rawSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Sales Tax (8%)</span>
                  <span className="font-semibold text-slate-800">${estimatedTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Fulfillment Fee</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-slate-900">Total Amount</span>
                    <p className="text-[10px] text-slate-400">Taxes included</p>
                  </div>
                  <span className="text-2xl font-black text-blue-600">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit Order Button */}
              <Button
                variant="primary"
                size="lg"
                disabled={placingOrder || items.length === 0}
                onClick={handlePlaceOrder}
                className="w-full shadow-md shadow-blue-500/20 font-bold"
              >
                {placingOrder ? 'Reserving Inventory & Creating...' : 'Place Order & Reserve Stock'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="text-center">
                <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Encrypted & synced with inventory ledger
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
