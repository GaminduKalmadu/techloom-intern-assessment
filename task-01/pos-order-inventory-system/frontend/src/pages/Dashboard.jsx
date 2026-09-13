import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  BarChart3,
  PieChart,
  Layers,
  ShieldCheck,
  Activity,
  Database,
  Server,
  Zap,
  CreditCard,
  Wallet,
  Building2,
  ExternalLink,
  ChevronRight,
  Clock,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Clock3,
  Eye,
} from 'lucide-react';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { SkeletonCard, SkeletonTable } from '../components/common/Loader';
import ErrorAlert from '../components/common/ErrorAlert';
import { useApp } from '../context/AppContext';
import * as analyticsService from '../services/analyticsService';

const TIMEFRAMES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'all', label: 'All Time' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { systemHealth, refreshHealth } = useApp();

  const [timeframe, setTimeframe] = useState('7d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  // Fetch live analytical metrics
  const fetchAnalytics = useCallback(async (selectedTimeframe = timeframe) => {
    try {
      setLoading(true);
      setError(null);
      const res = await analyticsService.getDashboardAnalytics(selectedTimeframe);
      if (res && res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
      setError(err.message || 'Could not fetch live dashboard analytics.');
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchAnalytics(timeframe);
  }, [fetchAnalytics, timeframe]);

  // Calculations for daily revenue bar chart
  const dailyTrends = data?.dailyTrends || [];
  const maxRevenue = useMemo(() => {
    if (!dailyTrends.length) return 100;
    const max = Math.max(...dailyTrends.map((d) => d.revenue || 0));
    return max > 0 ? max * 1.15 : 100;
  }, [dailyTrends]);

  const activeDayData = hoveredDay || (dailyTrends.length > 0 ? dailyTrends[dailyTrends.length - 1] : null);

  // Helper for order status badge
  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PAID':
        return <Badge variant="success" dot size="xs">PAID</Badge>;
      case 'RESERVED':
        return <Badge variant="warning" dot size="xs">RESERVED</Badge>;
      case 'EXPIRED':
        return <Badge variant="purple" dot size="xs">EXPIRED</Badge>;
      case 'FAILED':
        return <Badge variant="danger" dot size="xs">FAILED</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral" dot size="xs">CANCELLED</Badge>;
      default:
        return <Badge variant="neutral" size="xs">{status}</Badge>;
    }
  };

  // Helper for status percentage in conversion pipeline
  const totalOrdersCount = data?.kpis?.orders?.total || 1;
  const statusShare = (count) => Math.round(((count || 0) / totalOrdersCount) * 100);

  return (
    <div className="space-y-7 pb-16 max-w-7xl mx-auto">
      {/* ==================================================== */}
      {/* 1. EXECUTIVE ANALYTICAL COMMAND HEADER               */}
      {/* ==================================================== */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 text-white shadow-xl shadow-slate-950/20 overflow-hidden">
        {/* Background decorative glows */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -top-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Enterprise POS Intelligence & Live Telemetry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Executive Analytics Dashboard
            </h1>
            <p className="text-indigo-200/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Real-time synchronization across MongoDB Atlas transactions, concurrency stock holds, and payment channels.
            </p>
          </div>

          {/* Timeframe selector & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 relative z-10">
            {/* Timeframe Switcher */}
            <div className="bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/15 flex items-center shadow-inner">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    timeframe === tf.id
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchAnalytics(timeframe)}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
                title="Refresh Analytics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>

              <Link
                to="/inventory"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all active:scale-95"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>New Sale</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Error Notice if any */}
      {error && (
        <ErrorAlert
          title="Telemetry Synchronization Warning"
          message={error}
          onRetry={() => fetchAnalytics(timeframe)}
        />
      )}

      {/* ==================================================== */}
      {/* 2. TOP METRIC CARDS GRID (EXECUTIVE KPIS)           */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {loading && !data ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            {/* KPI 1: Gross Sales Revenue */}
            <Card hover className="p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Gross Sales Revenue
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                  ${data?.kpis?.revenue?.lifetime?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="inline-flex items-center font-bold text-emerald-600">
                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                    {data?.kpis?.revenue?.growthTrend || '+12.5%'}
                  </span>
                  <span className="text-slate-400">
                    AOV: <strong className="text-slate-700 font-mono">${data?.kpis?.revenue?.aov || '0.00'}</strong>
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Selected period:</span>
                <span className="font-mono font-semibold text-slate-800">
                  ${data?.kpis?.revenue?.period?.toFixed(2) || '0.00'}
                </span>
              </div>
            </Card>

            {/* KPI 2: Completed Orders & Conversion */}
            <Card hover className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Order Conversion
                </span>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <PackageCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                  {data?.kpis?.orders?.paid || 0}{' '}
                  <span className="text-sm font-semibold text-slate-400">/ {data?.kpis?.orders?.total || 0}</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="inline-flex items-center font-bold text-blue-600">
                    <Zap className="w-3.5 h-3.5 mr-1" />
                    {data?.kpis?.orders?.conversionRate || 0}% Conversion
                  </span>
                  <span className="text-slate-400">Paid / Reserved</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, data?.kpis?.orders?.conversionRate || 0)}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* KPI 3: Physical Catalog Valuation */}
            <Card hover className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Catalog Valuation
                </span>
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                  <Boxes className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                  ${data?.kpis?.inventory?.totalValuation?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="inline-flex items-center font-bold text-purple-600">
                    <Layers className="w-3.5 h-3.5 mr-1" />
                    {data?.kpis?.inventory?.totalSkus || 0} Active SKUs
                  </span>
                  <span className="text-slate-400 font-mono">
                    {data?.kpis?.inventory?.totalUnits?.toLocaleString() || 0} units
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Warehouse status:</span>
                <span className="font-semibold text-emerald-600">Fully Stocked</span>
              </div>
            </Card>

            {/* KPI 4: Inventory Health Radar */}
            <Card hover className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Stock Health Radar
                </span>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                  {data?.kpis?.inventory?.healthScore || 100}%
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span
                    className={`inline-flex items-center font-bold ${
                      (data?.kpis?.inventory?.lowStockCount || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {data?.kpis?.inventory?.lowStockCount || 0} Low Stock Alerts
                  </span>
                  <span className="text-rose-500 font-semibold">
                    {data?.kpis?.inventory?.outOfStockCount || 0} Out
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Action:</span>
                <Link to="/inventory" className="text-blue-600 font-bold hover:underline flex items-center gap-0.5">
                  Inspect Thresholds <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* ==================================================== */}
      {/* 3. INTERACTIVE VISUAL CHARTS ROW                    */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART 1: 7-Day Revenue Velocity (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Revenue Velocity Trend</h3>
                  <p className="text-[11px] text-slate-400">Daily gross revenue across the trailing 7 days</p>
                </div>
              </div>

              {activeDayData && (
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {activeDayData.day} ({activeDayData.date})
                  </span>
                  <span className="text-sm font-mono font-black text-slate-900">
                    ${activeDayData.revenue?.toFixed(2)}{' '}
                    <span className="text-[10px] text-slate-400 font-medium">({activeDayData.paidOrders} sales)</span>
                  </span>
                </div>
              )}
            </div>

            {/* Interactive SVG Bar Chart */}
            <div className="pt-6 pb-2">
              <div className="h-44 w-full flex items-end justify-between gap-2 sm:gap-4 px-2">
                {dailyTrends.map((point, index) => {
                  const heightPercent = maxRevenue > 0 ? Math.max(8, (point.revenue / maxRevenue) * 100) : 8;
                  const isHovered = hoveredDay?.date === point.date;

                  return (
                    <div
                      key={index}
                      onMouseEnter={() => setHoveredDay(point)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                    >
                      {/* Tooltip on hover */}
                      <div className="relative w-full flex flex-col items-center">
                        <div
                          className={`w-full max-w-[42px] rounded-2xl transition-all duration-300 ${
                            isHovered
                              ? 'bg-gradient-to-t from-blue-700 to-indigo-500 shadow-lg shadow-blue-500/30'
                              : point.revenue > 0
                              ? 'bg-gradient-to-t from-slate-800 to-blue-600 hover:from-blue-600 hover:to-blue-400'
                              : 'bg-slate-100'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>

                      <span className={`text-[11px] font-bold transition-colors ${
                        isHovered ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'
                      }`}>
                        {point.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Hover bar to inspect specific day breakdown
            </span>
            <span className="font-mono text-slate-600 font-semibold">
              Peak: ${(maxRevenue / 1.15).toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* CHART 2: Order Conversion Pipeline & Funnel (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Order Lifecycle Funnel</h3>
                  <p className="text-[11px] text-slate-400">Total transaction status distribution</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-800">
                {totalOrdersCount} Total
              </span>
            </div>

            {/* Horizontal Stacked Bar */}
            <div className="py-5">
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                {data?.orderStatusDistribution?.map((stat, idx) => {
                  const s = stat._id?.toUpperCase();
                  const share = statusShare(stat.count);
                  if (share <= 0) return null;

                  const color =
                    s === 'PAID'
                      ? 'bg-emerald-500'
                      : s === 'RESERVED'
                      ? 'bg-amber-500'
                      : s === 'EXPIRED'
                      ? 'bg-purple-500'
                      : s === 'FAILED'
                      ? 'bg-rose-500'
                      : 'bg-slate-400';

                  return (
                    <div
                      key={idx}
                      style={{ width: `${share}%` }}
                      className={`${color} h-full transition-all duration-300 hover:opacity-80`}
                      title={`${s}: ${stat.count} orders (${share}%)`}
                    />
                  );
                })}
              </div>

              {/* Legend & Count Breakdown */}
              <div className="mt-5 space-y-2.5">
                {data?.orderStatusDistribution?.map((stat, idx) => {
                  const s = stat._id?.toUpperCase();
                  const share = statusShare(stat.count);

                  return (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(s)}
                        <span className="font-semibold text-slate-700">{s}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-mono">{share}%</span>
                        <span className="font-mono font-bold text-slate-900">{stat.count} orders</span>
                        <span className="text-slate-400 font-mono text-[11px]">(${stat.amount?.toFixed(2)})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3.5 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Stock holds automatically released on timeout
            </span>
            <Link to="/orders" className="text-blue-600 font-bold hover:underline">
              All Orders
            </Link>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 4. LOWER DEEP DIVE ANALYTICS ROW                     */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Category Inventory Share */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-900">Category Valuation</h4>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {data?.categoryDistribution?.length || 0} Categories
            </span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {data?.categoryDistribution?.map((cat, idx) => {
              const catShare = data?.kpis?.inventory?.totalValuation > 0
                ? Math.round((cat.valuation / data.kpis.inventory.totalValuation) * 100)
                : 0;

              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800">{cat._id || 'Uncategorized'}</span>
                    <span className="font-mono font-bold text-slate-900">${cat.valuation?.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${Math.max(5, catShare)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{cat.count} items ({cat.totalStock} in stock)</span>
                    <span>{catShare}% of catalog</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Channels Breakdown */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">Payment Channel Volume</h4>
            </div>
            <Link to="/admin/payments" className="text-xs text-blue-600 font-bold hover:underline">
              Audit
            </Link>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {data?.kpis?.payments?.methods?.map((pm, idx) => {
              const method = pm._id || 'CARD';
              const Icon =
                method === 'CARD' ? CreditCard : method === 'DIGITAL_WALLET' ? Wallet : Building2;

              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 capitalize block">
                        {method.toLowerCase().replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {pm.count} authorized transactions
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    ${pm.total?.toFixed(2)}
                  </span>
                </div>
              );
            })}

            {(!data?.kpis?.payments?.methods || data.kpis.payments.methods.length === 0) && (
              <p className="text-xs text-slate-400 py-6 text-center">No paid transactions recorded yet.</p>
            )}
          </div>
        </div>

        {/* Low Stock Radar Monitor */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-bold text-slate-900">Immediate Restock Radar</h4>
            </div>
            <Link to="/inventory" className="text-xs text-blue-600 font-bold hover:underline">
              Inventory
            </Link>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {data?.lowStockWarnings?.map((item) => (
              <div
                key={item._id}
                className="p-3 rounded-2xl border border-amber-100 bg-amber-50/30 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900 truncate max-w-[170px]">{item.name}</p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    SKU: {item._id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                      item.stockQuantity === 0
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.stockQuantity} left
                  </span>
                  <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                    ${item.price?.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {(!data?.lowStockWarnings || data.lowStockWarnings.length === 0) && (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                <span>All stock items are well above safety threshold.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 5. RECENT TRANSACTION ACTIVITY & SYSTEM VITALS       */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Orders Ledger (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent POS Orders & Checkouts</h3>
                <p className="text-[11px] text-slate-400">Live feed of transactions generated across system</p>
              </div>
            </div>

            <Link
              to="/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Full History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer / Time</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentOrders?.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {o.orderNumber}
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-800 block truncate max-w-[140px]">
                        {o.notes ? o.notes.split('-')[0].trim() : 'POS Customer'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">
                      {o.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 0} items
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      ${o.totalAmount?.toFixed(2)}
                    </td>
                    <td className="p-3">{getStatusBadge(o.status)}</td>
                    <td className="p-3 text-right">
                      {o.status === 'RESERVED' ? (
                        <Link
                          to={`/payment/${o._id}`}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 hover:bg-emerald-100 text-[11px] inline-flex items-center gap-1"
                        >
                          <CreditCard className="w-3 h-3" /> Pay
                        </Link>
                      ) : (
                        <Link
                          to="/orders"
                          className="text-slate-400 hover:text-blue-600 inline-flex items-center gap-1 text-[11px] font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}

                {(!data?.recentOrders || data.recentOrders.length === 0) && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No recent order activity found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* System & Infrastructure Vitals (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Infrastructure Vitals</h3>
            </div>
            <button
              onClick={refreshHealth}
              className="text-slate-400 hover:text-blue-600 transition-colors p-1"
              title="Ping Backend"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* API Status */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-700">API Gateway</span>
              </div>
              <span className="font-bold text-emerald-600 capitalize bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] border border-emerald-200">
                {systemHealth.status || 'Active'}
              </span>
            </div>

            {/* MongoDB Pool */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">MongoDB Atlas</span>
              </div>
              <span className="font-mono text-slate-700 font-bold">
                {systemHealth.database?.state || 'Connected'}
              </span>
            </div>

            {/* Uptime */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="font-semibold text-slate-700">Uptime</span>
              </div>
              <span className="font-mono text-slate-700 font-bold">
                {systemHealth.uptime || 'Online'}
              </span>
            </div>

            {/* Security Suite */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-700">Security Suite</span>
              </div>
              <span className="font-semibold text-slate-600 text-[11px]">
                Helmet • Rate Limit • JWT
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-400 text-center">
            Last checked: {systemHealth.lastChecked || 'Just now'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
