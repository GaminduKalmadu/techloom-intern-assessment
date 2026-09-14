'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Loading, { Skeleton } from '@/components/common/Loading';
import healthService from '@/services/healthService';
import authService from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Database,
  Search,
  Code2,
  Zap,
  User,
  LogIn,
  LogOut,
  KeyRound,
  Lock,
  ArrowRight,
} from 'lucide-react';

export default function HomePage() {
  const { user, isAuthenticated, isAdmin, isCustomer, logout } = useAuth();

  const [healthData, setHealthData] = useState(null);
  const [healthStatus, setHealthStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [latency, setLatency] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  // RBAC Permission Test states
  const [rbacTestResult, setRbacTestResult] = useState(null);
  const [isTestingRbac, setIsTestingRbac] = useState(false);

  // Showcase state for Input & Button components
  const [demoInput, setDemoInput] = useState('John Doe');
  const [hasError, setHasError] = useState(false);
  const [isBtnLoading, setIsBtnLoading] = useState(false);

  const fetchHealthStatus = async () => {
    setHealthStatus('loading');
    setErrorMessage('');
    const startTime = performance.now();
    try {
      const response = await healthService.checkHealth();
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setHealthData(response);
      setHealthStatus('success');
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setHealthStatus('error');
      setErrorMessage(err.message || 'Failed to connect to backend server');
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    fetchHealthStatus();
  }, []);

  // Run test on GET /api/auth/me
  const testGetMe = async () => {
    setIsTestingRbac(true);
    setRbacTestResult(null);
    try {
      const res = await authService.getMe();
      setRbacTestResult({
        endpoint: 'GET /api/auth/me',
        status: 200,
        success: true,
        data: res,
      });
    } catch (err) {
      setRbacTestResult({
        endpoint: 'GET /api/auth/me',
        status: err.status || 401,
        success: false,
        error: err.message,
      });
    } finally {
      setIsTestingRbac(false);
    }
  };

  // Run test on GET /api/auth/admin-check
  const testAdminCheck = async () => {
    setIsTestingRbac(true);
    setRbacTestResult(null);
    try {
      const res = await authService.adminCheck();
      setRbacTestResult({
        endpoint: 'GET /api/auth/admin-check',
        status: 200,
        success: true,
        data: res,
      });
    } catch (err) {
      setRbacTestResult({
        endpoint: 'GET /api/auth/admin-check',
        status: err.status || (err.message.includes('403') ? 403 : 401),
        success: false,
        error: err.message,
      });
    } finally {
      setIsTestingRbac(false);
    }
  };

  const handleSimulateAction = () => {
    setIsBtnLoading(true);
    setTimeout(() => {
      setIsBtnLoading(false);
    }, 1200);
  };

  return (
    <main className="py-10 space-y-10">
      <PageContainer>
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide shadow-sm">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>Section 02 • Customer & Admin Authentication (RBAC)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            E-Commerce Checkout & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Payment System
            </span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Role-based authentication powered by bcrypt and JWT tokens. Full customer registration,
            secure admin authorization, protected middlewares, and dynamic responsive navigation.
          </p>
        </div>

        {/* AUTHENTICATION & ACTIVE SESSION CARD */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div
                className={`p-3 rounded-xl border ${
                  isAdmin
                    ? 'bg-purple-50 border-purple-100 text-purple-600'
                    : isCustomer
                    ? 'bg-blue-50 border-blue-100 text-blue-600'
                    : 'bg-slate-50 border-slate-100 text-slate-600'
                }`}
              >
                {isAdmin ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : isCustomer ? (
                  <User className="w-6 h-6" />
                ) : (
                  <KeyRound className="w-6 h-6" />
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Active Authentication Session</h2>
                <p className="text-xs text-slate-500">
                  Current Session Status:{' '}
                  <span className="font-semibold text-slate-700">
                    {isAuthenticated
                      ? `${user?.role} (${user?.email})`
                      : 'Unauthenticated (Guest Visitor)'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  icon={LogOut}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  Sign Out
                </Button>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline" size="sm" icon={LogIn}>
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary" size="sm" icon={ArrowRight}>
                      Create Account
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Session Overview Details */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Role</span>
              <div className="mt-2 flex items-center gap-2">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-black text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    ADMIN
                  </span>
                ) : isCustomer ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-black text-xs">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    CUSTOMER
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-bold text-xs">
                    GUEST
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">User Identity</span>
              <div className="mt-2 text-sm font-bold text-slate-800 truncate">
                {user?.name || 'Anonymous Visitor'}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">JWT Storage</span>
              <div className="mt-2 font-mono text-xs text-slate-600 truncate">
                {isAuthenticated ? 'Active (Bearer token saved)' : 'No Token'}
              </div>
            </div>
          </div>

          {/* LIVE RBAC PERMISSION TEST ACTIONS */}
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Test Role-Based Protected Endpoints
                </h3>
                <p className="text-xs text-slate-500">
                  Verify how your current role interacts with `protect` and `requireAdmin` middlewares.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testGetMe}
                  isLoading={isTestingRbac}
                >
                  Test GET /api/auth/me
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={testAdminCheck}
                  isLoading={isTestingRbac}
                  icon={ShieldCheck}
                >
                  Test GET /api/auth/admin-check
                </Button>
              </div>
            </div>

            {/* Test Results Output */}
            {rbacTestResult && (
              <div
                className={`p-4 rounded-xl border text-xs font-mono space-y-2 animate-in fade-in ${
                  rbacTestResult.success
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : rbacTestResult.status === 403
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-rose-50/80 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider">
                    {rbacTestResult.endpoint}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      rbacTestResult.success
                        ? 'bg-emerald-200 text-emerald-800'
                        : rbacTestResult.status === 403
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-rose-200 text-rose-800'
                    }`}
                  >
                    HTTP {rbacTestResult.status}
                  </span>
                </div>

                <div className="text-[11px] font-sans">
                  {rbacTestResult.success ? (
                    <p className="text-emerald-700 font-semibold">
                      ✔ Request succeeded! User authenticated and authorized for this route.
                    </p>
                  ) : rbacTestResult.status === 403 ? (
                    <p className="text-amber-700 font-semibold">
                      ✔ 403 Forbidden: Customer successfully blocked by `requireAdmin` middleware!
                    </p>
                  ) : (
                    <p className="text-rose-700 font-semibold">
                      ✖ Request rejected: {rbacTestResult.error}
                    </p>
                  )}
                </div>

                <pre className="p-3 bg-white/70 rounded-lg overflow-x-auto text-[11px] border border-black/5">
                  {JSON.stringify(rbacTestResult.data || rbacTestResult.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Backend Health Check Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Backend API Connectivity</h2>
                <p className="text-xs text-slate-500">
                  Endpoint: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">GET /api/health</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHealthStatus}
                isLoading={healthStatus === 'loading'}
                icon={RefreshCw}
              >
                Refresh Check
              </Button>
            </div>
          </div>

          {/* Health Status Display */}
          <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
              <div className="mt-2 flex items-center gap-2">
                {healthStatus === 'loading' ? (
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
                    <Loading size="sm" message="" />
                    <span>Pinging API...</span>
                  </div>
                ) : healthStatus === 'success' ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Online & Responding</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <span>Connection Failed</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Response Latency</span>
              <div className="mt-2 font-mono text-sm font-bold text-slate-800">
                {latency !== null ? `${latency} ms` : '—'}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Ping</span>
              <div className="mt-2 font-mono text-xs font-medium text-slate-600">
                {lastChecked || 'Never'}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              API Response Payload:
            </span>
            {healthStatus === 'loading' ? (
              <Skeleton className="h-16 w-full" />
            ) : healthStatus === 'success' ? (
              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            ) : (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                <span className="font-bold">Error:</span> {errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* UI Components Interactive Showcase */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Base UI Component Showcase</h3>
              <p className="text-xs text-slate-500">
                Verification of reusable UI elements in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">components/common</code>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Input Component (<code className="lowercase">components/common/Input.jsx</code>)
              </span>

              <Input
                label="Customer Name"
                icon={Search}
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                placeholder="Enter full name..."
                error={hasError ? 'Invalid customer format or name required' : null}
                helperText="Input component supports leading icons, error states, and helper labels"
              />

              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setHasError((p) => !p)}
                >
                  {hasError ? 'Clear Error State' : 'Trigger Error State'}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Button Component Variants (<code className="lowercase">components/common/Button.jsx</code>)
              </span>

              <div className="flex flex-wrap gap-2.5">
                <Button variant="primary" size="sm">
                  Primary
                </Button>
                <Button variant="secondary" size="sm">
                  Secondary
                </Button>
                <Button variant="outline" size="sm">
                  Outline
                </Button>
                <Button variant="danger" size="sm">
                  Danger
                </Button>
                <Button variant="success" size="sm">
                  Success
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isBtnLoading}
                  onClick={handleSimulateAction}
                >
                  {isBtnLoading ? 'Saving...' : 'Click to Load'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
