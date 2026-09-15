'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and verify stored session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const storedToken = localStorage.getItem('token');
          if (storedToken) {
            setToken(storedToken);
            const res = await authService.getMe();
            if (res?.data?.user) {
              setUser(res.data.user);
            }
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Session expired or invalid token:', err.message);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Log in user with credentials
   */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login({ email, password });
      const { user: authUser, token: authToken } = res.data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', authToken);
      }

      setUser(authUser);
      setToken(authToken);
      return { success: true, user: authUser };
    } catch (err) {
      const message = err.message || 'Failed to sign in. Please check your credentials.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Register a new customer
   */
  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.register({ name, email, password });
      const { user: authUser, token: authToken } = res.data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', authToken);
      }

      setUser(authUser);
      setToken(authToken);
      return { success: true, user: authUser };
    } catch (err) {
      const message = err.message || 'Registration failed. Please try again.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Log out active user and wipe stored tokens
   */
  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isCustomer: user?.role === 'CUSTOMER',
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
