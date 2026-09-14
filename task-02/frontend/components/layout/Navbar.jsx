'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, ShieldCheck, Activity, Menu, X } from 'lucide-react';
import PageContainer from '../common/PageContainer';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <PageContainer>
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20 group-hover:bg-blue-700 transition-colors">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-slate-900 block leading-tight">
                Techloom Store
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Section 02
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <Link href="/" className="text-slate-900 hover:text-blue-600 transition-colors">
              Overview
            </Link>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Base Setup Ready
            </span>
          </nav>

          {/* Status Indicator / Mobile Toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 border border-slate-200 px-3 py-1.5 rounded-xl bg-slate-50/60">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Next.js App Router</span>
            </div>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-2 animate-in fade-in">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Overview
            </Link>
          </div>
        )}
      </PageContainer>
    </header>
  );
};

export default Navbar;
