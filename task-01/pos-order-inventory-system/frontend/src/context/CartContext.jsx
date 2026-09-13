import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import * as cartService from '../services/cartService';
import AddToCartModal from '../components/cart/AddToCartModal';

const CartContext = createContext(null);

const DEFAULT_USER_ID = 'demo_pos_user';

export const CartProvider = ({ children }) => {
  const [userId] = useState(() => {
    return localStorage.getItem('pos_user_id') || DEFAULT_USER_ID;
  });

  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    totalItems: 0,
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Global Add-to-Cart Modal state
  const [modalProduct, setModalProduct] = useState(null);

  const promptAddToCart = (product) => {
    if (!product) return;
    setModalProduct(product);
  };

  const closeAddToCartModal = () => {
    setModalProduct(null);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await cartService.getCart(userId);
      if (res && res.success && res.data) {
        setCart(res.data);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
      setError(err.message || 'Failed to load shopping cart');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1, productName = 'Item') => {
    try {
      setUpdating(true);
      setError(null);
      const res = await cartService.addToCart({
        productId,
        quantity,
        userId,
      });

      if (res && res.success && res.data) {
        setCart(res.data);
        showToast(`Added ${quantity > 1 ? `${quantity}x ` : ''}'${productName}' to cart!`, 'success');
        return res.data;
      }
    } catch (err) {
      const msg = err.message || 'Could not add item to cart';
      showToast(msg, 'error');
      setError(msg);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      setUpdating(true);
      setError(null);
      const res = await cartService.updateCartItem({
        itemId,
        quantity,
        userId,
      });

      if (res && res.success && res.data) {
        setCart(res.data);
        return res.data;
      }
    } catch (err) {
      const msg = err.message || 'Failed to update quantity';
      showToast(msg, 'error');
      setError(msg);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (itemId, itemName = 'Item') => {
    try {
      setUpdating(true);
      setError(null);
      const res = await cartService.removeCartItem({
        itemId,
        userId,
      });

      if (res && res.success && res.data) {
        setCart(res.data);
        showToast(`Removed '${itemName}' from cart`, 'info');
        return res.data;
      }
    } catch (err) {
      const msg = err.message || 'Failed to remove item';
      showToast(msg, 'error');
      setError(msg);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  const clearCart = async () => {
    try {
      setUpdating(true);
      setError(null);
      const res = await cartService.clearCart(userId);
      if (res && res.success) {
        setCart({ items: [], subtotal: 0, totalItems: 0 });
        showToast('Cart cleared', 'info');
      }
    } catch (err) {
      const msg = err.message || 'Failed to clear cart';
      showToast(msg, 'error');
      setError(msg);
    } finally {
      setUpdating(false);
    }
  };

  const getItemQuantity = (productId) => {
    if (!cart?.items) return 0;
    const item = cart.items.find(
      (it) =>
        (it.productId?._id && it.productId._id === productId) ||
        it.productId === productId
    );
    return item ? item.quantity : 0;
  };

  return (
    <CartContext.Provider
      value={{
        userId,
        cart,
        loading,
        updating,
        error,
        toast,
        addToCart,
        promptAddToCart,
        openAddToCartModal: promptAddToCart,
        closeAddToCartModal,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart: fetchCart,
        getItemQuantity,
        showToast,
      }}
    >
      {children}

      {/* Global Add-to-Cart Modal with Dynamic Quantity & Price Calculator */}
      <AddToCartModal
        isOpen={!!modalProduct}
        product={modalProduct}
        isLoading={updating}
        existingQuantityInCart={modalProduct ? getItemQuantity(modalProduct._id) : 0}
        onClose={closeAddToCartModal}
        onAdd={async (productId, quantity, productName) => {
          try {
            await addToCart(productId, quantity, productName);
            closeAddToCartModal();
          } catch (err) {
            // error is displayed in toast
          }
        }}
      />

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-bounce-in pointer-events-auto">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold transition-all ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : toast.type === 'info'
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-slate-900/95 backdrop-blur-md border-slate-800 text-white'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-5 h-5 text-blue-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span className="tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
