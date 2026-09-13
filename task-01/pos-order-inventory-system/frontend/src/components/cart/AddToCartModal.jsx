import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  ShoppingCart,
  Package,
  AlertTriangle,
  Check,
  Tag,
  Boxes,
  Info,
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';

const PRESETS = [1, 2, 5, 10];

const AddToCartModal = ({
  isOpen,
  onClose,
  onAdd,
  product,
  existingQuantityInCart = 0,
  isLoading = false,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  const currentStock = product?.stockQuantity || 0;
  const unitPrice = Number(product?.price) || 0;

  // Reset state whenever modal opens or product changes
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setError('');
    }
  }, [isOpen, product]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  // Dynamic calculations
  const numQty = parseInt(quantity, 10) || 0;
  const subtotal = numQty * unitPrice;
  const totalPrice = subtotal;

  const handleIncrement = () => {
    if (numQty < currentStock) {
      setQuantity(numQty + 1);
      setError('');
    } else {
      setError(`Cannot exceed total available stock (${currentStock} units)`);
    }
  };

  const handleDecrement = () => {
    if (numQty > 1) {
      setQuantity(numQty - 1);
      setError('');
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val === '') {
      setQuantity('');
      setError('Please enter a valid quantity');
      return;
    }
    const parsed = parseInt(val, 10);
    if (parsed <= 0) {
      setQuantity(1);
      setError('Quantity must be at least 1');
      return;
    }
    if (parsed > currentStock) {
      setQuantity(currentStock);
      setError(`Quantity capped at maximum available stock (${currentStock} units)`);
      return;
    }
    setQuantity(parsed);
    setError('');
  };

  const handlePreset = (val) => {
    if (val > currentStock) {
      setQuantity(currentStock);
      setError(`Capped at available stock (${currentStock} units)`);
    } else {
      setQuantity(val);
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (numQty <= 0) {
      setError('Please enter at least 1 item');
      return;
    }
    if (numQty > currentStock) {
      setError(`Only ${currentStock} units available in stock`);
      return;
    }

    onAdd(product._id, numQty, product.name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with smooth blur */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80 shadow-xs">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Add to Cart</h3>
              <p className="text-[11px] text-slate-400">Configure item quantity & price</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Product Overview Section */}
          <div className="flex items-start gap-3.5 p-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Package className="w-6 h-6 text-slate-400" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900 truncate">{product.name}</h4>
                <span className="font-mono font-bold text-emerald-600 text-sm shrink-0">
                  ${unitPrice.toFixed(2)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                {product.category && (
                  <Badge variant="neutral" size="xs">
                    {product.category}
                  </Badge>
                )}
                <span className="text-[11px] font-mono text-slate-400">
                  SKU: {product._id?.slice(-6).toUpperCase()}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    currentStock > 10
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                  }`}
                >
                  {currentStock} available in stock
                </span>
              </div>

              {existingQuantityInCart > 0 && (
                <p className="text-[11px] font-medium text-blue-600 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  Currently {existingQuantityInCart} in your cart
                </p>
              )}
            </div>
          </div>

          {/* Quantity Selector: How many items need */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                How many items needed?
              </label>
              <span className="text-xs text-slate-400">
                Max:{' '}
                <span className="font-semibold text-slate-700 font-mono">{currentStock}</span>
              </span>
            </div>

            {/* Stepper Control */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={numQty <= 1 || isLoading}
                className="w-12 h-12 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 transition-colors shadow-xs"
                title="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={quantity}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50/50 text-center font-mono text-xl font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all shadow-inner"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                  units
                </span>
              </div>

              <button
                type="button"
                onClick={handleIncrement}
                disabled={numQty >= currentStock || isLoading}
                className="w-12 h-12 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 transition-colors shadow-xs"
                title="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Select:</span>
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={p > currentStock || isLoading}
                  onClick={() => handlePreset(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    numQty === p
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 disabled:opacity-30'
                  }`}
                >
                  +{p}
                </button>
              ))}

              {currentStock > 1 && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handlePreset(currentStock)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    numQty === currentStock
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All ({currentStock})
                </button>
              )}
            </div>

            {/* Error / Warning Notice */}
            {error && (
              <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-rose-600 animate-in fade-in">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Automatic Price Calculation Display Box */}
          <div className="p-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 rounded-2xl border border-blue-100/60 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Unit Price</span>
              <span className="font-mono font-medium text-slate-700">${unitPrice.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Quantity Selected</span>
              <span className="font-mono font-medium text-slate-700">× {numQty}</span>
            </div>

            <div className="border-t border-blue-100/70 pt-2 flex items-baseline justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Calculated Subtotal
                </span>
                <span className="text-[11px] text-slate-400">Excludes taxes & checkout fees</span>
              </div>

              <div className="text-right">
                <span className="font-mono text-2xl font-black text-slate-900">
                  ${totalPrice.toFixed(2)}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 ml-1">USD</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-xl text-slate-600 font-semibold text-sm"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              disabled={numQty <= 0 || numQty > currentStock || isLoading}
              className="flex-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 py-3"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                Add to Cart • ${totalPrice.toFixed(2)}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToCartModal;
