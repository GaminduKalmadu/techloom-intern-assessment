import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  Filter,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  CreditCard,
  RefreshCw,
  Search,
  FileSpreadsheet,
  FileText,
  ChevronRight,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import * as reportService from '../services/reportService';
import Button from '../components/common/Button';

const REPORT_TYPES = [
  { id: 'sales', name: 'Sales & Revenue', icon: TrendingUp, desc: 'Revenue, orders, ticket size & payment breakdown' },
  { id: 'inventory', name: 'Inventory & Valuation', icon: Package, desc: 'Stock health, retail valuation & category assets' },
  { id: 'top_products', name: 'Top-Selling Products', icon: ArrowUpRight, desc: 'Best performing items by units sold & revenue' },
];

const TIMEFRAME_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'all', label: 'All Time' },
  { id: 'custom', label: 'Custom Range' },
];

const Reports = () => {
  const { formatCurrency, settings } = useSettings();

  // Controls State
  const [activeReport, setActiveReport] = useState('sales');
  const [timeframe, setTimeframe] = useState('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Data State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [topProductsData, setTopProductsData] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(new Date());

  // Fetch Report Data
  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeReport === 'sales') {
        const params = {
          timeframe: timeframe !== 'custom' ? timeframe : undefined,
          startDate: timeframe === 'custom' ? startDate : undefined,
          endDate: timeframe === 'custom' ? endDate : undefined,
          status: selectedStatus,
        };
        const res = await reportService.getSalesReport(params);
        setSalesData(res.data);
      } else if (activeReport === 'inventory') {
        const params = {
          category: selectedCategory,
          lowStockThreshold: settings.lowStockThreshold || 10,
        };
        const res = await reportService.getInventoryReport(params);
        setInventoryData(res.data);
      } else if (activeReport === 'top_products') {
        const params = {
          startDate: timeframe === 'custom' ? startDate : undefined,
          endDate: timeframe === 'custom' ? endDate : undefined,
          limit: 15,
        };
        const res = await reportService.getTopProductsReport(params);
        setTopProductsData(res.data);
      }
      setGeneratedAt(new Date());
    } catch (err) {
      console.error('Report fetch error:', err);
      setError(err.message || 'Failed to generate report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [activeReport, timeframe, startDate, endDate, selectedStatus, selectedCategory, settings.lowStockThreshold]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Export to CSV
  const handleExportCsv = () => {
    if (activeReport === 'sales') {
      reportService.downloadReportFile({
        type: 'sales',
        format: 'csv',
        startDate: timeframe === 'custom' ? startDate : undefined,
        endDate: timeframe === 'custom' ? endDate : undefined,
      });
    } else if (activeReport === 'inventory') {
      reportService.downloadReportFile({
        type: 'inventory',
        format: 'csv',
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      });
    } else {
      // Client CSV fallback for top products
      if (!topProductsData?.topProducts?.length) return;
      const headers = ['Product Name', 'Units Sold', 'Total Revenue ($)', 'Order Count'];
      const rows = topProductsData.topProducts.map((p) => [
        `"${p.name}"`,
        p.unitsSold,
        Number(p.revenue || 0).toFixed(2),
        p.orderCount,
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `top-products-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Export to JSON
  const handleExportJson = () => {
    let currentPayload = null;
    let fileName = `report-${activeReport}-${new Date().toISOString().split('T')[0]}.json`;

    if (activeReport === 'sales') currentPayload = salesData;
    else if (activeReport === 'inventory') currentPayload = inventoryData;
    else if (activeReport === 'top_products') currentPayload = topProductsData;

    if (!currentPayload) return;
    const blob = new Blob([JSON.stringify(currentPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Print-Only Header */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-900">{settings.storeName || 'Techloom POS Retail'}</h1>
        <p className="text-xs text-slate-500">{settings.storeAddress || ''}</p>
        <div className="flex justify-between items-center mt-2 text-xs text-slate-600">
          <span>Report: {REPORT_TYPES.find((r) => r.id === activeReport)?.name}</span>
          <span>Generated: {generatedAt.toLocaleString()}</span>
        </div>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Reports & Analytics
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Generate real-time business reports, monitor revenue streams, and export audits.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5"
            disabled={isLoading}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            className="flex items-center gap-1.5"
            disabled={isLoading}
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>JSON</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5"
            disabled={isLoading}
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print / PDF</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={fetchReport}
            isLoading={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 print:hidden">
        {REPORT_TYPES.map((type) => {
          const Icon = type.icon;
          const isActive = activeReport === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setActiveReport(type.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                isActive
                  ? 'bg-blue-50/70 border-blue-400 shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-bold truncate ${isActive ? 'text-blue-950' : 'text-slate-800'}`}>
                  {type.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{type.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter and Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Report Parameters</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Generated: {generatedAt.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Timeframe Presets (for Sales & Top Products) */}
          {activeReport !== 'inventory' && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {TIMEFRAME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setTimeframe(preset.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    timeframe === preset.id
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          {/* Custom Date Range Inputs */}
          {activeReport !== 'inventory' && timeframe === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}

          {/* Status Filter for Sales */}
          {activeReport === 'sales' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Statuses</option>
                <option value="PAID">Paid Only</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          )}

          {/* Category Filter for Inventory */}
          {activeReport === 'inventory' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Categories</option>
                <option value="Hardware">Hardware</option>
                <option value="Supplies">Supplies</option>
                <option value="Beverages">Beverages</option>
                <option value="Apparel">Apparel</option>
                <option value="Accessories">Accessories</option>
                <option value="Food">Food</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {/* Apply Filter Button */}
          <button
            type="button"
            onClick={fetchReport}
            disabled={isLoading}
            className="px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors ml-auto"
          >
            {isLoading ? 'Computing...' : 'Apply Filters'}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          <p className="flex-1">{error}</p>
          <button onClick={fetchReport} className="underline font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* SECTION 1: SALES & REVENUE REPORT VIEW */}
      {activeReport === 'sales' && salesData && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {formatCurrency(salesData.summary?.totalRevenue || 0)}
              </p>
              <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Paid & Settled Orders
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Paid Orders</span>
                <ShoppingCart className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-black text-slate-900">{salesData.summary?.paidOrders || 0}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Out of {salesData.summary?.totalOrders || 0} total created
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Avg Order Value</span>
                <TrendingUp className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {formatCurrency(salesData.summary?.averageOrderValue || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Per completed transaction</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Items Dispensed</span>
                <Package className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-slate-900">{salesData.summary?.totalItemsSold || 0}</p>
              <p className="text-[11px] text-slate-400 mt-1">Total physical units sold</p>
            </div>
          </div>

          {/* Payment Method Distribution Card */}
          {salesData.paymentMethods && Object.keys(salesData.paymentMethods).length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                Payment Method Revenue Share
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(salesData.paymentMethods).map(([method, amount]) => {
                  const total = salesData.summary?.totalRevenue || 1;
                  const pct = ((amount / total) * 100).toFixed(1);
                  return (
                    <div key={method} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{method}</span>
                        <span className="text-blue-600">{pct}%</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(amount)}</p>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Orders Itemized Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Transaction Breakdown</h3>
                <p className="text-xs text-slate-400">Detailed list of recorded orders within timeframe</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter orders or customer..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesData.orders
                    ?.filter(
                      (o) =>
                        o.orderId.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        o.customerName.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        o.paymentMethod.toLowerCase().includes(searchFilter.toLowerCase())
                    )
                    .map((order) => (
                      <tr key={order.orderId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-slate-700">
                          #{order.orderId.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{order.customerName}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                              order.status === 'PAID' || order.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                : order.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                                : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {formatCurrency(order.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  {(!salesData.orders || salesData.orders.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No orders recorded for the selected filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3">
                      Total Report Summary
                    </td>
                    <td className="px-4 py-3">{salesData.summary?.totalItemsSold || 0} units</td>
                    <td colSpan={2} />
                    <td className="px-4 py-3 text-right text-sm text-emerald-700">
                      {formatCurrency(salesData.summary?.totalRevenue || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: INVENTORY & VALUATION REPORT VIEW */}
      {activeReport === 'inventory' && inventoryData && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Valuation</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {formatCurrency(inventoryData.summary?.totalValuation || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Retail asset value on hand</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Physical Stock</span>
                <Package className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {inventoryData.summary?.totalStockUnits || 0} units
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Across {inventoryData.summary?.totalProducts || 0} catalog SKUs
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Items</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-600">
                {inventoryData.summary?.lowStockCount || 0}
              </p>
              <p className="text-[11px] text-amber-600 mt-1">Threshold: &le; {settings.lowStockThreshold || 10} units</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Out of Stock</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-black text-rose-600">
                {inventoryData.summary?.outOfStockCount || 0}
              </p>
              <p className="text-[11px] text-rose-600 mt-1">Zero units currently available</p>
            </div>
          </div>

          {/* Category Breakdown Cards */}
          {inventoryData.categoryStats?.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Category Valuation Breakdown
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {inventoryData.categoryStats.map((cat) => (
                  <div key={cat.category} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex justify-between text-xs font-semibold text-slate-800">
                      <span>{cat.category}</span>
                      <span className="text-slate-500">{cat.count} SKUs</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(cat.valuation)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{cat.stockUnits} units on shelf</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products Stock Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Inventory Product Status</h3>
                <p className="text-xs text-slate-400">Live stock valuation per individual product SKU</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search item or SKU..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Unit Price</th>
                    <th className="px-4 py-3">Stock Units</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventoryData.products
                    ?.filter(
                      (p) =>
                        p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        p.category.toLowerCase().includes(searchFilter.toLowerCase())
                    )
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                          <span>{item.name}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.category}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{item.stockQuantity}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                              item.status === 'IN_STOCK'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                : item.status === 'LOW_STOCK'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                                : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                            }`}
                          >
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {formatCurrency(item.valuation)}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3">
                      Total Inventory Valuation
                    </td>
                    <td className="px-4 py-3">{inventoryData.summary?.totalStockUnits || 0} units</td>
                    <td />
                    <td className="px-4 py-3 text-right text-sm text-blue-700">
                      {formatCurrency(inventoryData.summary?.totalValuation || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: TOP PRODUCTS REPORT VIEW */}
      {activeReport === 'top_products' && topProductsData && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Top-Selling Retail Items</h3>
                <p className="text-xs text-slate-400">Ranked by unit sales volume and generated gross revenue</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3 text-center">Units Sold</th>
                    <th className="px-4 py-3 text-center">Order Appearances</th>
                    <th className="px-4 py-3 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProductsData.topProducts?.map((product, idx) => (
                    <tr key={product.productId || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-400">#{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{product.name}</td>
                      <td className="px-4 py-3 text-center font-bold text-blue-600">
                        {product.unitsSold} units
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">{product.orderCount} orders</td>
                      <td className="px-4 py-3 text-right font-black text-slate-900">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))}
                  {(!topProductsData.topProducts || topProductsData.topProducts.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        No sales data found for top products calculation.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
