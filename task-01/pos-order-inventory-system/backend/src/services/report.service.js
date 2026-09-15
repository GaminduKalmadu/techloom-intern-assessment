const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Payment = require('../models/payment.model');

/**
 * Helper to build date range filter
 */
const buildDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  return filter;
};

/**
 * Generate comprehensive Sales & Revenue Report
 */
const getSalesReport = async ({ startDate, endDate, status, timeframe }) => {
  let dateQuery = {};
  const now = new Date();

  if (timeframe === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateQuery = { createdAt: { $gte: today } };
  } else if (timeframe === '7d') {
    const d = new Date();
    d.setDate(now.getDate() - 7);
    dateQuery = { createdAt: { $gte: d } };
  } else if (timeframe === '30d') {
    const d = new Date();
    d.setDate(now.getDate() - 30);
    dateQuery = { createdAt: { $gte: d } };
  } else if (startDate || endDate) {
    dateQuery = buildDateFilter(startDate, endDate);
  }

  const matchStage = { ...dateQuery };
  if (status && status !== 'all') {
    matchStage.status = status.toUpperCase();
  }

  // 1. Fetch matching orders
  const orders = await Order.find(matchStage)
    .sort({ createdAt: -1 })
    .lean();

  // 2. Compute metrics
  let totalRevenue = 0;
  let totalPaidRevenue = 0;
  let totalItemsSold = 0;
  let paidOrdersCount = 0;
  const paymentMethods = {};
  const dailyTrends = {};

  orders.forEach((order) => {
    const orderTotal = Number(order.totalAmount) || 0;
    totalRevenue += orderTotal;

    const isPaid = order.status === 'PAID' || order.status === 'COMPLETED';
    if (isPaid) {
      totalPaidRevenue += orderTotal;
      paidOrdersCount += 1;

      const method = order.paymentMethod || 'OTHER';
      paymentMethods[method] = (paymentMethods[method] || 0) + orderTotal;
    }

    if (Array.isArray(order.items)) {
      order.items.forEach((item) => {
        totalItemsSold += Number(item.quantity) || 0;
      });
    }

    // Daily breakdown
    const dayKey = order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : 'Unknown';
    if (!dailyTrends[dayKey]) {
      dailyTrends[dayKey] = { date: dayKey, revenue: 0, orders: 0, paidOrders: 0 };
    }
    dailyTrends[dayKey].orders += 1;
    if (isPaid) {
      dailyTrends[dayKey].revenue += orderTotal;
      dailyTrends[dayKey].paidOrders += 1;
    }
  });

  const averageOrderValue = paidOrdersCount > 0 ? (totalPaidRevenue / paidOrdersCount).toFixed(2) : 0;

  return {
    summary: {
      totalOrders: orders.length,
      paidOrders: paidOrdersCount,
      totalRevenue: totalPaidRevenue,
      grossVolume: totalRevenue,
      averageOrderValue: Number(averageOrderValue),
      totalItemsSold,
    },
    paymentMethods,
    dailyTrends: Object.values(dailyTrends).sort((a, b) => a.date.localeCompare(b.date)),
    orders: orders.map((o) => ({
      orderId: o._id,
      customerName: o.customerName || 'Walk-in Customer',
      customerEmail: o.customerEmail || '',
      itemCount: Array.isArray(o.items) ? o.items.length : 0,
      items: o.items || [],
      totalAmount: o.totalAmount,
      paymentMethod: o.paymentMethod || 'CASH',
      status: o.status,
      createdAt: o.createdAt,
    })),
  };
};

/**
 * Generate Inventory & Valuation Report
 */
const getInventoryReport = async ({ category, stockStatus, lowStockThreshold = 10 }) => {
  const query = {};
  if (category && category !== 'all') {
    query.category = category;
  }

  const threshold = Number(lowStockThreshold) || 10;

  if (stockStatus === 'low_stock') {
    query.stockQuantity = { $gt: 0, $lte: threshold };
  } else if (stockStatus === 'out_of_stock') {
    query.stockQuantity = 0;
  } else if (stockStatus === 'in_stock') {
    query.stockQuantity = { $gt: threshold };
  }

  const products = await Product.find(query).sort({ category: 1, name: 1 }).lean();

  let totalStockUnits = 0;
  let totalValuation = 0;
  let outOfStockCount = 0;
  let lowStockCount = 0;
  const categoryStats = {};

  products.forEach((prod) => {
    const qty = Number(prod.stockQuantity) || 0;
    const price = Number(prod.price) || 0;
    const val = qty * price;

    totalStockUnits += qty;
    totalValuation += val;

    if (qty === 0) outOfStockCount += 1;
    else if (qty <= threshold) lowStockCount += 1;

    const cat = prod.category || 'Uncategorized';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { category: cat, count: 0, stockUnits: 0, valuation: 0 };
    }
    categoryStats[cat].count += 1;
    categoryStats[cat].stockUnits += qty;
    categoryStats[cat].valuation += val;
  });

  return {
    summary: {
      totalProducts: products.length,
      totalStockUnits,
      totalValuation: Number(totalValuation.toFixed(2)),
      lowStockCount,
      outOfStockCount,
    },
    categoryStats: Object.values(categoryStats),
    products: products.map((p) => ({
      id: p._id,
      name: p.name,
      category: p.category,
      price: p.price,
      stockQuantity: p.stockQuantity,
      valuation: Number((p.price * p.stockQuantity).toFixed(2)),
      status: p.stockQuantity === 0 ? 'OUT_OF_STOCK' : p.stockQuantity <= threshold ? 'LOW_STOCK' : 'IN_STOCK',
      imageUrl: p.imageUrl || '',
    })),
  };
};

/**
 * Generate Top-Selling Products Report
 */
const getTopProductsReport = async ({ limit = 10, startDate, endDate }) => {
  const matchStage = {
    status: { $in: ['PAID', 'COMPLETED'] },
  };

  const dateFilter = buildDateFilter(startDate, endDate);
  if (dateFilter.createdAt) {
    matchStage.createdAt = dateFilter.createdAt;
  }

  const result = await Order.aggregate([
    { $match: matchStage },
    { $unwind: '$items' },
    {
      $group: {
        _id: {
          productId: '$items.productId',
          name: '$items.name',
        },
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { unitsSold: -1, revenue: -1 } },
    { $limit: Number(limit) || 10 },
    {
      $project: {
        _id: 0,
        productId: '$_id.productId',
        name: '$_id.name',
        unitsSold: 1,
        revenue: 1,
        orderCount: 1,
      },
    },
  ]);

  return {
    timeframeFilter: { startDate, endDate },
    topProducts: result,
  };
};

module.exports = {
  getSalesReport,
  getInventoryReport,
  getTopProductsReport,
};
