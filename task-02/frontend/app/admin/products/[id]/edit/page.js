'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Loading from '@/components/common/Loading';
import AdminGuard from '@/components/admin/AdminGuard';
import ProductImageUpload from '@/components/admin/ProductImageUpload';
import productService from '@/services/productService';
import categoryService from '@/services/categoryService';
import {
  ArrowLeft,
  Image as ImageIcon,
  DollarSign,
  Boxes,
  Lock,
  Check,
  AlertCircle,
} from 'lucide-react';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id;

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  // Product Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [reservedQuantity, setReservedQuantity] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadProductAndCategories = async () => {
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          productService.getProductById(productId),
          categoryService.getCategories(),
        ]);

        const prod = prodRes.data.product;
        setName(prod.name || '');
        setDescription(prod.description || '');
        setCategoryId(prod.categoryId?._id || prod.categoryId || '');
        setPrice(prod.price ? String(prod.price) : '0');
        setImageUrl(prod.imageUrl || '');
        setStockQuantity(prod.stockQuantity !== undefined ? String(prod.stockQuantity) : '0');
        setReservedQuantity(prod.reservedQuantity || 0);
        setIsActive(Boolean(prod.isActive));

        setCategories(catRes.data.categories || []);
      } catch (err) {
        setErrorMessage(err.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProductAndCategories();
    }
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Product title is required.');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMessage('Price must be a valid non-negative number.');
      return;
    }

    const numStock = parseInt(stockQuantity, 10);
    if (isNaN(numStock) || numStock < 0) {
      setErrorMessage('Stock quantity must be a non-negative integer.');
      return;
    }

    if (numStock < reservedQuantity) {
      setErrorMessage(
        `Total stock (${numStock}) cannot be lower than currently reserved stock (${reservedQuantity}).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await productService.updateProduct(productId, {
        name: name.trim(),
        description: description.trim(),
        categoryId,
        price: numPrice,
        imageUrl: imageUrl.trim(),
        stockQuantity: numStock,
        isActive,
      });

      router.push('/admin/products');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableStockCalc = Math.max(0, (parseInt(stockQuantity, 10) || 0) - reservedQuantity);

  return (
    <AdminGuard>
      <main className="py-8 space-y-6">
        <PageContainer size="sm">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href="/admin/products"
                  className="text-xs text-slate-400 hover:text-purple-600 transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Products
                </Link>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Edit Product Details
              </h1>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <Loading size="md" message="Loading product information..." />
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5"
            >
              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Title */}
              <Input
                id="name"
                label="Product Title"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              {/* Description */}
              <div className="space-y-1.5">
                <label
                  htmlFor="description"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                />
              </div>

              {/* Category Selection */}
              <div className="space-y-1.5">
                <label
                  htmlFor="category"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 bg-white outline-none focus:border-blue-600 font-medium"
                >
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <Input
                id="price"
                label="Price (USD)"
                type="number"
                step="0.01"
                min="0"
                icon={DollarSign}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />

              {/* Inventory Stock & Reserved Overview */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Inventory & Stock Levels
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-500" />
                    Reserved stock locked
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Total Stock Input */}
                  <div>
                    <label
                      htmlFor="stockQuantity"
                      className="block text-[11px] font-bold text-slate-600 uppercase mb-1"
                    >
                      Total Physical Stock
                    </label>
                    <input
                      id="stockQuantity"
                      type="number"
                      min={reservedQuantity}
                      step="1"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-slate-900 bg-white outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* Reserved Stock (Read Only) */}
                  <div>
                    <span className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Reserved Stock
                    </span>
                    <div className="w-full rounded-xl border border-amber-200/60 bg-amber-50 px-3 py-2 text-xs font-mono font-bold text-amber-700 flex items-center justify-between">
                      <span>{reservedQuantity}</span>
                      <span className="text-[10px] text-amber-600 uppercase">Held</span>
                    </div>
                  </div>

                  {/* Calculated Available Stock */}
                  <div>
                    <span className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Available Stock
                    </span>
                    <div className="w-full rounded-xl border border-emerald-200/60 bg-emerald-50 px-3 py-2 text-xs font-mono font-bold text-emerald-700 flex items-center justify-between">
                      <span>{availableStockCalc}</span>
                      <span className="text-[10px] text-emerald-600 uppercase">Live</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Image Section (Upload from Device max 10MB or Image URL) */}
              <ProductImageUpload
                imageUrl={imageUrl}
                onChange={(val) => {
                  setImageUrl(val);
                  setErrorMessage('');
                }}
                onError={(err) => setErrorMessage(err)}
              />

              {/* Active Status Switch */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-900">Active Status</span>
                  <span className="text-[11px] text-slate-400">
                    Product visibility in store catalog
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <Link href="/admin/products">
                  <Button variant="outline" size="md">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  icon={Check}
                >
                  Update Product
                </Button>
              </div>
            </form>
          )}
        </PageContainer>
      </main>
    </AdminGuard>
  );
}
