import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Package,
  AlertCircle,
  Tag,
  ShieldCheck,
  RotateCcw,
  Boxes,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import * as productService from '../services/productService';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { SkeletonCard } from '../components/common/Loader';
import ErrorAlert from '../components/common/ErrorAlert';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, loading, updating, updateQuantity, removeItem, clearCart, addToCart } = useCart();
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  // Fetch quick catalog recommendations
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoadingCatalog(true);
        const res = await productService.getProducts({ limit: 6, sortOrder: 'desc' });
        if (res && res.success && res.data) {
          setCatalogProducts(res.data);
        }
      } catch (err) {
        console.error('Failed to load catalog products:', err);
      } finally {
        setLoadingCatalog(false);
      }
    };
    fetchCatalog();
  }, []);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError('');
    setPromoSuccess('');
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'TECHLOOM10' || code === 'SAVE10') {
      setAppliedDiscount(0.1); // 10% off
      setPromoSuccess('10% discount applied!');
    } else if (code === 'VIP20') {
      setAppliedDiscount(0.2); // 20% off
      setPromoSuccess('20% VIP discount applied!');
    } else {
      setPromoError('Invalid coupon code. Try TECHLOOM10');
    }
  };

  const items = cart?.items || [];
  const rawSubtotal = cart?.subtotal || 0;
  const discountAmount = Math.round(rawSubtotal * appliedDiscount * 100) / 100;
  const taxableAmount = Math.max(0, rawSubtotal - discountAmount);
  const estimatedTax = Math.round(taxableAmount * 0.08 * 100) / 100; // 8% sales tax
  const finalTotal = Math.round((taxableAmount + estimatedTax) * 100) / 100;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div>
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shopping Cart</h1>
            <Badge variant="primary" size="sm">
              {cart?.totalItems || 0} {cart?.totalItems === 1 ? 'item' : 'items'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review your selected items, modify quantities, and proceed to checkout.
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCart}
              disabled={updating}
              className="text-slate-600 hover:text-rose-600 hover:border-rose-200"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Clear Cart
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/checkout')}
              className="shadow-sm shadow-blue-500/20"
            >
              Proceed to Checkout
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        /* Empty Cart State */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Your shopping cart is empty</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            Looks like you haven't added any products to your cart yet. Explore available inventory or
            choose from the recommended products below.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/inventory">
              <Button variant="primary">
                <Boxes className="w-4 h-4 mr-2" />
                Browse Full Inventory
              </Button>
            </Link>
          </div>

          {/* Quick-add recommendations in empty state */}
          {catalogProducts.length > 0 && (
            <div className="mt-12 text-left pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-800">Quick Add from Catalog</h3>
                </div>
                <Link to="/inventory" className="text-xs font-semibold text-blue-600 hover:underline">
                  View all &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {catalogProducts.slice(0, 3).map((prod) => (
                  <div
                    key={prod._id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700">
                          {prod.category}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          ${prod.price?.toFixed(2)}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800 mt-2 line-clamp-1">
                        {prod.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {prod.stockQuantity > 0 ? `${prod.stockQuantity} in stock` : 'Out of stock'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full text-xs"
                      disabled={prod.stockQuantity <= 0 || updating}
                      onClick={() => addToCart(prod._id, 1, prod.name)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add to Cart
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Cart Content: Items List + Price Summary */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Product Cards & Quantity Controls */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Cart Items ({items.length})
                </span>
                <span className="text-xs text-slate-400">Prices locked upon checkout</span>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const product = item.productId || {};
                  const isPopulated = typeof product === 'object' && product !== null;
                  const productName = isPopulated ? product.name : 'Product Item';
                  const productCategory = isPopulated ? product.category : 'General';
                  const productStock = isPopulated ? product.stockQuantity : 99;
                  const unitPrice = item.price || (isPopulated ? product.price : 0) || 0;
                  const itemSubtotal = Math.round(unitPrice * item.quantity * 100) / 100;
                  const isOutOfStock = productStock < item.quantity;

                  return (
                    <div
                      key={item._id || item.productId}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/40"
                    >
                      {/* Product Info */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 border border-slate-200/60 overflow-hidden">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {productCategory}
                            </span>
                            {productStock <= 5 && productStock > 0 && (
                              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                Only {productStock} left
                              </span>
                            )}
                            {isOutOfStock && (
                              <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Exceeds stock ({productStock})
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {productName}
                          </h3>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>${unitPrice.toFixed(2)} each</span>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-emerald-600 font-medium">
                              {productStock} in stock
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls & Line Subtotal */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                        {/* Quantity Controls */}
                        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/80 p-1">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={updating || item.quantity <= 1}
                            onClick={() =>
                              updateQuantity(item._id || product._id, item.quantity - 1)
                            }
                            className="w-7 h-7 rounded-lg bg-white shadow-xs border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="w-10 text-center text-xs font-bold text-slate-800">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={updating || item.quantity >= productStock}
                            onClick={() =>
                              updateQuantity(item._id || product._id, item.quantity + 1)
                            }
                            className="w-7 h-7 rounded-lg bg-white shadow-xs border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right min-w-[70px]">
                          <p className="text-sm font-bold text-slate-900">
                            ${itemSubtotal.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-slate-400">Total</p>
                        </div>

                        {/* Remove Item Button */}
                        <button
                          type="button"
                          aria-label="Remove item"
                          disabled={updating}
                          onClick={() => removeItem(item._id || product._id, productName)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Catalog Bar */}
            {catalogProducts.length > 0 && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Add More Items
                  </span>
                  <Link to="/inventory" className="text-xs font-semibold text-blue-600 hover:underline">
                    View Catalog
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {catalogProducts.slice(0, 4).map((p) => {
                    const inCart = items.some(
                      (i) => (i.productId?._id || i.productId) === p._id
                    );
                    return (
                      <div
                        key={p._id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                            {p.name}
                          </p>
                          <p className="text-xs font-bold text-slate-900 mt-1">
                            ${p.price?.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant={inCart ? 'secondary' : 'outline'}
                          size="sm"
                          className="mt-2 w-full text-[11px] py-1"
                          disabled={p.stockQuantity <= 0 || updating}
                          onClick={() => addToCart(p._id, 1, p.name)}
                        >
                          {inCart ? 'Add More' : '+ Add'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Price Calculation & Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Order Summary
              </h2>

              {/* Price Calculation Breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({cart?.totalItems || 0} items)</span>
                  <span className="font-semibold text-slate-900">${rawSubtotal.toFixed(2)}</span>
                </div>

                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount ({(appliedDiscount * 100).toFixed(0)}%)</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    Estimated Tax
                    <span className="text-[10px] text-slate-400">(8%)</span>
                  </span>
                  <span className="font-semibold text-slate-900">${estimatedTax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Shipping & Handling</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-bold text-slate-900">Total Amount</span>
                    <p className="text-[11px] text-slate-400">USD, inclusive of taxes</p>
                  </div>
                  <span className="text-2xl font-black text-blue-600">
                    ${finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="pt-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Promo code (e.g. TECHLOOM10)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase tracking-wide"
                    />
                  </div>
                  <Button type="submit" variant="outline" size="sm" className="text-xs">
                    Apply
                  </Button>
                </div>
                {promoError && <p className="text-xs text-rose-500 mt-1.5">{promoError}</p>}
                {promoSuccess && <p className="text-xs text-emerald-600 mt-1.5">{promoSuccess}</p>}
              </form>

              {/* Checkout CTA */}
              <Button
                variant="primary"
                size="lg"
                className="w-full shadow-md shadow-blue-500/20 font-bold"
                onClick={() => navigate('/checkout')}
                disabled={items.length === 0}
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              {/* Trust Badges */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-400">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>15-min Stock Lock</span>
                </div>
                <span>&bull;</span>
                <span>POS & Online Ready</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
