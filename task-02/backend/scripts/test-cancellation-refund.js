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

const runCancellationRefundTestSuite = async () => {
  console.log('\n======================================================');
  console.log('   Section 02 Order Cancellation & Refund Test Suite  ');
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
  let testProduct1, testProduct2;
  let orderA, paymentA;
  let orderB, paymentB;
  let failedOrder, expiredOrder;

  const results = [];

  try {
    // 1. Setup test users
    const emailA = `cancel.customer.a.${Date.now()}@test.com`;
    const emailB = `cancel.customer.b.${Date.now()}@test.com`;

    const regA = await makeRequest(port, '/api/auth/register', 'POST', {
      name: 'Cancellation Customer A',
      email: emailA,
      password: 'Password123!',
    });
    tokenA = regA.data.data.token;
    userA = regA.data.data.user;

    const regB = await makeRequest(port, '/api/auth/register', 'POST', {
      name: 'Cancellation Customer B',
      email: emailB,
      password: 'Password123!',
    });
    tokenB = regB.data.data.token;
    userB = regB.data.data.user;

    const defaultCategory = await Category.findOne();

    // 2. Setup Test Products
    // Product 1: stockQuantity = 8, reservedQuantity = 0 (after sold 2 units)
    testProduct1 = await Product.create({
      name: `Cancellation Test Item 1 ${Date.now()}`,
      description: 'Inventory restoration test item',
      categoryId: defaultCategory._id,
      price: 50.0,
      stockQuantity: 8, // Sold 2 out of original 10
      reservedQuantity: 0,
      isActive: true,
    });

    // Setup Confirmed Paid Order for Customer A (Order A)
    orderA = await Order.create({
      userId: userA._id,
      items: [
        {
          productId: testProduct1._id,
          productName: testProduct1.name,
          price: 50.0,
          quantity: 2,
        },
      ],
      subtotal: 100.0,
      total: 100.0,
      status: 'CONFIRMED',
      paymentStatus: 'SUCCESS',
    });

    paymentA = await Payment.create({
      orderId: orderA._id,
      userId: userA._id,
      amount: 100.0,
      status: 'SUCCESS',
      idempotencyKey: `IDEMP_CANCEL_A_${Date.now()}`,
      transactionReference: `TXN_INIT_${Date.now()}`,
    });

    // Setup Confirmed Paid Order for Customer B (Order B)
    testProduct2 = await Product.create({
      name: `Cancellation Test Item 2 ${Date.now()}`,
      description: 'Customer B order product',
      categoryId: defaultCategory._id,
      price: 75.0,
      stockQuantity: 5,
      reservedQuantity: 0,
      isActive: true,
    });

    orderB = await Order.create({
      userId: userB._id,
      items: [
        {
          productId: testProduct2._id,
          productName: testProduct2.name,
          price: 75.0,
          quantity: 1,
        },
      ],
      subtotal: 75.0,
      total: 75.0,
      status: 'CONFIRMED',
      paymentStatus: 'SUCCESS',
    });

    paymentB = await Payment.create({
      orderId: orderB._id,
      userId: userB._id,
      amount: 75.0,
      status: 'SUCCESS',
      idempotencyKey: `IDEMP_CANCEL_B_${Date.now()}`,
      transactionReference: `TXN_INIT_B_${Date.now()}`,
    });

    // Setup Failed & Expired Orders
    failedOrder = await Order.create({
      userId: userA._id,
      items: [
        {
          productId: testProduct1._id,
          productName: testProduct1.name,
          price: 50.0,
          quantity: 1,
        },
      ],
      subtotal: 50.0,
      total: 50.0,
      status: 'FAILED',
      paymentStatus: 'FAILED',
    });

    expiredOrder = await Order.create({
      userId: userA._id,
      items: [
        {
          productId: testProduct1._id,
          productName: testProduct1.name,
          price: 50.0,
          quantity: 1,
        },
      ],
      subtotal: 50.0,
      total: 50.0,
      status: 'EXPIRED',
      paymentStatus: 'TIMEOUT',
    });

    let cancelResponseA;

    // -----------------------------------------------------------------
    // TEST 1: Cancel paid confirmed order
    // -----------------------------------------------------------------
    results.push(
      await runTest('1. Cancel paid confirmed order (POST /api/orders/:id/cancel)', async () => {
        const res = await makeRequest(
          port,
          `/api/orders/${orderA._id}/cancel`,
          'POST',
          {},
          { Authorization: `Bearer ${tokenA}` }
        );

        if (res.status !== 200) {
          throw new Error(`Expected 200 OK, got ${res.status}: ${JSON.stringify(res.data)}`);
        }

        cancelResponseA = res.data.data;

        if (cancelResponseA.orderStatus !== 'CANCELLED') {
          throw new Error(`Expected orderStatus 'CANCELLED', got '${cancelResponseA.orderStatus}'`);
        }

        if (cancelResponseA.paymentStatus !== 'REFUNDED') {
          throw new Error(`Expected paymentStatus 'REFUNDED', got '${cancelResponseA.paymentStatus}'`);
        }

        if (!cancelResponseA.refundReference || !cancelResponseA.refundReference.startsWith('REF_')) {
          throw new Error(`Expected valid refundReference, got '${cancelResponseA.refundReference}'`);
        }

        if (Number(cancelResponseA.refundAmount) !== 100.0) {
          throw new Error(`Expected refundAmount 100, got ${cancelResponseA.refundAmount}`);
        }
      })
    );

    // -----------------------------------------------------------------
    // TEST 2: Stock restored correctly without changing reservedQuantity
    // -----------------------------------------------------------------
    results.push(
      await runTest('2. Product inventory restored (stockQuantity restored, reservedQuantity untouched)', async () => {
        const refreshedProduct = await Product.findById(testProduct1._id);

        // Original before cancellation was 8. Cancelled order had 2 units. Expected: 8 + 2 = 10.
        if (refreshedProduct.stockQuantity !== 10) {
          throw new Error(`Expected stockQuantity to be 10, got ${refreshedProduct.stockQuantity}`);
        }

        // reservedQuantity must remain 0
        if (refreshedProduct.reservedQuantity !== 0) {
          throw new Error(`Expected reservedQuantity to remain 0, got ${refreshedProduct.reservedQuantity}`);
        }
      })
    );

    // -----------------------------------------------------------------
    // TEST 3: Refund record created in database with SUCCESS and reference
    // -----------------------------------------------------------------
    results.push(
      await runTest('3. Refund record created in database with SUCCESS status', async () => {
        const refundDoc = await Refund.findOne({ orderId: orderA._id });
        if (!refundDoc) {
          throw new Error('Refund document not found in database');
        }

        if (refundDoc.status !== 'SUCCESS') {
          throw new Error(`Expected refund status 'SUCCESS', got '${refundDoc.status}'`);
        }

        if (refundDoc.amount !== 100.0) {
          throw new Error(`Expected refund amount 100, got ${refundDoc.amount}`);
        }

        if (refundDoc.paymentId.toString() !== paymentA._id.toString()) {
          throw new Error('Refund paymentId does not match original payment');
        }

        if (refundDoc.refundReference !== cancelResponseA.refundReference) {
          throw new Error('Refund reference mismatch between response and DB document');
        }
      })
    );

    // -----------------------------------------------------------------
    // TEST 4: Payment document becomes REFUNDED
    // -----------------------------------------------------------------
    results.push(
      await runTest('4. Payment document status updated to REFUNDED', async () => {
        const refreshedPayment = await Payment.findById(paymentA._id);
        if (refreshedPayment.status !== 'REFUNDED') {
          throw new Error(`Expected Payment status 'REFUNDED', got '${refreshedPayment.status}'`);
        }
      })
    );

    // -----------------------------------------------------------------
    // TEST 5: Repeat cancellation rejected (prevent duplicate refund/restoration)
    // -----------------------------------------------------------------
    results.push(
      await runTest('5. Repeat cancellation rejected (prevents double refund & double stock restore)', async () => {
        const repeatRes = await makeRequest(
          port,
          `/api/orders/${orderA._id}/cancel`,
          'POST',
          {},
          { Authorization: `Bearer ${tokenA}` }
        );

        if (repeatRes.status !== 400 && repeatRes.status !== 409) {
          throw new Error(`Expected 400/409, got ${repeatRes.status}: ${JSON.stringify(repeatRes.data)}`);
        }

        // Verify stock was NOT incremented again (must still be 10, not 12)
        const productAfterRepeat = await Product.findById(testProduct1._id);
        if (productAfterRepeat.stockQuantity !== 10) {
          throw new Error(`Stock quantity was duplicated! Expected 10, got ${productAfterRepeat.stockQuantity}`);
        }

        // Verify only 1 refund record exists
        const refundCount = await Refund.countDocuments({ orderId: orderA._id });
        if (refundCount !== 1) {
          throw new Error(`Duplicate refund records found! Count: ${refundCount}`);
        }
      })
    );

    // -----------------------------------------------------------------
    // TEST 6: Unauthorized customer cannot cancel another customer's order (403)
    // -----------------------------------------------------------------
    results.push(
      await runTest('6. Unauthorized customer cannot cancel another customer\'s order (403 Forbidden)', async () => {
        // Customer A tries to cancel Customer B's order
        const unauthorizedRes = await makeRequest(
          port,
          `/api/orders/${orderB._id}/cancel`,
          'POST',
          {},
          { Authorization: `Bearer ${tokenA}` }
        );

        if (unauthorizedRes.status !== 403) {
          throw new Error(`Expected 403 Forbidden, got ${unauthorizedRes.status}: ${JSON.stringify(unauthorizedRes.data)}`);
        }

        // Verify Order B is still CONFIRMED
        const orderBCheck = await Order.findById(orderB._id);
        if (orderBCheck.status !== 'CONFIRMED') {
          throw new Error(`Order B should remain CONFIRMED, got '${orderBCheck.status}'`);
        }
      })
    );

    // -----------------------------------------------------------------
    // TEST 7: Already cancelled order cannot be cancelled again
    // -----------------------------------------------------------------
    results.push(
      await runTest('7. Order marked CANCELLED is rejected on cancel endpoint', async () => {
        const res = await makeRequest(
          port,
          `/api/orders/${orderA._id}/cancel`,
          'POST',
          {},
          { Authorization: `Bearer ${tokenA}` }
        );

        if (res.status !== 400) {
          throw new Error(`Expected 400 Bad Request, got ${res.status}: ${JSON.stringify(res.data)}`);
        }
      })
    );

    // -----------------------------------------------------------------
    // TEST 8: Failed/Expired order cannot be incorrectly refunded
    // -----------------------------------------------------------------
    results.push(
      await runTest('8. Failed or expired orders cannot be cancelled or refunded', async () => {
        // Try cancelling failed order
        const cancelFailed = await makeRequest(
          port,
          `/api/orders/${failedOrder._id}/cancel`,
          'POST',
          {},
          { Authorization: `Bearer ${tokenA}` }
        );

        if (cancelFailed.status !== 400) {
          throw new Error(`Expected 400 for failed order cancel, got ${cancelFailed.status}`);
        }

        // Try cancelling expired order
        const cancelExpired = await makeRequest(
          port,
          `/api/orders/${expiredOrder._id}/cancel`,
          'POST',
          {},
          { Authorization: `Bearer ${tokenA}` }
        );

        if (cancelExpired.status !== 400) {
          throw new Error(`Expected 400 for expired order cancel, got ${cancelExpired.status}`);
        }

        // Ensure no refunds were created for failed/expired orders
        const refundFailed = await Refund.findOne({ orderId: failedOrder._id });
        if (refundFailed) {
          throw new Error('Refund document should NOT exist for failed order');
        }

        const refundExpired = await Refund.findOne({ orderId: expiredOrder._id });
        if (refundExpired) {
          throw new Error('Refund document should NOT exist for expired order');
        }
      })
    );

  } catch (err) {
    console.error('Fatal error during cancellation test run:', err);
    results.push(false);
  } finally {
    server.close();
    await mongoose.disconnect();
  }

  const allPassed = results.every(Boolean);
  console.log('\n------------------------------------------------------');
  if (allPassed) {
    console.log(' ALL 8 CANCELLATION & REFUND TESTS PASSED! ');
  } else {
    console.log(' SOME TESTS FAILED. PLEASE REVIEW LOGS ABOVE. ');
  }
  console.log('------------------------------------------------------\n');

  process.exit(allPassed ? 0 : 1);
};

runCancellationRefundTestSuite();
