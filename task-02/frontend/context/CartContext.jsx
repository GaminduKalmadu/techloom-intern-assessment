'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import cartService from '@/services/cartService';
import { useAuth } from '@/context/AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null); // { type: 'success' | 'error', text: string }

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const syncCartState = (cartData) => {
    if (!cartData) {
      setCart(null);
      setItems([]);
      setSubtotal(0);
      setItemCount(0);
      return;
    }
    setCart(cartData);
    setItems(cartData.items || []);
    setSubtotal(cartData.subtotal || 0);
    setItemCount(cartData.itemCount || 0);
  };

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      syncCartState(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await cartService.getCart();
      syncCartState(res.data?.cart);
    } catch (err) {
      console.error('Failed to load cart:', err);
      // Don't show critical banner for 401
      if (err.status !== 401) {
        setError(err.message || 'Failed to load shopping cart');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      showToast('Please log in to add items to your cart.', 'error');
      return { success: false, requireAuth: true };
    }

    setActionLoadingId(productId);
    setError(null);
    try {
      const res = await cartService.addItem(productId, quantity);
      syncCartState(res.data?.cart);
      showToast('Item successfully added to your cart!', 'success');
      return { success: true, cart: res.data?.cart };
    } catch (err) {
      const msg = err.message || 'Failed to add item to cart';
      showToast(msg, 'error');
      return { success: false, error: msg };
    } finally {
      setActionLoadingId(null);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (!isAuthenticated) return { success: false };

    setActionLoadingId(productId);
    setError(null);
    try {
      const res = await cartService.updateItemQuantity(productId, quantity);
      syncCartState(res.data?.cart);
      showToast('Cart quantity updated.', 'success');
      return { success: true, cart: res.data?.cart };
    } catch (err) {
      const msg = err.message || 'Failed to update quantity';
      showToast(msg, 'error');
      return { success: false, error: msg };
    } finally {
      setActionLoadingId(null);
    }
  };

  const removeFromCart = async (productId) => {
    if (!isAuthenticated) return { success: false };

    setActionLoadingId(productId);
    setError(null);
    try {
      const res = await cartService.removeItem(productId);
      syncCartState(res.data?.cart);
      showToast('Item removed from cart.', 'success');
      return { success: true, cart: res.data?.cart };
    } catch (err) {
      const msg = err.message || 'Failed to remove item';
      showToast(msg, 'error');
      return { success: false, error: msg };
    } finally {
      setActionLoadingId(null);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return { success: false };

    setLoading(true);
    setError(null);
    try {
      const res = await cartService.clearCart();
      syncCartState(res.data?.cart);
      showToast('Cart has been cleared.', 'success');
      return { success: true, cart: res.data?.cart };
    } catch (err) {
      const msg = err.message || 'Failed to clear cart';
      showToast(msg, 'error');
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        subtotal,
        itemCount,
        loading,
        actionLoadingId,
        error,
        toastMessage,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300 pointer-events-none">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold pointer-events-auto ${
              toastMessage.type === 'error'
                ? 'bg-rose-900 text-rose-50 border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <span>{toastMessage.text}</span>
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

export default CartContext;
