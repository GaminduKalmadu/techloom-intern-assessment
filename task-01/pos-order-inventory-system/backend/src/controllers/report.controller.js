const reportService = require('../services/report.service');
const ApiResponse = require('../utils/apiResponse');

const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, status, timeframe } = req.query;
    const report = await reportService.getSalesReport({ startDate, endDate, status, timeframe });
    return ApiResponse.success(res, 'Sales report generated successfully', report);
  } catch (err) {
    next(err);
  }
};

const getInventoryReport = async (req, res, next) => {
  try {
    const { category, stockStatus, lowStockThreshold } = req.query;
    const report = await reportService.getInventoryReport({ category, stockStatus, lowStockThreshold });
    return ApiResponse.success(res, 'Inventory report generated successfully', report);
  } catch (err) {
    next(err);
  }
};

const getTopProductsReport = async (req, res, next) => {
  try {
    const { limit, startDate, endDate } = req.query;
    const report = await reportService.getTopProductsReport({ limit, startDate, endDate });
    return ApiResponse.success(res, 'Top products report generated successfully', report);
  } catch (err) {
    next(err);
  }
};

/**
 * Export data to CSV format
 */
const exportReport = async (req, res, next) => {
  try {
    const { type = 'sales', format = 'csv', startDate, endDate, category } = req.query;
    const timestamp = new Date().toISOString().split('T')[0];

    if (type === 'sales') {
      const data = await reportService.getSalesReport({ startDate, endDate });

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="sales-report-${timestamp}.json"`);
        return res.send(JSON.stringify(data, null, 2));
      }

      // Convert to CSV
      const headers = ['Order ID', 'Date', 'Customer Name', 'Items Count', 'Payment Method', 'Status', 'Total Amount ($)'];
      const rows = data.orders.map((o) => [
        `"${o.orderId}"`,
        `"${o.createdAt ? new Date(o.createdAt).toISOString() : ''}"`,
        `"${(o.customerName || '').replace(/"/g, '""')}"`,
        o.itemCount,
        `"${o.paymentMethod}"`,
        `"${o.status}"`,
        Number(o.totalAmount || 0).toFixed(2),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="sales-report-${timestamp}.csv"`);
      return res.status(200).send(csvContent);
    }

    if (type === 'inventory') {
      const data = await reportService.getInventoryReport({ category });

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="inventory-report-${timestamp}.json"`);
        return res.send(JSON.stringify(data, null, 2));
      }

      const headers = ['Product ID', 'Name', 'Category', 'Price ($)', 'Stock Quantity', 'Valuation ($)', 'Status'];
      const rows = data.products.map((p) => [
        `"${p.id}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.category || '').replace(/"/g, '""')}"`,
        Number(p.price || 0).toFixed(2),
        p.stockQuantity,
        Number(p.valuation || 0).toFixed(2),
        `"${p.status}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="inventory-report-${timestamp}.csv"`);
      return res.status(200).send(csvContent);
    }

    return ApiResponse.error(res, 'Unsupported export type', 400);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSalesReport,
  getInventoryReport,
  getTopProductsReport,
  exportReport,
};
