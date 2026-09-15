import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Image as ImageIcon,
  AlertCircle,
  UploadCloud,
  Link2,
  Trash2,
  CheckCircle2,
  Upload,
  RefreshCw,
} from 'lucide-react';
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

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB maximum limit
const MAX_IMAGE_SIZE_LABEL = '10MB';

const ProductModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) => {
  const isEdit = Boolean(initialData && initialData._id);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Hardware',
    price: '',
    stockQuantity: '',
    description: '',
    imageUrl: '',
  });

  const [imageTab, setImageTab] = useState('upload'); // 'upload' | 'url'
  const [fileMeta, setFileMeta] = useState(null); // { name, size, type }
  const [imageError, setImageError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      const initialImg = initialData.imageUrl || '';
      setFormData({
        name: initialData.name || '',
        category: initialData.category || 'Hardware',
        price: initialData.price !== undefined ? String(initialData.price) : '',
        stockQuantity: initialData.stockQuantity !== undefined ? String(initialData.stockQuantity) : '',
        description: initialData.description || '',
        imageUrl: initialImg,
      });

      // If existing image is a base64 data URL, set tab to upload; otherwise if url set to url
      if (initialImg.startsWith('data:')) {
        setImageTab('upload');
        setFileMeta({ name: 'Device Image', size: 'Embedded' });
      } else if (initialImg) {
        setImageTab('url');
        setFileMeta(null);
      } else {
        setImageTab('upload');
        setFileMeta(null);
      }
    } else {
      setFormData({
        name: '',
        category: 'Hardware',
        price: '',
        stockQuantity: '10',
        description: '',
        imageUrl: '',
      });
      setImageTab('upload');
      setFileMeta(null);
    }
    setImageError('');
    setIsDragging(false);
    setIsReadingImage(false);
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const processImageFile = (file) => {
    setImageError('');
    if (!file) return;

    // 1. Validate file type
    if (!file.type || !file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Validate file size: must strictly not exceed 10MB
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setImageError(
        `Selected file is ${fileSizeMB} MB. Image size must be less than ${MAX_IMAGE_SIZE_LABEL}. Please choose a smaller image.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 3. Read image as Data URL
    setIsReadingImage(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setFileMeta({
        name: file.name,
        size: `${fileSizeMB} MB`,
        type: file.type,
      });
      setIsReadingImage(false);
      setImageError('');
    };

    reader.onerror = () => {
      setImageError('Failed to read image file from device. Please try again.');
      setIsReadingImage(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    setFileMeta(null);
    setImageError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

    if (imageError) {
      newErrors.imageUrl = imageError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (imageError) return;

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

          {/* Product Image Adding Section (Device Upload + Web URL with 10MB limit) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Product Image <span className="text-slate-400 font-normal">(Optional)</span>
              </label>

              {/* Source Switcher: Device Upload vs Image URL */}
              <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setImageTab('upload');
                    setImageError('');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                    imageTab === 'upload'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Device Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImageTab('url');
                    setImageError('');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                    imageTab === 'url'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Image URL</span>
                </button>
              </div>
            </div>

            {/* Hidden Native File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Option 1: Device Image Upload */}
            {imageTab === 'upload' && (
              <div className="space-y-2">
                {formData.imageUrl ? (
                  /* Loaded Image Preview Card */
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                        <img
                          src={formData.imageUrl}
                          alt="Product preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-xs">
                          {fileMeta?.name || 'Device Image Attached'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                            <CheckCircle2 className="w-3 h-3" />
                            {fileMeta?.size ? `${fileMeta.size} • Under 10MB` : 'Ready'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isReadingImage}
                        className="p-2 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all flex items-center gap-1"
                        title="Replace Image"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Change</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-all flex items-center gap-1"
                        title="Remove Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Drag and Drop Zone */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all group ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
                        : imageError
                        ? 'border-rose-300 bg-rose-50/30'
                        : 'border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">
                        <span className="text-blue-600 hover:underline">Choose image from device</span> or drag & drop
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                        <span>PNG, JPG, WEBP, GIF, SVG</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-600 bg-slate-200/70 px-1.5 py-0.5 rounded text-[10px]">
                          MAX 10MB
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Validation Note / Status */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Image size must be less than 10MB</span>
                  <span className="font-medium text-slate-500">Max limit: 10 MB</span>
                </div>
              </div>
            )}

            {/* Option 2: External Image URL */}
            {imageTab === 'url' && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, imageUrl: e.target.value });
                        setFileMeta(null);
                        setImageError('');
                      }}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                    {formData.imageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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
                <p className="text-[11px] text-slate-400 px-1">
                  Enter a direct web link to an image (HTTPS recommended).
                </p>
              </div>
            )}

            {/* Error Banner for Image (e.g. Size > 10MB or invalid format) */}
            {imageError && (
              <div className="p-3 bg-rose-50/90 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Image validation error</p>
                  <p className="text-rose-600 mt-0.5">{imageError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setImageError('')}
                  className="text-rose-400 hover:text-rose-700 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
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
