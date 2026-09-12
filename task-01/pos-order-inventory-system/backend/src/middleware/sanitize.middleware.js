/**
 * Input sanitization middleware
 * 1. Recursively cleans NoSQL injection payloads ($ and . operators in object keys)
 * 2. Trims leading/trailing whitespace on string inputs
 */

const cleanKey = (key) => {
  // Strip starting $ or containing . from keys
  return key.replace(/^\$|\./g, '');
};

const sanitizeValue = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  // Handle nested objects
  if (typeof value === 'object' && !(value instanceof Date)) {
    const cleaned = {};
    for (const [key, val] of Object.entries(value)) {
      const sanitizedKey = cleanKey(key);
      if (sanitizedKey.length > 0) {
        cleaned[sanitizedKey] = sanitizeValue(val);
      }
    }
    return cleaned;
  }

  // Handle strings: trim whitespace
  if (typeof value === 'string') {
    return value.trim();
  }

  return value;
};

const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
};

module.exports = sanitizeInput;
