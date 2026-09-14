'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, Lock, ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PageContainer from '../common/PageContainer';
import Button from '../common/Button';
import Loading from '../common/Loading';

export const AdminGuard = ({ children }) => {
  const { user, isAuthenticated, isAdmin, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loading size="lg" message="Verifying admin credentials..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex-1 flex items-center justify-center py-16">
        <PageContainer size="sm">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Authentication Required</h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              You must be logged in as an administrator to access the Section 02 Admin Console.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>
                <Button variant="primary" icon={LogIn}>
                  Sign In to Admin
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" icon={ArrowLeft}>
                  Return Home
                </Button>
              </Link>
            </div>
          </div>
        </PageContainer>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex-1 flex items-center justify-center py-16">
        <PageContainer size="sm">
          <div className="bg-white border border-rose-200 rounded-2xl shadow-sm p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">403 Forbidden: Access Denied</h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
              Your account (<span className="font-semibold">{user?.email}</span>) is signed in with the{' '}
              <span className="font-bold text-rose-600 uppercase">{user?.role}</span> role. Only accounts with{' '}
              <span className="font-bold text-purple-700">ADMIN</span> privileges can access this management console.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link href="/">
                <Button variant="outline" icon={ArrowLeft}>
                  Back to Customer Home
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="primary" icon={LogIn}>
                  Switch to Admin Account
                </Button>
              </Link>
            </div>
          </div>
        </PageContainer>
      </main>
    );
  }

  return children;
};

export default AdminGuard;
