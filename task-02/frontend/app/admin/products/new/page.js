'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import AdminGuard from '@/components/admin/AdminGuard';
import productService from '@/services/productService';
import categoryService from '@/services/categoryService';
import {
  PackagePlus,
  ArrowLeft,
  Image as ImageIcon,
  DollarSign,
  Boxes,
  Tag,
  AlertCircle,
  Plus,
  Check,
} from 'lucide-react';

export default function AddProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [isActive, setIsActive] = useState(true);

  // Quick category modal state
  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryService.getCategories();
        const cats = res.data.categories || [];
        setCategories(cats);
        if (cats.length > 0) {
          setCategoryId(cats[0]._id);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsCreatingCategory(true);
    try {
      const res = await categoryService.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim(),
      });
      const created = res.data.category;
      setCategories((prev) => [...prev, created]);
      setCategoryId(created._id);
      setNewCatName('');
      setNewCatDesc('');
      setNewCategoryModalOpen(false);
    } catch (err) {
      alert(`Error creating category: ${err.message}`);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Product title is required.');
      return;
    }

    if (!categoryId) {
      setErrorMessage('Please select a product category.');
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

    setIsSubmitting(true);
    try {
      await productService.createProduct({
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
      setErrorMessage(err.message || 'Failed to create product.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                Add New Product
              </h1>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Product Creation Form */}
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
            {/* Name */}
            <Input
              id="name"
              label="Product Title"
              placeholder="e.g. Wireless Barcode Scanner 2D"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Product specifications, compatibility, and key features..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
              />
            </div>

            {/* Category selection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="category" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Category <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setNewCategoryModalOpen(true)}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Category
                </button>
              </div>

              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 bg-white outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 font-medium"
              >
                {categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Price and Stock Quantity Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Price */}
              <Input
                id="price"
                label="Price (USD)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                icon={DollarSign}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />

              {/* Stock Quantity */}
              <Input
                id="stockQuantity"
                label="Initial Stock Quantity"
                type="number"
                step="1"
                min="0"
                placeholder="0"
                icon={Boxes}
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                required
                helperText="Reserved stock will start at 0"
              />
            </div>

            {/* Image URL */}
            <div className="space-y-1.5">
              <Input
                id="imageUrl"
                label="Image URL"
                type="url"
                icon={ImageIcon}
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                helperText="Direct image link for catalog display"
              />

              {imageUrl && (
                <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono truncate max-w-sm">
                    {imageUrl}
                  </span>
                </div>
              )}
            </div>

            {/* Active Status Switch */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-slate-900">Active Status</span>
                <span className="text-[11px] text-slate-400">
                  Visible to shoppers when active in store
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

            {/* Submit Action */}
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
                Save Product
              </Button>
            </div>
          </form>

          {/* Quick Create Category Modal */}
          {newCategoryModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Create New Category</h3>
                  <button
                    type="button"
                    onClick={() => setNewCategoryModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <Input
                    label="Category Name"
                    placeholder="e.g. Scanners & Readers"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    required
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Category description..."
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewCategoryModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isCreatingCategory}
                    >
                      Create
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </PageContainer>
      </main>
    </AdminGuard>
  );
}
