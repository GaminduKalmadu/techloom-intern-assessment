'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/common/PageContainer';
import Button from '@/components/common/Button';
import AdminGuard from '@/components/admin/AdminGuard';
import adminService from '@/services/adminService';
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedRef, setCopiedRef] = useState(null);

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await adminService.getRefunds(params);
      if (res?.success && res?.data) {
        setRefunds(res.data.refunds || []);
      } else {
        setError(res?.message || 'Failed to load refunds.');
      }
    } catch (err) {
      setError(err.message || 'Error loading refunds ledger.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const copyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedRef(text);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">
            <CheckCircle2 className="w-3 h-3 text-purple-600" />
            SUCCESS
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            PENDING
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <AdminGuard>
      <main className="py-8 space-y-6">
        <PageContainer>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href="/admin" className="text-xs font-bold text-purple-600 hover:text-purple-700">
                  Dashboard
                </Link>
                <span className="text-xs text-slate-400">/</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Refunds</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Refunds Audit Ledger
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Audited visibility into cancellation refunds, restored inventory traces, and settlement references.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchRefunds}
              icon={RotateCcw}
              isLoading={loading}
              className="self-start sm:self-auto font-bold"
            >
              Refresh
            </Button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
            {['ALL', 'SUCCESS', 'PENDING', 'FAILED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  statusFilter === s
                    ? 'bg-purple-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s === 'ALL' ? 'All Refunds' : s}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading refunds ledger...</div>
            ) : refunds.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <RotateCcw className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="text-sm font-black text-slate-700">No Refund Records Found</h3>
                <p className="text-xs text-slate-400">No refunds have been processed under the selected filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Refund Reference</th>
                      <th className="py-3.5 px-4 font-bold">Order ID</th>
                      <th className="py-3.5 px-4 font-bold">Customer</th>
                      <th className="py-3.5 px-4 font-bold text-right">Amount</th>
                      <th className="py-3.5 px-4 font-bold">Status</th>
                      <th className="py-3.5 px-4 font-bold text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {refunds.map((r) => {
                      const orderShort = r.order?._id
                        ? `#${r.order._id.slice(-6).toUpperCase()}`
                        : 'N/A';

                      return (
                        <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-4 font-mono">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-purple-950">{r.refundReference}</span>
                              <button
                                type="button"
                                onClick={() => copyText(r.refundReference)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-all"
                                title="Copy Reference"
                              >
                                {copiedRef === r.refundReference ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            {r.payment?.transactionReference && (
                              <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                                Paid via: {r.payment.transactionReference}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {r.order?._id ? (
                              <Link
                                href={`/admin/orders/${r.order._id}`}
                                className="font-mono font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                <span>{orderShort}</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            ) : (
                              <span className="text-slate-400 font-mono">N/A</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-bold text-slate-800 block">
                              {r.customer?.name || 'Customer'}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {r.customer?.email || 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-black text-purple-700 text-sm">
                            ${Number(r.amount).toFixed(2)}
                          </td>
                          <td className="py-4 px-4">{renderStatusBadge(r.status)}</td>
                          <td className="py-4 px-4 text-right text-slate-500 font-medium">
                            {formatDate(r.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </PageContainer>
      </main>
    </AdminGuard>
  );
}
