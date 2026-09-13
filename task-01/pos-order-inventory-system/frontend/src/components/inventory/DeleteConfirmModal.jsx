import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '../common/Button';

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  product,
  isLoading = false,
}) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200/80 p-6 z-10 space-y-5">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900">Delete Product?</h3>
          <p className="text-xs text-slate-500 mt-1">
            Are you sure you want to delete <span className="font-semibold text-slate-800">"{product.name}"</span>? This will permanently remove this item and its SKU from your inventory catalog.
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>Category:</span>
            <span className="font-medium text-slate-800">{product.category}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Price:</span>
            <span className="font-medium text-slate-800">${product.price?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Stock on hand:</span>
            <span className="font-medium text-slate-800">{product.stockQuantity} units</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
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
            type="button"
            variant="danger"
            size="md"
            onClick={() => onConfirm(product._id)}
            isLoading={isLoading}
          >
            Delete Product
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
