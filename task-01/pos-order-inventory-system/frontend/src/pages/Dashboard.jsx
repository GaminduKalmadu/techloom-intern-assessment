import React, { useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight,
  Server,
  Activity,
  Database,
  Cpu,
  RefreshCw,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import Card, { CardHeader, CardBody, CardFooter } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { SkeletonCard, SkeletonTable } from '../components/common/Loader';
import ErrorAlert from '../components/common/ErrorAlert';
import { useApp } from '../context/AppContext';

const Dashboard = () => {
  const { systemHealth, refreshHealth } = useApp();
  const [simulateLoading, setSimulateLoading] = useState(false);
  const [showDemoError, setShowDemoError] = useState(false);

  const toggleLoadingDemo = () => {
    setSimulateLoading(true);
    setTimeout(() => setSimulateLoading(false), 1200);
  };

  // Static foundation KPI metrics
  const metrics = [
    {
      title: "Today's Revenue",
      value: '$3,842.50',
      trend: '+14.2%',
      trendUp: true,
      description: 'vs. yesterday ($3,365.00)',
      icon: DollarSign,
      color: 'blue',
    },
    {
      title: 'Active Orders',
      value: '128',
      trend: '+8.4%',
      trendUp: true,
      description: '18 completed this hour',
      icon: ShoppingCart,
      color: 'emerald',
    },
    {
      title: 'Inventory In Stock',
      value: '1,420',
      trend: '98.5%',
      trendUp: true,
      description: 'Stock health optimal',
      icon: Boxes,
      color: 'indigo',
    },
    {
      title: 'Low Stock Alerts',
      value: '6 Items',
      trend: 'Action needed',
      trendUp: false,
      description: 'Threshold < 10 units',
      icon: AlertTriangle,
      color: 'amber',
    },
  ];

  // Foundation placeholder items for upcoming business modules
  const recentOrdersPlaceholder = [
    { id: 'ORD-9021', customer: 'Walk-in Customer', items: '3 items', total: '$48.50', status: 'Completed', time: '5m ago' },
    { id: 'ORD-9020', customer: 'Sarah Jenkins', items: '1 item', total: '$12.00', status: 'Completed', time: '14m ago' },
    { id: 'ORD-9019', customer: 'Techloom Labs', items: '12 items', total: '$340.00', status: 'Processing', time: '32m ago' },
    { id: 'ORD-9018', customer: 'David Kim', items: '2 items', total: '$29.90', status: 'Completed', time: '45m ago' },
  ];

  const lowStockPlaceholder = [
    { name: 'Thermal Receipt Paper 80mm', sku: 'SKU-PAP-80', stock: 3, min: 15, level: 'Critical' },
    { name: 'Wireless Barcode Scanner USB', sku: 'SKU-SCN-01', stock: 4, min: 10, level: 'Low' },
    { name: 'Custom POS Terminal Stylus', sku: 'SKU-STY-99', stock: 8, min: 20, level: 'Low' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome & Live Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-blue-100 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Section 01 • Full-Stack Architecture Ready</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            POS Order & Inventory System
          </h2>
          <p className="text-blue-100 text-sm max-w-xl">
            Enterprise foundation built with Express, MongoDB Atlas, JWT readiness, React, and Tailwind CSS.
          </p>
        </div>

        {/* Action Controls */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={toggleLoadingDemo}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
          >
            <Clock className="w-4 h-4 mr-1.5" />
            Simulate Loading
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDemoError((prev) => !prev)}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
          >
            {showDemoError ? 'Hide Error UI' : 'Demo Error UI'}
          </Button>
        </div>
      </div>

      {/* Demo Error State Banner if triggered */}
      {showDemoError && (
        <ErrorAlert
          title="Sample Error Boundary & API Error Display"
          message="This is a demonstration of the centralized error feedback system. All client and server errors provide structured messages and troubleshooting details."
          errors={[
            { field: 'network', message: 'Simulated validation error or network retry notice.' },
            { field: 'auth', message: 'Token refresh hook is configured and active in Axios interceptors.' },
          ]}
          onRetry={() => setShowDemoError(false)}
        />
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {simulateLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : metrics.map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <Card key={idx} hover className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {metric.title}
                    </span>
                    <div className={`p-2.5 rounded-xl bg-${metric.color}-50 text-${metric.color}-600`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-bold text-slate-900 tracking-tight">
                      {metric.value}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`inline-flex items-center text-xs font-semibold ${
                          metric.trendUp ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {metric.trendUp && <TrendingUp className="w-3.5 h-3.5 mr-1 inline" />}
                        {metric.trend}
                      </span>
                      <span className="text-xs text-slate-400">• {metric.description}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
      </div>

      {/* Backend Operational Status Card */}
      <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader
          title="Backend Infrastructure & Security Health"
          description="Live metrics fetched from GET /api/v1/health with Helmet, Rate Limiting, and CORS protection"
          icon={Server}
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={refreshHealth}
              icon={RefreshCw}
              className="text-xs"
            >
              Refresh Ping
            </Button>
          }
        />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200/80">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>API Status</span>
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-base font-bold text-slate-900 capitalize">
                {systemHealth.status}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Checked: {systemHealth.lastChecked || 'Pending'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>MongoDB Atlas</span>
                <Database className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-base font-bold text-slate-900">
                {systemHealth.database?.state || 'Standby'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {systemHealth.database?.isConnected ? 'Connection Pool Active' : 'Waiting for Atlas URI'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Server Uptime</span>
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-base font-bold text-slate-900">
                {systemHealth.uptime || 'Active'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Express v4 / Node.js</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Security Shield</span>
                <Cpu className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-base font-bold text-slate-900">Configured</div>
              <p className="text-[11px] text-slate-400 mt-1">Helmet • Rate Limit • JWT</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Grid: Upcoming Business Modules Foundation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Placeholder (2 cols) */}
        <div className="lg:col-span-2">
          {simulateLoading ? (
            <SkeletonTable rows={4} />
          ) : (
            <Card>
              <CardHeader
                title="Recent Register Transactions"
                description="Foundation layout ready for Section 02 Order processing"
                action={
                  <Badge variant="info" size="xs">
                    Module Ready
                  </Badge>
                }
              />
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3">Order ID</th>
                        <th className="px-5 py-3">Customer</th>
                        <th className="px-5 py-3">Items</th>
                        <th className="px-5 py-3">Total</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentOrdersPlaceholder.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-900">{order.id}</td>
                          <td className="px-5 py-3 text-slate-600">{order.customer}</td>
                          <td className="px-5 py-3 text-slate-500">{order.items}</td>
                          <td className="px-5 py-3 font-bold text-slate-900">{order.total}</td>
                          <td className="px-5 py-3">
                            <Badge
                              variant={order.status === 'Completed' ? 'success' : 'info'}
                              dot
                              size="xs"
                            >
                              {order.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-right text-slate-400">{order.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
              <CardFooter className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Ready to connect with Mongoose Order Model
                </span>
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 gap-1">
                  <span>View All Orders</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Low Stock Watchlist Placeholder (1 col) */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col justify-between">
            <div>
              <CardHeader
                title="Low Stock Watchlist"
                description="Real-time threshold alerts"
                icon={Boxes}
              />
              <CardBody className="p-5 space-y-4">
                {lowStockPlaceholder.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.sku}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-900">
                        {item.stock} / <span className="text-slate-400 font-normal">{item.min}</span>
                      </div>
                      <Badge
                        variant={item.level === 'Critical' ? 'danger' : 'warning'}
                        size="xs"
                        className="mt-1"
                      >
                        {item.level}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardBody>
            </div>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full text-xs">
                Manage Inventory Thresholds
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
