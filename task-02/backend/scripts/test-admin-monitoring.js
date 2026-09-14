const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');
const Refund = require('../src/models/Refund');
const seedAdmin = require('../src/scripts/seedAdmin');
const seedCategoriesAndProducts = require('../src/scripts/seedCategories');

const runTest = (name, fn) => {
  return fn()
    .then(() => {
      console.log(`  ✔ PASS: ${name}`);
      return true;
    })
    .catch((err) => {
      console.error(`  ✘ FAIL: ${name}`);
      console.error(`    Error: ${err.message}`);
      return false;
    });
};

const makeRequest = (port, path, method = 'GET', data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const reqHeaders = { ...headers };

    if (data) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, raw: body, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (data) req.write(postData);
    req.end();
  });
};

const runAdminMonitoringTestSuite = async () => {
  console.log('\n======================================================');
  console.log('   Section 02 Admin Monitoring & Telemetry Test Suite ');
  console.log('======================================================\n');

  await connectDB();
  await seedAdmin();
  await seedCategoriesAndProducts();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test server running at http://localhost:${port}/api\n`);

  let adminToken, customerToken;
  let testOrder, testPayment, testRefund;

  const results = [];

  try {
    // 1. Authenticate Admin
    const adminLogin = await makeRequest(port, '/api/auth/login', 'POST', {
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
    });

    if (adminLogin.status !== 200 || !adminLogin.data?.data?.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
    }
    adminToken = adminLogin.data.data.token;

    // 2. Register Customer
    const customerEmail = `monitor.customer.${Date.now()}@test.com`;
    const custReg = await makeRequest(port, '/api/auth/register', 'POST', {
      name: 'Monitor Customer',
      email: customerEmail,
      password: 'Password123!',
    });
    customerToken = custReg.data.data.token;
    const customerUser = custReg.data.data.user;

    // 3. Setup Seed Order & Payment & Refund for validation
    const category = await Category.findOne();
    const product = await Product.create({
      name: `Admin Monitored Product ${Date.now()}`,
      description: 'Test product for telemetry',
      categoryId: category._id,
      price: 150.0,
      stockQuantity: 20,
      reservedQuantity: 5,
      isActive: true,
    });

    testOrder = await Order.create({
      userId: customerUser.id || customerUser._id,
      items: [
        {
          productId: product._id,
          productName: product.name,
          price: 150.0,
          quantity: 1,
        },
      ],
      subtotal: 150.0,
      total: 150.0,
      status: 'CONFIRMED',
      paymentStatus: 'SUCCESS',
    });

    testPayment = await Payment.create({
      orderId: testOrder._id,
      userId: customerUser.id || customerUser._id,
      amount: 150.0,
      status: 'SUCCESS',
      idempotencyKey: `IDEMP_ADMIN_TEST_${Date.now()}`,
      transactionReference: `TXN_ADMIN_MON_${Date.now()}`,
    });

    // -----------------------------------------------------------------
    // TEST 1: Admin access granted on all monitoring endpoints (200 OK)
    // -----------------------------------------------------------------
    results.push(
      await runTest('1. Admin access granted on all endpoints (200 OK)', async () => {
        const endpoints = ['/dashboard', '/orders', '/payments', '/refunds'];
        for (const ep of endpoints) {
          const res = await makeRequest(
            port,
            `/api/admin${ep}`,
            'GET',
            null,
            { Authorization: `Bearer ${adminToken}` }
          );
          if (res.status !== 200) {
            throw new Error(`Endpoint ${ep} returned ${res.status}, expected 200 OK`);
          }
        }
      })
    );

    // -----------------------------------------------------------------
    // TEST 2: Customer blocked with 403 Forbidden
    // -----------------------------------------------------------------
    results.push(
      await runTest('2. Customer access blocked with 403 Forbidden', async () => {
        const endpoints = ['/dashboard', '/orders', '/payments', '/refunds'];
        for (const ep of endpoints) {
          const res = await makeRequest(
            port,
            `/api/admin${ep}`,
            'GET',
            null,
            { Authorization: `Bearer ${customerToken}` }
          );
          if (res.status !== 403) {
            throw new Error(`Customer on ${ep} returned ${res.status}, expected 403 Forbidden`);
          }
        }
      })
    );

    // -----------------------------------------------------------------
    // TEST 3: Unauthenticated request blocked with 401 Unauthorized
    // -----------------------------------------------------------------
    results.push(
      await runTest('3. Unauthenticated request blocked with 401 Unauthorized', async () => {
        const res = await makeRequest(port, '/api/admin/dashboard', 'GET');
        if (res.status !== 401) {
          throw new Error(`Expected 401, got ${res.status}`);
        }
      })
    );

    // -----------------------------------------------------------------
    // TEST 4: Dashboard returns 8 required operational metrics
    // -----------------------------------------------------------------
    results.push(
      await runTest('4. Dashboard returns all 8 required operational metrics', async () => {
        const res = await makeRequest(
          port,
          '/api/admin/dashboard',
          'GET',
          null,
          { Authorization: `Bearer ${adminToken}` }
        );

        if (res.status !== 200) {
          throw new Error(`Expected 200 OK, got ${res.status}`);
        }

        const metrics = res.data?.data?.metrics;
        if (!metrics) {
          throw new Error('Missing metrics object in response');
        }

        const requiredFields = [
          'totalProducts',
          'availableInventory',
          'reservedInventory',
          'totalOrders',
          'confirmedOrders',
          'failedOrders',
          'revenue',
          'refundedAmount',
        ];

        for (const field of requiredFields) {
          if (typeof metrics[field] === 'undefined') {
            throw new Error(`Missing required dashboard metric field: ${field}`);
          }
        }

        if (metrics.totalProducts < 1) {
          throw new Error('totalProducts should be >= 1');
        }

        if (metrics.confirmedOrders < 1) {
          throw new Error('confirmedOrders should be >= 1');
        }

        if (metrics.revenue < 150.0) {
          throw new Error(`Revenue should include confirmed order total, got ${metrics.revenue}`);
        }
      })
    );

    // -----------------------------------------------------------------
    // TEST 5: Admin orders listing with filters
    // -----------------------------------------------------------------
    results.push(
      await runTest('5. Admin orders listing with orderStatus & paymentStatus filters', async () => {
        // Unfiltered list
        const resAll = await makeRequest(
          port,
          '/api/admin/orders',
          'GET',
          null,
          { Authorization: `Bearer ${adminToken}` }
        );

        if (resAll.status !== 200) {
          throw new Error(`Expected 200 OK, got ${resAll.status}`);
        }

        const orders = resAll.data?.data?.orders;
        if (!Array.isArray(orders) || orders.length === 0) {
          throw new Error('Orders array should not be empty');
        }

        // Verify customer populated
        const firstOrder = orders[0];
        if (!firstOrder.customer?.email) {
          throw new Error('Customer information was not populated on order');
        }

        // Filter by CONFIRMED
        const resFiltered = await makeRequest(
          port,
          '/api/admin/orders?orderStatus=CONFIRMED',
          'GET',
          null,
          { Authorization: `Bearer ${adminToken}` }
        );

        const filteredOrders = resFiltered.data?.data?.orders;
        for (const o of filteredOrders) {
          if (o.status !== 'CONFIRMED') {
            throw new Error(`Filter violated: expected CONFIRMED, got ${o.status}`);
          }
        }
      })
    );

    // -----------------------------------------------------------------
    // TEST 6: Single admin order details by ID
    // -----------------------------------------------------------------
    results.push(
      await runTest('6. Single admin order details by ID (/api/admin/orders/:id)', async () => {
        const res = await makeRequest(
          port,
          `/api/admin/orders/${testOrder._id}`,
          'GET',
          null,
          { Authorization: `Bearer ${adminToken}` }
        );

        if (res.status !== 200) {
          throw new Error(`Expected 200 OK, got ${res.status}`);
        }

        const orderData = res.data?.data?.order;
        if (!orderData || orderData._id.toString() !== testOrder._id.toString()) {
          throw new Error('Order details ID mismatch');
        }

        if (!orderData.customer || !orderData.items) {
          throw new Error('Missing customer or items breakdown on order details');
        }
      })
    );

    // -----------------------------------------------------------------
    // TEST 7: Payments listing displays transactions with references
    // -----------------------------------------------------------------
    results.push(
      await runTest('7. Admin payments ledger listing (/api/admin/payments)', async () => {
        const res = await makeRequest(
          port,
          '/api/admin/payments',
          'GET',
          null,
          { Authorization: `Bearer ${adminToken}` }
        );

        if (res.status !== 200) {
          throw new Error(`Expected 200 OK, got ${res.status}`);
        }

        const payments = res.data?.data?.payments;
        if (!Array.isArray(payments) || payments.length === 0) {
          throw new Error('Payments array should not be empty');
        }

        const paymentMatch = payments.find(
          (p) => p.transactionReference === testPayment.transactionReference
        );
        if (!paymentMatch) {
          throw new Error('Created test payment transactionReference not found in payments ledger');
        }

        if (!paymentMatch.customer?.email) {
          throw new Error('Customer details not populated on payment record');
        }
      })
    );

    // -----------------------------------------------------------------
    // TEST 8: Refunds ledger listing and statuses reflect database correctly
    // -----------------------------------------------------------------
    results.push(
      await runTest('8. Refunds ledger and cancellation reflection (/api/admin/refunds)', async () => {
        // Cancel the test order using Customer Token to trigger a real simulated refund
        const cancelRes = await makeRequest(
          port,
          `/api/orders/${testOrder._id}/cancel`,
          'POST',
          {},
          { Authorization: `Bearer ${customerToken}` }
        );

        if (cancelRes.status !== 200) {
          throw new Error(`Failed to cancel test order: ${JSON.stringify(cancelRes.data)}`);
        }

        const refundRef = cancelRes.data?.data?.refundReference;

        // Fetch Admin Refunds Ledger
        const refundsRes = await makeRequest(
          port,
          '/api/admin/refunds',
          'GET',
          null,
          { Authorization: `Bearer ${adminToken}` }
        );

        if (refundsRes.status !== 200) {
          throw new Error(`Expected 200 OK on refunds, got ${refundsRes.status}`);
        }

        const refunds = refundsRes.data?.data?.refunds;
        const refundMatch = refunds.find((r) => r.refundReference === refundRef);
        if (!refundMatch) {
          throw new Error(`Created refund reference ${refundRef} not found in admin refunds ledger`);
        }

        if (refundMatch.status !== 'SUCCESS') {
          throw new Error(`Expected refund status 'SUCCESS', got '${refundMatch.status}'`);
        }

        // Verify dashboard reflects refundedAmount
        const dashRes = await makeRequest(
          port,
          '/api/admin/dashboard',
          'GET',
          null,
          { Authorization: `Bearer ${adminToken}` }
        );

        const updatedMetrics = dashRes.data?.data?.metrics;
        if (updatedMetrics.refundedAmount < 150.0) {
          throw new Error(`Dashboard refundedAmount did not reflect refund: ${updatedMetrics.refundedAmount}`);
        }
      })
    );

  } catch (err) {
    console.error('Fatal error during admin monitoring test run:', err);
    results.push(false);
  } finally {
    server.close();
    await mongoose.disconnect();
  }

  const allPassed = results.every(Boolean);
  console.log('\n------------------------------------------------------');
  if (allPassed) {
    console.log(' ALL 8 ADMIN MONITORING & TELEMETRY TESTS PASSED! ');
  } else {
    console.log(' SOME TESTS FAILED. PLEASE REVIEW LOGS ABOVE. ');
  }
  console.log('------------------------------------------------------\n');

  process.exit(allPassed ? 0 : 1);
};

runAdminMonitoringTestSuite();
