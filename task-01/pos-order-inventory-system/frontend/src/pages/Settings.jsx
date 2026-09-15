import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  Receipt,
  Sliders,
  Database,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Activity,
  DollarSign,
  ShieldCheck,
  Volume2,
  Printer,
  Sparkles,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import * as healthService from '../services/healthService';
import * as productService from '../services/productService';
import Button from '../components/common/Button';

const CURRENCY_OPTIONS = [
  { symbol: '$', code: 'USD', name: 'US Dollar ($)' },
  { symbol: '€', code: 'EUR', name: 'Euro (€)' },
  { symbol: '£', code: 'GBP', name: 'British Pound (£)' },
  { symbol: '₹', code: 'INR', name: 'Indian Rupee (₹)' },
  { symbol: 'Rs', code: 'LKR', name: 'Sri Lankan Rupee (Rs)' },
  { symbol: '¥', code: 'JPY', name: 'Japanese Yen (¥)' },
  { symbol: 'A$', code: 'AUD', name: 'Australian Dollar (A$)' },
  { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar (C$)' },
];

const SETTINGS_TABS = [
  { id: 'store', label: 'Store Profile', icon: Store },
  { id: 'pos', label: 'POS & Inventory', icon: Sliders },
  { id: 'receipt', label: 'Receipt & Printing', icon: Receipt },
  { id: 'system', label: 'System & Diagnostics', icon: Database },
];

const Settings = () => {
  const { settings, saveSettings, resetToDefaults, isLoading: contextLoading } = useSettings();

  const [activeTab, setActiveTab] = useState('store');
  const [formData, setFormData] = useState({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Sync form data with context
  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  // Handle Save
  const handleSave = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await saveSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Reset Defaults
  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all store settings to factory defaults?')) {
      await resetToDefaults();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Ping Backend Health
  const checkHealth = async () => {
    setIsCheckingHealth(true);
    const startTime = Date.now();
    try {
      const res = await healthService.getHealth();
      const latency = Date.now() - startTime;
      setHealthStatus({
        online: true,
        latency: `${latency}ms`,
        uptime: res.data?.uptime || 'Active',
        dbStatus: res.data?.mongodb || 'Connected',
      });
    } catch (err) {
      setHealthStatus({
        online: false,
        error: err.message || 'API Unreachable',
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  // Seed Demo Products
  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      await productService.seedProducts();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3500);
    } catch (err) {
      alert('Seeding error: ' + (err.message || 'Failed to seed sample items'));
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              POS & Store Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Configure store branding, currency symbols, tax rates, POS rules, and receipt formats.
            </p>
          </div>
        </div>

        {/* Global Save Controls */}
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/80 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Settings Saved
            </span>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Reset Defaults</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            className="flex items-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Settings Tabs on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Navigation & Settings Forms (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {/* Tab Bar */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content Cards */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            {/* TAB 1: STORE PROFILE */}
            {activeTab === 'store' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">Store Profile & Location</h3>
                  <p className="text-xs text-slate-500">
                    Business details printed on customer receipts and POS reports
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Store Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Store Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.storeName || ''}
                      onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="e.g. Techloom POS Retail"
                    />
                  </div>

                  {/* Store Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Store Email</label>
                    <input
                      type="email"
                      value={formData.storeEmail || ''}
                      onChange={(e) => setFormData({ ...formData, storeEmail: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="support@techloom.ai"
                    />
                  </div>

                  {/* Store Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Store Phone</label>
                    <input
                      type="tel"
                      value={formData.storePhone || ''}
                      onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="+1 (555) 019-2834"
                    />
                  </div>

                  {/* Currency Symbol */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                    <select
                      value={formData.currencySymbol || '$'}
                      onChange={(e) => {
                        const opt = CURRENCY_OPTIONS.find((c) => c.symbol === e.target.value);
                        setFormData({
                          ...formData,
                          currencySymbol: e.target.value,
                          currency: opt?.code || 'USD',
                        });
                      }}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.symbol}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tax Rate (%) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sales Tax / VAT Rate (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.taxRate !== undefined ? formData.taxRate : 8.25}
                        onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Tax ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Business Tax / VAT Registration ID
                    </label>
                    <input
                      type="text"
                      value={formData.taxId || ''}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="e.g. TX-992014-A"
                    />
                  </div>
                </div>

                {/* Store Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Store Address</label>
                  <textarea
                    rows={2}
                    value={formData.storeAddress || ''}
                    onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                    placeholder="Physical store or terminal location..."
                  />
                </div>
              </div>
            )}

            {/* TAB 2: POS & INVENTORY OPERATIONS */}
            {activeTab === 'pos' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">Inventory & Terminal Controls</h3>
                  <p className="text-xs text-slate-500">Configure real-time stock thresholds and checkout rules</p>
                </div>

                {/* Low Stock Alert Threshold */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Low-Stock Warning Threshold</h4>
                      <p className="text-[11px] text-slate-500">
                        Products with stock &le; this number trigger warning badges across POS & Inventory
                      </p>
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={formData.lowStockThreshold !== undefined ? formData.lowStockThreshold : 10}
                        onChange={(e) =>
                          setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value, 10) || 10 })
                        }
                        className="w-full px-3 py-1.5 text-center text-sm font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 hover:bg-slate-50/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Audio Feedback Chimes</p>
                        <p className="text-[11px] text-slate-400">Play audio cue on scan, cart update & payment</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.enableSound)}
                      onChange={(e) => setFormData({ ...formData, enableSound: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 hover:bg-slate-50/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <Printer className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Auto-Prompt Print Receipt</p>
                        <p className="text-[11px] text-slate-400">
                          Automatically trigger print dialog when order checkout is completed
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.autoPrintReceipt)}
                      onChange={(e) => setFormData({ ...formData, autoPrintReceipt: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 3: RECEIPT & PRINTING */}
            {activeTab === 'receipt' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">Receipt Customization</h3>
                  <p className="text-xs text-slate-500">Configure text displayed on physical & PDF receipts</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Header Greeting</label>
                  <input
                    type="text"
                    value={formData.receiptHeader || ''}
                    onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="THANK YOU FOR SHOPPING AT TECHLOOM POS"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Receipt Footer Policy / Return Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.receiptFooter || ''}
                    onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                    placeholder="Goods once sold can be returned within 14 days with original receipt."
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50/50 cursor-pointer">
                    <span className="text-xs font-semibold text-slate-700">Display Cashier / Staff on Receipt</span>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.showCashierOnReceipt)}
                      onChange={(e) => setFormData({ ...formData, showCashierOnReceipt: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50/50 cursor-pointer">
                    <span className="text-xs font-semibold text-slate-700">Display Barcode / QR Section</span>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.showBarcodeOnReceipt)}
                      onChange={(e) => setFormData({ ...formData, showBarcodeOnReceipt: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 4: SYSTEM & DIAGNOSTICS */}
            {activeTab === 'system' && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">System Diagnostics & Database</h3>
                  <p className="text-xs text-slate-500">Inspect backend health, seed demo data, and manage cache</p>
                </div>

                {/* API Health Diagnostic Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-bold text-slate-800">Backend API & Database Connection</h4>
                    </div>
                    <button
                      type="button"
                      onClick={checkHealth}
                      disabled={isCheckingHealth}
                      className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                    >
                      {isCheckingHealth ? 'Testing...' : 'Ping Server'}
                    </button>
                  </div>

                  {healthStatus && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                        healthStatus.online ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${healthStatus.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span className="font-bold">{healthStatus.online ? 'Operational' : 'Unreachable'}</span>
                      </div>
                      {healthStatus.online && (
                        <span className="font-mono text-[11px] text-emerald-700">Latency: {healthStatus.latency}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Demo Catalog Seeding */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Seed Sample POS Catalog
                    </h4>
                    <p className="text-[11px] text-indigo-700/80 mt-0.5">
                      Instantly populate 10 realistic retail hardware and apparel items into MongoDB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSeedDemoData}
                    disabled={isSeeding}
                    className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 shadow-sm whitespace-nowrap"
                  >
                    {isSeeding ? 'Seeding...' : seedSuccess ? 'Seeded!' : 'Seed Products'}
                  </button>
                </div>

                {/* Clear Local Cache */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Clear Local POS Cache</h4>
                    <p className="text-[11px] text-slate-500">Wipe browser storage, cached cart items, and stored tokens</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Clear all local browser cached data?')) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold hover:bg-rose-50"
                  >
                    Clear Cache
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Thermal Receipt Preview (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-blue-600" />
              Live Receipt Preview
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">
              80mm Thermal
            </span>
          </div>

          {/* Thermal Receipt Paper Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 font-mono text-xs text-slate-800 space-y-4 relative overflow-hidden">
            {/* Top jagged paper trim */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
              <h3 className="font-bold text-sm text-slate-900 tracking-wider uppercase">
                {formData.storeName || 'TECHLOOM POS RETAIL'}
              </h3>
              <p className="text-[11px] text-slate-500">{formData.storeAddress || '100 Innovation Way, CA'}</p>
              <p className="text-[11px] text-slate-500">TEL: {formData.storePhone || '+1 (555) 019-2834'}</p>
              {formData.taxId && (
                <p className="text-[10px] text-slate-400">TAX REG: {formData.taxId}</p>
              )}
            </div>

            {/* Receipt Metadata */}
            <div className="text-[11px] text-slate-600 space-y-0.5 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>RECEIPT: #TL-88219</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              {formData.showCashierOnReceipt && (
                <div className="flex justify-between text-slate-500">
                  <span>CASHIER: Admin Terminal</span>
                  <span>POS #01</span>
                </div>
              )}
            </div>

            {/* Mock Itemized Lines */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between font-bold border-b pb-1 text-slate-900">
                <span>ITEM</span>
                <span>TOTAL</span>
              </div>
              <div className="flex justify-between">
                <span>1x Wireless Scanner 2D</span>
                <span>{formData.currencySymbol || '$'}129.00</span>
              </div>
              <div className="flex justify-between">
                <span>2x Thermal Receipt Paper</span>
                <span>{formData.currencySymbol || '$'}17.98</span>
              </div>
            </div>

            {/* Calculation Totals */}
            <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-500">
                <span>SUBTOTAL</span>
                <span>{formData.currencySymbol || '$'}146.98</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>TAX ({formData.taxRate !== undefined ? formData.taxRate : 8.25}%)</span>
                <span>
                  {formData.currencySymbol || '$'}
                  {((146.98 * (formData.taxRate || 8.25)) / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t pt-1">
                <span>TOTAL</span>
                <span>
                  {formData.currencySymbol || '$'}
                  {(146.98 * (1 + (formData.taxRate || 8.25) / 100)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Receipt Footer Message */}
            <div className="text-center pt-2 border-t border-dashed border-slate-300 space-y-2">
              <p className="text-[11px] font-bold text-slate-800">
                {formData.receiptHeader || 'THANK YOU FOR SHOPPING!'}
              </p>
              <p className="text-[10px] text-slate-400">
                {formData.receiptFooter || 'Goods once sold can be returned within 14 days.'}
              </p>
              {formData.showBarcodeOnReceipt && (
                <div className="pt-2 flex flex-col items-center">
                  <div className="w-36 h-7 bg-slate-800 rounded flex items-center justify-center text-white text-[9px] tracking-widest font-mono">
                    ||||| ||| ||||||| ||
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5">88219-TL-POS</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
