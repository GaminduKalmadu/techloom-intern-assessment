'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useAuth } from '@/context/AuthContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  ShieldCheck,
  User,
  ArrowRight,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, error: authError, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Clear errors when typing
  useEffect(() => {
    if (formError) setFormError('');
    if (authError) clearError();
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setFormError('Please enter your email address.');
      return;
    }

    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      router.push('/');
    }
  };

  // Quick fill demo helper
  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setFormError('');
    clearError();
  };

  return (
    <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
      <PageContainer size="sm">
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-10 transition-all">
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 mb-2 shadow-sm">
              <LogIn className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Sign In to Your Account
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              Enter your credentials to access your customer orders or admin control panel.
            </p>
          </div>

          {/* Error Banner */}
          {(formError || authError) && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError || authError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Password <span className="text-rose-500">*</span>
                </label>
              </div>

              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isSubmitting}
                icon={ArrowRight}
              >
                Sign In
              </Button>
            </div>
          </form>

          {/* Quick Fill Testing Helper Bar */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Testing Accounts
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@gmail.com', '123456')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/60 text-purple-800 text-xs font-semibold transition-colors cursor-pointer text-left"
              >
                <div className="p-1.5 rounded-lg bg-purple-200 text-purple-700 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block font-bold">Admin Account</span>
                  <span className="text-[10px] text-purple-600 font-normal">admin@gmail.com</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('customer@example.com', 'Password123!')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 text-blue-800 text-xs font-semibold transition-colors cursor-pointer text-left"
              >
                <div className="p-1.5 rounded-lg bg-blue-200 text-blue-700 shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block font-bold">Customer Demo</span>
                  <span className="text-[10px] text-blue-600 font-normal">customer@example.com</span>
                </div>
              </button>
            </div>
          </div>

          {/* Footer Link */}
          <p className="mt-6 text-center text-xs text-slate-500">
            Don&apos;t have an account yet?{' '}
            <Link
              href="/register"
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>
      </PageContainer>
    </main>
  );
}
