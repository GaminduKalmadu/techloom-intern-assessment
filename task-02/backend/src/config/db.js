const dns = require('dns');
const mongoose = require('mongoose');
const env = require('./env');

// 1. Set reliable public DNS servers for c-ares SRV and A record resolutions
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('[Database] Could not set custom DNS servers:', dnsErr.message);
}

// 2. Wrap dns.lookup with fallback to resolve4 using reliable DNS
// Solves "getaddrinfo ENOTFOUND" when local router/ISP DNS fails on Atlas shard domains
const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  originalLookup(hostname, options, (err, address, family) => {
    if (err && (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN')) {
      dns.resolve4(hostname, (resErr, addresses) => {
        if (resErr || !addresses || addresses.length === 0) {
          return callback(err);
        }
        return callback(null, addresses[0], 4);
      });
    } else {
      return callback(err, address, family);
    }
  });
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    throw error;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] Mongoose disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database] Mongoose connection error: ${err.message}`);
});

module.exports = { connectDB };
