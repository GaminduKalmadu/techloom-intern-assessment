'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Package,
  Sparkles,
  Lock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import checkoutService from '@/services/checkoutService';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    items,
    subtotal,
    itemCount,
    loading: cartLoading,
    actionLoadingId,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const handleProceedToCheckout = async () => {
    try {
      setCheckingOut(true);
      setCheckoutError(null);
      const res = await checkoutService.createCheckout();
      if (res?.success && res?.data?.orderId) {
        router.push(`/checkout?orderId=${res.data.orderId}`);
      } else {
        setCheckoutError(res?.message || 'Failed to initialize checkout.');
      }
    } catch (err) {
      if (err.status === 409) {
        setCheckoutError(
          err.message || 'Inventory conflict: Some items in your cart have insufficient stock or were just reserved by another shopper. Please review your cart.'
        );
      } else {
        setCheckoutError(err.message || 'Unable to proceed to checkout.');
      }
    } finally {
      setCheckingOut(false);
    }
  };

  // Unauthenticated Guest View
  if (!authLoading && !isAuthenticated) {
    return (
      <PageContainer className="py-16">
        <div className="max-w-md mx-auto text-center bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-sm space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">Sign In to View Cart</h1>
            <p className="text-sm text-slate-500">
              Your shopping cart is securely synchronized with your account across all your devices.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={() => router.push('/login?redirect=/cart')}
              className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              Sign In to Your Account
            </Button>
            <Link
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors py-1"
            >
              Continue Browsing as Guest
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Loading Skeleton State
  if (authLoading || (cartLoading && items.length === 0)) {
    return (
      <PageContainer className="py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 animate-pulse"
                >
                  <div className="w-20 h-20 bg-slate-200 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-1/2 bg-slate-200 rounded" />
                    <div className="h-4 w-1/4 bg-slate-200 rounded" />
                  </div>
                  <div className="h-10 w-24 bg-slate-200 rounded-xl" />
                </div>
              ))}
            </div>
            <div className="lg:col-span-4">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 animate-pulse">
                <div className="h-6 w-32 bg-slate-200 rounded" />
                <div className="h-12 w-full bg-slate-200 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Empty Cart State
  if (items.length === 0) {
    return (
      <PageContainer className="py-16">
        <div className="max-w-lg mx-auto text-center bg-white rounded-3xl p-10 sm:p-12 border border-slate-200/80 shadow-sm space-y-6">
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-50 to-indigo-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <ShoppingCart className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Your Cart is Empty</h1>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Looks like you haven&apos;t added any POS hardware or retail accessories yet. Browse our catalog to get started.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              onClick={() => router.push('/')}
              className="py-3.5 px-8 rounded-2xl font-bold inline-flex items-center gap-2 shadow-lg shadow-blue-500/10"
            >
              <Package className="w-4 h-4" />
              Explore Hardware Catalog
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-8 lg:py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <ShoppingCart className="w-3.5 h-3.5" />
              Customer Shopping Bag
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Shopping Cart</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-500">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
            </span>
            <button
              type="button"
              onClick={() => setClearConfirmOpen(true)}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-3 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Cart
            </button>
          </div>
        </div>

        {/* Cart Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => {
              const product = item.product || {};
              const isUpdating = actionLoadingId === item.productId;

              return (
                <div
                  key={item.productId}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-slate-300 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
                >
                  {/* Thumbnail & Info */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <Link
                      href={`/products/${item.productId}`}
                      className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60 group"
                    >
                      <img
                        src={
                          product.imageUrl ||
                          'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500&q=80'
                        }
                        alt={product.name || 'Product'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500&q=80';
                        }}
                      />
                    </Link>

                    <div className="min-w-0 flex-1 space-y-1">
                      <Link
                        href={`/products/${item.productId}`}
                        className="font-bold text-slate-900 text-base hover:text-blue-600 transition-colors line-clamp-1"
                      >
                        {product.name}
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>Unit: ${Number(item.unitPrice).toFixed(2)}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-600">Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Line Total */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl p-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateQuantity(item.productId, item.quantity - 1);
                          } else {
                            removeFromCart(item.productId);
                          }
                        }}
                        disabled={isUpdating}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white transition-colors disabled:opacity-40"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-9 text-center font-bold text-sm text-slate-900 select-none">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={isUpdating}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white transition-colors disabled:opacity-40"
                        title="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right min-w-[90px]">
                      <div className="font-black text-slate-900 text-base">
                        ${Number(item.lineTotal).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">Subtotal</div>
                    </div>

                    {/* Remove Action */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      disabled={isUpdating}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Remove product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Continue Browsing Products
              </Link>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6 sticky top-24">
            <h2 className="font-black text-slate-900 text-lg pb-4 border-b border-slate-100">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Standard Delivery</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax</span>
                <span className="text-xs text-slate-400">Calculated at checkout</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="font-black text-slate-900 text-base">Estimated Total</span>
                <span className="font-black text-slate-900 text-2xl">${subtotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Action Button & Error Alert */}
            <div className="space-y-3 pt-2">
              {checkoutError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{checkoutError}</span>
                </div>
              )}

              <Button
                variant="primary"
                disabled={checkingOut || items.length === 0}
                onClick={handleProceedToCheckout}
                className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-base shadow-lg shadow-blue-500/20"
              >
                {checkingOut ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Reserving Stock...
                  </>
                ) : (
                  <>
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>SSL Encrypted • 5-Min Concurrency-Safe Stock Hold</span>
              </div>
            </div>

            {/* Cart Perks */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Express courier shipping on all orders</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Free 30-day hardware return policy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-slate-900">Clear Shopping Cart?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove all {itemCount} items from your shopping cart?
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setClearConfirmOpen(false);
                }}
                className="w-full py-3 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white text-sm transition-colors"
              >
                Yes, Clear All Items
              </button>
              <Button
                variant="secondary"
                onClick={() => setClearConfirmOpen(false)}
                className="w-full py-3 rounded-xl font-bold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

    </PageContainer>
  );
}
