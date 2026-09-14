'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import productService from '@/services/productService';
import { useCart } from '@/context/CartContext';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  PackageCheck,
  Tag,
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;
  const { addToCart, actionLoadingId } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [addedItemDetails, setAddedItemDetails] = useState(null);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      setLoading(false);
      try {
        setLoading(true);
        const res = await productService.getProductById(productId);
        const data = res.data?.product;
        if (!data) {
          setError('Product not found or currently unavailable.');
        } else {
          setProduct(data);
          // Set initial quantity: 1 if in stock, 0 if out of stock
          const avail = typeof data.availableStock === 'number' ? data.availableStock : 0;
          setQuantity(avail > 0 ? 1 : 0);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
        setError(
          err.response?.status === 404
            ? 'This product is currently unavailable or has been discontinued.'
            : 'Unable to load product information. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const availableStock = product ? (typeof product.availableStock === 'number' ? product.availableStock : 0) : 0;
  const isOutOfStock = availableStock <= 0;
  const isLowStock = availableStock > 0 && availableStock <= 5;

  const handleIncrement = () => {
    if (quantity < availableStock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (isOutOfStock || quantity < 1) return;

    const res = await addToCart(product._id, quantity);
    if (res?.requireAuth) {
      router.push(`/login?redirect=/products/${product._id}`);
    } else if (res?.success) {
      setAddedItemDetails({
        name: product.name,
        quantity,
        price: product.price,
        total: (product.price * quantity).toFixed(2),
        image: product.imageUrl,
      });
      setCartModalOpen(true);
    }
  };

  if (loading) {
    return (
      <PageContainer className="py-12">
        <div className="max-w-6xl mx-auto">
          <div className="h-5 w-48 bg-slate-200 animate-pulse rounded-md mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-slate-200 animate-pulse rounded-3xl" />
            <div className="space-y-6">
              <div className="h-6 w-28 bg-slate-200 animate-pulse rounded-full" />
              <div className="h-10 w-3/4 bg-slate-200 animate-pulse rounded-xl" />
              <div className="h-8 w-32 bg-slate-200 animate-pulse rounded-lg" />
              <div className="h-24 w-full bg-slate-200 animate-pulse rounded-xl" />
              <div className="h-14 w-full bg-slate-200 animate-pulse rounded-xl" />
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !product) {
    return (
      <PageContainer className="py-16">
        <div className="max-w-xl mx-auto text-center bg-white rounded-3xl p-10 border border-slate-200/80 shadow-sm">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Product Unavailable</h1>
          <p className="text-slate-600 mb-6">{error || 'The requested product could not be found.'}</p>
          <Button variant="primary" onClick={() => router.push('/')} className="inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Product Catalog
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-8 lg:py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Breadcrumbs Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <span className="hover:text-blue-600 transition-colors">
            {product.categoryId?.name || 'Hardware'}
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-semibold truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Product Media Gallery */}
          <div className="lg:col-span-6">
            <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-gradient-to-tr from-slate-100 to-slate-50 border border-slate-200/80 shadow-sm group">
              <img
                src={
                  product.imageUrl ||
                  'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&q=80'
                }
                alt={product.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&q=80';
                }}
              />

              {/* Status Badge Overlay */}
              <div className="absolute top-4 left-4">
                {isOutOfStock ? (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-md flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider bg-amber-500 text-white shadow-md flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Only {availableStock} available
                  </span>
                ) : (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider bg-emerald-600 text-white shadow-md flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    In Stock
                  </span>
                )}
              </div>
            </div>

            {/* Quality Badges */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                <ShieldCheck className="w-5 h-5 text-blue-600 mb-1" />
                <span className="text-xs font-bold text-slate-800">1-Year Warranty</span>
                <span className="text-[10px] text-slate-500">Official Techloom</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                <Truck className="w-5 h-5 text-emerald-600 mb-1" />
                <span className="text-xs font-bold text-slate-800">Fast Dispatch</span>
                <span className="text-[10px] text-slate-500">Express delivery</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                <RotateCcw className="w-5 h-5 text-purple-600 mb-1" />
                <span className="text-xs font-bold text-slate-800">Easy Returns</span>
                <span className="text-[10px] text-slate-500">30-day guarantee</span>
              </div>
            </div>
          </div>

          {/* Product Meta & Actions */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-3">
                <Tag className="w-3 h-3" />
                {product.categoryId?.name || 'Hardware'}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-slate-900">
                  ${Number(product.price).toFixed(2)}
                </span>
                <span className="text-xs font-medium text-slate-500">USD • Taxes calculated at checkout</span>
              </div>
            </div>

            {/* Availability Alert Box */}
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                isOutOfStock
                  ? 'bg-rose-50/60 border-rose-200 text-rose-800'
                  : isLowStock
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              }`}
            >
              {isOutOfStock ? (
                <XCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
              ) : isLowStock ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              ) : (
                <PackageCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              )}
              <div>
                <h4 className="font-bold text-sm">
                  {isOutOfStock
                    ? 'Currently Out of Stock'
                    : isLowStock
                    ? `Hurry! Only ${availableStock} units remaining`
                    : 'In Stock and Ready to Ship'}
                </h4>
                <p className="text-xs mt-0.5 opacity-90">
                  {isOutOfStock
                    ? 'This item is currently sold out. Check back soon or browse our alternative hardware equipment.'
                    : isLowStock
                    ? 'High demand item with limited quantities available in our fulfillment center.'
                    : 'Orders placed today ship within 24 hours with trackable logistics.'}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Description</h3>
              <p className="text-slate-700 text-base leading-relaxed">
                {product.description ||
                  'High-grade commercial POS hardware solution built for fast-paced retail and hospitality checkout counters.'}
              </p>
            </div>

            {/* Action Area: Quantity & Add to Cart */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Quantity Selector */}
                <div className="flex items-center border border-slate-200 bg-slate-50 rounded-2xl p-1 shrink-0 w-fit">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={isOutOfStock || quantity <= 1}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-base text-slate-900 select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={isOutOfStock || quantity >= availableStock}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <Button
                  variant="primary"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2.5 text-base font-bold shadow-lg shadow-blue-500/20 disabled:shadow-none"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {isOutOfStock ? 'Sold Out' : `Add to Cart • $${(product.price * quantity).toFixed(2)}`}
                </Button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <Link href="/" className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors font-medium">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Continue Shopping
                </Link>
                <span>Product SKU: #{product._id?.slice(-6).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Placeholder Confirmation Modal */}
      {cartModalOpen && addedItemDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-slate-900">Added to Cart Preview</h3>
              <p className="text-xs text-slate-500">
                Item successfully added to your shopping session
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
              <img
                src={addedItemDetails.image || 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500&q=80'}
                alt={addedItemDetails.name}
                className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-slate-900 truncate">{addedItemDetails.name}</h4>
                <p className="text-xs text-slate-500">
                  Qty: {addedItemDetails.quantity} × ${Number(addedItemDetails.price).toFixed(2)}
                </p>
                <p className="text-xs font-bold text-blue-600 mt-0.5">
                  Subtotal: ${addedItemDetails.total}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900">
              <p className="font-medium">
                🛒 <strong>Cart Saved:</strong> Item added to your active cart. You can review items and proceed to checkout anytime.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                onClick={() => {
                  setCartModalOpen(false);
                  router.push('/cart');
                }}
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                View Shopping Cart
              </Button>
              <Button
                variant="secondary"
                onClick={() => setCartModalOpen(false)}
                className="w-full py-3 rounded-xl font-bold"
              >
                Keep Browsing
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
