import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  ChevronRight,
  ShoppingBag,
  CreditCard,
  Ban,
} from 'lucide-react';
import * as orderService from '../services/orderService';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { SkeletonTable } from '../components/common/Loader';
import ErrorAlert from '../components/common/ErrorAlert';

const STATUS_FILTERS = ['ALL', 'RESERVED', 'PAID', 'PENDING', 'CANCELLED', 'FAILED', 'EXPIRED'];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (activeFilter !== 'ALL') {
        params.status = activeFilter;
      }
      const res = await orderService.getOrders(params);
      if (res && res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(err.message || 'Failed to load order history');
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handlePay = async (orderId) => {
    try {
      setActionLoading(true);
      const res = await orderService.payOrder(orderId, { notes: 'Paid at POS terminal' });
      if (res && res.success) {
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(res.data);
        }
      }
    } catch (err) {
      alert(err.message || 'Payment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order and release reserved stock?')) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await orderService.cancelOrder(orderId, 'Manually cancelled');
      if (res && res.success) {
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(res.data);
        }
      }
    } catch (err) {
      alert(err.message || 'Cancellation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PAID':
        return (
          <Badge variant="success" dot size="sm">
            PAID
          </Badge>
        );
      case 'RESERVED':
        return (
          <Badge variant="warning" dot size="sm">
            RESERVED
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="primary" dot size="sm">
            PENDING
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="neutral" dot size="sm">
            CANCELLED
          </Badge>
        );
      case 'FAILED':
      case 'EXPIRED':
        return (
          <Badge variant="danger" dot size="sm">
            {s}
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order Management</h1>
            <Badge variant="primary" size="sm">
              {orders.length}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track customer orders, inventory reservations, and payment statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/cart">
            <Button variant="primary" size="sm">
              + New Order
            </Button>
          </Link>
        </div>
      </div>

      {error && <ErrorAlert title="Error" message={error} />}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/80">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === f
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <SkeletonTable rows={5} columns={6} />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No orders found</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                {activeFilter !== 'ALL'
                  ? `No orders matching status '${activeFilter}'.`
                  : 'Start shopping and place your first order.'}
              </p>
              <Link to="/cart">
                <Button variant="primary" size="sm">
                  Go to Shopping Cart
                </Button>
              </Link>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Order Number</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => {
                  const s = (o.status || '').toUpperCase();
                  const isReserved = s === 'RESERVED';

                  return (
                    <tr key={o._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">
                        {o.orderNumber}
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(o.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-4 text-slate-600">
                        <span className="font-semibold text-slate-800">
                          {o.items?.reduce((sum, it) => sum + it.quantity, 0) || 0} items
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                          {o.items?.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        ${o.totalAmount?.toFixed(2)}
                      </td>
                      <td className="p-4">{getStatusBadge(o.status)}</td>
                      <td className="p-4 text-right space-x-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(o)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>

                        {isReserved && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePay(o._id)}
                              disabled={actionLoading}
                              className="text-emerald-600 hover:bg-emerald-50 border-emerald-200"
                            >
                              <CreditCard className="w-3.5 h-3.5 mr-1" />
                              Pay
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(o._id)}
                              disabled={actionLoading}
                              className="text-rose-600 hover:bg-rose-50"
                            >
                              <Ban className="w-3.5 h-3.5 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-slate-800">
                  {selectedOrder.orderNumber}
                </span>
                <p className="text-[11px] text-slate-400">
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <div>{getStatusBadge(selectedOrder.status)}</div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Order Items
              </span>
              {selectedOrder.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                  <div>
                    <span className="font-semibold text-slate-800">{it.name}</span>
                    <span className="text-slate-400 block">{it.quantity}x @ ${it.price?.toFixed(2)}</span>
                  </div>
                  <span className="font-bold text-slate-900">${it.subtotal?.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between text-sm">
              <span className="font-bold text-slate-700">Total Charged:</span>
              <span className="font-black text-blue-600 text-lg">
                ${selectedOrder.totalAmount?.toFixed(2)}
              </span>
            </div>

            {selectedOrder.notes && (
              <div className="p-2.5 rounded-lg bg-slate-50 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700 block mb-0.5">Notes:</span>
                {selectedOrder.notes}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
