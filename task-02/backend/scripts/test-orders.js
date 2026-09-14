const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Reservation = require('../src/models/Reservation');
const Payment = require('../src/models/Payment');
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

const runOrdersTestSuite = async () => {
  console.log('\n======================================================');
  console.log('   Section 02 Customer Orders & History Test Suite     ');
  console.log('======================================================\n');

  await connectDB();
  await seedAdmin();
  await seedCategoriesAndProducts();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test server running at http://localhost:${port}/api\n`);

  let tokenA, userA;
  let tokenB, userB;
  let testProduct;

  const results = [];

  try {
    // 1. Setup test users
    const emailA = `order.customer.a.${Date.now()}@test.com`;
    const emailB = `order.customer.b.${Date.now()}@test.com`;

    const regA = await makeRequest(port, '/api/auth/register', 'POST', {
      name: 'Order Customer A',
      email: emailA,
      password: 'Password123!',
    });
    tokenA = regA.data.data.token;
    userA = regA.data.data.user;

    const regB = await makeRequest(port, '/api/auth/register', 'POST', {
      name: 'Order Customer B',
      email: emailB,
      password: 'Password123!',
    });
    tokenB = regB.data.data.token;
    userB = regB.data.data.user;

    const testCat = await Category.findOne();
    testProduct = await Product.create({
      name: `Orders Suite Product ${Date.now()}`,
      categoryId: testCat._id,
      price: 125,
      stockQuantity: 50,
      reservedQuantity: 0,
      isActive: true,
    });

    // 2. Create Confirmed Order with Payment
    const confirmedOrder = await Order.create({
      userId: userA._id,
      items: [
        {
          productId: testProduct._id,
          productName: testProduct.name,
          price: 125,
          quantity: 2,
        },
      ],
      subtotal: 250,
      total: 250,
      status: 'CONFIRMED',
      paymentStatus: 'SUCCESS',
      createdAt: new Date(Date.now() - 30000), // 30s ago
    });

    const confirmedTxnRef = `TXN_CONFIRMED_${Date.now()}`;
    await Payment.create({
      orderId: confirmedOrder._id,
      userId: userA._id,
      amount: 250,
      status: 'SUCCESS',
      idempotencyKey: `idemp-conf-${Date.now()}`,
      transactionReference: confirmedTxnRef,
    });

    await Reservation.create({
      orderId: confirmedOrder._id,
      userId: userA._id,
      items: [{ productId: testProduct._id, quantity: 2 }],
      status: 'COMPLETED',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // 3. Create Failed Order
    const failedOrder = await Order.create({
      userId: userA._id,
      items: [
        {
          productId: testProduct._id,
          productName: testProduct.name,
          price: 125,
          quantity: 1,
        },
      ],
      subtotal: 125,
      total: 125,
      status: 'FAILED',
      paymentStatus: 'FAILED',
      createdAt: new Date(Date.now() - 20000), // 20s ago
    });

    await Payment.create({
      orderId: failedOrder._id,
      userId: userA._id,
      amount: 125,
      status: 'FAILED',
      idempotencyKey: `idemp-fail-${Date.now()}`,
      transactionReference: null,
    });

    await Reservation.create({
      orderId: failedOrder._id,
      userId: userA._id,
      items: [{ productId: testProduct._id, quantity: 1 }],
      status: 'RELEASED',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // 4. Create Expired Order
    const expiredOrder = await Order.create({
      userId: userA._id,
      items: [
        {
          productId: testProduct._id,
          productName: testProduct.name,
          price: 125,
          quantity: 3,
        },
      ],
      subtotal: 375,
      total: 375,
      status: 'EXPIRED',
      paymentStatus: 'TIMEOUT',
      createdAt: new Date(Date.now() - 10000), // 10s ago (newest of A's orders)
    });

    await Reservation.create({
      orderId: expiredOrder._id,
      userId: userA._id,
      items: [{ productId: testProduct._id, quantity: 3 }],
      status: 'EXPIRED',
      expiresAt: new Date(Date.now() - 5000),
    });

    // 5. Create an order belonging to Customer B
    const orderB = await Order.create({
      userId: userB._id,
      items: [
        {
          productId: testProduct._id,
          productName: testProduct.name,
          price: 125,
          quantity: 1,
        },
      ],
      subtotal: 125,
      total: 125,
      status: 'CONFIRMED',
      paymentStatus: 'SUCCESS',
    });

    // ----------------------------------------------------
    // TEST 1: Confirmed Order Details
    // ----------------------------------------------------
    results.push(
      await runTest('1. Confirmed order details retrieved with transaction reference', async () => {
        const res = await makeRequest(
          port,
          `/api/orders/${confirmedOrder._id}`,
          'GET',
          null,
          { Authorization: `Bearer ${tokenA}` }
        );

        if (res.status !== 200 || !res.data?.success) {
          throw new Error(`Expected 200, got ${res.status}: ${res.data?.message}`);
        }

        const data = res.data.data;
        if (data.order.status !== 'CONFIRMED' || data.order.paymentStatus !== 'SUCCESS') {
          throw new Error(`Invalid status: order=${data.order.status}, payment=${data.order.paymentStatus}`);
        }

        if (data.transactionReference !== confirmedTxnRef) {
          throw new Error(`Expected transactionReference "${confirmedTxnRef}", got "${data.transactionReference}"`);
        }
      })
    );

    // ----------------------------------------------------
    // TEST 2: Failed Order Details
    // ----------------------------------------------------
    results.push(
      await runTest('2. Failed order details retrieved with FAILED statuses', async () => {
        const res = await makeRequest(
          port,
          `/api/orders/${failedOrder._id}`,
          'GET',
          null,
          { Authorization: `Bearer ${tokenA}` }
        );

        if (res.status !== 200 || !res.data?.success) {
          throw new Error(`Expected 200, got ${res.status}: ${res.data?.message}`);
        }

        const data = res.data.data;
        if (data.order.status !== 'FAILED' || data.order.paymentStatus !== 'FAILED') {
          throw new Error(`Invalid status: order=${data.order.status}, payment=${data.order.paymentStatus}`);
        }

        if (data.reservation?.status !== 'RELEASED') {
          throw new Error(`Expected reservation status RELEASED, got ${data.reservation?.status}`);
        }
      })
    );

    // ----------------------------------------------------
    // TEST 3: Expired Order Details
    // ----------------------------------------------------
    results.push(
      await runTest('3. Expired order details retrieved with EXPIRED and TIMEOUT statuses', async () => {
        const res = await makeRequest(
          port,
          `/api/orders/${expiredOrder._id}`,
          'GET',
          null,
          { Authorization: `Bearer ${tokenA}` }
        );

        if (res.status !== 200 || !res.data?.success) {
          throw new Error(`Expected 200, got ${res.status}: ${res.data?.message}`);
        }

        const data = res.data.data;
        if (data.order.status !== 'EXPIRED' || data.order.paymentStatus !== 'TIMEOUT') {
          throw new Error(`Invalid status: order=${data.order.status}, payment=${data.order.paymentStatus}`);
        }

        if (data.reservation?.status !== 'EXPIRED') {
          throw new Error(`Expected reservation status EXPIRED, got ${data.reservation?.status}`);
        }
      })
    );

    // ----------------------------------------------------
    // TEST 4: Order History Sorting (Newest First & User Isolation)
    // ----------------------------------------------------
    results.push(
      await runTest('4. Order history returns authenticated customer orders sorted newest first', async () => {
        const res = await makeRequest(
          port,
          '/api/orders/my-orders',
          'GET',
          null,
          { Authorization: `Bearer ${tokenA}` }
        );

        if (res.status !== 200 || !res.data?.success) {
          throw new Error(`Expected 200, got ${res.status}: ${res.data?.message}`);
        }

        const orders = res.data.data?.orders;
        if (!Array.isArray(orders) || orders.length !== 3) {
          throw new Error(`Expected exactly 3 orders for Customer A, got ${orders?.length}`);
        }

        // Verify descending order by createdAt
        for (let i = 0; i < orders.length - 1; i++) {
          const dateCurrent = new Date(orders[i].createdAt).getTime();
          const dateNext = new Date(orders[i + 1].createdAt).getTime();
          if (dateCurrent < dateNext) {
            throw new Error(`Orders not sorted newest first: order[${i}] (${dateCurrent}) < order[${i + 1}] (${dateNext})`);
          }
        }

        // Order 0 must be expiredOrder (10s ago), Order 1 must be failedOrder (20s ago), Order 2 must be confirmedOrder (30s ago)
        if (orders[0]._id.toString() !== expiredOrder._id.toString()) {
          throw new Error('Newest order should be the first item');
        }

        // Verify Customer B's order is NOT present
        const hasOrderB = orders.some((o) => o._id.toString() === orderB._id.toString());
        if (hasOrderB) {
          throw new Error('Security failure: Customer B order leaked into Customer A history');
        }
      })
    );

    // ----------------------------------------------------
    // TEST 5: Complete Line Items & Valuation Accuracy
    // ----------------------------------------------------
    results.push(
      await runTest('5. Line items, quantities, unit prices, and valuation accuracy', async () => {
        const res = await makeRequest(
          port,
          `/api/orders/${confirmedOrder._id}`,
          'GET',
          null,
          { Authorization: `Bearer ${tokenA}` }
        );

        const order = res.data.data.order;
        if (!order.items || order.items.length !== 1) {
          throw new Error('Expected 1 line item in confirmed order');
        }

        const item = order.items[0];
        if (item.productName !== testProduct.name || item.quantity !== 2 || item.price !== 125) {
          throw new Error(`Line item values mismatch: ${JSON.stringify(item)}`);
        }

        if (order.subtotal !== 250 || order.total !== 250) {
          throw new Error(`Valuation mismatch: subtotal=${order.subtotal}, total=${order.total}`);
        }
      })
    );

    // ----------------------------------------------------
    // TEST 6: User Cannot Open Another User's Order
    // ----------------------------------------------------
    results.push(
      await runTest('6. User cannot open another user\'s order (403 Forbidden)', async () => {
        // Customer A attempts to open Customer B's order
        const hijackRes = await makeRequest(
          port,
          `/api/orders/${orderB._id}`,
          'GET',
          null,
          { Authorization: `Bearer ${tokenA}` }
        );

        if (hijackRes.status !== 403) {
          throw new Error(`Expected 403 Forbidden, received status ${hijackRes.status}`);
        }

        if (!hijackRes.data?.message?.includes('not authorized')) {
          throw new Error(`Expected authorization error message, got: ${hijackRes.data?.message}`);
        }
      })
    );

    console.log('\n------------------------------------------------------');
    const allPassed = results.every((r) => r === true);
    if (allPassed) {
      console.log(` ALL ${results.length} ORDERS & HISTORY TESTS PASSED! `);
    } else {
      console.error(` ✘ SOME TESTS FAILED (${results.filter((r) => !r).length} failures) `);
    }
    console.log('------------------------------------------------------\n');

    server.close();
    await mongoose.disconnect();
    process.exit(allPassed ? 0 : 1);
  } catch (err) {
    console.error('[Orders Test Suite Error]', err);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runOrdersTestSuite();
