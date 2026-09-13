import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Receipt,
  BarChart3,
  Settings,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';

const MobileNav = () => {
  const { mobileMenuOpen, closeMobileMenu } = useApp();
  const { cart } = useCart();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Inventory', href: '/inventory', icon: Boxes },
    {
      name: 'Cart / POS',
      href: '/cart',
      icon: ShoppingCart,
      badge: cart?.totalItems > 0 ? `${cart.totalItems}` : null,
    },
    { name: 'Orders', href: '/orders', icon: Receipt },
    { name: 'Reports', href: '/reports', icon: BarChart3, badge: 'Soon' },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  if (!mobileMenuOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={closeMobileMenu}
      />

      {/* Drawer */}
      <div className="relative flex flex-col w-72 max-w-[80%] bg-white h-full shadow-2xl z-10">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20">
              TL
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Techloom POS</h2>
              <p className="text-[10px] text-slate-400">Order & Inventory</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-500">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
            AD
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 truncate">Admin Demo</p>
            <p className="text-[10px] text-slate-400 truncate">admin@techloom.ai</p>
          </div>
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
