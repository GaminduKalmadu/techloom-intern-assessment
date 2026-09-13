/**
 * GET /api/health
 * Returns standard API health status
 */
const getHealth = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'API is running',
  });
};

module.exports = {
  getHealth,
};
