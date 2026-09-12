const os = require('os');
const env = require('../config/env');
const { getDatabaseStatus } = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

/**
 * Get comprehensive health status of backend server and database
 */
const getHealth = (req, res) => {
  const dbStatus = getDatabaseStatus();

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: env.NODE_ENV,
    server: {
      platform: process.platform,
      nodeVersion: process.version,
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      freeSystemMemoryMB: Math.round(os.freemem() / 1024 / 1024),
    },
    database: dbStatus,
  };

  return ApiResponse.success(res, 'POS Order & Inventory API is operational', healthData);
};

module.exports = {
  getHealth,
};
