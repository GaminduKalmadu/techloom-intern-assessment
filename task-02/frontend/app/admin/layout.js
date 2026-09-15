'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminGuard from '@/components/admin/AdminGuard';

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  // /admin/login is the standalone admin login portal (no sidebar or guard)
  if (pathname === '/admin/login') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center">
        {children}
      </div>
    );
  }

  // All other /admin routes require Admin authentication and render the dedicated Sidebar layout
  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
        <AdminSidebar />
        <div className="flex-1 min-w-0 bg-slate-100/90 overflow-y-auto min-h-screen">
          {children}
        </div>
      </div>
    </AdminGuard>
  );
}
