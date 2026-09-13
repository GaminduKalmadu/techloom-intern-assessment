import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import Button from '../common/Button';

const CATEGORY_SUGGESTIONS = [
  'Hardware',
  'Supplies',
  'Beverages',
  'Apparel',
  'Accessories',
  'Food',
  'Other',
];

const ProductModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) => {
  const isEdit = Boolean(initialData && initialData._id);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Hardware',
    price: '',
    stockQuantity: '',
    description: '',
    imageUrl: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || 'Hardware',
        price: initialData.price !== undefined ? String(initialData.price) : '',
        stockQuantity: initialData.stockQuantity !== undefined ? String(initialData.stockQuantity) : '',
        description: initialData.description || '',
        imageUrl: initialData.imageUrl || '',
      });
    } else {
      setFormData({
        name: '',
        category: 'Hardware',
        price: '',
        stockQuantity: '10',
        description: '',
        imageUrl: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.length > 120) {
      newErrors.name = 'Product name cannot exceed 120 characters';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    const numericPrice = parseFloat(formData.price);
    if (formData.price === '' || isNaN(numericPrice)) {
      newErrors.price = 'Valid price is required';
    } else if (numericPrice < 0) {
      newErrors.price = 'Price must be positive (>= 0)';
    }

    const numericStock = parseInt(formData.stockQuantity, 10);
    if (formData.stockQuantity === '' || isNaN(numericStock)) {
      newErrors.stockQuantity = 'Stock quantity is required';
    } else if (numericStock < 0) {
      newErrors.stockQuantity = 'Stock cannot be negative';
    } else if (!Number.isInteger(Number(formData.stockQuantity))) {
      newErrors.stockQuantity = 'Stock quantity must be a whole integer';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: formData.name.trim(),
      category: formData.category.trim(),
      price: parseFloat(formData.price),
      stockQuantity: parseInt(formData.stockQuantity, 10),
      description: formData.description.trim(),
      imageUrl: formData.imageUrl.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit
                ? 'Update product pricing, stock count, and catalog details'
                : 'Add a new retail item to your POS inventory catalog'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Wireless Barcode Scanner 2D"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 ${
                errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Category & Price Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="category-options"
                  placeholder="Select or type..."
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.category ? 'border-rose-400' : 'border-slate-200'
                  }`}
                />
                <datalist id="category-options">
                  {CATEGORY_SUGGESTIONS.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              {errors.category && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.category}
                </p>
              )}
            </div>

            {/* Price ($) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Price ($) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className={`w-full pl-8 pr-3.5 py-2 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.price ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.price && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.price}
                </p>
              )}
            </div>
          </div>

          {/* Stock Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Stock Quantity <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 50"
              value={formData.stockQuantity}
              onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
              className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                errors.stockQuantity ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
              }`}
            />
            {errors.stockQuantity ? (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.stockQuantity}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                Products with stock &le; 10 trigger low-stock alerts on the POS dashboard.
              </p>
            )}
          </div>

          {/* Image URL & Thumbnail Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Image URL <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="url"
                placeholder="https://example.com/product.jpg"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Provide item specifications, SKU details, or warranty info..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
            >
              {isEdit ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
