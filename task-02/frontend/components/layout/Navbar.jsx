'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  Package,
  ExternalLink,
} from 'lucide-react';
import PageContainer from '../common/PageContainer';
import Button from '../common/Button';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, isCustomer, logout } = useAuth();
  const { itemCount } = useCart();
  const pathname = usePathname();

  // Hide the customer top navigation bar on all admin portal routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs transition-all">
      <PageContainer>
        <div className="flex h-20 items-center justify-between gap-6">
          {/* Brand Logo & Storefront Badge */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20 group-hover:bg-blue-700 transition-all duration-200 group-hover:scale-105">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-slate-900 block leading-snug">
                  Techloom Store
                </span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                  Official Storefront
                </span>
              </div>
            </Link>

            {/* Customer Session Badge */}
            {isCustomer && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs tracking-wide">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Customer
              </span>
            )}
          </div>

          {/* Desktop Customer Navigation */}
          <nav className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Link
              href="/"
              className={`px-4 py-2.5 rounded-xl transition-all duration-150 ${
                pathname === '/'
                  ? 'text-blue-600 bg-blue-50/90 font-bold shadow-xs'
                  : 'hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            <Link
              href="/#catalog"
              className={`px-4 py-2.5 rounded-xl transition-all duration-150 ${
                pathname?.startsWith('/products')
                  ? 'text-blue-600 bg-blue-50/90 font-bold shadow-xs'
                  : 'hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              Explore Products
            </Link>

            <Link
              href="/cart"
              className={`px-4 py-2.5 rounded-xl transition-all duration-150 inline-flex items-center gap-2 relative ${
                pathname === '/cart'
                  ? 'text-blue-600 bg-blue-50/90 font-bold shadow-xs'
                  : 'hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              <div className="relative flex items-center">
                <ShoppingCart className="w-4.5 h-4.5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-blue-600 text-white text-[11px] font-black min-w-5 h-5 px-1 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-75">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </div>
              <span>Cart</span>
            </Link>

            {isAuthenticated && (
              <Link
                href="/orders"
                className={`px-4 py-2.5 rounded-xl transition-all duration-150 inline-flex items-center gap-2 ${
                  pathname?.startsWith('/orders')
                    ? 'text-blue-600 bg-blue-50/90 font-bold shadow-xs'
                    : 'hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>My Orders</span>
              </Link>
            )}

            {/* If logged in as Admin, show quick link to Admin Console */}
            {isAdmin && (
              <Link
                href="/admin"
                className="ml-2 px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-bold border border-purple-200 text-xs hover:bg-purple-100 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                Admin Console
                <ExternalLink className="w-3 h-3 text-purple-500" />
              </Link>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-bold text-slate-800 leading-tight">
                    {user?.name || 'Customer'}
                  </span>
                  <span className="text-xs text-slate-400 truncate max-w-[170px]">
                    {user?.email}
                  </span>
                </div>

                <div className="h-10 w-10 rounded-2xl bg-slate-100 border border-slate-200/90 flex items-center justify-center text-slate-700 text-sm font-bold uppercase shadow-2xs">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>

                <Button
                  variant="ghost"
                  size="md"
                  onClick={logout}
                  icon={LogOut}
                  title="Sign out"
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                >
                  <span className="hidden md:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link href="/login">
                  <Button variant="outline" size="md" className="font-bold">
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="md" className="font-bold">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="p-2.5 rounded-2xl text-slate-600 hover:bg-slate-100 md:hidden border border-slate-200/60"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Customer Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 py-4 space-y-1.5 animate-in fade-in slide-in-from-top-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                pathname === '/' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            <Link
              href="/#catalog"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                pathname?.startsWith('/products') ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Explore Products
            </Link>

            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                pathname === '/cart' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-5 h-5 text-slate-500" />
                <span>Cart</span>
              </div>
              {itemCount > 0 && (
                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated && (
              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                  pathname?.startsWith('/orders') ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Package className="w-5 h-5 text-slate-500" />
                <span>My Orders</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-base font-bold text-purple-700 bg-purple-50 hover:bg-purple-100"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                  <span>Admin Console</span>
                </div>
                <ExternalLink className="w-4 h-4 text-purple-500" />
              </Link>
            )}
          </div>
        )}
      </PageContainer>
    </header>
  );
};

export default Navbar;
