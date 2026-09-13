import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as cartService from '../services/cartService';

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
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart: fetchCart,
        getItemQuantity,
        showToast,
      }}
    >
      {children}
      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce-in">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium transition-all ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : toast.type === 'info'
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                toast.type === 'error'
                  ? 'bg-rose-500'
                  : toast.type === 'info'
                  ? 'bg-blue-400'
                  : 'bg-emerald-500'
              }`}
            />
            <span>{toast.message}</span>
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
