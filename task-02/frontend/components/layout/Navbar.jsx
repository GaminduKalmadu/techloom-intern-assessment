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
  Layers,
  Sparkles,
  LayoutDashboard,
  Box,
  CreditCard,
  RotateCcw,
} from 'lucide-react';
import PageContainer from '../common/PageContainer';
import Button from '../common/Button';
import { useAuth } from '@/context/AuthContext';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, isCustomer, logout } = useAuth();
  const pathname = usePathname();

  const handlePlaceholderClick = (moduleName) => {
    // Helpful indicator for un-implemented future modules
    alert(`${moduleName} module is a placeholder in Section 02 Auth phase.`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <PageContainer>
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand Logo & Context Badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm transition-colors ${
                  isAdmin
                    ? 'bg-purple-600 shadow-purple-600/20 group-hover:bg-purple-700'
                    : 'bg-blue-600 shadow-blue-600/20 group-hover:bg-blue-700'
                }`}
              >
                {isAdmin ? <ShieldCheck className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
              </div>
              <div>
                <span className="text-sm font-black tracking-tight text-slate-900 block leading-tight">
                  Techloom Store
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  {isAdmin ? 'Admin Console' : 'Section 02'}
                </span>
              </div>
            </Link>

            {/* Role Badge */}
            {isAdmin && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[11px] tracking-wide uppercase">
                <ShieldCheck className="w-3 h-3 text-purple-600" />
                Admin
              </span>
            )}
            {isCustomer && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px] tracking-wide uppercase">
                <User className="w-3 h-3 text-blue-600" />
                Customer
              </span>
            )}
          </div>

          {/* Desktop Navigation - Role-Based */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-600">
            {/* ADMIN NAVIGATION PLACEHOLDERS */}
            {isAdmin ? (
              <>
                <Link
                  href="/"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    pathname === '/' ? 'text-purple-600 bg-purple-50 font-bold' : 'hover:text-purple-600 hover:bg-slate-50'
                  }`}
                >
                  Overview
                </Link>
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    pathname === '/admin' ? 'text-purple-600 bg-purple-50 font-bold' : 'hover:text-purple-600 hover:bg-slate-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/products"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    pathname?.startsWith('/admin/products') ? 'text-purple-600 bg-purple-50 font-bold' : 'hover:text-purple-600 hover:bg-slate-50'
                  }`}
                >
                  Products
                </Link>
                <Link
                  href="/admin/inventory"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    pathname === '/admin/inventory' ? 'text-purple-600 bg-purple-50 font-bold' : 'hover:text-purple-600 hover:bg-slate-50'
                  }`}
                >
                  Inventory
                </Link>
                <button
                  type="button"
                  onClick={() => handlePlaceholderClick('Orders Management')}
                  className="px-3 py-1.5 rounded-lg hover:text-purple-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Orders
                </button>
                <button
                  type="button"
                  onClick={() => handlePlaceholderClick('Payments Gateway')}
                  className="px-3 py-1.5 rounded-lg hover:text-purple-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Payments
                </button>
                <button
                  type="button"
                  onClick={() => handlePlaceholderClick('Refunds Management')}
                  className="px-3 py-1.5 rounded-lg hover:text-purple-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Refunds
                </button>
              </>
            ) : isCustomer ? (
              /* CUSTOMER NAVIGATION */
              <>
                <Link
                  href="/"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    pathname === '/' ? 'text-blue-600 bg-blue-50 font-bold' : 'hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  Home
                </Link>
                <button
                  type="button"
                  onClick={() => handlePlaceholderClick('Products Catalog')}
                  className="px-3 py-1.5 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  Products
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-normal">Next</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePlaceholderClick('Shopping Cart')}
                  className="px-3 py-1.5 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Cart
                </button>
                <button
                  type="button"
                  onClick={() => handlePlaceholderClick('My Orders')}
                  className="px-3 py-1.5 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Package className="w-3.5 h-3.5" />
                  My Orders
                </button>
              </>
            ) : (
              /* GUEST / VISITOR NAVIGATION */
              <>
                <Link
                  href="/"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    pathname === '/' ? 'text-blue-600 bg-blue-50 font-bold' : 'hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  Home
                </Link>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium text-[11px]">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Guest Visitor
                </span>
              </>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              /* Authenticated User State */
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {user?.name || 'User'}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                    {user?.email}
                  </span>
                </div>

                <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold uppercase shadow-sm">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  icon={LogOut}
                  title="Sign out"
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                >
                  <span className="hidden md:inline">Logout</span>
                </Button>
              </div>
            ) : (
              /* Unauthenticated Buttons */
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 py-3 space-y-1 animate-in fade-in">
            {isAdmin ? (
              <>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Overview
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    pathname === '/admin' ? 'text-purple-600 bg-purple-50 font-bold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    pathname?.startsWith('/admin/products') ? 'text-purple-600 bg-purple-50 font-bold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Products
                </Link>
                <Link
                  href="/admin/inventory"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    pathname === '/admin/inventory' ? 'text-purple-600 bg-purple-50 font-bold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Inventory
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handlePlaceholderClick('Orders Management');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Orders
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handlePlaceholderClick('Payments Gateway');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Payments
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handlePlaceholderClick('Refunds Management');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Refunds
                </button>
              </>
            ) : isCustomer ? (
              <>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Home
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handlePlaceholderClick('Products Catalog');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Products
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handlePlaceholderClick('Shopping Cart');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cart
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handlePlaceholderClick('My Orders');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  My Orders
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Home
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-blue-600 hover:bg-blue-50"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Register Customer Account
                </Link>
              </>
            )}

            {isAuthenticated && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out ({user?.email})
                </button>
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </header>
  );
};

export default Navbar;
