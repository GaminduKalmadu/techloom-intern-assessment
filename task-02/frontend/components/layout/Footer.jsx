'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import PageContainer from '../common/PageContainer';
import { ShieldCheck, Cpu, Database } from 'lucide-react';

export const Footer = () => {
  const pathname = usePathname();

  // Do not render customer footer on admin portal pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  return (
    <footer className="border-t border-slate-200/80 bg-white py-8 text-slate-500 text-xs">
      <PageContainer>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">E-Commerce Checkout & Payment System</span>
            <span>•</span>
            <span>Section 02 Base Setup</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-blue-600" /> Next.js & Express
            </span>
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-emerald-600" /> MongoDB Atlas
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Modular Arch
            </span>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
};

export default Footer;
