import React from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Activity,
  Database,
  RefreshCw,
  ShoppingCart,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import Badge from '../common/Badge';

const Navbar = () => {
  const { toggleMobileMenu, systemHealth, refreshHealth } = useApp();
  const { cart } = useCart();

  const getStatusBadge = () => {
    switch (systemHealth.status) {
      case 'online':
        return (
          <Badge variant="success" dot size="sm">
            Backend Online
          </Badge>
        );
      case 'degraded':
        return (
          <Badge variant="warning" dot size="sm">
            Degraded
          </Badge>
        );
      case 'offline':
        return (
          <Badge variant="danger" dot size="sm">
            API Offline
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" dot size="sm">
            Connecting...
          </Badge>
        );
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left side: Hamburger (mobile) + Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-md">
        <button
          type="button"
          onClick={toggleMobileMenu}
          aria-label="Open navigation menu"
          className="p-2 -ml-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 md:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search */}
        <div className="relative w-full max-w-xs hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products, orders, SKU..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right side: System health status & actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend health status badge */}
        <div className="flex items-center gap-2">
          {getStatusBadge()}

          {/* Database indicator tooltip / badge */}
          <div
            title={`Database: ${
              systemHealth.database?.isConnected ? 'Connected' : 'Waiting for connection'
            }`}
            className={`p-1.5 rounded-lg border flex items-center gap-1 text-[11px] font-medium hidden sm:flex ${
              systemHealth.database?.isConnected
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Atlas DB</span>
          </div>

          <button
            type="button"
            onClick={refreshHealth}
            title="Refresh system status"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* Shopping Cart Button with Live Counter Badge */}
        <Link
          to="/cart"
          aria-label="View shopping cart"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          {cart?.totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs">
              {cart.totalItems}
            </span>
          )}
        </Link>

        {/* Notification Bell */}
        <button
          type="button"
          aria-label="View notifications"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
