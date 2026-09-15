'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import Button from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, logout, isAuthenticated, isAdmin, loading, error: authError, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated as ADMIN, redirect to /admin immediately
  useEffect(() => {
    if (!loading && isAuthenticated && isAdmin) {
      router.push('/admin');
    }
  }, [isAuthenticated, isAdmin, loading, router]);

  // Clear errors when typing
  useEffect(() => {
    if (formError) setFormError('');
    if (authError) clearError();
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setFormError('Please enter your administrator email address.');
      return;
    }
    if (!password) {
      setFormError('Please enter your administrator password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');

      // authContext login returns { success: boolean, user?: object, error?: string }
      const result = await login(cleanEmail, password);

      if (!result?.success) {
        setFormError(result?.error || 'Authentication failed. Please verify your administrator credentials.');
        return;
      }

      // Verify that the authenticated account has the ADMIN role
      if (result.user?.role !== 'ADMIN') {
        await logout();
        setFormError('Access Denied: Customer accounts are not permitted in the Administrator Portal.');
        return;
      }

      router.push('/admin');
    } catch (err) {
      setFormError(err?.message || 'Authentication failed. Please verify your administrator credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative overflow-hidden selection:bg-purple-600 selection:text-white">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Customer Store</span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/60">
          {/* Card Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-purple-600 text-white shadow-xl shadow-purple-600/30 mb-4 ring-8 ring-purple-600/10">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Techloom Admin Portal
            </h1>
            <p className="text-xs font-semibold text-purple-400 mt-1 uppercase tracking-widest">
              Restricted Access • Authorized Staff Only
            </p>
          </div>

          {/* Error Banner */}
          {(formError || authError) && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 font-medium">
                <span className="font-bold block text-rose-200">Authentication Alert</span>
                <p>{formError || authError}</p>
              </div>
            </div>
          )}

          {/* Admin Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Master Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full bg-purple-600 hover:bg-purple-500 border-purple-500 shadow-lg shadow-purple-600/30 text-sm font-bold py-3"
                isLoading={isSubmitting}
                icon={ArrowRight}
              >
                Sign In to Admin Console
              </Button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500">
              This terminal is monitored for administrative operations.
              <br />
              All access attempts are cryptographically verified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
