'use client';

import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Loading, { Skeleton } from '@/components/common/Loading';
import healthService from '@/services/healthService';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Layers,
  ShieldCheck,
  Cpu,
  Database,
  Search,
  Code2,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  const [healthData, setHealthData] = useState(null);
  const [healthStatus, setHealthStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [latency, setLatency] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

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
            <span>Section 02 • Architecture & Configuration Foundation</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            E-Commerce Checkout & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Payment System
            </span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Clean base project structure initialized with Next.js App Router, Tailwind CSS, Express REST API,
            and MongoDB Mongoose connection pooling.
          </p>
        </div>

        {/* Backend Health Check Card */}
        <div className="mt-8 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
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
            {/* Status tile */}
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

            {/* Latency tile */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Response Latency</span>
              <div className="mt-2 font-mono text-sm font-bold text-slate-800">
                {latency !== null ? `${latency} ms` : '—'}
              </div>
            </div>

            {/* Timestamp tile */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Ping</span>
              <div className="mt-2 font-mono text-xs font-medium text-slate-600">
                {lastChecked || 'Never'}
              </div>
            </div>
          </div>

          {/* JSON Payload or Error Banner */}
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

        {/* System Architecture Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Backend Stack & Architecture */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Backend Configuration</h3>
                <p className="text-xs text-slate-500">Node.js + Express + Mongoose</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Database Connection:</strong> Configured with connection pooling, events & graceful disconnect in <code className="bg-slate-100 px-1 py-0.5 rounded">src/config/db.js</code>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Security & Logging:</strong> Helmet, Morgan & CORS configured in <code className="bg-slate-100 px-1 py-0.5 rounded">src/app.js</code>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Standardized Envelopes:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded">ApiResponse</code> and <code className="bg-slate-100 px-1 py-0.5 rounded">ApiError</code> classes
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Modular Directory Tree:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded">controllers/</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">models/</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">services/</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">middleware/</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">routes/</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">jobs/</code>
                </span>
              </li>
            </ul>
          </div>

          {/* Frontend Stack & Primitives */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Frontend Foundation</h3>
                <p className="text-xs text-slate-500">Next.js App Router + Tailwind CSS</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>App Router:</strong> Built with Next.js JavaScript App Router architecture & responsive layout
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>API Client:</strong> Centralized client in <code className="bg-slate-100 px-1 py-0.5 rounded">services/api.js</code> with <code className="bg-slate-100 px-1 py-0.5 rounded">NEXT_PUBLIC_API_URL</code> configuration
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Reusable Primitives:</strong> Standardized <code className="bg-slate-100 px-1 py-0.5 rounded">Button</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">Input</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">Loading</code>, and <code className="bg-slate-100 px-1 py-0.5 rounded">PageContainer</code>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Ready for Expansion:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded">hooks/</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">context/</code>, and <code className="bg-slate-100 px-1 py-0.5 rounded">utils/</code> ready for feature modules
                </span>
              </li>
            </ul>
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
            {/* Input Component Showcase */}
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

            {/* Button Component Showcase */}
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

              <div className="pt-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Loading Component
                </span>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-4">
                  <Loading size="sm" message="Inline spinner" />
                  <div className="h-6 w-px bg-slate-200" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
