const env = require('../config/env');
const ApiError = require('../utils/apiError');

const OUTCOMES = Object.freeze(['SUCCESS', 'FAILED', 'TIMEOUT']);

/**
 * Deterministic internal gateway. No card data is accepted or persisted.
 * Production always uses SUCCESS; explicit simulation is intentionally gated.
 */
const processPayment = ({ simulationOutcome }) => {
  const requested = (simulationOutcome || 'SUCCESS').toUpperCase();

  if (!OUTCOMES.includes(requested)) {
    throw ApiError.coded(400, 'INVALID_PAYMENT_OUTCOME', 'Unsupported payment simulation outcome.');
  }

  if (!env.MOCK_PAYMENT_CONTROLS_ENABLED && simulationOutcome) {
    throw ApiError.coded(403, 'PAYMENT_SIMULATION_DISABLED', 'Payment simulation controls are disabled.');
  }

  return env.MOCK_PAYMENT_CONTROLS_ENABLED ? requested : 'SUCCESS';
};

module.exports = { OUTCOMES, processPayment };
