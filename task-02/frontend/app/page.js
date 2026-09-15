'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import productService from '@/services/productService';
import categoryService from '@/services/categoryService';
import { useCart } from '@/context/CartContext';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  ShoppingCart,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Tag,
  Package,
  Layers,
  ChevronRight,
  Filter,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function CustomerStorePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [availability, setAvailability] = useState(''); // '' | 'in-stock' | 'out-of-stock'
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Cart Placeholder Modal
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [selectedCartProduct, setSelectedCartProduct] = useState(null);

  // Fetch categories once on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryService.getCategories();
        setCategories(res.data?.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Fetch products whenever filters change
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (minPrice !== '' && !isNaN(Number(minPrice))) params.minPrice = minPrice;
      if (maxPrice !== '' && !isNaN(Number(maxPrice))) params.maxPrice = maxPrice;
      if (availability) params.availability = availability;

      const res = await productService.getProducts(params);
      setProducts(res.data?.products || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Unable to load products. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchProducts();
    }, 250);

    return () => clearTimeout(debounceTimer);
  }, [search, selectedCategory, minPrice, maxPrice, availability]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setAvailability('');
  };

  const hasActiveFilters = Boolean(
    search.trim() || selectedCategory || minPrice !== '' || maxPrice !== '' || availability
  );

  const router = useRouter();
  const { addToCart, actionLoadingId } = useCart();

  const handleAddToCartClick = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    const availableStock = typeof product.availableStock === 'number' ? product.availableStock : 0;
    if (availableStock <= 0) return;

    const res = await addToCart(product._id, 1);
    if (res?.requireAuth) {
      router.push('/login?redirect=/cart');
    } else if (res?.success) {
      setSelectedCartProduct(product);
      setCartModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Hero Header Section */}
      <section className="bg-white border-b border-slate-200/80 pt-8 pb-12">
        <PageContainer>
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Official POS Hardware & Equipment Catalog
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Enterprise POS & Retail Solutions
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              Explore high-performance barcode scanners, touchscreen POS terminals, receipt printers, and accessories with real-time inventory availability.
            </p>

            {/* Instant Search Bar */}
            <div className="pt-2 max-w-2xl mx-auto">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products by name or keywords (e.g. scanner, printer, monitor)..."
                  className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-900 placeholder:text-slate-400 text-sm font-medium transition-all shadow-sm outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Category Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  !selectedCategory
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug === selectedCategory ? '' : cat.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedCategory === cat.slug
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Main Content Area */}
      <PageContainer id="catalog" className="pt-8">
        {/* Mobile Filter Toggle & Summary */}
        <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6">
          <div className="text-sm font-bold text-slate-800">
            {products.length} {products.length === 1 ? 'product' : 'products'} found
          </div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters {hasActiveFilters && '• Active'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6 sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                Filter Catalog
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</h3>
              <div className="space-y-1">
                <label className="flex items-center gap-2.5 p-2 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === ''}
                    onChange={() => setSelectedCategory('')}
                    className="text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <span className={selectedCategory === '' ? 'font-bold text-blue-600' : 'text-slate-700'}>
                    All Categories
                  </span>
                </label>
                {categories.map((cat) => (
                  <label
                    key={cat._id}
                    className="flex items-center gap-2.5 p-2 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat.slug}
                      onChange={() => setSelectedCategory(cat.slug)}
                      className="text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <span className={selectedCategory === cat.slug ? 'font-bold text-blue-600' : 'text-slate-700'}>
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Price Range ($)</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 mb-1 block">MIN</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 mb-1 block">MAX</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="500+"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice('0');
                    setMaxPrice('100');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Under $100
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice('100');
                    setMaxPrice('250');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  $100 - $250
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice('250');
                    setMaxPrice('');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  $250+
                </button>
              </div>
            </div>

            {/* Availability Filter */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Availability</h3>
              <div className="space-y-1.5">
                {[
                  { label: 'All Items', value: '' },
                  { label: 'In Stock Only', value: 'in-stock' },
                  { label: 'Out of Stock Only', value: 'out-of-stock' },
                ].map((item) => (
                  <label
                    key={item.value}
                    className="flex items-center gap-2.5 p-2 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="availability"
                      checked={availability === item.value}
                      onChange={() => setAvailability(item.value)}
                      className="text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <span className={availability === item.value ? 'font-bold text-blue-600' : 'text-slate-700'}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="secondary"
                onClick={handleResetFilters}
                className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear All Filters
              </Button>
            )}
          </aside>

          {/* Product Grid Area */}
          <main className="lg:col-span-9 space-y-6">
            {/* Results Header Bar */}
            <div className="hidden lg:flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-sm font-bold text-slate-700">
                Showing{' '}
                <span className="text-blue-600 font-extrabold">{products.length}</span> active{' '}
                {products.length === 1 ? 'hardware product' : 'hardware products'}
              </div>

              {hasActiveFilters && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Filters Applied:</span>
                  {selectedCategory && (
                    <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold flex items-center gap-1">
                      Cat: {selectedCategory}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory('')} />
                    </span>
                  )}
                  {availability && (
                    <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-semibold flex items-center gap-1">
                      Status: {availability}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setAvailability('')} />
                    </span>
                  )}
                  {(minPrice || maxPrice) && (
                    <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 font-semibold flex items-center gap-1">
                      Price: ${minPrice || '0'} - ${maxPrice || '∞'}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => {
                          setMinPrice('');
                          setMaxPrice('');
                        }}
                      />
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Loading Skeletons */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-4 animate-pulse"
                  >
                    <div className="aspect-square w-full bg-slate-200 rounded-2xl" />
                    <div className="h-4 w-24 bg-slate-200 rounded-full" />
                    <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
                    <div className="h-4 w-full bg-slate-200 rounded-md" />
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-6 w-20 bg-slate-200 rounded-md" />
                      <div className="h-9 w-28 bg-slate-200 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              /* Error State */
              <div className="bg-white rounded-3xl p-12 text-center border border-rose-100 shadow-sm max-w-md mx-auto space-y-4">
                <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Failed to Load Products</h3>
                <p className="text-xs text-slate-500">{error}</p>
                <Button variant="primary" onClick={fetchProducts} className="rounded-xl text-xs font-bold">
                  Retry Loading
                </Button>
              </div>
            ) : products.length === 0 ? (
              /* Empty State */
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto space-y-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900">No Products Found</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  We couldn&apos;t find any hardware matching your current search terms or filter selection.
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="secondary"
                    onClick={handleResetFilters}
                    className="rounded-xl text-xs font-bold inline-flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset All Filters
                  </Button>
                )}
              </div>
            ) : (
              /* Product Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => {
                  const availableStock =
                    typeof product.availableStock === 'number' ? product.availableStock : 0;
                  const isOutOfStock = availableStock <= 0;
                  const isLowStock = availableStock > 0 && availableStock <= 5;

                  return (
                    <div
                      key={product._id}
                      className="group bg-white rounded-3xl p-4 border border-slate-200/80 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        {/* Image Container with Zoom & Badge */}
                        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 mb-4">
                          <img
                            src={
                              product.imageUrl ||
                              'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500&q=80'
                            }
                            alt={product.name}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500&q=80';
                            }}
                          />

                          {/* Customer Availability Indicator */}
                          <div className="absolute top-3 left-3">
                            {isOutOfStock ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider bg-amber-500 text-white shadow-sm flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Only {availableStock} left
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                In Stock
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Product Meta */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                            <Tag className="w-3 h-3" />
                            {product.categoryId?.name || 'Hardware'}
                          </div>
                          <Link href={`/products/${product._id}`}>
                            <h2 className="font-bold text-slate-900 text-base line-clamp-1 hover:text-blue-600 transition-colors">
                              {product.name}
                            </h2>
                          </Link>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {product.description || 'Enterprise POS and retail hardware equipment.'}
                          </p>
                        </div>
                      </div>

                      {/* Pricing & Actions */}
                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-lg font-black text-slate-900">
                            ${Number(product.price).toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">USD</div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* View Details Button */}
                          <Link
                            href={`/products/${product._id}`}
                            className="p-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center"
                            title="View Product Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Add to Cart Button Placeholder */}
                          <button
                            type="button"
                            onClick={(e) => handleAddToCartClick(e, product)}
                            disabled={isOutOfStock}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            {isOutOfStock ? 'Sold Out' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </PageContainer>

      {/* Mobile Filters Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white h-full p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="font-black text-slate-900 text-lg flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                Filter Options
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Categories */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</h4>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="mobile-category"
                    checked={selectedCategory === ''}
                    onChange={() => setSelectedCategory('')}
                  />
                  <span>All Categories</span>
                </label>
                {categories.map((cat) => (
                  <label key={cat._id} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="mobile-category"
                      checked={selectedCategory === cat.slug}
                      onChange={() => setSelectedCategory(cat.slug)}
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Mobile Price */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Price Range</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min $"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
                <input
                  type="number"
                  placeholder="Max $"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>
            </div>

            {/* Mobile Availability */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Availability</h4>
              <div className="space-y-1.5">
                {[
                  { label: 'All Items', value: '' },
                  { label: 'In Stock Only', value: 'in-stock' },
                  { label: 'Out of Stock Only', value: 'out-of-stock' },
                ].map((item) => (
                  <label key={item.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="mobile-availability"
                      checked={availability === item.value}
                      onChange={() => setAvailability(item.value)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <Button
                variant="primary"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3 rounded-xl font-bold"
              >
                Apply Filters ({products.length} Results)
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    handleResetFilters();
                    setMobileFiltersOpen(false);
                  }}
                  className="w-full py-3 rounded-xl font-bold"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Placeholder Confirmation Modal */}
      {cartModalOpen && selectedCartProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-slate-900">Added to Cart</h3>
              <p className="text-xs text-slate-500">
                Item successfully added to your shopping session
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
              <img
                src={
                  selectedCartProduct.imageUrl ||
                  'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500&q=80'
                }
                alt={selectedCartProduct.name}
                className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-slate-900 truncate">
                  {selectedCartProduct.name}
                </h4>
                <p className="text-xs text-slate-500">Qty: 1 item</p>
                <p className="text-xs font-bold text-blue-600 mt-0.5">
                  ${Number(selectedCartProduct.price).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900">
              <p className="font-medium">
                🛒 <strong>Cart Saved:</strong> Item has been added to your active shopping cart. You can review items and proceed to checkout anytime.
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
                Keep Browsing Catalog
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
