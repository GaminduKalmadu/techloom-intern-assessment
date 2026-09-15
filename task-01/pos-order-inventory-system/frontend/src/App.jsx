import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';
import ErrorBoundary from './pages/ErrorPage';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import NotFound from './pages/NotFound';
import Payment from './pages/Payment';
import AdminPayments from './pages/AdminPayments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <AppProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="register" element={<Cart />} />
                  <Route path="checkout" element={<Checkout />} />
                  <Route path="payment/:orderId" element={<Payment />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="admin/payments" element={<AdminPayments />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </AppProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
