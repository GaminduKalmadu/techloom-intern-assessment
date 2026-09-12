import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Package, AlertCircle } from 'lucide-react';
import Button from '../common/Button';

const PRESETS = [5, 10, 25, 50];

const StockAdjustModal = ({
  isOpen,
  onClose,
  onSubmit,
  product,
  isLoading = false,
}) => {
  const [mode, setMode] = useState('add'); // 'add' | 'remove'
  const [quantity, setQuantity] = useState('10');
  const [error, setError] = useState('');

  useEffect(() => {
    setMode('add');
    setQuantity('10');
    setError('');
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currentStock = product.stockQuantity || 0;
  const numQty = parseInt(quantity, 10) || 0;
  const delta = mode === 'add' ? numQty : -numQty;
  const projectedStock = currentStock + delta;

  const handlePreset = (val) => {
    setQuantity(String(val));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (numQty <= 0) {
      setError('Please enter a quantity greater than 0');
      return;
    }
    if (projectedStock < 0) {
      setError(`Cannot deduct more than available stock (${currentStock} units)`);
      return;
    }

    onSubmit(product._id, delta);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Adjust Stock Level</h3>
              <p className="text-xs text-slate-500 truncate max-w-[240px]">{product.name}</p>
            </div>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Current vs Projected Stock Indicator */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Current Stock
              </span>
              <div className="text-xl font-extrabold text-slate-800 mt-0.5">
                {currentStock} <span className="text-xs font-normal text-slate-500">units</span>
              </div>
            </div>
            <div className="border-l border-slate-200">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Projected Stock
              </span>
              <div
                className={`text-xl font-extrabold mt-0.5 ${
                  projectedStock < 0
                    ? 'text-rose-600'
                    : projectedStock <= 10
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {Math.max(0, projectedStock)}{' '}
                <span className="text-xs font-normal text-slate-500">units</span>
              </div>
            </div>
          </div>

          {/* Mode Switcher: Add / Deduct */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('add');
                setError('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                mode === 'add'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Restock / Add</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('remove');
                setError('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                mode === 'remove'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Deduct / Write-off</span>
            </button>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity to {mode === 'add' ? 'Add' : 'Deduct'}
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError('');
              }}
              className="w-full px-3.5 py-2 text-base font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="block text-[11px] font-medium text-slate-400 mb-1.5">
              Quick presets:
            </span>
            <div className="flex gap-2">
              {PRESETS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePreset(val)}
                  className={`flex-1 py-1 text-xs font-medium rounded-lg border transition-colors ${
                    quantity === String(val)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
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
              variant={mode === 'add' ? 'primary' : 'danger'}
              size="md"
              isLoading={isLoading}
            >
              Confirm {mode === 'add' ? `+${numQty || 0}` : `-${numQty || 0}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustModal;
