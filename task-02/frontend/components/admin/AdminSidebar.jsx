'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  RotateCcw,
  Box,
  Layers,
  ExternalLink,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const AdminSidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      group: 'OPERATIONS TELEMETRY',
      items: [
        {
          name: 'Dashboard',
          href: '/admin',
          icon: LayoutDashboard,
          active: pathname === '/admin',
        },
        {
          name: 'Orders',
          href: '/admin/orders',
          icon: ShoppingBag,
          active: pathname?.startsWith('/admin/orders'),
        },
        {
          name: 'Payments',
          href: '/admin/payments',
          icon: CreditCard,
          active: pathname?.startsWith('/admin/payments'),
        },
        {
          name: 'Refunds',
          href: '/admin/refunds',
          icon: RotateCcw,
          active: pathname?.startsWith('/admin/refunds'),
        },
      ],
    },
    {
      group: 'CATALOG & STOCK',
      items: [
        {
          name: 'Products',
          href: '/admin/products',
          icon: Box,
          active: pathname?.startsWith('/admin/products'),
        },
        {
          name: 'Inventory',
          href: '/admin/inventory',
          icon: Layers,
          active: pathname === '/admin/inventory',
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-600/30 group-hover:bg-purple-500 transition-colors">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-sm font-black tracking-tight text-white block leading-tight">
              Techloom Admin
            </span>
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">
              Management Portal
            </span>
          </div>
        </Link>
        {mobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Modules */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {navItems.map((group, idx) => (
          <div key={idx} className="space-y-1.5">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
              {group.group}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    item.active
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${item.active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.active && <ChevronRight className="w-3.5 h-3.5 text-purple-200" />}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Storefront View Link */}
        <div className="pt-2 border-t border-slate-800/80">
          <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
            Storefront
          </p>
          <Link
            href="/"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ExternalLink className="w-4 h-4 text-slate-400" />
              <span>Customer Store</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 font-medium">
              Live
            </span>
          </Link>
        </div>
      </div>

      {/* Admin User Card & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 text-xs font-bold shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email || 'admin@gmail.com'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-800 min-h-screen sticky top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Top Bar with Drawer Trigger */}
      <div className="lg:hidden sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span className="text-xs font-black text-white uppercase tracking-wider">
            Admin Console
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Open Admin Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
